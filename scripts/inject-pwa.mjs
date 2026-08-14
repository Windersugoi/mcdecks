// Inyecta las etiquetas PWA en el index.html generado por `expo export -p web`.
//
// Con `web.output: "single"` Expo usa su propia plantilla HTML e ignora
// `+html.tsx`, así que las añadimos después de compilar. Al hacerse aquí,
// la app no cambia y la build de Android no se ve afectada en absoluto.
//
// Uso: node scripts/inject-pwa.mjs [rutaBase]     (por defecto: la detecta sola)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const file = 'dist/index.html';
if (!existsSync(file)) {
  console.error('No existe dist/index.html — ¿se ha ejecutado el export?');
  process.exit(1);
}

let html = readFileSync(file, 'utf8');

// Ruta base: la del argumento, o la que Expo ya puso en el favicon (p.ej. /mcdecks/)
let base = process.argv[2] ?? '';
if (!base) {
  const m = html.match(/href="([^"]*)favicon\.ico"/);
  base = m ? m[1] : '/';
}
if (!base.endsWith('/')) base += '/';

if (html.includes('rel="manifest"')) {
  console.log('Las etiquetas PWA ya estaban presentes; no se toca nada.');
  process.exit(0);
}

const tags = `
    <link rel="manifest" href="${base}manifest.json" />
    <link rel="apple-touch-icon" href="${base}apple-touch-icon.png" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="MCDecks" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="description" content="Gestor de mazos y coleccion para Marvel Champions LCG" />
`;

html = html.replace('</head>', `${tags}  </head>`);

// viewport-fit=cover para que se vea bien en pantallas con notch en modo app
html = html.replace(
  'content="width=device-width, initial-scale=1, shrink-to-fit=no"',
  'content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"'
);

writeFileSync(file, html);
console.log(`Etiquetas PWA inyectadas (ruta base: ${base})`);
