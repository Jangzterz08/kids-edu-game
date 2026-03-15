let muted = false;

export function setMuted(val) { muted = val; }
export function isMuted() { return muted; }

const cache = {};

function getAudio(src) {
  if (!cache[src]) {
    cache[src] = new Audio(src);
    cache[src].preload = 'auto';
  }
  return cache[src];
}


export function playSound(src) {
  if (muted) return;
  try {
    const audio = getAudio(src);
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch (_) {}
}


// Pick the most child-friendly voice available
function getKidsVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  const enVoices = voices.filter(v => v.lang.startsWith('en'));
  const preferred = ['Google US English', 'Samantha', 'Karen', 'Moira', 'Tessa', 'Shelley', 'Sandy', 'Eddy', 'Reed', 'Daniel', 'Fred'];
  for (const name of preferred) {
    const v = enVoices.find(v => v.name.includes(name));
    if (v) return v;
  }
  return enVoices[0] || voices[0];
}

function toAudioFilename(text) {
  return '/audio/' + text.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') + '.mp3';
}

export function speakWord(word) {
  if (muted) return;

  const tryTTS = () => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    function speak() {
      const utter = new SpeechSynthesisUtterance(word);
      const voice = getKidsVoice();
      if (voice) utter.voice = voice;
      utter.rate  = 1.1;
      utter.pitch = 1.1;
      utter.volume = 1;
      // Chrome bug: must defer speak() after cancel()
      setTimeout(() => window.speechSynthesis.speak(utter), 50);
    }
    if (window.speechSynthesis.getVoices().length > 0) speak();
    else window.speechSynthesis.onvoiceschanged = () => speak();
  };

  const src = toAudioFilename(word);

  // Already know this file doesn't exist — go straight to TTS
  if (cache[src]?.failed) {
    tryTTS();
    return;
  }

  const audio = getAudio(src);

  let ttsTriggered = false;
  const fallback = () => {
    if (ttsTriggered) return;
    ttsTriggered = true;
    cache[src].failed = true;
    tryTTS();
  };

  audio.onerror = fallback;
  audio.currentTime = 0;
  audio.play().catch(fallback);
}
