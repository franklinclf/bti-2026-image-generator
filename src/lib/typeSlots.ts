// Registro das partes textuais ajustaveis do design + defaults (espelham src/styles/template.css).
// Usado pelos controles de tipografia (por formando) e pelo TemplateCard (aplica os overrides).
import type { SlotKey, TypeStyles, Variant } from '../types';

export interface SlotDef {
  key: SlotKey;
  label: string;
  piece: 'ambos' | Variant; // em que peca o slot aparece
  size: number; // font-size default (px)
  lineHeight: number; // line-height default
  min: number; // limites do tamanho (px)
  max: number;
  step: number;
  lh: boolean; // permite ajustar a entrelinha?
}

// Defaults iguais aos do template.css atual.
export const SLOTS: SlotDef[] = [
  { key: 'nome',        label: 'Nome do formando',           piece: 'ambos',   size: 70, lineHeight: 1.1,  min: 34, max: 96, step: 1, lh: true },
  { key: 'corpo',       label: 'Corpo do convite',           piece: 'convite', size: 25, lineHeight: 1.7,  min: 14, max: 30, step: 1, lh: true },
  { key: 'evento',      label: 'Destaque “Colação de Grau”', piece: 'convite', size: 64, lineHeight: 1.1,  min: 34, max: 88, step: 1, lh: true },
  { key: 'modulos',     label: 'Cartões (local / data)',     piece: 'convite', size: 21, lineHeight: 1.38, min: 13, max: 26, step: 1, lh: false },
  { key: 'saudacao',    label: 'Saudação “Aos que amo,”',    piece: 'display', size: 37, lineHeight: 1.1,  min: 22, max: 56, step: 1, lh: true },
  { key: 'dedicatoria', label: 'Dedicatória',                piece: 'display', size: 25, lineHeight: 1.66, min: 14, max: 30, step: 1, lh: true },
  { key: 'fecho',       label: 'Fecho “Muito obrigado(a)!”', piece: 'display', size: 42, lineHeight: 1.2,  min: 24, max: 64, step: 1, lh: true },
];

export const SLOT_BY_KEY = Object.fromEntries(
  SLOTS.map((s) => [s.key, s]),
) as Record<SlotKey, SlotDef>;

// Estilo final de um slot = default do template + override do formando.
export function resolveSlot(
  key: SlotKey,
  ov?: TypeStyles,
): { fontSize: number; lineHeight: number } {
  const def = SLOT_BY_KEY[key];
  const o = ov?.[key];
  return {
    fontSize: o?.size ?? def.size,
    lineHeight: o?.lineHeight ?? def.lineHeight,
  };
}
