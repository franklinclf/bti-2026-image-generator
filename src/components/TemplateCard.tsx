// TemplateCard — renderiza UM card 1600x1149 fiel ao split-diag,
// parametrizado por { variant, nome, photoUrl, transform }.
// O chrome (fundo, grafo, foto, costura, moldura, header, rodape) e comum
// aos dois variants; so o miolo (.main), o selo de edicao e o code-note mudam.
import type { TemplateCardProps } from '../types';
import { resolveSlot } from '../lib/typeSlots';
import '../styles/template.css';

// Placeholder cinza (data-URI) quando nao ha foto.
const PLACEHOLDER =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="1081">' +
      '<rect width="100%" height="100%" fill="#1a2438"/>' +
      '<rect width="100%" height="100%" fill="url(#g)"/>' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#223050"/><stop offset="1" stop-color="#141d30"/>' +
      '</linearGradient></defs></svg>',
  );

export default function TemplateCard({
  variant,
  nome,
  photoUrl,
  transform,
  gender,
  typeStyles,
}: TemplateCardProps) {
  const { scale, x, y } = transform;
  // ID unico do gradiente do monograma por variant (evita colisao com 2 cards na pagina).
  const hxgId = `hxg-${variant}`;
  // Genero: F ajusta os textos PT (feminino); M mantem como esta.
  const g = gender === 'F';

  // Resolves de tipografia (default do template + override do formando).
  // 'nome' e comum aos dois variants; os demais slots so existem na variant atual.
  const sNome = resolveSlot('nome', typeStyles);
  const sCorpo = resolveSlot('corpo', typeStyles);
  const sEvento = resolveSlot('evento', typeStyles);
  const sModulos = resolveSlot('modulos', typeStyles);
  const sSaudacao = resolveSlot('saudacao', typeStyles);
  const sDedicatoria = resolveSlot('dedicatoria', typeStyles);
  const sFecho = resolveSlot('fecho', typeStyles);

  return (
    <div className="card">
      <div className="grid-fine" />
      <div className="grid-coarse" />

      {/* GRAFO discreto (concentrado no lado esquerdo + cantos) */}
      <svg
        className="graph"
        viewBox="0 0 1600 1149"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g stroke="rgba(201,162,39,0.20)" strokeWidth="1">
          <path d="M40 120 L150 70 L250 150 L180 250 L60 220 Z" />
          <path d="M150 70 L60 220 M250 150 L40 120" />
          <path
            d="M120 430 L260 360 L410 450 L360 610 L190 590 L120 430 Z"
            opacity="0.55"
          />
          <path
            d="M260 360 L190 590 M410 450 L120 430 M260 360 L360 610"
            opacity="0.5"
          />
          <path
            d="M190 590 L300 720 L460 690 M300 720 L240 850"
            opacity="0.45"
          />
          <path d="M60 900 L180 850 L200 970 L90 1010 Z" opacity="0.5" />
        </g>
        <g fill="rgba(232,207,143,0.55)">
          <circle cx="150" cy="70" r="3.2" />
          <circle cx="250" cy="150" r="2.6" />
          <circle cx="60" cy="220" r="2.6" />
          <circle cx="260" cy="360" r="3.2" />
          <circle cx="410" cy="450" r="2.8" />
          <circle cx="190" cy="590" r="3" />
          <circle cx="360" cy="610" r="2.6" />
          <circle cx="300" cy="720" r="2.8" />
          <circle cx="460" cy="690" r="2.4" />
          <circle cx="120" cy="430" r="2.4" />
          <circle cx="240" cy="850" r="2.4" />
          <circle cx="180" cy="850" r="2.6" />
        </g>
      </svg>

      {/* "2026.1" marca d'agua atras do miolo */}
      <div className="watermark" aria-hidden="true">
        2026.1
      </div>

      {/* FOTO LATERAL FULL-HEIGHT (direita) com corte diagonal facetado */}
      <div className="photo">
        <img
          src={photoUrl ?? PLACEHOLDER}
          alt="Foto do formando"
          style={{
            objectFit: 'cover',
            transform: `translate(${x}px, ${y}px) scale(${scale})`,
            transformOrigin: 'center top',
          }}
        />
      </div>
      {/* selo mono discreto sobre a foto */}
      <div className="photo-tag">
        <span className="lead">[ retrato ]</span> <span className="dot" /> 2026.1{' '}
        <span style={{ color: 'var(--slate-dim)' }}>// fig.01</span>
      </div>
      <svg
        className="photo-net"
        viewBox="0 0 640 1081"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g
          stroke="rgba(232,207,143,0.5)"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        >
          <path d="M360 812 L470 752 L560 836 M470 752 L508 636 M360 812 L300 918 M560 836 L602 946" />
        </g>
        <g fill="rgba(232,207,143,0.85)">
          <circle cx="360" cy="812" r="3.2" />
          <circle cx="470" cy="752" r="3.6" />
          <circle cx="560" cy="836" r="3" />
          <circle cx="508" cy="636" r="2.6" />
          <circle cx="300" cy="918" r="2.6" />
          <circle cx="602" cy="946" r="2.6" />
        </g>
      </svg>
      <div className="photo-coord">
        <span className="g">//</span> 05.79 S &middot; 35.20 W
        <br />
        fig.01 &middot; retrato
      </div>
      {/* HAIRLINE dourada sobre a diagonal facetada + 3 nos de grafo */}
      <svg
        className="seam"
        viewBox="0 0 640 1081"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <polyline
          points="128,0 89.6,216.2 19.2,497.3 76.8,778.3 38.4,1081"
          fill="none"
          stroke="rgba(232,207,143,0.20)"
          strokeWidth="7"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points="128,0 89.6,216.2 19.2,497.3 76.8,778.3 38.4,1081"
          fill="none"
          stroke="rgba(232,207,143,0.85)"
          strokeWidth="1.4"
          vectorEffect="non-scaling-stroke"
        />
        <g
          fill="#e8cf8f"
          stroke="rgba(11,20,36,0.7)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        >
          <circle cx="128" cy="0" r="5" />
          <circle cx="19.2" cy="497.3" r="6" />
          <circle cx="38.4" cy="1081" r="5" />
        </g>
        <g
          stroke="rgba(232,207,143,0.5)"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
          fill="none"
        >
          <path d="M19.2,497.3 L120,470 M19.2,497.3 L110,590" />
          <path d="M128,0 L200,70" />
        </g>
        <g fill="rgba(232,207,143,0.7)">
          <circle cx="120" cy="470" r="3" />
          <circle cx="110" cy="590" r="2.6" />
          <circle cx="200" cy="70" r="2.6" />
        </g>
      </svg>

      <div className="frame" />
      <span className="reg tl" />
      <span className="reg tr" />
      <span className="reg bl" />
      <span className="reg br" />

      {/* baseline dourada (na coluna de conteudo) */}
      <div className="baseline" />
      <div className="baseline-tag mono">
        <span className="kw">//</span> baseline · y = 935px
      </div>

      <div className="content">
        {/* HEADER / IDENTIDADE + selos de edicao */}
        <header className="header">
          <div className="brand">
            {/* Monograma hexagonal */}
            <svg
              className="monogram"
              viewBox="0 0 74 82"
              aria-label="TI monograma hexagonal"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={hxgId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#e8cf8f" />
                  <stop offset="1" stopColor="#c9a227" />
                </linearGradient>
              </defs>
              <polygon
                points="37,3 70,21 70,61 37,79 4,61 4,21"
                fill="rgba(21,36,66,0.5)"
                stroke={`url(#${hxgId})`}
                strokeWidth="2"
              />
              <polygon
                points="37,13 61,26 61,56 37,69 13,56 13,26"
                fill="none"
                stroke="rgba(201,162,39,0.35)"
                strokeWidth="1"
              />
              <g stroke="rgba(232,207,143,0.55)" strokeWidth="1.1" fill="none">
                <path d="M37,3 L37,13 M70,21 L61,26 M70,61 L61,56 M37,79 L37,69 M4,61 L13,56 M4,21 L13,26" />
              </g>
              <g fill="#e8cf8f">
                <circle cx="37" cy="3" r="2.4" />
                <circle cx="70" cy="21" r="2.4" />
                <circle cx="70" cy="61" r="2.4" />
                <circle cx="37" cy="79" r="2.4" />
                <circle cx="4" cy="61" r="2.4" />
                <circle cx="4" cy="21" r="2.4" />
              </g>
              <text
                x="37"
                y="52"
                textAnchor="middle"
                fontFamily="Fraunces, serif"
                fontWeight="600"
                fontSize="30"
                fill="#eef2fb"
                fontStyle="italic"
              >
                TI
              </text>
            </svg>

            <div className="brand-lines">
              <div className="prompt">
                <span className="caret">&gt;_</span> curso&nbsp;/&nbsp;ti
              </div>
              <h1>Tecnologia da Informação</h1>
              <div className="org">
                Universidade Federal do Rio Grande do Norte
              </div>
            </div>
          </div>

          <div className="edition">
            <span className="mod">[ 01 ] {variant}</span>
            <span className="year">2026.1</span>
          </div>
        </header>

        {/* MIOLO — varia por variant */}
        {variant === 'convite' ? (
          <div className="main">
            <div className="mlabel">
              <span className="idx">[ 02 ]</span> convocatória{' '}
              <span className="rule" />
            </div>
            <div className="code-note mono">
              <span className="kw">//</span> <span className="kw">const</span>{' '}
              formando = <span className="kw">new</span>{' '}
              {g ? 'Graduanda' : 'Graduando'}(
              <span style={{ color: '#e8cf8f' }}>"TI"</span>,{' '}
              <span style={{ color: '#e8cf8f' }}>"2026.1"</span>);
            </div>

            <div className="namewrap">
              <div
                className="name"
                style={{
                  fontSize: sNome.fontSize + 'px',
                  lineHeight: sNome.lineHeight,
                }}
              >
                {nome}
                <span className="cursor" />
              </div>
              <div className="name-tag mono">
                <span className="c">const</span>{' '}
                {g ? 'convidada' : 'convidado'} ={' '}
                <span className="c">true</span>;
              </div>
            </div>

            <p
              className="body-copy"
              style={{
                fontSize: sCorpo.fontSize + 'px',
                lineHeight: sCorpo.lineHeight,
              }}
            >
              <span className="strong">{nome}</span>,{' '}
              {g ? 'formanda' : 'formando'} em Tecnologia da Informação, turma
              2026.1, da Universidade Federal do Rio Grande do Norte, tem a
              honra de convidá-lo(a) para a
            </p>

            <div className="event">
              <div className="kicker">
                <span className="run">return</span> &mdash; cerimônia de
              </div>
              <h2
                style={{
                  fontSize: sEvento.fontSize + 'px',
                  lineHeight: sEvento.lineHeight,
                }}
              >
                Colação de Grau
              </h2>
            </div>

            <div className="modules">
              <div className="mod-card place">
                <svg
                  className="hx"
                  viewBox="0 0 20 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10 1 L18.7 6 L18.7 16 L10 21 L1.3 16 L1.3 6 Z"
                    stroke="#d4af37"
                    strokeOpacity=".6"
                  />
                  <circle cx="10" cy="11" r="2" fill="#c9a227" />
                </svg>
                <div className="dk">
                  <span className="dot" /> Local{' '}
                  <span className="idx">[ 03 ]</span>
                </div>
                <div className="dv" style={{ fontSize: sModulos.fontSize + 'px' }}>
                  Ginásio Poliesportivo 1 &mdash; UFRN
                  <span className="sub">
                    Rua da Saúde, Lagoa Nova &mdash; Natal/RN
                  </span>
                </div>
              </div>
              <div className="mod-card time">
                <svg
                  className="hx"
                  viewBox="0 0 20 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M10 1 L18.7 6 L18.7 16 L10 21 L1.3 16 L1.3 6 Z"
                    stroke="#d4af37"
                    strokeOpacity=".6"
                  />
                  <circle cx="10" cy="11" r="2" fill="#c9a227" />
                </svg>
                <div className="dk">
                  <span className="dot" /> Data{' '}
                  <span className="idx">[ 04 ]</span>
                </div>
                <div className="dv" style={{ fontSize: sModulos.fontSize + 'px' }}>
                  28.07.2026 &middot; 19h
                  <span
                    className="sub"
                    style={{
                      fontFamily: 'var(--sans)',
                      color: 'var(--slate)',
                      letterSpacing: 0,
                    }}
                  >
                    28 de Julho de 2026
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="main">
            <div className="mlabel">
              <span className="idx">[ 02 ]</span> dedicatória{' '}
              <span className="rule" />
            </div>
            <div className="code-note mono">
              <span className="kw">//</span> <span className="kw">for</span>{' '}
              (pessoa <span className="kw">of</span> minhaGente) {'{'}{' '}
              obrigado(pessoa); {'}'}
            </div>

            <div className="namewrap">
              <div
                className="name"
                style={{
                  fontSize: sNome.fontSize + 'px',
                  lineHeight: sNome.lineHeight,
                }}
              >
                {nome}
                <span className="cursor" />
              </div>
              <div className="name-tag mono">
                <span className="c">const</span> gratidão ={' '}
                <span className="c">Infinity</span>;
              </div>
            </div>

            <div className="dedic">
              <div
                className="overline"
                style={{
                  fontSize: sSaudacao.fontSize + 'px',
                  lineHeight: sSaudacao.lineHeight,
                }}
              >
                Aos que amo,
              </div>
              <p
                className="prose"
                style={{
                  fontSize: sDedicatoria.fontSize + 'px',
                  lineHeight: sDedicatoria.lineHeight,
                }}
              >
                A vocês, que acreditaram em mim e me impulsionaram a seguir em
                frente, <span className="hl">dedico esta conquista</span>. Foi
                ao lado de pessoas tão especiais como vocês que encontrei a força
                e a coragem para enfrentar cada desafio. Com profunda gratidão,
                agradeço por estarem presentes em cada passo, ajudando a
                transformar meus sonhos em realidade.{' '}
                <span className="hl">Este momento é nosso.</span>
              </p>
              <div
                className="close"
                style={{
                  fontSize: sFecho.fontSize + 'px',
                  lineHeight: sFecho.lineHeight,
                }}
              >
                {g ? 'Muito obrigada!' : 'Muito obrigado!'}
              </div>
              <div className="close-tag mono">
                <span className="c">return</span> gratidão;
              </div>
            </div>
          </div>
        )}

        {/* RODAPE (logos na base da coluna de conteudo) */}
        <footer className="footer">
          <div className="fmeta mono">
            {variant === 'convite' ? 'convite@ti' : 'display@ti'}&mdash;2026.1
            <br />
            <span className="end">EOF</span> &middot;{' '}
            {variant === 'convite'
              ? 'presença confirmada'
              : 'este momento é nosso'}
          </div>
          <div className="sponsors">
            <div className="sp">
              <img className="logo-ufrn" src="/brand/ufrn-white.png" alt="UFRN" />
              <span className="lead">Instituição</span>
            </div>
            <span className="sp-div" />
            <div className="sp">
              <img
                className="logo-imd"
                src="/brand/imd.svg"
                alt="Instituto Metrópole Digital"
              />
              <span className="lead">Curso</span>
            </div>
            <span className="sp-div" />
          </div>
        </footer>
      </div>
    </div>
  );
}
