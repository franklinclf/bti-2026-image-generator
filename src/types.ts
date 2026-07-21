// Modelo de dados do gerador (fonte da verdade dos contratos).

export type Variant = 'convite' | 'display';

// Transform da foto no espaco do card 1600x1149.
// scale >= 1; x/y em px (translate) aplicados pelo TemplateCard.
export interface PhotoTransform {
  scale: number;
  x: number;
  y: number;
}

// --- Tipografia ajustavel por formando e por parte do design ---
// Chaves das partes textuais ajustaveis (labels/defaults em src/lib/typeSlots.ts).
export type SlotKey =
  | 'nome'
  | 'corpo'
  | 'evento'
  | 'modulos'
  | 'saudacao'
  | 'dedicatoria'
  | 'fecho';

// Override de um slot: tamanho (px) e/ou entrelinha. Ausente => usa o default do template.
export interface SlotOverride {
  size?: number;
  lineHeight?: number;
}

// Overrides de tipografia de um formando (parcial: so o que foi alterado).
export type TypeStyles = Partial<Record<SlotKey, SlotOverride>>;

// Um formando importado.
export interface Grad {
  id: string;
  nome: string;
  fileName: string;
  url: string;
  transform: PhotoTransform;
  selected: boolean;
  gender: 'M' | 'F';
  typeStyles: TypeStyles;
}

// Props do card parametrizado (convite ou display).
export interface TemplateCardProps {
  variant: Variant;
  nome: string;
  photoUrl: string | null;
  transform: PhotoTransform;
  gender: 'M' | 'F';
  typeStyles?: TypeStyles;
}
