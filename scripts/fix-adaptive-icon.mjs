// Regenerates the Android adaptive-icon foreground with proper safe-zone
// padding from the master icon artwork (assets/images/icon.png).
//
// Android adaptive icons crop the foreground layer to an inner "safe zone"
// (~66% of the canvas diameter) before applying the launcher's mask shape
// (circle/squircle/rounded-square/teardrop, varies by OEM). Content outside
// that zone gets clipped. This script re-scales the existing icon.png art
// down to 66% and centers it on a transparent 1024x1024 canvas, so it
// survives every mask shape without cropping the satellite icons or dice.
//
// Usage:
//   node scripts/fix-adaptive-icon.mjs

import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const SRC = path.join(repoRoot, 'assets/images/icon.png');
const OUT = path.join(repoRoot, 'assets/images/android-icon-foreground-safe.png');
const CANVAS_SIZE = 1024;
const SAFE_ZONE_RATIO = 0.66; // Android adaptive-icon safe zone

async function main() {
  const contentSize = Math.round(CANVAS_SIZE * SAFE_ZONE_RATIO);

  const resized = await sharp(SRC)
    .resize(contentSize, contentSize, { fit: 'contain' })
    .toBuffer();

  await sharp({
    create: {
      width: CANVAS_SIZE,
      height: CANVAS_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, gravity: 'center' }])
    .png()
    .toFile(OUT);

  console.log(
    `[fix-adaptive-icon] Wrote ${OUT} (${contentSize}x${contentSize} content on ${CANVAS_SIZE}x${CANVAS_SIZE} transparent canvas)`
  );
}

main();
