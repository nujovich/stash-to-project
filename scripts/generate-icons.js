#!/usr/bin/env node
// scripts/generate-icons.js
// Genera los íconos PWA a partir de un SVG base
// Uso: node scripts/generate-icons.js
// Requiere: npm install sharp

const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// SVG del ícono de la app — un ovillo de lana
const SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="100" fill="#B85C38"/>
  <text x="256" y="340" text-anchor="middle" font-size="280" font-family="serif">🧶</text>
</svg>
`;

const sizes = [192, 512];
const outDir = path.join(__dirname, "../public/icons");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function generate() {
  for (const size of sizes) {
    await sharp(Buffer.from(SVG))
      .resize(size, size)
      .png()
      .toFile(path.join(outDir, `icon-${size}.png`));
    console.log(`✓ icon-${size}.png generado`);
  }
  console.log("\nÍconos listos en public/icons/");
  console.log("Recuerda crear también public/icons/screenshot-mobile.png (390x844)");
}

generate().catch(console.error);
