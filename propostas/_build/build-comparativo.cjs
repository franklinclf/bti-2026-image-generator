#!/usr/bin/env node
// Monta propostas/comparativo.html com miniaturas (srcdoc) dos 5 conceitos.
const fs = require('fs');
const path = require('path');

const ROOT = '/Users/franklinoliveira/Documents/BTI2026/propostas';
const CDIR = path.join(ROOT, 'conceitos');
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, '_build', 'meta.json'), 'utf8'));
const byIdx = Object.fromEntries(meta.map(m => [m.idx, m]));

// ordem de apresentacao + minha leitura de cada um
const REC = [
  { idx: 2, letter: 'A', why: 'A evolucao elegante do seu cerebro/circuito atual: um grafo de conhecimento em ouro. Continuidade de identidade + ar premium. Minha recomendacao principal.', flag: '' },
  { idx: 1, letter: 'B', why: 'Linguagem de projeto de engenharia: grid tecnico, marcas de registro, retrato em arco com anotacoes. Inteligente e preciso.', flag: '' },
  { idx: 3, letter: 'C', why: 'A referencia mais direta a engenharia de software: prompt >_, // class Formando extends UFRN, cursor. Ousado e moderno; personalidade mais "dev".', flag: '' },
];
const ALT = [
  { idx: 5, letter: 'D', why: 'Editorial / grid suico: 2026.1 gigante, layout de keynote de marca tech. Muito contemporaneo.', flag: 'precisa de ajuste de acentuacao PT-BR' },
  { idx: 4, letter: 'E', why: 'Art Deco cerimonial: moldura simetrica, leque de raios. O mais formal/tradicional com alma tech.', flag: 'precisa de ajuste de acentuacao PT-BR' },
];

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const hexes = arr => (arr || []).map(x => {
  const m = String(x).match(/#[0-9a-fA-F]{6}/);
  return m ? { hex: m[0], label: String(x).replace(m[0], '').trim() } : null;
}).filter(Boolean);

function card(entry, size) {
  const m = byIdx[entry.idx];
  const html = fs.readFileSync(path.join(CDIR, m.fname), 'utf8');
  const w = size === 'big' ? 360 : 300;
  const scale = (w / 860).toFixed(4);
  const h = Math.round(1216 * scale);
  const sw = hexes(m.palette).map(c =>
    `<span class="sw" title="${esc(c.label)} ${c.hex}" style="background:${c.hex}"></span>`).join('');
  const flag = entry.flag ? `<span class="flag">⚠ ${entry.flag}</span>` : '';
  return `
  <article class="card ${size}">
    <div class="head">
      <span class="letter">${entry.letter}</span>
      <div class="titles">
        <h3>${esc(m.name)}</h3>
        <p class="tag">${esc(m.tagline)}</p>
      </div>
    </div>
    <a class="thumb" style="width:${w}px;height:${h}px" href="conceitos/${m.fname}" target="_blank" rel="noopener" title="Abrir em tamanho real">
      <iframe scrolling="no" tabindex="-1" style="transform:scale(${scale})" srcdoc="${esc(html)}"></iframe>
      <span class="open">abrir em tamanho real ↗</span>
    </a>
    <div class="swatches">${sw}</div>
    <p class="why">${esc(entry.why)}</p>
    <p class="fonts"><b>Fontes:</b> ${esc((m.typography || '').split('.')[0])}.</p>
    ${flag}
  </article>`;
}

const page = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Propostas de Direção Visual — Formatura TI 2026.1</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Sora:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  :root{--navy:#0a1122;--gold:#d4af37;--champ:#e8cf8f;--ink:#eef2fb;--dim:#aab6cf;--faint:#6d7c9c;}
  *{margin:0;padding:0;box-sizing:border-box;}
  body{background:radial-gradient(1200px 900px at 50% -8%,#0d1526,#070a12 60%),#070a12;color:var(--ink);font-family:'Sora',sans-serif;padding:56px 40px 90px;}
  .wrap{max-width:1200px;margin:0 auto;}
  .eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.4em;text-transform:uppercase;color:var(--gold);}
  h1{font-family:'Fraunces',serif;font-weight:400;font-size:44px;line-height:1.05;margin:14px 0 10px;}
  h1 .em{font-style:italic;color:var(--champ);}
  .lede{color:var(--dim);font-weight:300;font-size:16px;line-height:1.7;max-width:820px;}
  .lede b{color:var(--ink);font-weight:500;}
  .note{margin-top:16px;padding:14px 18px;border:1px solid rgba(212,175,55,.25);border-radius:10px;background:rgba(212,175,55,.05);color:var(--dim);font-size:13.5px;line-height:1.65;}
  .note b{color:var(--champ);}
  h2.sec{font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:.36em;text-transform:uppercase;color:var(--faint);margin:52px 0 22px;display:flex;align-items:center;gap:16px;}
  h2.sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,rgba(212,175,55,.4),transparent);}
  .grid{display:flex;flex-wrap:wrap;gap:34px;}
  .card{background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,0));border:1px solid rgba(160,178,220,.1);border-radius:16px;padding:22px;width:404px;}
  .card.small{width:344px;opacity:.94;}
  .head{display:flex;gap:14px;align-items:flex-start;margin-bottom:16px;}
  .letter{flex:0 0 auto;width:34px;height:34px;display:grid;place-items:center;border:1px solid var(--gold);border-radius:9px;color:var(--champ);font-family:'Fraunces',serif;font-size:18px;}
  .titles h3{font-family:'Fraunces',serif;font-weight:500;font-size:21px;line-height:1.1;}
  .titles .tag{color:var(--dim);font-size:13px;font-weight:300;line-height:1.45;margin-top:5px;}
  .thumb{display:block;position:relative;overflow:hidden;border-radius:10px;border:1px solid rgba(212,175,55,.28);background:#05070d;box-shadow:0 20px 50px -24px rgba(0,0,0,.8);text-decoration:none;}
  .thumb iframe{position:absolute;top:0;left:0;width:860px;height:1216px;border:0;transform-origin:top left;pointer-events:none;}
  .thumb .open{position:absolute;left:0;right:0;bottom:0;padding:9px;text-align:center;font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--champ);background:linear-gradient(0deg,rgba(5,7,13,.92),rgba(5,7,13,0));opacity:0;transition:opacity .2s;}
  .thumb:hover .open{opacity:1;}
  .swatches{display:flex;flex-wrap:wrap;gap:6px;margin:16px 0 12px;}
  .sw{width:20px;height:20px;border-radius:5px;border:1px solid rgba(255,255,255,.14);}
  .why{color:var(--dim);font-size:13.5px;line-height:1.6;}
  .fonts{color:var(--faint);font-size:12px;line-height:1.5;margin-top:10px;}
  .fonts b{color:var(--dim);}
  .flag{display:inline-block;margin-top:12px;font-family:'JetBrains Mono',monospace;font-size:10.5px;letter-spacing:.1em;color:#e8b04a;background:rgba(232,176,74,.1);border:1px solid rgba(232,176,74,.3);border-radius:6px;padding:5px 9px;}
  .foot{margin-top:70px;color:var(--faint);font-size:12.5px;line-height:1.7;font-family:'JetBrains Mono',monospace;}
</style>
</head>
<body>
<div class="wrap">
  <div class="eyebrow">Formatura · Tecnologia da Informação 2026.1 · UFRN</div>
  <h1>Propostas de <span class="em">Direção Visual</span></h1>
  <p class="lede">Cinco caminhos distintos para substituir a arte atual — todos em <b>azul-marinho + dourado</b>, mantendo <b>foto do formando</b> e <b>logos (PIX / UFRN)</b>, com referências <b>modernas e elegantes</b> a tecnologia e engenharia de software. Passe o mouse e clique em qualquer peça para <b>abrir em tamanho real</b> numa nova aba.</p>
  <div class="note"><b>Como ler:</b> estas são <b>direções</b> (o convite serviu de peça-teste). Ao escolher uma, eu refino o ajuste fino de espaçamento, aplico nas demais peças do kit e entrego os arquivos editáveis. Orientação (retrato/paisagem) é ajustável. Fontes são todas de <b>licença aberta/comercial</b> (Google Fonts), então reproduzíveis pela empresa.</div>

  <h2 class="sec">Recomendados</h2>
  <div class="grid">
    ${REC.map(e => card(e, 'big')).join('\n')}
  </div>

  <h2 class="sec">Também exploramos</h2>
  <div class="grid">
    ${ALT.map(e => card(e, 'small')).join('\n')}
  </div>

  <p class="foot">// 5 conceitos gerados · azul-marinho + dourado · foto + logos preservados<br>// escolha A/B/C/D/E — ou combine elementos de duas direções · o próximo passo é refinar a escolhida</p>
</div>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, 'comparativo.html'), page, 'utf8');
console.log('OK -> ' + path.join(ROOT, 'comparativo.html'), '(' + page.length + ' chars)');
