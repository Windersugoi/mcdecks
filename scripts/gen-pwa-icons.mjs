// Genera los iconos de la PWA a partir de assets/icon.png.
//
// Se ejecuta en cada build, así que el icono de la web siempre coincide con el
// de la app: solo hay que cambiar assets/icon.png y listo. No hay copias
// duplicadas del icono que se puedan quedar desfasadas.
//
// Uso: node scripts/gen-pwa-icons.mjs

import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const SRC = 'assets/icon.png';
const OUT = 'dist';

if (!existsSync(SRC)) {
  console.error(`No se encuentra ${SRC}`);
  process.exit(1);
}
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

// Iconos normales (mantienen transparencia)
for (const size of [192, 512]) {
  await sharp(SRC).resize(size, size, { fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toFile(`${OUT}/icon-${size}.png`);
  console.log(`  icon-${size}.png`);
}

// iOS: ignora la transparencia y la pinta de negro -> fondo blanco y sin alfa
await sharp(SRC)
  .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .flatten({ background: { r: 255, g: 255, b: 255 } })
  .png().toFile(`${OUT}/apple-touch-icon.png`);
console.log('  apple-touch-icon.png (fondo blanco, sin alfa)');

// Android recorta en círculo -> 20% de margen de seguridad ("maskable")
const inner = await sharp(SRC).resize(410, 410, { fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 } } })
  .composite([{ input: inner, top: 51, left: 51 }])
  .png().toFile(`${OUT}/icon-maskable-512.png`);
console.log('  icon-maskable-512.png (con zona segura)');

console.log(`Iconos PWA generados desde ${SRC}`);
