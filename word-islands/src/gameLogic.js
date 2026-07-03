// Pure game logic — no React, no DOM. rng is injectable for deterministic tests.

export function shuffle(arr, rng = Math.random) {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Returns `count` answer options (word objects) including `correct`, shuffled.
export function makeChoices(words, correct, count, rng = Math.random) {
  const others = shuffle(
    words.filter((w) => w.english !== correct.english),
    rng
  ).slice(0, count - 1);
  return shuffle([correct, ...others], rng);
}

// Returns 2 * pairCount memory cards, shuffled.
// mode 'emoji-emoji': both cards show the emoji (ages 5-7).
// mode 'emoji-word': one card shows the emoji, the other the written word (ages 8-10).
export function makePairs(words, pairCount, mode, rng = Math.random) {
  const chosen = shuffle(words, rng).slice(0, pairCount);
  const cards = chosen.flatMap((w) => [
    { id: `${w.english}-a`, wordId: w.english, face: 'emoji', word: w },
    {
      id: `${w.english}-b`,
      wordId: w.english,
      face: mode === 'emoji-word' ? 'word' : 'emoji',
      word: w,
    },
  ]);
  return shuffle(cards, rng);
}

// Quiz score -> stars. Finishing always earns at least 1 star (no dead ends).
export function starsForScore(correct, total) {
  const ratio = total > 0 ? correct / total : 0;
  if (ratio === 1) return 3;
  if (ratio >= 0.7) return 2;
  return 1;
}
