import { describe, it, expect } from 'vitest';
import islands57 from './islands57.json';
import islands810 from './islands810.json';

const FILES = {
  'islands57.json (ages 5-7)': { data: islands57, wordCount: 8 },
  'islands810.json (ages 8-10)': { data: islands810, wordCount: 10 },
};

describe('content shape invariants', () => {
  for (const [label, { data, wordCount }] of Object.entries(FILES)) {
    describe(label, () => {
      it('has unique island ids', () => {
        const ids = data.map((island) => island.id);
        expect(new Set(ids).size).toBe(ids.length);
      });

      it(`has exactly ${wordCount} words per island`, () => {
        for (const island of data) {
          expect(island.words).toHaveLength(wordCount);
        }
      });

      it('has non-empty english/hebrew/emoji on every word', () => {
        for (const island of data) {
          for (const word of island.words) {
            expect(word.english).toBeTruthy();
            expect(word.hebrew).toBeTruthy();
            expect(word.emoji).toBeTruthy();
          }
        }
      });

      it('has unique emoji within each island', () => {
        for (const island of data) {
          const emoji = island.words.map((word) => word.emoji);
          expect(new Set(emoji).size).toBe(emoji.length);
        }
      });
    });
  }

  it('has unique creature emoji across both age paths combined', () => {
    const creatures = [
      ...islands57.map((island) => island.creature),
      ...islands810.map((island) => island.creature),
    ];
    expect(new Set(creatures).size).toBe(creatures.length);
  });
});
