#!/usr/bin/env bash
# Prepara e inicia o Ponto Facial: backend (FastAPI, porta 8000) e frontend (Vite, porta 5173).
#
# Antes de subir a aplicação instala as dependências do backend e do frontend e
# baixa os pesos do reconhecimento facial, para que a API só abra a porta com o
# DeepFace pronto. Ctrl+C encerra os dois serviços.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND="$ROOT/backend"
FRONTEND="$ROOT/frontend"
VENV="$BACKEND/.venv"
BACKEND_PORT=8000
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
HEALTH_TIMEOUT=180

log() { printf '\033[1;34m[ponto]\033[0m %s\n' "$*"; }
fail() { printf '\033[1;31m[ponto]\033[0m %s\n' "$*" >&2; exit 1; }

port_in_use() { (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null; }

check_port() {
  if port_in_use "$1"; then
    local owner
    owner="$(ss -ltnp 2>/dev/null | grep -E ":$1\b" | grep -oE 'users:\(\(.*\)\)' || true)"
    fail "A porta $1 ($2) já está em uso ${owner:+por $owner}. Encerre o processo e tente de novo."
  fi
}

# ---------------------------------------------------------------- backend
python_ok() { "$1" -c 'import sys; sys.exit(not (3, 10) <= sys.version_info[:2] <= (3, 13))' 2>/dev/null; }

setup_backend() {
  if [[ ! -x "$VENV/bin/python" ]]; then
    log "Criando ambiente virtual do backend..."
    if command -v uv >/dev/null; then
      uv venv -p "$(cat "$BACKEND/.python-version")" "$VENV"
    else
      local py=""
      for candidate in python3.12 python3.13 python3.11 python3.10 python3; do
        if command -v "$candidate" >/dev/null && python_ok "$candidate"; then py="$candidate"; break; fi
      done
      [[ -n "$py" ]] || fail "Python 3.10–3.13 não encontrado (o TensorFlow não suporta outras versões)."
      "$py" -m venv "$VENV"
    fi
  fi
  python_ok "$VENV/bin/python" || fail "O ambiente $VENV não usa Python 3.10–3.13. Apague-o e rode novamente."

  # Reinstala só quando requirements.txt muda.
  local stamp="$VENV/.requirements.sha256" hash
  hash="$(sha256sum "$BACKEND/requirements.txt" | cut -d' ' -f1)"
  if [[ "$(cat "$stamp" 2>/dev/null)" != "$hash" ]]; then
    log "Instalando dependências do backend (pode demorar na primeira vez)..."
    if command -v uv >/dev/null; then
      uv pip install -p "$VENV/bin/python" -r "$BACKEND/requirements.txt"
    else
      "$VENV/bin/python" -m pip install --upgrade pip -q
      "$VENV/bin/python" -m pip install -r "$BACKEND/requirements.txt"
    fi
    echo "$hash" > "$stamp"
  fi

  log "Preparando os modelos de reconhecimento facial..."
  (cd "$BACKEND" && "$VENV/bin/python" -m app.setup) \
    || fail "Não foi possível baixar os modelos do DeepFace. Verifique a conexão e rode novamente."
}

# ---------------------------------------------------------------- frontend
setup_frontend() {
  command -v npm >/dev/null || fail "npm não encontrado. Instale o Node.js 20.19+ ou 22.12+."
  # Reinstala quando node_modules falta ou está mais antigo que o package-lock.json.
  if [[ ! -f "$FRONTEND/node_modules/.package-lock.json" \
        || "$FRONTEND/package-lock.json" -nt "$FRONTEND/node_modules/.package-lock.json" ]]; then
    log "Instalando dependências do frontend..."
    (cd "$FRONTEND" && npm install)
  fi
}

# ---------------------------------------------------------------- execução
PIDS=()
cleanup() {
  trap - EXIT INT TERM
  if ((${#PIDS[@]})); then
    log "Encerrando serviços..."
    kill "${PIDS[@]}" 2>/dev/null || true
    wait "${PIDS[@]}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

check_port "$BACKEND_PORT" backend
check_port "$FRONTEND_PORT" frontend

setup_backend
setup_frontend

log "Iniciando backend em http://127.0.0.1:$BACKEND_PORT ..."
(cd "$BACKEND" && exec "$VENV/bin/uvicorn" app.main:app --reload --host 127.0.0.1 --port "$BACKEND_PORT") &
PIDS+=($!)

for ((i = 0; i < HEALTH_TIMEOUT; i++)); do
  kill -0 "${PIDS[0]}" 2>/dev/null || fail "O backend encerrou durante a inicialização (veja o log acima)."
  curl -fs "http://127.0.0.1:$BACKEND_PORT/api/saude" >/dev/null 2>&1 && break
  sleep 1
done
((i < HEALTH_TIMEOUT)) || fail "O backend não respondeu em ${HEALTH_TIMEOUT}s."
log "Backend pronto."

log "Iniciando frontend em http://localhost:$FRONTEND_PORT ..."
(cd "$FRONTEND" && exec npm run dev -- --port "$FRONTEND_PORT" --strictPort) &
PIDS+=($!)

for ((i = 0; i < 30; i++)); do
  kill -0 "${PIDS[1]}" 2>/dev/null || fail "O frontend encerrou durante a inicialização (veja o log acima)."
  curl -fs "http://localhost:$FRONTEND_PORT/api/saude" >/dev/null 2>&1 && break
  sleep 1
done
((i < 30)) || fail "O frontend não conseguiu falar com o backend pelo proxy /api."
log "Frontend ↔ backend OK. Acesse http://localhost:$FRONTEND_PORT/ponto ou /admin/funcionarios"

wait -n "${PIDS[@]}"
