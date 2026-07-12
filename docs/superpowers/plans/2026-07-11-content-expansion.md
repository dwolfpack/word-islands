# Word Islands Content Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Track 1 (Content) of the Word Islands post-launch improvements: a content-shape regression test, a tone fix, three new islands (Numbers, Weather, Family), and filling in the funny-video links for the 18 existing Animal-island words — per `docs/superpowers/specs/2026-07-11-content-expansion-design.md`.

**Architecture:** All content lives in two flat JSON arrays (`word-islands/src/content/islands57.json` for ages 5–7, `word-islands/src/content/islands810.json` for ages 8–10). The app (`manifest.js`, `WorldMap.jsx`, `progress.js`) already iterates these generically with no hardcoded island count, so every task here is a pure data change plus one new regression-test file — no application code changes.

**Tech Stack:** Vitest (existing), no new dependencies.

## Global Constraints

- Word count per island: exactly 8 entries in `islands57.json`, exactly 10 in `islands810.json`.
- Every word object has non-empty `english`, `hebrew`, `emoji` string fields.
- Every island's `emoji` values are unique within that island (game mechanics — Tap the Right One / Memory Match — depend on visually distinguishing words by emoji).
- Every island's `creature` emoji is unique across **both** files combined (Sticker Book identity is keyed on creature emoji).
- New islands (Numbers, Weather, Family) do **not** get a `"video"` field — that's an Animals-only feature per the design spec.
- Each task/PR must leave `npm test` (run from `word-islands/`) fully green before commit.

---

### Task 1: Content-shape regression test

**Files:**
- Create: `word-islands/src/content/contentShape.test.js`

**Interfaces:**
- Consumes: `word-islands/src/content/islands57.json`, `word-islands/src/content/islands810.json` (existing, no changes).
- Produces: nothing consumed by later tasks directly — but every later content task is validated by this suite passing under `npm test`.

- [ ] **Step 1: Write the test**

```js
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
```

- [ ] **Step 2: Run the suite and confirm it passes against current content**

This is a regression/invariant suite over already-shipped, already-verified content — not new production code being driven into existence — so there is no red step to force. Run:

```bash
cd word-islands && npm test
```

Expected: all suites pass, including the new `contentShape.test.js` (current content already satisfies every invariant — this has been independently verified by hand before writing this plan). If anything in this new suite fails, that means either the test has a bug or a genuine content defect was just caught — investigate before proceeding; do not weaken the assertions to make it pass.

- [ ] **Step 3: Commit**

```bash
git add word-islands/src/content/contentShape.test.js
git commit -m "test(word-islands): add content-shape regression suite"
```

---

### Task 2: Tone fix — replace "skull" in the 8–10 Body Island

**Files:**
- Modify: `word-islands/src/content/islands810.json`

**Interfaces:**
- Consumes: Task 1's `contentShape.test.js` (used to verify this change doesn't break invariants).
- Produces: nothing new consumed by later tasks.

- [ ] **Step 1: Make the edit**

Find this exact block in `word-islands/src/content/islands810.json` (inside the Body island's `words` array):

```json
      {
        "english": "skull",
        "hebrew": "גולגולת",
        "emoji": "💀"
      },
```

Replace it with:

```json
      {
        "english": "shoulder",
        "hebrew": "כתף",
        "emoji": "🤷"
      },
```

- [ ] **Step 2: Run tests**

```bash
cd word-islands && npm test
```

Expected: all pass, including `contentShape.test.js` (Body island still has 10 words, all unique emoji, unique creature — this edit only swaps one word, doesn't add/remove entries).

- [ ] **Step 3: Manual spot-check in the browser**

Start the dev server (`npm run dev` from `word-islands/`). Create or select an 8–10 profile, open the Body Island, page through the flashcards to the "shoulder" card. Confirm it shows 🤷, "shoulder", and (in Hebrew UI mode) "כתף", and that tapping the audio button doesn't throw a console error.

- [ ] **Step 4: Commit**

```bash
git add word-islands/src/content/islands810.json
git commit -m "content(word-islands): replace skull with shoulder in 8-10 Body Island"
```

---

### Task 3: Add the Numbers island

**Files:**
- Modify: `word-islands/src/content/islands57.json`
- Modify: `word-islands/src/content/islands810.json`

**Interfaces:**
- Consumes: Task 1's `contentShape.test.js`.
- Produces: a new island with `id: "numbers"`, `creature: "🦔"` in `islands57.json` and `creature: "🦫"` in `islands810.json` (every existing theme uses a *different* creature per age-path file — e.g. `animals` is 🦁 in `islands57.json` and 🐉 in `islands810.json` — so Numbers follows the same pattern) — Task 4 appends after this one, so its anchor is this task's exact output.

- [ ] **Step 1: Append the Numbers island to `islands57.json`**

Find this exact ending of the file (the end of the Clothes island / end of the array):

```json
      {
        "english": "scarf",
        "hebrew": "צעיף",
        "emoji": "🧣"
      }
    ]
  }
]
```

Replace it with:

```json
      {
        "english": "scarf",
        "hebrew": "צעיף",
        "emoji": "🧣"
      }
    ]
  },
  {
    "id": "numbers",
    "icon": "🔢",
    "name": {
      "en": "Number Island",
      "he": "אי המספרים"
    },
    "creature": "🦔",
    "words": [
      {
        "english": "one",
        "hebrew": "אחד",
        "emoji": "1️⃣"
      },
      {
        "english": "two",
        "hebrew": "שתיים",
        "emoji": "2️⃣"
      },
      {
        "english": "three",
        "hebrew": "שלוש",
        "emoji": "3️⃣"
      },
      {
        "english": "four",
        "hebrew": "ארבע",
        "emoji": "4️⃣"
      },
      {
        "english": "five",
        "hebrew": "חמש",
        "emoji": "5️⃣"
      },
      {
        "english": "six",
        "hebrew": "שש",
        "emoji": "6️⃣"
      },
      {
        "english": "seven",
        "hebrew": "שבע",
        "emoji": "7️⃣"
      },
      {
        "english": "eight",
        "hebrew": "שמונה",
        "emoji": "8️⃣"
      }
    ]
  }
]
```

- [ ] **Step 2: Append the Numbers island to `islands810.json`**

Find this exact ending of the file (the end of the Clothes island / end of the array):

```json
      {
        "english": "backpack",
        "hebrew": "תיק גב",
        "emoji": "🎒"
      }
    ]
  }
]
```

Replace it with:

```json
      {
        "english": "backpack",
        "hebrew": "תיק גב",
        "emoji": "🎒"
      }
    ]
  },
  {
    "id": "numbers",
    "icon": "🔢",
    "name": {
      "en": "Number Island",
      "he": "אי המספרים"
    },
    "creature": "🦫",
    "words": [
      {
        "english": "one",
        "hebrew": "אחד",
        "emoji": "1️⃣"
      },
      {
        "english": "two",
        "hebrew": "שתיים",
        "emoji": "2️⃣"
      },
      {
        "english": "three",
        "hebrew": "שלוש",
        "emoji": "3️⃣"
      },
      {
        "english": "four",
        "hebrew": "ארבע",
        "emoji": "4️⃣"
      },
      {
        "english": "five",
        "hebrew": "חמש",
        "emoji": "5️⃣"
      },
      {
        "english": "six",
        "hebrew": "שש",
        "emoji": "6️⃣"
      },
      {
        "english": "seven",
        "hebrew": "שבע",
        "emoji": "7️⃣"
      },
      {
        "english": "eight",
        "hebrew": "שמונה",
        "emoji": "8️⃣"
      },
      {
        "english": "nine",
        "hebrew": "תשע",
        "emoji": "9️⃣"
      },
      {
        "english": "ten",
        "hebrew": "עשר",
        "emoji": "🔟"
      }
    ]
  }
]
```

- [ ] **Step 3: Run tests and build**

```bash
cd word-islands && npm test && npm run build
```

Expected: all tests pass (7 islands now, both files respect their word-count invariant, 🦔 and 🦫 don't collide with any existing creature: `🦁 🦜 🐸 🐢 🦉 🐬 🐉 🦚 🦊 🦥 🦖 🧜`, or with each other); build succeeds.

- [ ] **Step 4: Manual spot-check in the browser**

Start the dev server. Create a fresh profile (or clear `localStorage` first: open devtools console and run `localStorage.removeItem('wordIslands')`, then reload). To preview the new island's content directly without playing through all 6 prior islands, seed 3 stars on every prior island via the browser console (after creating your profile):

```js
const s = JSON.parse(localStorage.getItem('wordIslands'));
const p = s.profiles[0];
for (const id of ['animals', 'colors', 'food', 'home', 'body', 'clothes']) {
  p.islands[id] = { stars: 3 };
}
localStorage.setItem('wordIslands', JSON.stringify(s));
location.reload();
```

Confirm the world map now shows 7 islands, Number Island is unlocked, its flashcards show the digits/emoji/Hebrew correctly, and no console errors appear.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/content/islands57.json word-islands/src/content/islands810.json
git commit -m "content(word-islands): add Numbers island"
```

---

### Task 4: Add the Weather island

**Files:**
- Modify: `word-islands/src/content/islands57.json`
- Modify: `word-islands/src/content/islands810.json`

**Interfaces:**
- Consumes: Task 3's output (this task's anchor is the Numbers island just appended).
- Produces: a new island with `id: "weather"`, `creature: "🐨"` in `islands57.json` and `creature: "🦦"` in `islands810.json` (same different-creature-per-file pattern as every existing island) — Task 5 appends after this one.

- [ ] **Step 1: Append the Weather island to `islands57.json`**

Find this exact ending of the file (the end of the Numbers island added in Task 3):

```json
      {
        "english": "eight",
        "hebrew": "שמונה",
        "emoji": "8️⃣"
      }
    ]
  }
]
```

Replace it with:

```json
      {
        "english": "eight",
        "hebrew": "שמונה",
        "emoji": "8️⃣"
      }
    ]
  },
  {
    "id": "weather",
    "icon": "🌦️",
    "name": {
      "en": "Weather Island",
      "he": "אי מזג האוויר"
    },
    "creature": "🐨",
    "words": [
      {
        "english": "sun",
        "hebrew": "שמש",
        "emoji": "☀️"
      },
      {
        "english": "rain",
        "hebrew": "גשם",
        "emoji": "🌧️"
      },
      {
        "english": "cloud",
        "hebrew": "ענן",
        "emoji": "☁️"
      },
      {
        "english": "wind",
        "hebrew": "רוח",
        "emoji": "🌬️"
      },
      {
        "english": "snow",
        "hebrew": "שלג",
        "emoji": "❄️"
      },
      {
        "english": "storm",
        "hebrew": "סערה",
        "emoji": "⛈️"
      },
      {
        "english": "fog",
        "hebrew": "ערפל",
        "emoji": "🌫️"
      },
      {
        "english": "ice",
        "hebrew": "קרח",
        "emoji": "🧊"
      }
    ]
  }
]
```

- [ ] **Step 2: Append the Weather island to `islands810.json`**

Find this exact ending of the file (the end of the Numbers island added in Task 3):

```json
      {
        "english": "ten",
        "hebrew": "עשר",
        "emoji": "🔟"
      }
    ]
  }
]
```

Replace it with:

```json
      {
        "english": "ten",
        "hebrew": "עשר",
        "emoji": "🔟"
      }
    ]
  },
  {
    "id": "weather",
    "icon": "🌦️",
    "name": {
      "en": "Weather Island",
      "he": "אי מזג האוויר"
    },
    "creature": "🦦",
    "words": [
      {
        "english": "sun",
        "hebrew": "שמש",
        "emoji": "☀️"
      },
      {
        "english": "rain",
        "hebrew": "גשם",
        "emoji": "🌧️"
      },
      {
        "english": "cloud",
        "hebrew": "ענן",
        "emoji": "☁️"
      },
      {
        "english": "wind",
        "hebrew": "רוח",
        "emoji": "🌬️"
      },
      {
        "english": "snow",
        "hebrew": "שלג",
        "emoji": "❄️"
      },
      {
        "english": "storm",
        "hebrew": "סערה",
        "emoji": "⛈️"
      },
      {
        "english": "fog",
        "hebrew": "ערפל",
        "emoji": "🌫️"
      },
      {
        "english": "ice",
        "hebrew": "קרח",
        "emoji": "🧊"
      },
      {
        "english": "thunder",
        "hebrew": "רעם",
        "emoji": "⚡"
      },
      {
        "english": "umbrella",
        "hebrew": "מטרייה",
        "emoji": "☂️"
      }
    ]
  }
]
```

- [ ] **Step 3: Run tests and build**

```bash
cd word-islands && npm test && npm run build
```

Expected: all tests pass (8 islands now; 🐨 and 🦦 don't collide with any existing creature including 🦔/🦫 from Task 3, or with each other); build succeeds.

- [ ] **Step 4: Manual spot-check in the browser**

Same technique as Task 3 Step 4, but also seed `numbers: { stars: 3 }` in the loop so Weather Island unlocks:

```js
const s = JSON.parse(localStorage.getItem('wordIslands'));
const p = s.profiles[0];
for (const id of ['animals', 'colors', 'food', 'home', 'body', 'clothes', 'numbers']) {
  p.islands[id] = { stars: 3 };
}
localStorage.setItem('wordIslands', JSON.stringify(s));
location.reload();
```

Confirm 8 islands on the map, Weather Island unlocked, flashcards render correctly, no console errors.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/content/islands57.json word-islands/src/content/islands810.json
git commit -m "content(word-islands): add Weather island"
```

---

### Task 5: Add the Family island

**Files:**
- Modify: `word-islands/src/content/islands57.json`
- Modify: `word-islands/src/content/islands810.json`

**Interfaces:**
- Consumes: Task 4's output (this task's anchor is the Weather island just appended).
- Produces: a new island with `id: "family"`, `creature: "🦭"` in `islands57.json` and `creature: "🐿️"` in `islands810.json` (same different-creature-per-file pattern). This is the last new island in this plan.

- [ ] **Step 1: Append the Family island to `islands57.json`**

Find this exact ending of the file (the end of the Weather island added in Task 4):

```json
      {
        "english": "ice",
        "hebrew": "קרח",
        "emoji": "🧊"
      }
    ]
  }
]
```

Replace it with:

```json
      {
        "english": "ice",
        "hebrew": "קרח",
        "emoji": "🧊"
      }
    ]
  },
  {
    "id": "family",
    "icon": "👨‍👩‍👧‍👦",
    "name": {
      "en": "Family Island",
      "he": "אי המשפחה"
    },
    "creature": "🦭",
    "words": [
      {
        "english": "mom",
        "hebrew": "אמא",
        "emoji": "👩"
      },
      {
        "english": "dad",
        "hebrew": "אבא",
        "emoji": "👨"
      },
      {
        "english": "sister",
        "hebrew": "אחות",
        "emoji": "👧"
      },
      {
        "english": "brother",
        "hebrew": "אח",
        "emoji": "👦"
      },
      {
        "english": "baby",
        "hebrew": "תינוק",
        "emoji": "👶"
      },
      {
        "english": "grandma",
        "hebrew": "סבתא",
        "emoji": "👵"
      },
      {
        "english": "grandpa",
        "hebrew": "סבא",
        "emoji": "👴"
      },
      {
        "english": "friend",
        "hebrew": "חבר",
        "emoji": "🧑‍🤝‍🧑"
      }
    ]
  }
]
```

- [ ] **Step 2: Append the Family island to `islands810.json`**

Find this exact ending of the file (the end of the Weather island added in Task 4):

```json
      {
        "english": "umbrella",
        "hebrew": "מטרייה",
        "emoji": "☂️"
      }
    ]
  }
]
```

Replace it with:

```json
      {
        "english": "umbrella",
        "hebrew": "מטרייה",
        "emoji": "☂️"
      }
    ]
  },
  {
    "id": "family",
    "icon": "👨‍👩‍👧‍👦",
    "name": {
      "en": "Family Island",
      "he": "אי המשפחה"
    },
    "creature": "🐿️",
    "words": [
      {
        "english": "mom",
        "hebrew": "אמא",
        "emoji": "👩"
      },
      {
        "english": "dad",
        "hebrew": "אבא",
        "emoji": "👨"
      },
      {
        "english": "sister",
        "hebrew": "אחות",
        "emoji": "👧"
      },
      {
        "english": "brother",
        "hebrew": "אח",
        "emoji": "👦"
      },
      {
        "english": "baby",
        "hebrew": "תינוק",
        "emoji": "👶"
      },
      {
        "english": "grandma",
        "hebrew": "סבתא",
        "emoji": "👵"
      },
      {
        "english": "grandpa",
        "hebrew": "סבא",
        "emoji": "👴"
      },
      {
        "english": "friend",
        "hebrew": "חבר",
        "emoji": "🧑‍🤝‍🧑"
      },
      {
        "english": "family",
        "hebrew": "משפחה",
        "emoji": "👪"
      },
      {
        "english": "cousin",
        "hebrew": "בן דוד",
        "emoji": "🧑"
      }
    ]
  }
]
```

- [ ] **Step 3: Run tests and build**

```bash
cd word-islands && npm test && npm run build
```

Expected: all tests pass (9 islands now; 🦭 and 🐿️ don't collide with any existing creature or each other); build succeeds.

- [ ] **Step 4: Manual spot-check in the browser**

Same technique as before, seeding all 8 prior islands (including `weather: { stars: 3 }`):

```js
const s = JSON.parse(localStorage.getItem('wordIslands'));
const p = s.profiles[0];
for (const id of ['animals', 'colors', 'food', 'home', 'body', 'clothes', 'numbers', 'weather']) {
  p.islands[id] = { stars: 3 };
}
localStorage.setItem('wordIslands', JSON.stringify(s));
location.reload();
```

Confirm 9 islands render cleanly on the world-map grid (no layout breakage with the larger count — the CSS grid is `repeat(auto-fill, minmax(180px, 1fr))`, which wraps automatically), Family Island unlocked, flashcards correct, no console errors.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/content/islands57.json word-islands/src/content/islands810.json
git commit -m "content(word-islands): add Family island"
```

---

### Task 6: Funny-video links — ages 5–7 batch (8 Animal-island words)

**Files:**
- Modify: `word-islands/src/content/islands57.json` (only the `animals` island's `video` fields)

**Interfaces:**
- Consumes: `videoEmbedUrl()` from `word-islands/src/video.js` (already implemented and tested — accepts a YouTube watch/shorts/youtu.be URL or a bare 11-character video id; returns `null`, which hides the flashcard's video button, for anything else).
- Produces: nothing consumed by later tasks.

This task is research-and-approval, not code-driven TDD — there is no failing test to write first, since it's a data-fill against an already-tested parser.

- [ ] **Step 1: Research candidates**

For each of the 8 words in `islands57.json`'s `animals` island (dog, cat, fish, bird, horse, cow, duck, rabbit), web-search for a short, family-friendly video (funny/cute clips from known kid-safe channels preferred — avoid anything with ads, comments sections, or unrelated linked content baked into the clip itself).

- [ ] **Step 2: Present shortlist for approval**

In chat, present one shortlist entry per word: word, candidate title, URL, one-line description of what's in the clip. Wait for approval, rejection, or a request for alternatives on each word before proceeding. Do not add a video link the user hasn't explicitly approved.

- [ ] **Step 3: Fill in approved links**

For each approved word, set its `"video"` field in `islands57.json`'s `animals` island to the approved URL (or bare video id). Leave any word without an approved link as `"video": ""` — an empty slot is a valid, fully-supported state (the flashcard simply shows no video button), not an error.

- [ ] **Step 4: Run tests**

```bash
cd word-islands && npm test
```

Expected: all pass (this doesn't touch word count, emoji, or creature fields — only `video` values on existing entries).

- [ ] **Step 5: Manual spot-check in the browser**

Start the dev server, open Animal Island on a 5–7 profile, confirm: words with an approved link show the 🎬 "Funny video!" button and open the embed overlay without console errors; words without a link show no button.

- [ ] **Step 6: Commit**

```bash
git add word-islands/src/content/islands57.json
git commit -m "content(word-islands): add approved video links for 5-7 Animal Island"
```

---

### Task 7: Funny-video links — ages 8–10 batch (10 Animal-island words)

**Files:**
- Modify: `word-islands/src/content/islands810.json` (only the `animals` island's `video` fields)

**Interfaces:**
- Consumes: same `videoEmbedUrl()` as Task 6.
- Produces: nothing — this is the last task in this plan.

- [ ] **Step 1: Research candidates**

For each of the 10 words in `islands810.json`'s `animals` island (elephant, monkey, lion, tiger, bear, wolf, snake, turtle, penguin, dolphin), web-search for a short, family-friendly video, same criteria as Task 6.

- [ ] **Step 2: Present shortlist for approval**

Same process as Task 6 Step 2, for this batch's 10 words.

- [ ] **Step 3: Fill in approved links**

Same process as Task 6 Step 3, writing into `islands810.json`'s `animals` island.

- [ ] **Step 4: Run tests**

```bash
cd word-islands && npm test
```

Expected: all pass.

- [ ] **Step 5: Manual spot-check in the browser**

Same as Task 6 Step 5, but on an 8–10 profile's Animal Island.

- [ ] **Step 6: Commit**

```bash
git add word-islands/src/content/islands810.json
git commit -m "content(word-islands): add approved video links for 8-10 Animal Island"
```
