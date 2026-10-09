import type { LayerId } from './geometry';

export type FontId = 'fraunces' | 'space-grotesk' | 'sora' | 'jetbrains-mono';
export type SlotKey =
  | 'titulo' | 'subtitulo' | 'rotulo' | 'snippet' | 'secao'
  | 'homenagem' | 'legenda' | 'hexTI' | 'hexAno';

// sizeMm = corpo da fonte em mm; tracking em em (0.1 = 10% do corpo).
export interface SlotStyle { font: FontId; weight: 400 | 600; italic: boolean; sizeMm: number; tracking: number }

export type SnippetId =
  | 'coord' | 'build' | 'importTurma' | 'importGratidao' | 'git' | 'return'
  | 'label01' | 'fig01' | 'label02' | 'gratidao' | 'label03' | 'sprint' | 'indices';
export interface Snippet { text: string; on: boolean }

// x, y em % da celula (-100 a 100); scale >= 1.
export interface PhotoTransform { scale: number; x: number; y: number }
export interface Photo { url: string; fileName: string; w: number; h: number }

export interface MuralFormando {
  id: string;
  nome: string;
  linhas: [string, string];
  linhasManuais: boolean;
  photo?: Photo;
  transform: PhotoTransform;
}

export interface CargoNome { cargo: string; nome: string }

export type ExportFileId = 'composicao' | LayerId | 'corte';
export interface ExportOptions {
  files: Record<ExportFileId, boolean>;
  formats: { pdf: boolean; svg: boolean; png: boolean };
  dpi: 150 | 300;
  bleedMm: number;
  holeMm: number;
}

export interface MuralDoc {
  version: 2;
  titulo: string;
  subtitulo: string;
  turma: string;
  snippets: Record<SnippetId, Snippet>;
  administracao: CargoNome[];
  homenageados: CargoNome[];
  professores: string[];
  memoriam: string[];
  comissao: string[];
  formandos: MuralFormando[];
  fotoTurma: { photo?: Photo; transform: PhotoTransform };
  estilos: Record<SlotKey, SlotStyle>;
  export: ExportOptions;
}
