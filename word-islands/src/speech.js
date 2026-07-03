// Thin wrapper over the Web Speech API. Chrome/Edge populate the voice
// list asynchronously, so we cache it and refresh on voiceschanged.
// isSpeechAvailable() is optimistic while the list is still empty
// (unknown), and false only once we know there is no English voice —
// then the UI hides audio buttons and the game stays fully playable.

let voices = [];

function hasSynthesis() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

function refreshVoices() {
  voices = window.speechSynthesis.getVoices();
}

if (hasSynthesis()) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

function englishVoice() {
  return voices.find((v) => v.lang && v.lang.startsWith('en')) || null;
}

export function isSpeechAvailable() {
  if (!hasSynthesis()) return false;
  if (voices.length === 0) refreshVoices();
  return voices.length === 0 || Boolean(englishVoice());
}

export function speak(text) {
  if (!hasSynthesis()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // slightly slow for learners
  const voice = englishVoice();
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel(); // don't queue overlapping words
  window.speechSynthesis.speak(utterance);
}
