#!/usr/bin/env node
// One-time script: generates MP3 files for all lesson words using Microsoft Edge TTS (free, neural voices).
// Run from project root: node generate-audio.js
// Output: client/public/audio/{word}.mp3

const fs   = require('fs');
const path = require('path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const OUT_DIR = path.join(__dirname, 'client', 'public', 'audio');

// Kid-friendly Microsoft neural voice
const VOICE = 'en-US-AriaNeural'; // warm, friendly female voice

// All unique speakWord() calls derived from module data
const WORDS = [
  // Alphabet — "Letter X"
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => `Letter ${l}`),
  // Numbers — "Number N"
  ...[0,1,2,3,4,5,6,7,8,9,10].map(n => `Number ${n}`),
  // Words from all modules
  'angry','apple','ball','bed','belly','bird','black','blue','brown',
  'cat','chair','circle','cloudy','cow','dairy','diamond','dog','door','duck',
  'ears','eight','elephant','excited','eyes','feet','fish','five','foggy','four',
  'friday','fridge','fruits','grains','grapes','green','hands','happy','head',
  'heart','hello','help','house','ice cream','jar','kite','lamp','lion',
  'listen','monday','monkey','moon','mouth','nest','nine','nose','one','orange',
  'oval','penguin','pink','please','protein','purple','queen','rabbit','rainbow',
  'rainy','rectangle','red','sad','saturday','scared','seven','share','silly',
  'six','snowy','sofa','sorry','square','star','stormy','sun','sunday','sunny',
  'surprised','sweets','table','thank you','three','thursday','tiger','tired',
  'triangle','tuesday','two','umbrella','vegetables','violin','water','wednesday',
  'whale','white','window','windy','xylophone','yak','yellow','zebra','zero',
];

function toFilename(text) {
  return text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') + '.mp3';
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Delete previously generated ElevenLabs files so we regenerate with consistent voice
  // (only if they're tiny/corrupt — skip logic handles existing good files)

  console.log(`Generating ${WORDS.length} audio files → ${OUT_DIR}`);
  console.log(`Voice: ${VOICE}\n`);

  const tts = new MsEdgeTTS();
  await tts.setMetadata(VOICE, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

  let ok = 0, skipped = 0, errors = 0;

  for (const text of WORDS) {
    const filename = toFilename(text);
    const outPath  = path.join(OUT_DIR, filename);

    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
      console.log(`  skip  ${filename}`);
      skipped++;
      continue;
    }

    try {
      const { audioStream } = tts.toStream(text);
      const chunks = [];
      await new Promise((resolve, reject) => {
        audioStream.on('data', chunk => chunks.push(chunk));
        audioStream.on('end', resolve);
        audioStream.on('error', reject);
      });
      const buf = Buffer.concat(chunks);
      fs.writeFileSync(outPath, buf);
      console.log(`  ok    ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
      ok++;
      // Small delay to avoid hammering the service
      await new Promise(r => setTimeout(r, 80));
    } catch (err) {
      console.error(`  ERROR ${text}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone! ${ok} generated, ${skipped} skipped, ${errors} errors`);
}

main().catch(console.error);
