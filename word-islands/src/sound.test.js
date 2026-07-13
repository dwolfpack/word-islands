import { describe, it, expect } from 'vitest';
import { playCorrect, playIncorrect, playStars, playCreatureUnlocked } from './sound.js';

// Vitest runs these in a plain node environment (no window, no Web Audio
// API), which exercises exactly the fallback path these functions must
// never throw on — the same situation as a browser with audio blocked.
describe('sound', () => {
  it('does not throw when the Web Audio API is unavailable, enabled or not', () => {
    expect(() => playCorrect(true)).not.toThrow();
    expect(() => playCorrect(false)).not.toThrow();
    expect(() => playIncorrect(true)).not.toThrow();
    expect(() => playIncorrect(false)).not.toThrow();
    expect(() => playStars(true)).not.toThrow();
    expect(() => playStars(false)).not.toThrow();
    expect(() => playCreatureUnlocked(true)).not.toThrow();
    expect(() => playCreatureUnlocked(false)).not.toThrow();
  });
});
