#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const OUT='/private/tmp/claude-501/-Users-franklinoliveira-Documents-BTI2026/90018351-689e-48d2-9559-f81866183309/tasks/w3siectvw.output';
const DEST='/Users/franklinoliveira/Documents/BTI2026/propostas';
const data=JSON.parse(fs.readFileSync(OUT,'utf8'));
const panels=(data.result&&data.result.panels)||data.panels||[];
const letter=['a','b','c'];
const norm=x=>x.normalize('NFD').replace(/[̀-ͯ]/g,'');
console.log('\n=== EXTRACAO + QA (painel) ===\n');
panels.forEach(p=>{
  const idx=p._index, fname=`panel-${letter[idx-1]}.html`, html=p.html||'';
  fs.writeFileSync(path.join(DEST,fname),html,'utf8');
  const q=[];
  if(!/^<!DOCTYPE html>/i.test(html.trim()))q.push('sem DOCTYPE');
  const cards=(html.match(/class="card"/g)||[]).length; if(cards<2)q.push('cards='+cards);
  const photo=(html.match(/assets\/sample-photo\.jpg/g)||[]).length; if(photo<2)q.push('foto refs='+photo);
  if(/class="silhouette"/.test(html))q.push('AINDA tem silhouette');
  if(!html.includes('assets/ufrn-white.png'))q.push('sem ufrn-white');
  if(!html.includes('watermark'))q.push('sem watermark 2026.1');
  if(!/>TI<\/text>/.test(html))q.push('sem hexagono-TI');
  ['Nome do','Colação de Grau','Ginásio','Aos que amo','Muito obrigado'].forEach(t=>{if(!norm(html).includes(norm(t)))q.push('falta '+t)});
  const o=(html.match(/<div/g)||[]).length,c=(html.match(/<\/div>/g)||[]).length;
  console.log(`#${idx} ${p.variant_name}`);
  console.log(`   ${fname} (${html.length} ch, cards:${cards}, foto:${photo}, div +${o}/-${c}${o!==c?' DESBAL':''})`);
  console.log(`   QA: ${q.length?'⚠ '+q.join(' | '):'OK ✓'}\n`);
});
console.log('escritos em',DEST);
