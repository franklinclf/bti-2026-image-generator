#!/usr/bin/env node
const fs=require('fs'),path=require('path');
const OUT='/private/tmp/claude-501/-Users-franklinoliveira-Documents-BTI2026/90018351-689e-48d2-9559-f81866183309/tasks/w9hue6u0g.output';
const DEST='/Users/franklinoliveira/Documents/BTI2026/propostas';
const data=JSON.parse(fs.readFileSync(OUT,'utf8'));
const merged=(data.result&&data.result.merged)||data.merged||[];
const slug=s=>s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,30);
const norm=x=>x.normalize('NFD').replace(/[̀-ͯ]/g,'');
console.log('\n=== EXTRACAO + QA (merge) ===\n');
merged.forEach(m=>{
  const idx=m._index, fname=`merge-${idx}-${slug(m._dir||m.variant_name)}.html`, html=m.html||'';
  fs.writeFileSync(path.join(DEST,fname),html,'utf8');
  const q=[];
  if(!/^<!DOCTYPE html>/i.test(html.trim()))q.push('sem DOCTYPE');
  const cards=(html.match(/class="card"/g)||[]).length; if(cards<2)q.push('cards='+cards);
  if(!html.includes('assets/ufrn-white.png'))q.push('nao usa ufrn-white.png');
  if(html.includes('assets/ufrn-wordmark.png'))q.push('AINDA usa ufrn-wordmark (outline)');
  if(!html.includes('assets/imd.svg'))q.push('sem imd');
  if(!html.includes('assets/pix.png'))q.push('sem pix');
  if(!/2026\.1/.test(html))q.push('sem 2026.1');
  const wm=(html.match(/watermark|2026\.1/g)||[]).length;
  ['Nome do','Colação de Grau','Ginásio','28','Aos que amo','Muito obrigado'].forEach(t=>{if(!norm(html).includes(norm(t)))q.push('falta '+t)});
  const o=(html.match(/<div/g)||[]).length,c=(html.match(/<\/div>/g)||[]).length;
  const monoHexTI=/>TI<\/text>|>TI<\/tspan>|font-style="italic"[^>]*>TI/.test(html)||/text[^>]*>\s*TI\s*</.test(html);
  console.log(`#${idx} ${m.variant_name}`);
  console.log(`   ${fname} (${html.length} chars, cards:${cards}, div +${o}/-${c}${o!==c?' DESBAL':''}, TI-text:${monoHexTI?'sim':'?'})`);
  console.log(`   QA: ${q.length?'⚠ '+q.join(' | '):'OK ✓'}\n`);
});
console.log('escritos em',DEST);
