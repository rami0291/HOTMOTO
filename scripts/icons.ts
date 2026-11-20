// Generates the site's icons in site/brand/ from its mark (site/brand/Logo.tsx SignalBlock): the signal
// block, chamfered at two corners, in a mass edge with the mass diagonal across it.
//   logo.svg, favicon.ico (16, 32, 48): the block alone on a clear ground, readable on light and dark tabs.
//   icon.png (512), icon-192.png, apple-icon.png (180), logo.png (1024): the block on a full mass tile, as
//   home screens and app launchers crop and round it.
//
// Usage: node scripts/icons.ts
import { writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BRAND = path.join(import.meta.dirname, "../site/brand");
const SIGNAL = "#a6f724";
const MASS = "#151b18";

/** The block in a 100-unit box: inset by half its edge so the stroke stays inside. */
const block = (edge: string) =>
  `<path d="M6 6H70L94 30V94H30L6 70Z" fill="${SIGNAL}" stroke="${edge}" stroke-width="10"/><path d="M32 68L68 32" stroke="${MASS}" stroke-width="10"/>`;

const mark = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${block(MASS)}</svg>\n`;
/** The tile: the block at 60% on mass, centred, inside the safe zone launchers keep. */
const tile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${MASS}"/><g transform="translate(20 20) scale(0.6)">${block(MASS)}</g></svg>`;

const png = (svg: string, size: number) => sharp(Buffer.from(svg), { density: Math.max(72, (size / 100) * 72 * 4) }).resize(size, size).png().toBuffer();

/** A Windows icon holding PNG entries (supported by every browser that reads favicon.ico). */
function ico(images: Array<{ size: number; data: Buffer }>): Buffer {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, at);
    header.writeUInt8(size >= 256 ? 0 : size, at + 1);
    header.writeUInt8(0, at + 2);
    header.writeUInt8(0, at + 3);
    header.writeUInt16LE(1, at + 4);
    header.writeUInt16LE(32, at + 6);
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((im) => im.data)]);
}

writeFileSync(path.join(BRAND, "logo.svg"), mark);
const favicons = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(mark, size) })));
writeFileSync(path.join(BRAND, "favicon.ico"), ico(favicons));
for (const [name, size] of [["icon.png", 512], ["icon-192.png", 192], ["apple-icon.png", 180], ["logo.png", 1024]] as const) {
  writeFileSync(path.join(BRAND, name), await png(tile, size));
}
console.log("site/brand: logo.svg favicon.ico icon.png icon-192.png apple-icon.png logo.png");
