#!/usr/bin/env node
/**
 * Image generator for Kids Edu Game
 * Generates 144 colorful WebP images using Sharp + SVG
 * Run from: /Users/Ja_Jang/Application/kids-edu-game/
 *   node generate-images.js
 */

const sharp = require('sharp');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const path  = require('path');
const fs    = require('fs');

// Register Apple Color Emoji so canvas can render emoji glyphs
GlobalFonts.registerFromPath('/System/Library/Fonts/Apple Color Emoji.ttc', 'AppleEmoji');

const OUT = path.join(__dirname, 'client/public/assets/images');

// ─── helpers ────────────────────────────────────────────────────────────────

function mkdir(dir) { fs.mkdirSync(dir, { recursive: true }); }

async function save(svg, filePath) {
  mkdir(path.dirname(filePath));
  await sharp(Buffer.from(svg))
    .resize(400, 400)
    .webp({ quality: 90 })
    .toFile(filePath);
  console.log('  ✓', path.relative(OUT, filePath));
}

function grad(id, c1, c2) {
  return `<defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${c1}"/>
    <stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>`;
}

function base(bg = 'url(#g)') {
  return `<rect width="400" height="400" fill="${bg}" rx="48"/>`;
}

// ─── alphabet ───────────────────────────────────────────────────────────────

const ALPHA = [
  { l:'A', word:'Apple',     c1:'#FF6B6B', c2:'#FFE66D' },
  { l:'B', word:'Ball',      c1:'#4ECDC4', c2:'#44C49B' },
  { l:'C', word:'Cat',       c1:'#F7B731', c2:'#F39C12' },
  { l:'D', word:'Dog',       c1:'#A29BFE', c2:'#6C5CE7' },
  { l:'E', word:'Elephant',  c1:'#FD79A8', c2:'#E84393' },
  { l:'F', word:'Fish',      c1:'#00CEC9', c2:'#0984E3' },
  { l:'G', word:'Grapes',    c1:'#6C5CE7', c2:'#A29BFE' },
  { l:'H', word:'House',     c1:'#FDCB6E', c2:'#E17055' },
  { l:'I', word:'Ice Cream', c1:'#FD79A8', c2:'#FDCB6E' },
  { l:'J', word:'Jar',       c1:'#55EFC4', c2:'#00B894' },
  { l:'K', word:'Kite',      c1:'#74B9FF', c2:'#0984E3' },
  { l:'L', word:'Lion',      c1:'#FFEAA7', c2:'#FDCB6E' },
  { l:'M', word:'Moon',      c1:'#6C5CE7', c2:'#2D3436' },
  { l:'N', word:'Nest',      c1:'#A29BFE', c2:'#FDCB6E' },
  { l:'O', word:'Orange',    c1:'#FF7675', c2:'#FDCB6E' },
  { l:'P', word:'Penguin',   c1:'#2D3436', c2:'#636E72' },
  { l:'Q', word:'Queen',     c1:'#FD79A8', c2:'#6C5CE7' },
  { l:'R', word:'Rainbow',   c1:'#FF6B6B', c2:'#A29BFE' },
  { l:'S', word:'Sun',       c1:'#FFEAA7', c2:'#F9CA24' },
  { l:'T', word:'Tiger',     c1:'#F39C12', c2:'#2D3436' },
  { l:'U', word:'Umbrella',  c1:'#74B9FF', c2:'#0984E3' },
  { l:'V', word:'Violin',    c1:'#A29BFE', c2:'#6C5CE7' },
  { l:'W', word:'Whale',     c1:'#0984E3', c2:'#00CEC9' },
  { l:'X', word:'Xylophone', c1:'#FF6B6B', c2:'#FDCB6E' },
  { l:'Y', word:'Yak',       c1:'#55EFC4', c2:'#FFEAA7' },
  { l:'Z', word:'Zebra',     c1:'#2D3436', c2:'#636E72' },
];

async function genAlphabet() {
  console.log('\n📝 Alphabet...');
  mkdir(path.join(OUT, 'alphabet'));
  for (const { l, word, c1, c2 } of ALPHA) {
    const fileName = word.toLowerCase().replace(/ /g, '') + '.webp';
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      ${grad('g', c1, c2)}
      ${base()}
      <text x="200" y="230" text-anchor="middle" font-family="Arial Black,sans-serif"
            font-size="200" font-weight="900" fill="white" opacity="0.95">${l}</text>
      <text x="200" y="340" text-anchor="middle" font-family="Arial,sans-serif"
            font-size="38" font-weight="700" fill="white" opacity="0.85">${word}</text>
    </svg>`;
    await save(svg, path.join(OUT, 'alphabet', fileName));
  }
}

// ─── numbers ────────────────────────────────────────────────────────────────

const NUMS = [
  { n:'0', word:'Zero',  c1:'#636E72', c2:'#2D3436' },
  { n:'1', word:'One',   c1:'#FF6B6B', c2:'#FF4757' },
  { n:'2', word:'Two',   c1:'#4ECDC4', c2:'#0984E3' },
  { n:'3', word:'Three', c1:'#F7B731', c2:'#E17055' },
  { n:'4', word:'Four',  c1:'#A29BFE', c2:'#6C5CE7' },
  { n:'5', word:'Five',  c1:'#FD79A8', c2:'#E84393' },
  { n:'6', word:'Six',   c1:'#55EFC4', c2:'#00B894' },
  { n:'7', word:'Seven', c1:'#74B9FF', c2:'#0984E3' },
  { n:'8', word:'Eight', c1:'#FFEAA7', c2:'#FDCB6E' },
  { n:'9', word:'Nine',  c1:'#FD79A8', c2:'#A29BFE' },
];

async function genNumbers() {
  console.log('\n🔢 Numbers...');
  mkdir(path.join(OUT, 'numbers'));
  for (const { n, word, c1, c2 } of NUMS) {
    const fileName = word.toLowerCase() + '.webp';
    // Draw dot grid to represent the number
    const dots = [];
    const count = parseInt(n);
    const cols = Math.min(count, 3);
    const rows = Math.ceil(count / 3);
    for (let i = 0; i < count; i++) {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 140 + col * 60;
      const y = 110 + row * 60;
      dots.push(`<circle cx="${x}" cy="${y}" r="20" fill="white" opacity="0.9"/>`);
    }
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      ${grad('g', c1, c2)}
      ${base()}
      ${dots.join('\n      ')}
      <text x="200" y="310" text-anchor="middle" font-family="Arial Black,sans-serif"
            font-size="120" font-weight="900" fill="white" opacity="0.95">${n}</text>
      <text x="200" y="370" text-anchor="middle" font-family="Arial,sans-serif"
            font-size="32" font-weight="700" fill="white" opacity="0.85">${word}</text>
    </svg>`;
    await save(svg, path.join(OUT, 'numbers', fileName));
  }
}

// ─── shapes ─────────────────────────────────────────────────────────────────

async function genShapes() {
  console.log('\n🔷 Shapes...');
  mkdir(path.join(OUT, 'shapes'));

  const shapes = [
    { slug:'circle',    word:'Circle',    c1:'#FF6B6B', c2:'#FF4757',
      shape:`<circle cx="200" cy="185" r="110" fill="white" opacity="0.9"/>` },
    { slug:'square',    word:'Square',    c1:'#4ECDC4', c2:'#0984E3',
      shape:`<rect x="90" y="75" width="220" height="220" fill="white" opacity="0.9" rx="12"/>` },
    { slug:'triangle',  word:'Triangle',  c1:'#F7B731', c2:'#E17055',
      shape:`<polygon points="200,65 330,290 70,290" fill="white" opacity="0.9"/>` },
    { slug:'rectangle', word:'Rectangle', c1:'#A29BFE', c2:'#6C5CE7',
      shape:`<rect x="60" y="115" width="280" height="160" fill="white" opacity="0.9" rx="12"/>` },
    { slug:'star',      word:'Star',      c1:'#FFEAA7', c2:'#F9CA24',
      shape:`<polygon points="200,55 225,140 315,140 245,190 270,280 200,230 130,280 155,190 85,140 175,140"
             fill="white" opacity="0.9"/>` },
    { slug:'heart',     word:'Heart',     c1:'#FD79A8', c2:'#E84393',
      shape:`<path d="M200,290 C200,290 80,200 80,130 C80,95 110,70 145,70 C170,70 190,85 200,100
                      C210,85 230,70 255,70 C290,70 320,95 320,130 C320,200 200,290 200,290 Z"
             fill="white" opacity="0.9"/>` },
    { slug:'diamond',   word:'Diamond',   c1:'#74B9FF', c2:'#0984E3',
      shape:`<polygon points="200,60 320,200 200,340 80,200" fill="white" opacity="0.9"/>` },
    { slug:'oval',      word:'Oval',      c1:'#55EFC4', c2:'#00B894',
      shape:`<ellipse cx="200" cy="185" rx="145" ry="95" fill="white" opacity="0.9"/>` },
  ];

  for (const { slug, word, c1, c2, shape } of shapes) {
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      ${grad('g', c1, c2)}
      ${base()}
      ${shape}
      <text x="200" y="368" text-anchor="middle" font-family="Arial,sans-serif"
            font-size="34" font-weight="700" fill="white" opacity="0.85">${word}</text>
    </svg>`;
    await save(svg, path.join(OUT, 'shapes', `${slug}.webp`));
  }
}

// ─── colors ─────────────────────────────────────────────────────────────────

async function genColors() {
  console.log('\n🎨 Colors...');
  mkdir(path.join(OUT, 'colors'));

  const colors = [
    { slug:'red',    word:'Red',    hex:'#FF5252', ring:'#FF1744' },
    { slug:'blue',   word:'Blue',   hex:'#2979FF', ring:'#2962FF' },
    { slug:'yellow', word:'Yellow', hex:'#FFD600', ring:'#FFAB00' },
    { slug:'green',  word:'Green',  hex:'#4CAF50', ring:'#388E3C' },
    { slug:'orange', word:'Orange', hex:'#FF9800', ring:'#E65100' },
    { slug:'purple', word:'Purple', hex:'#9C27B0', ring:'#6A1B9A' },
    { slug:'pink',   word:'Pink',   hex:'#E91E8C', ring:'#AD1457' },
    { slug:'brown',  word:'Brown',  hex:'#795548', ring:'#4E342E' },
    { slug:'black',  word:'Black',  hex:'#424242', ring:'#212121' },
    { slug:'white',  word:'White',  hex:'#F5F5F5', ring:'#BDBDBD' },
  ];

  for (const { slug, word, hex, ring } of colors) {
    const textColor = slug === 'white' || slug === 'yellow' ? '#424242' : 'white';
    const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#F8F9FA" rx="48"/>
      <circle cx="200" cy="175" r="130" fill="${ring}"/>
      <circle cx="200" cy="175" r="115" fill="${hex}"/>
      <text x="200" y="360" text-anchor="middle" font-family="Arial Black,sans-serif"
            font-size="44" font-weight="900" fill="#333">${word}</text>
    </svg>`;
    await save(svg, path.join(OUT, 'colors', `${slug}.webp`));
  }
}

// ─── emoji card (canvas-based, supports color emoji) ─────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

async function genEmojiCard(items, folder) {
  mkdir(path.join(OUT, folder));
  for (const item of items) {
    const SIZE = 400;
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');

    // gradient background
    const grd = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grd.addColorStop(0, item.c1);
    grd.addColorStop(1, item.c2);

    // rounded rect background
    ctx.save();
    const r = 48;
    ctx.beginPath();
    ctx.moveTo(r, 0); ctx.lineTo(SIZE - r, 0);
    ctx.quadraticCurveTo(SIZE, 0, SIZE, r);
    ctx.lineTo(SIZE, SIZE - r);
    ctx.quadraticCurveTo(SIZE, SIZE, SIZE - r, SIZE);
    ctx.lineTo(r, SIZE);
    ctx.quadraticCurveTo(0, SIZE, 0, SIZE - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.restore();

    // emoji (large, centered)
    ctx.font = '180px AppleEmoji, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, SIZE / 2, SIZE / 2 - 20);

    // white pill background for word
    const word = item.word;
    ctx.font = 'bold 36px Arial';
    const tw = ctx.measureText(word).width;
    const pw = tw + 40, ph = 52;
    const px = SIZE / 2 - pw / 2, py = SIZE - ph - 24;
    ctx.fillStyle = 'rgba(255,255,255,0.30)';
    const pr = 26;
    ctx.beginPath();
    ctx.moveTo(px + pr, py);
    ctx.lineTo(px + pw - pr, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + pr);
    ctx.lineTo(px + pw, py + ph - pr);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - pr, py + ph);
    ctx.lineTo(px + pr, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - pr);
    ctx.lineTo(px, py + pr);
    ctx.quadraticCurveTo(px, py, px + pr, py);
    ctx.closePath();
    ctx.fill();

    // word label
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, SIZE / 2, py + ph / 2);

    const buf = canvas.toBuffer('image/png');
    const outPath = path.join(OUT, folder, `${item.slug}.webp`);
    await sharp(buf).resize(400, 400).webp({ quality: 90 }).toFile(outPath);
    console.log('  ✓', path.relative(OUT, outPath));
  }
}

const ANIMALS = [
  { slug:'dog',      word:'Dog',      emoji:'🐶', c1:'#FDCB6E', c2:'#E17055' },
  { slug:'cat',      word:'Cat',      emoji:'🐱', c1:'#F7B731', c2:'#E17055' },
  { slug:'cow',      word:'Cow',      emoji:'🐮', c1:'#A29BFE', c2:'#6C5CE7' },
  { slug:'elephant', word:'Elephant', emoji:'🐘', c1:'#636E72', c2:'#2D3436' },
  { slug:'lion',     word:'Lion',     emoji:'🦁', c1:'#FFEAA7', c2:'#FDCB6E' },
  { slug:'monkey',   word:'Monkey',   emoji:'🐵', c1:'#A0522D', c2:'#6B3A2A' },
  { slug:'rabbit',   word:'Rabbit',   emoji:'🐰', c1:'#FD79A8', c2:'#E84393' },
  { slug:'duck',     word:'Duck',     emoji:'🦆', c1:'#F9CA24', c2:'#F0932B' },
  { slug:'fish',     word:'Fish',     emoji:'🐟', c1:'#00CEC9', c2:'#0984E3' },
  { slug:'bird',     word:'Bird',     emoji:'🐦', c1:'#74B9FF', c2:'#0984E3' },
];

const BODY = [
  { slug:'head',   word:'Head',   emoji:'🙂', c1:'#FD79A8', c2:'#FDCB6E' },
  { slug:'eyes',   word:'Eyes',   emoji:'👀', c1:'#74B9FF', c2:'#0984E3' },
  { slug:'ears',   word:'Ears',   emoji:'👂', c1:'#A29BFE', c2:'#6C5CE7' },
  { slug:'nose',   word:'Nose',   emoji:'👃', c1:'#FF7675', c2:'#E17055' },
  { slug:'mouth',  word:'Mouth',  emoji:'👄', c1:'#FD79A8', c2:'#E84393' },
  { slug:'hands',  word:'Hands',  emoji:'🙌', c1:'#55EFC4', c2:'#00B894' },
  { slug:'feet',   word:'Feet',   emoji:'🦶', c1:'#FFEAA7', c2:'#FDCB6E' },
  { slug:'belly',  word:'Belly',  emoji:'🫃', c1:'#FF6B6B', c2:'#FDCB6E' },
];

const MANNERS = [
  { slug:'please',    word:'Please',    emoji:'🙏', c1:'#A29BFE', c2:'#6C5CE7' },
  { slug:'thank-you', word:'Thank You', emoji:'😊', c1:'#55EFC4', c2:'#00B894' },
  { slug:'sorry',     word:'Sorry',     emoji:'😔', c1:'#FD79A8', c2:'#E84393' },
  { slug:'share',     word:'Share',     emoji:'🤝', c1:'#74B9FF', c2:'#0984E3' },
  { slug:'listen',    word:'Listen',    emoji:'👂', c1:'#FFEAA7', c2:'#FDCB6E' },
  { slug:'help',      word:'Help',      emoji:'🦸', c1:'#FF6B6B', c2:'#E17055' },
  { slug:'greet',     word:'Hello',     emoji:'👋', c1:'#F7B731', c2:'#E17055' },
];

const HOUSEHOLD = [
  { slug:'chair',  word:'Chair',  emoji:'🪑', c1:'#FDCB6E', c2:'#E17055' },
  { slug:'table',  word:'Table',  emoji:'🪴', c1:'#A29BFE', c2:'#6C5CE7' },
  { slug:'bed',    word:'Bed',    emoji:'🛏️', c1:'#74B9FF', c2:'#0984E3' },
  { slug:'door',   word:'Door',   emoji:'🚪', c1:'#FF7675', c2:'#E17055' },
  { slug:'window', word:'Window', emoji:'🪟', c1:'#55EFC4', c2:'#00B894' },
  { slug:'lamp',   word:'Lamp',   emoji:'💡', c1:'#FFEAA7', c2:'#F9CA24' },
  { slug:'sofa',   word:'Sofa',   emoji:'🛋️', c1:'#FD79A8', c2:'#E84393' },
  { slug:'fridge', word:'Fridge', emoji:'🧊', c1:'#4ECDC4', c2:'#0984E3' },
];

const FOOD = [
  { slug:'grains',     word:'Grains',     emoji:'🌾', c1:'#FDCB6E', c2:'#E17055' },
  { slug:'vegetables', word:'Vegetables', emoji:'🥦', c1:'#55EFC4', c2:'#00B894' },
  { slug:'fruits',     word:'Fruits',     emoji:'🍎', c1:'#FF6B6B', c2:'#FDCB6E' },
  { slug:'dairy',      word:'Dairy',      emoji:'🥛', c1:'#74B9FF', c2:'#0984E3' },
  { slug:'protein',    word:'Protein',    emoji:'🥩', c1:'#A29BFE', c2:'#6C5CE7' },
  { slug:'water',      word:'Water',      emoji:'💧', c1:'#4ECDC4', c2:'#0984E3' },
  { slug:'sweets',     word:'Sweets',     emoji:'🍬', c1:'#FD79A8', c2:'#E84393' },
];

const EMOTIONS = [
  { slug:'happy',     word:'Happy',     emoji:'😊', c1:'#FECA57', c2:'#FF9F43' },
  { slug:'sad',       word:'Sad',       emoji:'😢', c1:'#74B9FF', c2:'#0984E3' },
  { slug:'angry',     word:'Angry',     emoji:'😠', c1:'#FF6B6B', c2:'#C0392B' },
  { slug:'scared',    word:'Scared',    emoji:'😨', c1:'#A29BFE', c2:'#6C5CE7' },
  { slug:'surprised', word:'Surprised', emoji:'😲', c1:'#55EFC4', c2:'#00B894' },
  { slug:'excited',   word:'Excited',   emoji:'🤩', c1:'#FD79A8', c2:'#E84393' },
  { slug:'tired',     word:'Tired',     emoji:'😴', c1:'#636E72', c2:'#2D3436' },
  { slug:'silly',     word:'Silly',     emoji:'😜', c1:'#FDCB6E', c2:'#E17055' },
];

const WEATHER = [
  { slug:'sunny',   word:'Sunny',   emoji:'☀️',  c1:'#FECA57', c2:'#F9CA24' },
  { slug:'rainy',   word:'Rainy',   emoji:'🌧️', c1:'#74B9FF', c2:'#0984E3' },
  { slug:'cloudy',  word:'Cloudy',  emoji:'☁️',  c1:'#B2BEC3', c2:'#636E72' },
  { slug:'snowy',   word:'Snowy',   emoji:'❄️',  c1:'#DFE6E9', c2:'#74B9FF' },
  { slug:'windy',   word:'Windy',   emoji:'💨',  c1:'#55EFC4', c2:'#00CEC9' },
  { slug:'stormy',  word:'Stormy',  emoji:'⛈️',  c1:'#2D3436', c2:'#6C5CE7' },
  { slug:'rainbow', word:'Rainbow', emoji:'🌈',  c1:'#FF6B6B', c2:'#A29BFE' },
  { slug:'foggy',   word:'Foggy',   emoji:'🌫️', c1:'#B2BEC3', c2:'#636E72' },
];

const DAYS = [
  { slug:'monday',    word:'Monday',    emoji:'🌙', c1:'#6C5CE7', c2:'#A29BFE' },
  { slug:'tuesday',   word:'Tuesday',   emoji:'🔥', c1:'#E17055', c2:'#FDCB6E' },
  { slug:'wednesday', word:'Wednesday', emoji:'💧', c1:'#0984E3', c2:'#74B9FF' },
  { slug:'thursday',  word:'Thursday',  emoji:'⚡', c1:'#F9CA24', c2:'#F0932B' },
  { slug:'friday',    word:'Friday',    emoji:'🎉', c1:'#FD79A8', c2:'#E84393' },
  { slug:'saturday',  word:'Saturday',  emoji:'⭐', c1:'#FECA57', c2:'#FF9F43' },
  { slug:'sunday',    word:'Sunday',    emoji:'☀️', c1:'#FF6B6B', c2:'#FDCB6E' },
];

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎨 Generating images...');
  await genAlphabet();
  await genNumbers();
  await genShapes();
  await genColors();

  console.log('\n🐾 Animals...');
  await genEmojiCard(ANIMALS, 'animals');

  console.log('\n🫀 Body Parts...');
  await genEmojiCard(BODY, 'body');

  console.log('\n🤝 Manners...');
  await genEmojiCard(MANNERS, 'manners');

  console.log('\n🏠 Household...');
  await genEmojiCard(HOUSEHOLD, 'household');

  console.log('\n🥗 Food Pyramid...');
  await genEmojiCard(FOOD, 'food');

  console.log('\n😊 Emotions...');
  await genEmojiCard(EMOTIONS, 'emotions');

  console.log('\n⛅ Weather...');
  await genEmojiCard(WEATHER, 'weather');

  console.log('\n📅 Days of Week...');
  await genEmojiCard(DAYS, 'days');

  console.log('\n✅ Done! All images generated.');
}

main().catch(console.error);
