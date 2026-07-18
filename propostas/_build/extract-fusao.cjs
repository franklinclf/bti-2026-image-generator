#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const OUT = '/private/tmp/claude-501/-Users-franklinoliveira-Documents-BTI2026/90018351-689e-48d2-9559-f81866183309/tasks/w8idby2t1.output';
const DEST = '/Users/franklinoliveira/Documents/BTI2026/propostas';

const data = JSON.parse(fs.readFileSync(OUT, 'utf8'));
const variants = (data.result && data.result.variants) || data.variants || [];
const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 34);

const req = ['Nome do Formando', '2026.1', 'Colação de Grau', 'Ginásio', '28 de Julho', 'Aos que amo', 'Muito obrigado',
  'assets/ufrn-wordmark.png', 'assets/imd.svg', 'assets/pix.png', 'width:1600px', 'height:1149px'];
const norm = x => x.normalize('NFD').replace(/[̀-ͯ]/g, '');

const meta = [];
console.log('\n=== EXTRACAO + QA (fusao) ===\n');
variants.forEach(v => {
  const idx = v._index;
  const fname = `fusao-${idx}-${slug(v._dir || v.concept_name)}.html`;
  const html = v.html || '';
  fs.writeFileSync(path.join(DEST, fname), html, 'utf8');
  meta.push({ idx, name: v.concept_name, dir: v._dir, fname, notes: v.composition_notes });

  const q = [];
  if (!/^<!DOCTYPE html>/i.test(html.trim())) q.push('sem <!DOCTYPE');
  const cards = (html.match(/class="card"/g) || []).length;
  if (cards < 2) q.push('menos de 2 cards (achou ' + cards + ')');
  req.forEach(r => { if (r.includes('/') || r.includes(':')) { if (!html.includes(r)) q.push('falta ' + r); } });
  ['Colação', 'Informação', 'Ginásio', 'Saúde', 'gratidão', 'vocês', 'convidá'].forEach(a => {
    if (!norm(html).split(norm(a)).length) {}
  });
  const missTxt = ['Nome do Formando','2026.1','Colação de Grau','Ginásio','28 de Julho','Aos que amo','Muito obrigado']
    .filter(t => !norm(html).includes(norm(t)));
  if (missTxt.length) q.push('faltam textos: ' + missTxt.join(' | '));
  if (/&amp;lt;|&amp;gt;/.test(html.slice(0,300))) q.push('duplo-escapado?');
  const o = (html.match(/<div/g)||[]).length, c = (html.match(/<\/div>/g)||[]).length;

  console.log(`#${idx} ${v.concept_name}`);
  console.log(`   ${fname}  (${html.length} chars, cards:${cards}, div +${o}/-${c}${o!==c?' DESBAL':''})`);
  console.log(`   QA: ${q.length ? '⚠ ' + q.join('  |  ') : 'OK ✓'}\n`);
});
fs.mkdirSync(path.join(DEST, '_build'), { recursive: true });
fs.writeFileSync(path.join(DEST, '_build', 'meta-fusao.json'), JSON.stringify(meta, null, 2));
console.log('Escritos em', DEST);
