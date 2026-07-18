#!/usr/bin/env node
// Gera merge-1-cutout.html: Merge 1 com a foto real recortada no lugar da silhueta placeholder.
const fs=require('fs');
const dir='/Users/franklinoliveira/Documents/BTI2026/propostas/';
let h=fs.readFileSync(dir+'merge-1.html','utf8');
const img='<img class="silhouette" src="assets/cutout-demo.png" alt="Foto do formando (cutout de teste)" />';
const before=(h.match(/<svg class="silhouette"[\s\S]*?<\/svg>/g)||[]).length;
h=h.replace(/<svg class="silhouette"[\s\S]*?<\/svg>/g, img);
// overrides: foto ocupa bem o espaco, some o rotulo placeholder
h=h.replace('</head>',
  '<style>\n'+
  '  .figure .silhouette{ height:786px; width:auto; object-fit:contain; }\n'+
  '  .figure .plabel{ display:none; }\n'+
  '  .figure .hexbg{ opacity:.4; }\n'+   /* hexagono um pouco mais discreto atras da foto */
  '</style>\n</head>');
h=h.replace('Merge 1 (Integrada)','Merge 1 · Cutout real (teste)');
fs.writeFileSync(dir+'merge-1-cutout.html',h);
console.log('silhuetas substituidas:',before,'-> img cutout');
console.log('ok merge-1-cutout.html');
