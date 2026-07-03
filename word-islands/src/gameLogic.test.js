import { describe, it, expect } from 'vitest';
import { shuffle, makeChoices, makePairs, starsForScore } from './gameLogic.js';

const WORDS = [
  { english: 'dog', hebrew: 'כלב', emoji: '🐶' },
  { english: 'cat', hebrew: 'חתול', emoji: '🐱' },
  { english: 'fish', hebrew: 'דג', emoji: '🐟' },
  { english: 'bird', hebrew: 'ציפור', emoji: '🐦' },
  { english: 'horse', hebrew: 'סוס', emoji: '🐴' },
  { english: 'cow', hebrew: 'פרה', emoji: '🐄' },
  { english: 'duck', hebrew: 'ברווז', emoji: '🦆' },
  { english: 'rabbit', hebrew: 'ארנב', emoji: '🐰' },
];

// Deterministic rng: always returns 0 (Fisher-Yates then always swaps with index 0)
const rng0 = () => 0;

describe('shuffle', () => {
  it('returns a new array with the same items', () => {
    const out = shuffle(WORDS, rng0);
    expect(out).toHaveLength(WORDS.length);
    expect(new Set(out.map((w) => w.english))).toEqual(new Set(WORDS.map((w) => w.english)));
  });

  it('does not mutate the input array', () => {
    const copy = [...WORDS];
    shuffle(WORDS, rng0);
    expect(WORDS).toEqual(copy);
  });
});

describe('makeChoices', () => {
  it('returns the requested number of choices including the correct word', () => {
    const correct = WORDS[2];
    const choices = makeChoices(WORDS, correct, 3, rng0);
    expect(choices).toHaveLength(3);
    expect(choices.some((w) => w.english === correct.english)).toBe(true);
  });

  it('has no duplicate choices', () => {
    const choices = makeChoices(WORDS, WORDS[0], 4, rng0);
    expect(new Set(choices.map((w) => w.english)).size).toBe(4);
  });
});

describe('makePairs', () => {
  it('returns two cards per word with matching wordIds and unique card ids', () => {
    const cards = makePairs(WORDS, 6, 'emoji-emoji', rng0);
    expect(cards).toHaveLength(12);
    expect(new Set(cards.map((c) => c.id)).size).toBe(12);
    const byWord = {};
    for (const c of cards) byWord[c.wordId] = (byWord[c.wordId] || 0) + 1;
    expect(Object.values(byWord)).toEqual([2, 2, 2, 2, 2, 2]);
  });

  it('uses emoji faces on both cards in emoji-emoji mode', () => {
    const cards = makePairs(WORDS, 6, 'emoji-emoji', rng0);
    expect(cards.every((c) => c.face === 'emoji')).toBe(true);
  });

  it('uses one emoji face and one word face per pair in emoji-word mode', () => {
    const cards = makePairs(WORDS, 6, 'emoji-word', rng0);
    const faces = {};
    for (const c of cards) (faces[c.wordId] ||= []).push(c.face);
    for (const pair of Object.values(faces)) {
      expect(pair.sort()).toEqual(['emoji', 'word']);
    }
  });
});

describe('starsForScore', () => {
  it('gives 3 stars for a perfect score', () => {
    expect(starsForScore(8, 8)).toBe(3);
  });
  it('gives 2 stars for 70% or better (but not perfect)', () => {
    expect(starsForScore(7, 10)).toBe(2);
    expect(starsForScore(9, 10)).toBe(2);
  });
  it('gives 1 star below 70%', () => {
    expect(starsForScore(3, 10)).toBe(1);
    expect(starsForScore(0, 10)).toBe(1);
  });
});
