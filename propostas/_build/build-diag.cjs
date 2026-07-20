#!/usr/bin/env node
// Transforma split-a.html -> split-diag.html: foto mais estreita (640px), diagonal COMPLEXA (5 vertices),
// grafos/infos SOBRE a foto. Geometria clip-path == seam recalculada. Deterministico + verificavel.
const fs=require('fs');
const dir='/Users/franklinoliveira/Documents/BTI2026/propostas/';
let h=fs.readFileSync(dir+'split-a.html','utf8');
const chk=[];
function rep(a,b,expect){ const n=h.split(a).length-1; h=h.split(a).join(b); chk.push(`${expect!=null&&n!==expect?'⚠':'✓'} (${n}) ${a.slice(0,42)}`); }

// 1) foto + seam mais estreitas: 806 -> 640
rep('width: 806px;','width: 640px;',2);
rep('viewBox="0 0 806 1081"','viewBox="0 0 640 1081"',2);

// 2) clip-path diagonal COMPLEXA (5 vertices na borda esquerda)
rep('polygon(11% 0, 100% 0, 100% 100%, 2% 100%, 6.5% 52%)',
    'polygon(20% 0, 100% 0, 100% 100%, 6% 100%, 12% 72%, 3% 46%, 14% 20%)',1);

// 3) hairline SVG (polyline) acompanhando os 5 vertices (px em box 640x1081)
rep('88.66,0 52.39,562.12 16.12,1081','128,0 89.6,216.2 19.2,497.3 76.8,778.3 38.4,1081',4);

// 4) nos de grafo nos vertices (3 nos principais)
rep('cx="88.66" cy="0" r="5"','cx="128" cy="0" r="5"',2);
rep('cx="52.39" cy="562.12" r="6"','cx="19.2" cy="497.3" r="6"',2);
rep('cx="16.12" cy="1081" r="5"','cx="38.4" cy="1081" r="5"',2);

// 5) arestas de grafo agora vao PARA DENTRO da foto (overlay), nao pro conteudo
rep('M52.39,562.12 L-40,520 M52.39,562.12 L-24,636','M19.2,497.3 L120,470 M19.2,497.3 L110,590',2);
rep('M88.66,0 L18,64','M128,0 L200,70',2);
rep('<circle cx="-40" cy="520" r="3"/><circle cx="-24" cy="636" r="2.6"/><circle cx="18" cy="64" r="2.6"/>',
    '<circle cx="120" cy="470" r="3"/><circle cx="110" cy="590" r="2.6"/><circle cx="200" cy="70" r="2.6"/>',2);

// 6) conteudo mais largo (foto menor) + baseline termina antes da foto
rep('padding: 74px 800px 66px 84px;','padding: 74px 700px 66px 84px;',1);
rep('left: 60px; right: 812px;','left: 60px; right: 700px;',1);

// 7) CSS dos overlays sobre a foto
rep('  .photo-tag .lead { color: var(--gold-soft); }',
`  .photo-tag .lead { color: var(--gold-soft); }
  /* rede/grafo + coordenadas SOBRE a foto (nao sobre o rosto) */
  .photo-net { position:absolute; top:34px; right:34px; bottom:34px; width:640px; z-index:4; pointer-events:none; overflow:hidden; }
  .photo-coord { position:absolute; right:56px; bottom:60px; z-index:4; font-family:var(--mono); font-size:10px; letter-spacing:.16em; color:rgba(238,241,246,0.66); text-align:right; line-height:1.7; pointer-events:none; }
  .photo-coord .g { color: var(--gold-soft); }`,1);

// 8) markup dos overlays: injeta apos cada .photo-tag (2 cards)
const tag=`    <div class="photo-tag">
      <span class="lead">[ retrato ]</span> <span class="dot"></span> 2026.1 <span style="color:var(--slate-dim)">// fig.01</span>
    </div>`;
const overlay=`
    <svg class="photo-net" viewBox="0 0 640 1081" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g stroke="rgba(232,207,143,0.5)" stroke-width="1" fill="none" vector-effect="non-scaling-stroke">
        <path d="M360 812 L470 752 L560 836 M470 752 L508 636 M360 812 L300 918 M560 836 L602 946"/>
      </g>
      <g fill="rgba(232,207,143,0.85)">
        <circle cx="360" cy="812" r="3.2"/><circle cx="470" cy="752" r="3.6"/><circle cx="560" cy="836" r="3"/>
        <circle cx="508" cy="636" r="2.6"/><circle cx="300" cy="918" r="2.6"/><circle cx="602" cy="946" r="2.6"/>
      </g>
    </svg>
    <div class="photo-coord"><span class="g">//</span> 05.79 S &middot; 35.20 W<br />fig.01 &middot; retrato</div>`;
rep(tag, tag+overlay, 2);

h=h.replace('Split A (Diagonal facetada)','Diagonal complexa · foto menor + overlays');
fs.writeFileSync(dir+'split-diag.html',h);
console.log(chk.join('\n'));
console.log('\nok -> split-diag.html ('+h.length+' chars)');
