# Mural de vidro — design

Data: 2026-10-09 · Branch: `feat/mural` · Status: aprovado no brainstorming, aguardando revisão do spec

## 1. Objetivo

Adicionar ao app (Vite + React + TS, `src/`) um editor do **mural de parede em vidro** da turma
TI 2026.1 (UFRN), no mesmo sistema visual do convite/display, com exportação vetorial por peça
de vidro para a PIX Formaturas.

O convite e o display de mesa existentes **não mudam** (nem código, nem export).

## 2. Design aprovado (v5 do brainstorming)

Mockups de referência: `docs/superpowers/specs/mural/mockup-v5.html` (fragmento SVG; os snippets `build` e `sprint` foram atualizados depois, ver 2.4).

### 2.1 Formato

- **800 × 600 mm**, paisagem. Unidade interna = **1 mm** (SVG `viewBox="0 0 800 600"`).
- 3 níveis de vidro, com espaçadores metálicos:
  - **Fundo**: navy, contorno com chanfros de 30 mm nos 4 cantos, `y` de 60 a 600.
  - **Módulos** (3 vidros elevados): turma, homenagens, formandos.
  - **Hexágono** (topo): símbolo "louros de circuito", vazando ~4 cm acima do fundo.

### 2.2 Geometria (mm)

| Peça | Contorno | Posição / tamanho |
|---|---|---|
| Fundo | `M30,60 H770 L800,90 V570 L770,600 H30 L0,570 V90 Z` | 800 × 540 |
| [01] Turma | retângulo `rx=4` | x 25, y 90, 260 × 190; foto em x 37, y 114, 236 × 154 |
| [02] Homenagens | retângulo `rx=4` | x 515, y 90, 260 × 190; 2 colunas em x 527 e x 657 |
| [03] Formandos | retângulo `rx=4` | x 25, y 305, 750 × 270 |
| Hexágono | hexágono (desenho base 300 × 330) | `translate(318.25,15) scale(0.545)` → bbox ≈ x 329–471, y 23–187 |

- **Grade de formandos**: 13 colunas × 4 linhas = 52. Foto **40 × 48 mm**, em
  `x = 40 + c·56.7`, `y = 332 + r·60`. Nome completo em 2 linhas, centralizadas, baselines em
  `y + 52` e `y + 56.3`. Índice `00`–`51` no canto superior esquerdo de cada foto.
- **Título** (no vidro de fundo, sob o hexágono): "Tecnologia da Informação" (y 230), subtítulo
  "UFRN · 2026.1 · TURMA SPRINT SEM FIM" (y 248), linha git (y 266).
- **Arestas do grafo** (fundo): dos vértices inferiores do hexágono (329.1, 145.8) e
  (470.9, 145.8) até (285, 205) e (515, 205); segmento vertical (400, 276)→(400, 305).
- **Logos** no rodapé do fundo: UFRN (esquerda, x 40) e PIX (direita, até x 760). Arquivos em
  `public/brand/`.
- **Espaçadores**: fundo em (20, 80), (780, 80), (20, 580), (780, 580); hexágono em (400, 36) e
  (400, 170).

### 2.3 Paleta e tipografia

- Navy `#0e1a33` / `#14244a` / `#101d3b`, dourado `#c9a227`, champagne `#e8cf8f`,
  tinta `#eef2fb`, tinta fraca `#aab6cf`. Grid blueprint de 10 mm e 50 mm.
- Fontes: Fraunces (título, TI do hexágono), Space Grotesk ou Sora (nomes, homenagens),
  JetBrains Mono (snippets, rótulos `[ 0n ]`, 2026.1).

### 2.4 Snippets (todos editáveis e com liga/desliga)

| Id | Onde | Texto padrão |
|---|---|---|
| `coord` | fundo, canto sup. esquerdo | `// 05.79 S · 35.20 W · natal/rn` |
| `build` | fundo, canto inf. direito | `// sprint final · status: done ✓` |
| `importTurma` | fundo, sob o hexágono (horizontal) | `import turma` |
| `importGratidao` | fundo, sob o hexágono (horizontal) | `import gratidao` |
| `git` | fundo, sob o subtítulo | `>_ git commit -m "formados" && git push origin futuro` |
| `return` | fundo, rodapé central | `return gratidao;` |
| `label01` | módulo turma | `[ 01 ] turma.jpg` |
| `fig01` | módulo turma, sob a foto | `fig.01 · 52 pessoas · 1 turma` |
| `label02` | módulo homenagens | `[ 02 ] homenagens.json` |
| `gratidao` | módulo homenagens, rodapé | `const gratidao = Infinity;` |
| `label03` | módulo formandos | `[ 03 ] const formandos = new Array(52);` |
| `sprint` | módulo formandos, canto sup. direito | `while (sprint) aprender();` |
| `indices` | cada foto | `00`–`51` (só liga/desliga) |

### 2.5 Conteúdo inicial

- **Homenageados da turma**: Patronesse: Ismenia Blavatsky de Magalhães · Paraninfa: Isabel
  Dillmann Nunes · Orador(a): Aluno de C&T · Juramentista: Raquel da Costa Freire.
- **Professores homenageados** (16): Antonio Igor Silva de Oliveira, Roberta de Souza Coelho,
  Patrick Cesar Alves Terrematte, Alyson Matheus de Carvalho Souza, Maxwell Gomes da Silva,
  Gustavo Bezerra Paz Leitão, Eiji Adachi Medeiros Barbosa, Selan Rodrigues dos Santos,
  Tarciana Cabral de Brito Guerra, Daniel Sabino Amorim de Araujo, Thanos Tsouanas, Umberto
  Souza da Costa, Wellington Silva de Souza, Silvan Ferreira da Silva Junior, Frederico Araujo
  da Silva Lopes, Dennys Leite Maia.
- **Comissão de formatura**: Franklin Claudio Lopes de Oliveira Filho, Gabriel Ribeiro Barbosa
  da Silva, Mariana Emerenciano Miranda, Matheus Dias Araujo de Medeiros, Raquel da Costa Freire.
- **Corpo administrativo**: Reitor(a), Vice-reitor(a), Diretor(a) do IMD, Coord. do BTI, todos
  com nome `[ a confirmar ]`.
- **Formandos**: as 52 linhas de `docs/superpowers/specs/mural/formandos.txt`,
  em caixa alta, ordem alfabética. Copiadas para `src/mural/defaults.ts`.

## 3. Arquitetura

Abordagem escolhida: **mural renderizado como SVG em mm**, com todo texto convertido em
contornos (paths) via `opentype.js`. O mesmo SVG serve para a prévia e para os 3 formatos de
export, então a prévia é idêntica ao arquivo final.

### 3.1 Navegação

`App.tsx` ganha um seletor no topo: **Convite / Display** (tela atual, intacta) | **Mural**.

### 3.2 Módulos novos (`src/mural/`)

| Arquivo | Responsabilidade |
|---|---|
| `types.ts` | `MuralDoc`, `MuralFormando`, `SlotStyle`, `SnippetId`, `LayerId`, `ExportOptions` |
| `geometry.ts` | todas as constantes em mm da seção 2.2, contornos das peças e `outline(peça, sangria)` |
| `defaults.ts` | conteúdo inicial (2.4, 2.5) e estilos padrão por slot |
| `state.tsx` | reducer + `MuralProvider`/`useMural()`; persistência em `localStorage` |
| `text/fonts.ts` | carrega os TTF de `public/fonts/` com `opentype.js` (uma vez, cache) |
| `text/fit.ts` | mede texto, divide nome em 2 linhas, comprime ou sinaliza estouro |
| `text/TextPath.tsx` | componente que desenha texto como `<path>` (memoizado) |
| `layers/FundoLayer.tsx`, `TurmaLayer.tsx`, `HomenagensLayer.tsx`, `FormandosLayer.tsx`, `HexLayer.tsx` | uma camada por peça de vidro |
| `MuralSvg.tsx` | compõe as camadas; props: `layers` visíveis, `bleed`, `mode` (`preview`/`export`) |
| `editor/MuralEditor.tsx` + abas `TextosTab`, `HomenagensTab`, `FormandosTab`, `TipografiaTab`, `ExportTab` | UI |
| `export/svg.ts`, `export/pdf.ts`, `export/png.ts`, `export/corte.ts`, `export/bundle.ts` | export |

Reuso do app atual: `PhotoAdjust` (pan/zoom), `parseNameFromFile` e o padrão do `Dropzone`.

### 3.3 Modelo de dados

```ts
type SlotKey = 'titulo' | 'subtitulo' | 'rotulo' | 'snippet' | 'secao' | 'homenagem'
             | 'legenda' | 'hexTI' | 'hexAno';
type FontId = 'fraunces' | 'space-grotesk' | 'sora' | 'jetbrains-mono';
interface SlotStyle { font: FontId; weight: number; italic: boolean; sizeMm: number; tracking: number }

interface MuralFormando {
  id: string;
  nome: string;                 // caixa alta, como na lista
  linhas: [string, string];     // padrão = splitName(nome); editável
  linhasManuais: boolean;       // true quando o usuário editou
  fileName?: string; url?: string;          // retrato (não persistido)
  transform: { scale: number; x: number; y: number };
}

interface MuralDoc {
  version: 1;
  titulo: string; subtitulo: string; turma: string;
  snippets: Record<SnippetId, { text: string; on: boolean }>;
  administracao: { cargo: string; nome: string }[];
  homenageados: { cargo: string; nome: string }[];
  professores: string[];
  comissao: string[];
  formandos: MuralFormando[];
  fotoTurma?: { url: string; transform: { scale: number; x: number; y: number } };
  estilos: Record<SlotKey, SlotStyle>;
  export: ExportOptions;
}
```

### 3.4 Persistência

- `localStorage['mural-ti-2026:v1']` guarda o `MuralDoc` **sem** `url`s (debounce de 500 ms).
- Botões **Salvar projeto (.json)** e **Abrir projeto (.json)**, no mesmo formato.
- Fotos não são persistidas: ao soltar a pasta de retratos de novo, o app associa pelo nome do
  arquivo (normalizado: sem acento, minúsculas, `_`/`-` → espaço). Retratos sem par aparecem
  numa lista "sem formando", e podem ser arrastados para um formando.

## 4. Editor

Barra lateral com 5 abas, prévia à direita (zoom e pan; liga/desliga contorno das peças e
das áreas de sangria).

1. **Textos**: título, subtítulo, nome da turma, e cada snippet de 2.4 (texto + liga/desliga).
2. **Homenagens**: 4 listas (administração, homenageados da turma, professores, comissão);
   adicionar, remover e reordenar itens.
3. **Formandos**: 52 linhas (miniatura, nome, linha 1, linha 2, pan/zoom). Botões
   "ordenar alfabeticamente", "recalcular quebras" e área para soltar retratos. A foto da turma
   tem o seu próprio upload e pan/zoom.
4. **Tipografia**: uma linha por `SlotKey`: fonte (4 opções), peso (só os pesos empacotados),
   itálico, tamanho em mm e tracking. Botões "resetar slot" e "resetar tudo". Mostra o mínimo
   legível como referência (2,5 mm de altura de caixa alta).
5. **Exportar**: seção 5.

Fica **fora** do editor: mover ou redimensionar peças, cores, fontes além das 4.

### 4.1 Regras de texto (`text/fit.ts`)

- `splitName(nome)`: divide nas palavras, escolhendo a quebra que minimiza a linha mais longa.
- Ajuste à largura: se uma linha passa da caixa (38 mm nas legendas; largura da coluna nas
  homenagens), comprime na horizontal até **85%**. Passou disso: desenha mesmo assim e marca
  **estouro**.
- Estouro vertical nas homenagens (a lista não cabe na altura do módulo) também marca estouro.
- Estouros aparecem na aba correspondente (badge vermelho no item) e no topo da aba Exportar.
  O export continua permitido.

## 5. Export para a PIX

### 5.1 Arquivos

| Arquivo | Conteúdo | Tamanho útil |
|---|---|---|
| `00-composicao` | mural inteiro (prova para aprovação) | 800 × 600 mm |
| `01-fundo` | vidro de fundo: grid, arestas, título, snippets do fundo, logos | 800 × 540 mm |
| `02-turma` | módulo turma | 260 × 190 mm |
| `03-homenagens` | módulo homenagens | 260 × 190 mm |
| `04-formandos` | módulo formandos | 750 × 270 mm |
| `05-hexagono` | hexágono | ≈ 142 × 164 mm |
| `corte` | contorno de cada peça + furos dos espaçadores, só traço (0,25 mm, spot `CutContour`), na posição real do mural | 800 × 600 mm |
| `montagem.txt` | por peça: tamanho, posição (x, y) sobre o fundo e furos, em mm | — |

- Cada peça sai recortada no próprio contorno, fundo transparente, com **sangria** (padrão
  3 mm, ajustável de 0 a 5): o preenchimento de fundo da peça se estende além do contorno.
  Todos os contornos são convexos, então `outline(peça, sangria)` é um deslocamento simples.
- Furos: círculos de **Ø 8 mm** (ajustável), nas posições de 2.2.
- **Formatos** (marcáveis): PDF vetorial, SVG e PNG (150 ou 300 DPI, padrão 300). Peças
  marcáveis individualmente; tudo marcado por padrão.
- Saída: `mural-ti-2026_<AAAA-MM-DD>.zip`, com pastas `pdf/`, `svg/`, `png/` e os arquivos
  `corte.*` e `montagem.txt` na raiz.

### 5.2 Pipeline

1. `MuralSvg` em modo `export` renderiza a peça (offscreen), com fotos como data URLs
   reamostradas para a resolução de saída (40 × 48 mm a 300 DPI = 472 × 567 px).
2. **SVG**: serializa o elemento (texto já em paths).
3. **PDF**: `svg2pdf.js` sobre um `jsPDF` do tamanho da peça + sangria, em mm.
4. **PNG**: SVG serializado → `Image` → `canvas` no tamanho em px do DPI escolhido →
   `toBlob`. No Safari, se a área passar de 16,7 MP, avisa e sugere 150 DPI para aquele arquivo.
5. `JSZip` monta o zip; barra de progresso por arquivo; erros por arquivo são listados no
   fim, sem abortar o resto.

### 5.3 Dependências novas

- `opentype.js`, `svg2pdf.js` (o `jspdf` e o `jszip` já existem).
- `vitest` (dev).
- Fontes TTF estáticas em `public/fonts/` (licença OFL, com `OFL.txt`): Fraunces Regular e
  SemiBold Italic; Space Grotesk Regular e SemiBold; Sora Regular e SemiBold; JetBrains Mono
  Regular e Medium.

## 6. Testes e verificação

- **Vitest** (unitários): `splitName`, ajuste/estouro em `fit.ts` (com uma fonte real),
  `outline()` com sangria, associação de retratos por nome de arquivo, migração e
  carregamento do `localStorage`, conteúdo de `montagem.txt` e nomes dos arquivos do zip.
- `npm run build` sem erros.
- Teste de fumaça do export: gerar o PDF do hexágono e confirmar que contém paths e nenhuma
  fonte embutida (texto 100% em contornos).
- Teste visual e de impressão: feito pelo usuário no navegador e com a PIX.

## 7. Pendências (não bloqueiam a implementação)

1. Nomes do corpo administrativo (e quais cargos entram).
2. Nome do(a) orador(a) (hoje "Aluno de C&T").
3. Confirmar "Patronesse" / "Paraninfa".
4. Com a PIX: sangria, diâmetro dos furos, espessura do vidro, se precisam de camada de branco.
5. Retratos individuais (vêm da PIX) e foto da turma.
