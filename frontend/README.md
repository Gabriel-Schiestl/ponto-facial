# ponto · frontend

Frontend em React + TypeScript (Vite) do sistema de ponto por identificação facial, implementado a partir do Figma e integrado à API em `../backend`.

## Rodando

Na raiz do projeto, `./start.sh` prepara e sobe backend e frontend juntos. Para rodar só o frontend, suba o backend na porta 8000 (veja `backend/README.md`) e então:

```bash
npm install
npm run dev
```

Em desenvolvimento o Vite encaminha `/api` para `http://localhost:8000`. A câmera só funciona em `localhost` ou HTTPS.

### Variáveis de ambiente

| Variável | Padrão | Uso |
| --- | --- | --- |
| `VITE_API_URL` | vazio (mesma origem) | Endereço da API fora do servidor de desenvolvimento |
| `VITE_TERMINAL_NOME` | `Terminal 01` | Nome do terminal enviado em cada registro |
| `VITE_TERMINAL_LOCAL` | `São Paulo · Recepção` | Local do terminal enviado em cada registro |

## Telas

| Rota | Tela |
| --- | --- |
| `/admin/funcionarios` | Administração de funcionários (busca e filtros funcionais) |
| `/admin/funcionarios/novo` | Cadastro de funcionário |
| `/ponto` | Terminal público · identificação automática |
| `/ponto/confirmado` | Terminal público · registro confirmado |
| `/ponto/nao-reconhecido` | Terminal público · face não reconhecida |

`/ponto` envia um quadro da câmera a cada 1,5 s para `POST /api/ponto`: ao reconhecer abre a confirmação (que volta para a leitura após a contagem regressiva); rosto não reconhecido abre `/ponto/nao-reconhecido`; sem rosto na imagem, continua tentando.

## Estrutura

- `src/components` – layouts e componentes compartilhados (terminal e administração)
- `src/pages` – telas
- `src/api.ts` – cliente da API e tipos das respostas
- `src/hooks/useCamera.ts` – acesso à câmera e captura de quadros em JPEG
- `src/config` – identificação do terminal
- `src/data` – tipos e opções fixas dos formulários
- `src/styles` – estilos por área; tokens de cor ficam em `src/index.css`
- `src/assets` – ícones e imagens exportados do Figma
