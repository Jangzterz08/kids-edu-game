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

  // Prefer friendly-sounding female English voices
  const preferred = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Victoria', 'Allison', 'Ava', 'Susan'];
  for (const name of preferred) {
    const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('en'));
    if (v) return v;
  }
  // Fallback: any English female voice
  const female = voices.find(v => v.lang.startsWith('en') && /female/i.test(v.name));
  if (female) return female;
  // Fallback: any English voice
  return voices.find(v => v.lang.startsWith('en')) || voices[0];
}

export function speakWord(word) {
  if (muted || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();

  function speak() {
    const utter = new SpeechSynthesisUtterance(word);
    const voice = getKidsVoice();
    if (voice) utter.voice = voice;
    utter.rate  = 0.78;
    utter.pitch = 1.5;
    utter.volume = 1;
    window.speechSynthesis.speak(utter);
  }

  // Voices may not be loaded yet on first call
  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => { speak(); };
  }
}
