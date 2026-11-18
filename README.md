# Ponto Facial

Sistema de registro de ponto com reconhecimento facial. O funcionário é cadastrado
uma vez com uma captura do rosto. Depois disso, basta ficar em frente à câmera do
terminal: o sistema identifica quem é e grava o ponto (entrada, saída para intervalo,
retorno do intervalo ou saída) com data e horário.

Projeto desenvolvido para o Trabalho Avaliativo do Centro Universitário FAG, que pede
um sistema de ponto integrando **React**, **Python** e a biblioteca **DeepFace**.

## Atendimento à proposta

| Item da atividade | Como foi feito |
| --- | --- |
| Tela em React para cadastro de funcionários (nome, matrícula, cargo e foto facial) | Tela **Cadastrar funcionário** (`/admin/funcionarios/novo`) com nome, CPF, matrícula, e-mail, cargo, departamento, unidade, jornada, foto de perfil e captura facial pela câmera |
| Backend em Python processando as imagens | API em **FastAPI** que recebe as imagens, valida a qualidade e conversa com o DeepFace |
| DeepFace analisando e comparando os rostos | O DeepFace (modelo **Facenet512**, detector **RetinaFace**) transforma cada rosto em um vetor de 512 números; a comparação é feita pela distância de cosseno entre o rosto capturado e os vetores cadastrados |
| Câmera captura o rosto e envia para a API | O terminal (`/ponto`) liga a webcam e envia um quadro a cada 1,5 s para `POST /api/ponto`, sem o funcionário precisar clicar em nada |
| Registro de funcionário, data, horário e tipo (entrada, saída ou intervalo) | Cada registro guarda funcionário, data/hora, tipo, número de comprovante e terminal. O tipo segue a sequência do dia: entrada → saída para intervalo → retorno do intervalo → saída |
| Armazenamento em banco de dados | Banco **SQLite** acessado com **SQLAlchemy** (tabelas `funcionarios` e `registros_ponto`) |

Além do que a atividade pede, o projeto também tem:

- uma tela de **Registros de ponto** (`/admin/registros`) para consultar os registros por dia;
- uma lista de funcionários com busca, filtros, paginação, indicadores e exclusão de cadastro;
- validação da captura no cadastro, que exige um único rosto, boa iluminação e nitidez, e o rosto de frente;
- proteção contra leituras repetidas: se o mesmo funcionário for lido de novo em menos de 60 s, o sistema não grava outro registro;
- o termo de consentimento para uso dos dados faciais.

## Tecnologias

**Frontend**
- React 19 + TypeScript
- Vite (servidor de desenvolvimento e build)
- React Router (navegação entre as telas)
- API `getUserMedia` do navegador para acessar a câmera

**Backend**
- Python 3.12
- FastAPI + Uvicorn (API REST)
- DeepFace com TensorFlow (detecção e reconhecimento facial)
- OpenCV e NumPy (leitura das imagens, verificação de iluminação/nitidez e cálculo das distâncias)
- SQLAlchemy + SQLite (banco de dados)

## Como funciona

```
 Cadastro (React)                         Terminal de ponto (React)
   câmera → foto do rosto                   câmera → quadro a cada 1,5 s
        │                                         │
        ▼                                         ▼
 POST /api/funcionarios                    POST /api/ponto
        │                                         │
        ▼                                         ▼
 DeepFace: detecta o rosto (RetinaFace)    DeepFace: detecta o rosto e gera o vetor
 e gera o vetor facial (Facenet512)               │
        │                                         ▼
        ▼                                  compara com os vetores cadastrados
 SQLite: salva os dados + vetor facial     (distância de cosseno ≤ limiar?)
                                                  │
                                    sim ──────────┴────────── não
                                     │                          │
                         SQLite: grava o registro      tela "Face não reconhecida"
                         (funcionário, data, hora, tipo)
                                     │
                         tela "Registro confirmado"
```

1. **Cadastro:** o administrador preenche os dados e captura o rosto pela câmera. O
   backend confere a qualidade da imagem e usa o DeepFace para gerar o vetor facial
   (*embedding*), que é salvo no banco junto com os dados do funcionário.
2. **Ponto:** o terminal envia quadros da câmera. O backend gera o vetor do rosto
   capturado e calcula a distância até o vetor de cada funcionário ativo. Se a menor
   distância estiver abaixo do limiar do modelo, o funcionário é considerado identificado.
3. **Registro:** o sistema descobre qual é o próximo tipo de registro do dia para
   aquele funcionário e grava o ponto com data, horário e comprovante.

## Como executar

Pré-requisitos: **Python 3.10 a 3.13** (o TensorFlow ainda não suporta o 3.14),
**Node.js 20.19+** e uma webcam.

Na raiz do projeto:

```bash
./start.sh
```

O script cria o ambiente virtual do Python, instala as dependências do backend e do
frontend, baixa os pesos dos modelos do DeepFace e sobe os dois serviços. Na primeira
execução isso pode levar alguns minutos.

- Terminal de ponto: http://localhost:5173/ponto
- Administração: http://localhost:5173/admin/funcionarios
- Documentação da API: http://localhost:8000/docs

Para rodar backend e frontend separadamente, siga os passos em
[backend/README.md](backend/README.md) e [frontend/README.md](frontend/README.md).

> A câmera só funciona em `localhost` ou HTTPS, por restrição do navegador.

## Estrutura do projeto

```
ponto-facial/
├── start.sh              # instala tudo e sobe backend + frontend
├── backend/              # API em Python
│   ├── app/
│   │   ├── main.py       # aplicação FastAPI
│   │   ├── face.py       # integração com o DeepFace (detecção, qualidade, comparação)
│   │   ├── models.py     # tabelas do banco (Funcionario, RegistroPonto)
│   │   ├── routers/      # rotas de funcionários e de ponto
│   │   └── config.py     # modelo, detector, limiar, fuso horário etc.
│   └── data/             # banco SQLite e fotos (criado na execução)
└── frontend/             # aplicação React
    └── src/
        ├── pages/admin/     # funcionários, cadastro, registros de ponto
        ├── pages/terminal/  # identificação, confirmação, face não reconhecida
        ├── hooks/useCamera.ts
        └── api.ts           # cliente da API
```

## Privacidade

A imagem da captura facial não é guardada: o backend salva apenas o vetor numérico
gerado pelo DeepFace. O cadastro só aceita a captura do rosto com o consentimento do
funcionário marcado, e os dados faciais podem ser apagados pela rota
`DELETE /api/funcionarios/{matricula}/face`.

## Limitações conhecidas

- O sistema não tem login: qualquer pessoa com acesso ao navegador abre o painel administrativo.
- A detecção de fotos ou telas mostradas à câmera (*anti-spoofing*) existe, mas está
  desligada por padrão porque depende do PyTorch (`PONTO_FACE_ANTI_SPOOFING=true`).
- Excluir um funcionário apaga também os registros de ponto dele. Num sistema real,
  o normal seria apenas inativar o cadastro e manter o histórico.
