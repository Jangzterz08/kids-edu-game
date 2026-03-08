#!/usr/bin/env node
/**
 * Generates PWA icons for KidsLearn app
 * Uses @napi-rs/canvas for emoji rendering + sharp for WebP/PNG conversion
 */
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Register Apple Color Emoji font
try {
  GlobalFonts.registerFromPath('/System/Library/Fonts/Apple Color Emoji.ttc', 'AppleEmoji');
} catch (e) {
  console.warn('Apple Color Emoji font not found, emoji may not render correctly');
}

const OUT_DIR = join(__dirname, 'client/public');

async function genIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background gradient - cheerful purple/blue
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#6C5CE7');
  grad.addColorStop(1, '#a29bfe');
  ctx.fillStyle = grad;

  // Rounded rectangle
  const r = size * 0.2;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // Star sparkle dots (decorative)
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  const dots = [
    [size * 0.15, size * 0.2, size * 0.04],
    [size * 0.85, size * 0.15, size * 0.03],
    [size * 0.1, size * 0.75, size * 0.025],
    [size * 0.9, size * 0.8, size * 0.035],
  ];
  for (const [x, y, rad] of dots) {
    ctx.beginPath();
    ctx.arc(x, y, rad, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main emoji — graduation cap 🎓
  const emojiSize = Math.round(size * 0.55);
  ctx.font = `${emojiSize}px AppleEmoji, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', size / 2, size / 2 + size * 0.03);

  const buf = canvas.toBuffer('image/png');
  const png = await sharp(buf).png().toBuffer();
  writeFileSync(join(OUT_DIR, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png`);
}

async function genAppleTouchIcon() {
  // Apple touch icon — 180x180, no rounded corners (iOS adds them)
  const size = 180;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#6C5CE7');
  grad.addColorStop(1, '#a29bfe');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const emojiSize = Math.round(size * 0.6);
  ctx.font = `${emojiSize}px AppleEmoji, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', size / 2, size / 2 + size * 0.03);

  const buf = canvas.toBuffer('image/png');
  const png = await sharp(buf).png().toBuffer();
  writeFileSync(join(OUT_DIR, 'apple-touch-icon.png'), png);
  console.log('✓ apple-touch-icon.png');
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  // Generate icons at required PWA sizes
  for (const size of [192, 512]) {
    await genIcon(size);
  }
  await genAppleTouchIcon();

  console.log('\nDone! Icons saved to client/public/');
}

main().catch(console.error);
