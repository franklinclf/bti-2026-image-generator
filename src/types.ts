// Modelo de dados do gerador (fonte da verdade dos contratos).

export type Variant = 'convite' | 'display';

// Transform da foto no espaco do card 1600x1149.
// scale >= 1; x/y em px (translate) aplicados antes/depois do scale conforme o TemplateCard.
export interface PhotoTransform {
  scale: number;
  x: number;
  y: number;
}

// Um formando importado.
export interface Grad {
  id: string;
  nome: string;
  fileName: string;
  url: string;
  transform: PhotoTransform;
  selected: boolean;
}

// Props do card parametrizado (convite ou display).
export interface TemplateCardProps {
  variant: Variant;
  nome: string;
  photoUrl: string | null;
  transform: PhotoTransform;
}
