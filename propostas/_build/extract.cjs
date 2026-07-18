#!/usr/bin/env node
// Extrai os conceitos do output do workflow -> arquivos .html individuais + comparativo + relatorio de QA.
const fs = require('fs');
const path = require('path');

const OUT = process.argv[2] || '/private/tmp/claude-501/-Users-franklinoliveira-Documents-BTI2026/90018351-689e-48d2-9559-f81866183309/tasks/wm1hkd8ip.output';
const DEST = '/Users/franklinoliveira/Documents/BTI2026/propostas/conceitos';
fs.mkdirSync(DEST, { recursive: true });

let raw = fs.readFileSync(OUT, 'utf8').trim();
// isolar o objeto JSON
let jsonStr = raw;
if (!raw.startsWith('{')) {
  const i = raw.indexOf('{"concepts"');
  const j = raw.lastIndexOf('}');
  if (i >= 0 && j > i) jsonStr = raw.slice(i, j + 1);
}
let data;
try { data = JSON.parse(jsonStr); }
catch (e) { console.error('PARSE FAIL:', e.message); process.exit(1); }

const concepts = (data.result && data.result.concepts) || data.concepts || [];
const slug = s => s.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 40);

const required = ['2026.1', 'Nome do Formando', 'Grau', 'Ginásio', 'PIX', 'UFRN', '28 de Julho'];
const files = [];
console.log('\n=== EXTRACAO + QA ===\n');
concepts.forEach(c => {
  const idx = c._index;
  const name = c.concept_name || ('conceito-' + idx);
  const fname = `direcao-${idx}-${slug(c._dir || name)}.html`;
  const fpath = path.join(DEST, fname);
  let html = c.html || '';
  fs.writeFileSync(fpath, html, 'utf8');
  files.push({ idx, name, fname, dir: c._dir, tagline: c.tagline, palette: c.palette, typography: c.typography, tech: c.tech_reference, rationale: c.rationale });

  // QA checks
  const q = [];
  if (!/^<!DOCTYPE html>/i.test(html.trim())) q.push('NAO comeca com <!DOCTYPE');
  if (!/width:\s*860px/.test(html)) q.push('sem width:860px');
  if (!/height:\s*1216px/.test(html)) q.push('sem height:1216px');
  if (!/fonts\.googleapis\.com/.test(html)) q.push('sem Google Fonts link');
  const missing = required.filter(r => !html.includes(r) && !html.includes(r.replace('á','a').replace('í','i').replace('é','e')));
  // checagem tolerante a acento para alguns
  const missing2 = required.filter(r => {
    const norm = x => x.normalize('NFD').replace(/[̀-ͯ]/g,'');
    return !norm(html).includes(norm(r));
  });
  if (missing2.length) q.push('faltam textos: ' + missing2.join(', '));
  if (/&lt;|&gt;|&amp;lt;/.test(html.slice(0, 200))) q.push('HTML parece duplo-escapado');
  if (/\[object Object\]|undefined<|>undefined/.test(html)) q.push('contem artefatos undefined/object');
  const opens = (html.match(/<div/g) || []).length;
  const closes = (html.match(/<\/div>/g) || []).length;
  const divBalance = opens - closes;

  console.log(`#${idx} ${name}`);
  console.log(`   arquivo: ${fname}  (${html.length} chars, divs: +${opens}/-${closes}${divBalance!==0?' DESBALANCEADO('+divBalance+')':''})`);
  console.log(`   QA: ${q.length ? '⚠ ' + q.join(' | ') : 'OK ✓'}`);
  console.log('');
});

// salvar metadados p/ etapa de comparacao
fs.writeFileSync(path.join('/Users/franklinoliveira/Documents/BTI2026/propostas/_build', 'meta.json'), JSON.stringify(files, null, 2));
console.log('Arquivos escritos em:', DEST);
console.log('Total:', files.length);
