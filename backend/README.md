# Ponto Facial — backend

API em FastAPI para cadastro de funcionários e registro de ponto por reconhecimento
facial com [DeepFace](https://github.com/serengil/deepface) (modelo Facenet512).

## Executar

Para subir backend e frontend juntos, use `./start.sh` na raiz do projeto: ele instala
as dependências, baixa os modelos do DeepFace e só então inicia a API (porta 8000) e o
frontend (porta 5173), conferindo a comunicação entre eles.

Manualmente, requer Python 3.10–3.13 (o TensorFlow ainda não publica pacotes para 3.14).

```bash
uv venv -p 3.12 && source .venv/bin/activate
uv pip install -r requirements.txt
python -m app.setup   # baixa os pesos do modelo e do detector
uvicorn app.main:app --reload --port 8000
```

Os pesos ficam em `~/.deepface/weights`. Sem o `app.setup`, o download acontece na
inicialização da API e a porta só abre quando ele termina.
A documentação interativa fica em http://localhost:8000/docs.

Dados (SQLite e fotos) ficam em `backend/data/`.

## Endpoints

| Método | Rota | Uso |
| --- | --- | --- |
| GET | `/api/funcionarios?busca=&departamento=&status=&pagina=&por_pagina=` | Lista paginada (tela Funcionários) |
| GET | `/api/funcionarios/resumo` | Indicadores da tela Funcionários |
| POST | `/api/funcionarios` | Cadastro (multipart) |
| GET | `/api/funcionarios/{matricula}` | Detalhe |
| GET | `/api/funcionarios/{matricula}/foto` | Foto de perfil |
| POST | `/api/funcionarios/face/validar` | Pré-validação da captura facial (`imagem`) |
| PUT | `/api/funcionarios/{matricula}/face` | Configura/refaz a face (`imagem`, `consentimento`) |
| DELETE | `/api/funcionarios/{matricula}/face` | Apaga os dados faciais |
| POST | `/api/ponto` | Registro de ponto (`imagem`, `terminal`, `local`) |
| GET | `/api/pontos?funcionario=&data=AAAA-MM-DD` | Registros do dia |

### Cadastro (`POST /api/funcionarios`, multipart)

Campos: `nome`, `cpf`, `matricula`, `email`, `telefone`, `admissao` (DD/MM/AAAA),
`departamento`, `cargo`, `unidade`, `status` (Ativo/Inativo),
`jornada` (`Segunda a sexta · 08:00 às 17:00`), `consentimento` (true/false),
`foto` (perfil, opcional) e `face` (captura da câmera, opcional).

Os nomes seguem os atributos `name` do formulário em `CadastroFuncionario.tsx`, então
`new FormData(form)` funciona depois de adicionar `name` aos `<select>` e anexar as imagens.
Sem `face`, o funcionário fica com identificação facial **pendente**.

A captura facial é recusada (422, com a lista `checks`) se não passar nos critérios
exibidos na tela: um único rosto, iluminação/nitidez adequadas e rosto de frente.

### Registro de ponto (`POST /api/ponto`)

Envie um quadro da câmera (`canvas.toBlob(..., 'image/jpeg')`) no campo `imagem`.

- **200** — ponto registrado. `type` segue a sequência do dia:
  entrada → saída para intervalo → retorno do intervalo → saída.
  Se o mesmo funcionário for lido de novo em menos de 60 s, devolve o registro
  anterior com `duplicate: true` sem gravar outro.
- **404** — rosto detectado, mas não reconhecido → tela "Face não reconhecida".
- **422** — nenhum rosto na imagem → o terminal continua tentando.
- **409** — os quatro registros do dia já foram feitos.

As respostas usam camelCase no mesmo formato do tipo `Employee` do frontend.

## Configuração (variáveis de ambiente)

| Variável | Padrão |
| --- | --- |
| `PONTO_CORS_ORIGINS` | `http://localhost:5173` |
| `PONTO_TIMEZONE` | `America/Sao_Paulo` |
| `PONTO_FACE_MODEL` | `Facenet512` |
| `PONTO_FACE_DETECTOR` | `retinaface` |
| `PONTO_FACE_THRESHOLD` | limiar de cosseno padrão do DeepFace para o modelo |
| `PONTO_FACE_ANTI_SPOOFING` | `false` (requer `torch`) |
| `PONTO_PUNCH_COOLDOWN_SECONDS` | `60` |

## Privacidade

Somente o vetor facial é gravado; a imagem da captura é descartada após o
processamento. `DELETE /api/funcionarios/{matricula}/face` remove os dados faciais.
