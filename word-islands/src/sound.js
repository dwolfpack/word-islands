// Thin wrapper over the Web Audio API for short UI sound effects.
// No audio files — every sound is a synthesized tone. Every exported
// function is a no-op when sound is disabled or the API is
// unavailable, so the game never breaks just because audio can't play.

let ctx = null;

function getContext() {
  if (ctx) return ctx;
  const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

function tone(context, freq, startOffset, duration, type = 'sine', peakGain = 0.2) {
  const osc = context.createOscillator();
  const gain = context.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const start = context.currentTime + startOffset;
  const end = start + duration;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(peakGain, start + 0.01);
  gain.gain.linearRampToValueAtTime(0, end);
  osc.connect(gain);
  gain.connect(context.destination);
  osc.start(start);
  osc.stop(end);
}

export function playCorrect(enabled) {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;
  tone(context, 659.25, 0, 0.12); // E5
  tone(context, 987.77, 0.1, 0.15); // B5
}

export function playIncorrect(enabled) {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;
  tone(context, 180, 0, 0.25, 'sawtooth', 0.15);
}

export function playStars(enabled) {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;
  tone(context, 523.25, 0, 0.15); // C5
  tone(context, 659.25, 0.13, 0.15); // E5
  tone(context, 783.99, 0.26, 0.25); // G5
}

export function playCreatureUnlocked(enabled) {
  if (!enabled) return;
  const context = getContext();
  if (!context) return;
  tone(context, 523.25, 0, 0.12);
  tone(context, 659.25, 0.1, 0.12);
  tone(context, 783.99, 0.2, 0.12);
  tone(context, 1046.5, 0.3, 0.3);
}
