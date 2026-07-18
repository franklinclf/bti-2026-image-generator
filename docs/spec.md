# Formatura TI 2026.1 — UFRN · Especificação

Projeto: substituir a arte "brega" da formatura de **Tecnologia da Informação 2026.1 (UFRN)**
por um sistema visual premium + um **app web** que personaliza e exporta as peças em massa.

Status: **design em fase de fechamento** (escolha entre 3 execuções fundidas). App a implementar
em seguida, sobre o template escolhido.

---

## 1. Contexto e objetivo

- 52 formandos; cada um tem **convite** e **display de mesa** personalizados (nome + foto).
- A empresa (PIX Formaturas) usa **Adobe**; entregar também vetor editável de handoff.
- Substituir a arte antiga (fundo preto chapado, PCB, ícones tech desbotados, divisória em
  chevron dourado, mistura de fontes) por algo **elegante, moderno e com referências sutis a
  tecnologia / engenharia de software**.

## 2. Restrições

- **Custo zero**: apenas deploy grátis da Vercel a partir do repo Git. Sem APIs pagas, sem servidor.
- **Print-grade**: exportar em alta (300 DPI) com sangria.
- **Orientação/proporção**: paisagem **1600 × 1149** (≈1.393), refletindo o display físico.
  Convite e display compartilham o mesmo sistema; muda o conteúdo (foto é a mesma).
- **Foto**: corpo inteiro, estúdio, **fundo branco** → removido (cutout) e posto sobre o navy.

## 3. Sistema visual (direção fundida B+A+C)

- **Fundo** (proposta "Blueprint"): malha técnica quadriculada em ouro (grid fino ~44px + grosso
  ~220px), mascarada em radial para preservar contraste do texto.
- **Grafos + hexágonos** (proposta "Constelação"): rede/grafo em fio de ouro discreto, atrás da
  figura e nos cantos. Hexágono como monograma "TI" e acentos modulares.
- **Código/console + tipografia + modularidade** (proposta "Terminal"): referências mono sutis
  (`>_`, `// …`, `{ }`, `const`, `[ 01 ]`, `EOF`, cursor); blocos de info como módulos com rótulo
  mono.
- **Paleta**: navy `#070a12 / #0a1122 / #0f1a30 / #152442` + dourado `#c9a227 / #d4af37` +
  champagne `#e8cf8f` + off-white `#eef2fb`.
- **Tipografia** (licença aberta/comercial — reproduzível): **Fraunces** (serif display),
  **Space Grotesk**/**Sora** (sans), **JetBrains Mono** (código/rótulos).

## 4. Peças

- **Fase âncora**: convite + display de mesa.
- **Kit completo** (depois): save the date, convite digital, posts/stories, etc.

## 5. Logos (em `brand-source/`, cópias de trabalho em `propostas/assets/` e futuramente `public/brand/`)

| Marca | Arquivo | Tratamento sobre navy |
|---|---|---|
| UFRN (logotipo) | `logotipo_outline.png` | branco via `filter:brightness(0) invert(1)` |
| UFRN (brasão) | `brasao_outline.png` / `brasao_positivo.png` | opcional, branco (linework) |
| IMD | `1A-Primaria-Gradiente.svg` | branco via filtro (SVG recolorível) |
| PIX Formaturas | `pix.png` (215×148, fundo preto, baixa-res) | `mix-blend-mode:screen`; **pendente versão vetorial/alta** |

## 6. App (a implementar)

- **Stack**: Vite + React + TypeScript, **SPA 100% client-side** (sem serverless) → Vercel free.
- **Fluxo**: arrastar fotos nomeadas `Nome_Sobrenome` → parse dos nomes → tabela editável +
  edição inline por preview → ajuste de foto (mover/zoom/recorte) + remoção de fundo branco
  opcional → previews de todos os materiais → download (todos / selecionados / individual).
- **Template**: SVG (a direção escolhida), com slots `{nome}` e `{foto}` por peça/tamanho.
- **Exportação print-grade (client-side)**:
  - nome → paths com **opentype.js** (sem dependência de fonte instalada; permite PDF vetorial);
  - rasterização com **@resvg/resvg-wasm** (PNG 300 DPI) e/ou canvas;
  - PDF vetorial com **svg2pdf.js + jsPDF** (mm + sangria);
  - lote com **JSZip**.
  - remoção de fundo: **@imgly/background-removal** (WASM, client-side, grátis) — opcional, já que
    as fotos vêm de estúdio com fundo branco.
- **DevTools screenshot / DPR alto**: só conferência manual, não é o pipeline. Fallback de
  escalonamento grátis: Puppeteer/Playwright local ou GitHub Actions.

## 7. Entregáveis

- App estático (repo + deploy Vercel) — operável por formandos **e** empresa.
- SVG/AI editável + style guide + specs de impressão (sangria, 300 DPI) + máscara de foil do
  dourado (acabamento físico da gráfica).

## 8. Pendências

- Escolha final entre as 3 execuções fundidas (convite + display).
- Logo PIX em vetor/alta resolução.
- Specs de impressão com a gráfica (sangria, formato físico exato, CMYK/foil).
