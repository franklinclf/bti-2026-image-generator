// Conteudo inicial do mural (spec 2.4 e 2.5).
import type {
  CargoNome, ExportOptions, MuralDoc, MuralFormando, SlotKey, SlotStyle, Snippet, SnippetId,
} from './types';
import { splitName } from './text/split';

export const FORMANDOS: string[] = [
  'ARTHUR BOMA SKEETE MYPOTO',
  'BEATRIZ GOUVEIA GADELHA',
  'CIPRIANO JOSE DA SILVA NETO',
  'CRISTIAN DEYVES OLIVEIRA DE BRITO',
  'DAVI KELMER DE MENEZES SILVA',
  'DINORAH DE FARIAS CHAGAS',
  'ERICK MARQUES OLIVEIRA AZEVEDO',
  'FELIPE MARCELO AQUINO DA COSTA',
  'FRANKLIN CLAUDIO LOPES DE OLIVEIRA FILHO',
  'GABRIEL FONTINELI DANTAS',
  'GABRIEL GUILHERME CARVALHO VIANA',
  'GABRIEL RIBEIRO BARBOSA DA SILVA',
  'GILIARDO JULIO DE MEDEIROS JUNIOR',
  'GUSTAVO HENRIQUE ARAUJO DE SALES LEITE',
  'GUSTAVO SOUSA BERNARDES',
  'HEBERT FRANÇA DA SILVA TORRES',
  'IAGO GABRIEL NOBRE DE MACEDO',
  'IGOR BASTOS ALBUQUERQUE',
  'JEREMIAS PINHEIRO DE ARAUJO ANDRADE',
  'JOAB URBANO DE ARAUJO',
  'JOAO MARINHO CALDAS NETO',
  'JOÃO VITOR DE OLIVEIRA SANTOS',
  'JOAREMIO MARINHO REVOREDO NETO',
  'JOHNY LÚCIO TEIXEIRA DA COSTA',
  'JOSÉ JARDEU VICENTE DA SILVA',
  'JUDSON KEVIN RODRIGUES DA SILVA',
  'KAIO EDUARDO ALVES DE LIMA',
  'LUCAS ALVES DE FARIAS TORRES',
  'LUCAS CUNHA DE AZEVEDO',
  'LUCAS DA SILVA BARBALHO',
  'LUCAS PINHEIRO CALDAS',
  'MARCUS VINICIUS ARAUJO PEREIRA',
  'MARIA PAZ MARCATO',
  'MARIANA EMERENCIANO MIRANDA',
  'MARIO LUIZ DA SILVA JÚNIOR',
  'MATHEUS DIAS ARAUJO DE MEDEIROS',
  'MATHEUS EUGENIO DE MOURA',
  'MATHEUS GABRIEL SOUTO DE LIRA FREITAS',
  'PEDRO HENRIQUE BASTOS VIANA',
  'PEDRO MIGUEL VARELA COSTA',
  'PEDRO PAULO LUCAS DE LIRA',
  'RAFAEL MAGNO FREITAS NUNES',
  'RAI DE MEDEIROS CUNHA',
  'RAQUEL DA COSTA FREIRE',
  'RAYANA MAYRA MENDES CARDOSO',
  'ROBSON SANTIAGO DANTAS',
  'RODRIGO EDUARDO DANTAS BARBALHO',
  'VICTOR COSTA MEDEIROS RIBEIRO',
  'VICTOR GABRIEL RIBEIRO MENEZES',
  'VINICIUS DE LIMA DUARTE SAMPAIO',
  'VINICIUS FERNANDES QUEIROZ DE MEDEIROS',
  'WISLA ALVES ARGOLO',
];

const PROFESSORES = [
  'Maxwell Gomes da Silva',
  'Alyson Matheus de Carvalho Souza',
  'Antonio Igor Silva de Oliveira',
  'Daniel Sabino Amorim de Araujo',
  'Dennys Leite Maia',
  'Eiji Adachi Medeiros Barbosa',
  'Frederico Araujo da Silva Lopes',
  'Gustavo Bezerra Paz Leitão',
  'Patrick Cesar Alves Terrematte',
  'Roberta de Souza Coelho',
  'Selan Rodrigues dos Santos',
  'Silvan Ferreira da Silva Junior',
  'Tarciana Cabral de Brito Guerra',
  'Thanos Tsouanas',
  'Umberto Souza da Costa',
  'Wellington Silva de Souza',
];

const MEMORIAM = ['Maxwell Gomes da Silva'];

const COMISSAO = [
  'Franklin Claudio Lopes de Oliveira Filho',
  'Gabriel Ribeiro Barbosa da Silva',
  'Mariana Emerenciano Miranda',
  'Matheus Dias Araujo de Medeiros',
  'Raquel da Costa Freire',
];

const ADMINISTRACAO: CargoNome[] = [
  { cargo: 'Reitor(a)', nome: '[ a confirmar ]' },
  { cargo: 'Vice-reitor(a)', nome: '[ a confirmar ]' },
  { cargo: 'Diretor(a) do IMD', nome: '[ a confirmar ]' },
  { cargo: 'Coord. do BTI', nome: '[ a confirmar ]' },
];

const HOMENAGEADOS: CargoNome[] = [
  { cargo: 'Patronesse', nome: 'Ismenia Blavatsky de Magalhães' },
  { cargo: 'Paraninfa', nome: 'Isabel Dillmann Nunes' },
  { cargo: 'Juramentista', nome: 'Raquel da Costa Freire' },
];

export const DEFAULT_SNIPPETS: Record<SnippetId, Snippet> = {
  coord: { text: '// 05.79 S · 35.20 W · natal/rn', on: true },
  build: { text: '// sprint final · status: done ✓', on: true },
  importTurma: { text: 'import turma', on: true },
  importGratidao: { text: 'import gratidao', on: true },
  git: { text: '>_ git commit -m "formados" && git push origin futuro', on: true },
  return: { text: 'return gratidao;', on: true },
  label01: { text: '[ 01 ] turma.jpg', on: true },
  fig01: { text: 'fig.01 · 52 pessoas · 1 turma', on: true },
  label02: { text: '[ 02 ] homenagens.json', on: true },
  gratidao: { text: 'const gratidao = Infinity;', on: true },
  label03: { text: '[ 03 ] const formandos = new Array(52);', on: true },
  sprint: { text: 'while (sprint) aprender();', on: true },
  indices: { text: '', on: true },
};

export const SNIPPET_ORDER = Object.keys(DEFAULT_SNIPPETS) as SnippetId[];

export const SNIPPET_LABELS: Record<SnippetId, string> = {
  coord: 'Fundo · canto superior esquerdo',
  build: 'Fundo · canto superior direito',
  importTurma: 'Fundo · import (esquerda)',
  importGratidao: 'Fundo · import (direita)',
  git: 'Fundo · sob o subtítulo',
  return: 'Fundo · rodapé',
  label01: 'Turma · rótulo',
  fig01: 'Turma · legenda da foto',
  label02: 'Homenagens · rótulo',
  gratidao: 'Homenagens · rodapé',
  label03: 'Formandos · rótulo',
  sprint: 'Formandos · canto direito',
  indices: 'Formandos · índices 00–51 nas fotos',
};

export const DEFAULT_ESTILOS: Record<SlotKey, SlotStyle> = {
  titulo: { font: 'fraunces', weight: 400, italic: false, sizeMm: 18, tracking: 0 },
  subtitulo: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 8.5, tracking: 0.18 },
  rotulo: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 8, tracking: 0 },
  snippet: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 6, tracking: 0 },
  secao: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 5.6, tracking: 0 },
  homenagem: { font: 'sora', weight: 600, italic: false, sizeMm: 4.2, tracking: 0 },
  legenda: { font: 'sora', weight: 600, italic: false, sizeMm: 3.1, tracking: 0 },
  hexTI: { font: 'fraunces', weight: 600, italic: true, sizeMm: 42.5, tracking: 0 },
  hexAno: { font: 'jetbrains-mono', weight: 400, italic: false, sizeMm: 8.2, tracking: 0.13 },
};

export const SLOT_ORDER = Object.keys(DEFAULT_ESTILOS) as SlotKey[];

export const SLOT_LABELS: Record<SlotKey, string> = {
  titulo: 'Título',
  subtitulo: 'Subtítulo',
  rotulo: 'Rótulos [ 0n ]',
  snippet: 'Snippets',
  secao: 'Títulos das homenagens',
  homenagem: 'Nomes nas homenagens',
  legenda: 'Nomes sob as fotos',
  hexTI: 'Hexágono · TI',
  hexAno: 'Hexágono · 2026.1',
};

export const DEFAULT_EXPORT: ExportOptions = {
  files: { composicao: true, fundo: true, turma: true, homenagens: true, formandos: true, hexagono: true, corte: true },
  formats: { pdf: true, svg: true, png: true },
  dpi: 300,
  bleedMm: 3,
  holeMm: 8,
};

export function createFormandos(): MuralFormando[] {
  return FORMANDOS.map((nome, i) => ({
    id: `f${String(i).padStart(2, '0')}`,
    nome,
    linhas: splitName(nome),
    linhasManuais: false,
    transform: { scale: 1, x: 0, y: 0 },
  }));
}

export function createDefaultDoc(): MuralDoc {
  return {
    version: 2,
    titulo: 'Tecnologia da Informação',
    subtitulo: 'UFRN · 2026.1',
    turma: 'Sprint Sem Fim',
    snippets: structuredClone(DEFAULT_SNIPPETS),
    administracao: structuredClone(ADMINISTRACAO),
    homenageados: structuredClone(HOMENAGEADOS),
    professores: [...PROFESSORES],
    memoriam: [...MEMORIAM],
    comissao: [...COMISSAO],
    formandos: createFormandos(),
    fotoTurma: { transform: { scale: 1, x: 0, y: 0 } },
    estilos: structuredClone(DEFAULT_ESTILOS),
    export: structuredClone(DEFAULT_EXPORT),
  };
}
