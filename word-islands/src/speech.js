// Thin wrapper over the Web Speech API. If the browser has no speech
// synthesis or no English voice, isSpeechAvailable() is false and the UI
// hides audio buttons — the game stays fully playable visually.

export function isSpeechAvailable() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function speak(text) {
  if (!isSpeechAvailable()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // slightly slow for learners
  const voice = window.speechSynthesis
    .getVoices()
    .find((v) => v.lang && v.lang.startsWith('en'));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel(); // don't queue overlapping words
  window.speechSynthesis.speak(utterance);
}
