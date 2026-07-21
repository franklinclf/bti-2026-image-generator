// Preview — mostra o CONVITE e o DISPLAY do formando atual, cada card
// (1600x1149) escalado para caber, com controles de ajuste da foto.
// Estado vazio: convite para importar via <Dropzone/>.
import { useApp } from '../state';
import TemplateCard from './TemplateCard';
import PhotoAdjust from './PhotoAdjust';
import TypographyControls from './TypographyControls';
import Dropzone from './Dropzone';
import type { Variant } from '../types';

// Dimensoes nativas do card e escala de exibicao no preview.
const CARD_W = 1600;
const CARD_H = 1149;
const PREVIEW_W = 660; // largura alvo do preview em px
const SCALE = PREVIEW_W / CARD_W; // ~0.4125

// Um card escalado: o wrapper reserva o espaco final (W*scale x H*scale)
// e o card interno e reduzido via transform:scale, ancorado no topo-esquerda.
function ScaledCard({ variant }: { variant: Variant }) {
  const { current } = useApp();
  if (!current) return null;
  return (
    <div className="preview__panel">
      <div className="preview__label mono">
        <span className="preview__label-idx">[ {variant === 'convite' ? '01' : '02'} ]</span>{' '}
        {variant}
      </div>
      <div
        className="preview__stage"
        style={{ width: CARD_W * SCALE, height: CARD_H * SCALE }}
      >
        <div
          className="preview__scaler"
          style={{
            width: CARD_W,
            height: CARD_H,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          <TemplateCard
            variant={variant}
            nome={current.nome}
            gender={current.gender}
            photoUrl={current.url}
            transform={current.transform}
            typeStyles={current.typeStyles}
          />
        </div>
      </div>
    </div>
  );
}

export default function Preview() {
  const { current, grads } = useApp();

  // Sem nenhum formando: estado vazio com dropzone grande.
  if (!current) {
    return (
      <section className="preview preview--empty">
        <div className="empty">
          <h2>Nenhum formando ainda</h2>
          <p className="dim" style={{ marginBottom: 20 }}>
            Importe as fotos (arquivos <span className="mono">Nome_Sobrenome.jpg</span>)
            para gerar os convites e displays. Você poderá ajustar o nome e o
            enquadramento de cada foto.
          </p>
          <Dropzone />
          {grads.length === 0 ? null : (
            <p className="dim" style={{ marginTop: 16 }}>
              Selecione um formando na lista à esquerda para pré-visualizar.
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="preview">
      <div className="preview__controls">
        <PhotoAdjust />
        <TypographyControls />
      </div>
      <div className="preview__cards">
        <ScaledCard variant="convite" />
        <ScaledCard variant="display" />
      </div>
    </section>
  );
}
