// Copia os WOFF estaticos do @fontsource para public/fonts (usados pelo mural).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const FILES = {
  fraunces: [
    'fraunces-latin-400-normal.woff',
    'fraunces-latin-600-normal.woff',
    'fraunces-latin-400-italic.woff',
    'fraunces-latin-600-italic.woff',
  ],
  'space-grotesk': ['space-grotesk-latin-400-normal.woff', 'space-grotesk-latin-600-normal.woff'],
  sora: ['sora-latin-400-normal.woff', 'sora-latin-600-normal.woff'],
  'jetbrains-mono': ['jetbrains-mono-latin-400-normal.woff', 'jetbrains-mono-latin-600-normal.woff'],
};

const out = 'public/fonts';
mkdirSync(out, { recursive: true });
for (const [pkg, files] of Object.entries(FILES)) {
  for (const f of files) {
    const src = join('node_modules/@fontsource', pkg, 'files', f);
    if (!existsSync(src)) {
      console.error('faltando:', src);
      process.exitCode = 1;
      continue;
    }
    copyFileSync(src, join(out, f));
  }
  const lic = join('node_modules/@fontsource', pkg, 'LICENSE');
  if (existsSync(lic)) copyFileSync(lic, join(out, `${pkg}-OFL.txt`));
}
console.log('fontes copiadas para', out);
