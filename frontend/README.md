# ponto · frontend

Protótipo em React + TypeScript (Vite) do sistema de ponto por identificação facial, implementado a partir do Figma.

## Rodando

```bash
npm install
npm run dev
```

## Telas

| Rota | Tela |
| --- | --- |
| `/admin/funcionarios` | Administração de funcionários (busca e filtros funcionais) |
| `/admin/funcionarios/novo` | Cadastro de funcionário |
| `/ponto` | Terminal público · identificação automática |
| `/ponto/confirmado` | Terminal público · registro confirmado |
| `/ponto/nao-reconhecido` | Terminal público · face não reconhecida |

No protótipo, `/ponto` simula o reconhecimento após 5 s e abre a confirmação, que volta para a leitura após a contagem regressiva.

## Estrutura

- `src/components` – layouts e componentes compartilhados (terminal e administração)
- `src/pages` – telas
- `src/data` – dados fictícios
- `src/styles` – estilos por área; tokens de cor ficam em `src/index.css`
- `src/assets` – ícones e imagens exportados do Figma
