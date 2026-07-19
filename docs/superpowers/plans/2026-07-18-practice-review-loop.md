# Practice Review Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a spaced-repetition **Practice** mode that reviews previously-learned words on a Leitner schedule, reachable from a "Practice (N)" button on the world map.

**Architecture:** All scheduling is pure, unit-tested logic in `progress.js` (mirroring `recordResult`). A per-profile `reviews` map stores `{ box, due }` per word key `"<islandId>:<english>"`. `App.jsx` snapshots a capped, ordered session on entry and renders a new `PracticeSession.jsx` (modeled on `QuickQuiz.jsx`) that reuses the quiz mechanic, sounds, and the `Celebration` component.

**Tech Stack:** React 18, Vite, Vitest (default `node` env — pure-logic unit tests only; no component-render tests, matching the repo).

## Global Constraints

- Leitner boxes 1–5. Intervals (days until next due, by the box a word lands in): Box 1 → +1, Box 2 → +2, Box 3 → +4, Box 4 → +7, Box 5 → +14. Box 5 is a maintenance box — it recurs at +14 and never retires.
- Words enter at **Box 1, due today** when an island's quiz is completed; already-tracked words are **not** reset on replay.
- Movement: **right** → `box = min(box+1, 5)`, `due = today + interval[newBox]`; **wrong** → `box = 1`, `due = today + 1`.
- `due` is a local date string `'YYYY-MM-DD'`; a word is due when `due <= today` (correct as a lexicographic string compare on zero-padded dates). `today` is injected into all pure functions for deterministic tests.
- Mutators take `(state, profileId, …)` and return new state (like `recordResult`); read helpers take `(profile, …)`.
- Session cap: **10** words, ordered **lowest box first, then earliest `due` first**.
- Distractors come from the pool of **all the child's learned words**, deduped by `english`, so review mixes islands.
- Reward is **lighter** than island completion: confetti + a word-count summary, **no stars, no creature, no sticker**.
- Backward compatible: existing saved profiles load with `reviews: {}` via `loadState`'s default-merge.
- No backend, no new runtime dependency, localStorage as today. Every English i18n key needs a Hebrew counterpart (enforced by `i18n.test.js`).
- This repo has no component-render test setup; presentational tasks are verified in the browser. `npm test` (from `word-islands/`) must stay green after every task.

---

### Task 1: Data model, date helpers, and word entry

**Files:**
- Modify: `word-islands/src/progress.js`
- Test: `word-islands/src/progress.test.js`

**Interfaces:**
- Produces: `reviews: {}` on default/new profiles; `todayStr(date?)` → `'YYYY-MM-DD'`; `enterWordsForIsland(state, profileId, islandId, words, today)` → new state. Consumed by Task 2 (helpers reuse) and Task 6 (App).

- [ ] **Step 1: Write the failing tests**

`reviews` is a **per-profile** map (like `islands` and `creatures`), so
top-level `defaultState()` is unchanged and the existing `loadState`
default-state assertions stay as they are. The new tests assert that
`createProfile` seeds `reviews: {}` and that `enterWordsForIsland` works.

Add to `word-islands/src/progress.test.js`. First extend the import at the top:

```js
import {
  loadState,
  saveState,
  createProfile,
  recordResult,
  deleteProfile,
  todayStr,
  enterWordsForIsland,
} from './progress.js';
```

```js
describe('createProfile reviews', () => {
  it('seeds an empty reviews map on new profiles', () => {
    const { profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
    expect(profile.reviews).toEqual({});
  });
});

describe('todayStr', () => {
  it('formats a date as local YYYY-MM-DD', () => {
    expect(todayStr(new Date(2026, 6, 4))).toBe('2026-07-04');
    expect(todayStr(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('enterWordsForIsland', () => {
  const WORDS = [
    { english: 'dog', hebrew: 'כלב', emoji: '🐶' },
    { english: 'cat', hebrew: 'חתול', emoji: '🐱' },
  ];
  function seeded() {
    return createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
  }

  it('adds untracked island words at box 1, due today', () => {
    const { state, profile } = seeded();
    const next = enterWordsForIsland(state, profile.id, 'animals', WORDS, '2026-07-04');
    expect(next.profiles[0].reviews).toEqual({
      'animals:dog': { box: 1, due: '2026-07-04' },
      'animals:cat': { box: 1, due: '2026-07-04' },
    });
  });

  it('does not reset words already tracked', () => {
    const { state, profile } = seeded();
    let next = enterWordsForIsland(state, profile.id, 'animals', WORDS, '2026-07-04');
    next.profiles[0].reviews['animals:dog'] = { box: 3, due: '2026-07-20' };
    const again = enterWordsForIsland(next, profile.id, 'animals', WORDS, '2026-07-10');
    expect(again.profiles[0].reviews['animals:dog']).toEqual({ box: 3, due: '2026-07-20' });
    expect(again.profiles[0].reviews['animals:cat']).toEqual({ box: 1, due: '2026-07-04' });
  });

  it('does not modify other profiles', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    const next = enterWordsForIsland(b.state, b.profile.id, 'animals', WORDS, '2026-07-04');
    const profileA = next.profiles.find((p) => p.id === a.profile.id);
    expect(profileA.reviews).toEqual({});
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run (from `word-islands/`): `npm test`
Expected: FAIL — `todayStr`/`enterWordsForIsland` not exported; `profile.reviews` undefined.

- [ ] **Step 3: Implement**

Edit `word-islands/src/progress.js`. Add `reviews: {}` to the profile in `createProfile`:

```js
  const profile = { id, name, avatar, path, islands: {}, creatures: [], reviews: {} };
```

Add near the top (after `STORAGE_KEY`):

```js
// Leitner box -> days until the word is next due once it lands in that box.
const REVIEW_INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };

// Local date as 'YYYY-MM-DD'. Zero-padded so string comparison equals date order.
export function todayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Adds n days to a 'YYYY-MM-DD' string, returning a 'YYYY-MM-DD' string.
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}
```

Add after `recordResult`:

```js
// On finishing an island, adds any of its words not already tracked to the
// review schedule at box 1, due today. Never resets already-tracked words.
export function enterWordsForIsland(state, profileId, islandId, words, today) {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      const reviews = { ...(p.reviews || {}) };
      for (const w of words) {
        const key = `${islandId}:${w.english}`;
        if (!reviews[key]) reviews[key] = { box: 1, due: today };
      }
      return { ...p, reviews };
    }),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/progress.js word-islands/src/progress.test.js
git commit -m "feat(word-islands): add review data model, date helpers, and word entry"
```

---

### Task 2: Scheduling reads and box movement

**Files:**
- Modify: `word-islands/src/progress.js`
- Test: `word-islands/src/progress.test.js`

**Interfaces:**
- Consumes: `REVIEW_INTERVALS`, `addDays`, the `reviews` map (Task 1).
- Produces: `dueReviews(profile, today)` → `string[]`; `buildSession(profile, today, cap = 10)` → ordered capped `string[]`; `recordReview(state, profileId, key, correct, today)` → new state. Consumed by Task 5 (session) and Task 6 (App).

- [ ] **Step 1: Write the failing tests**

Add `dueReviews`, `buildSession`, `recordReview` to the import in `progress.test.js`, then add:

```js
function profileWithReviews(reviews) {
  const { state, profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
  profile.reviews = reviews;
  return { state, profile };
}

describe('dueReviews', () => {
  it('returns only keys due on or before today', () => {
    const { profile } = profileWithReviews({
      'animals:dog': { box: 1, due: '2026-07-04' },
      'animals:cat': { box: 2, due: '2026-07-10' },
      'animals:fish': { box: 1, due: '2026-07-03' },
    });
    expect(dueReviews(profile, '2026-07-04').sort()).toEqual(['animals:dog', 'animals:fish']);
  });

  it('is empty when nothing is tracked', () => {
    const { profile } = profileWithReviews({});
    expect(dueReviews(profile, '2026-07-04')).toEqual([]);
  });
});

describe('buildSession', () => {
  it('orders by lowest box then earliest due, and caps the count', () => {
    const reviews = {};
    for (let i = 0; i < 12; i++) reviews[`animals:w${i}`] = { box: 1, due: '2026-07-01' };
    reviews['animals:hi'] = { box: 3, due: '2026-06-01' }; // higher box, should come after box-1s
    const { profile } = profileWithReviews(reviews);
    const session = buildSession(profile, '2026-07-04', 10);
    expect(session).toHaveLength(10);
    expect(session).not.toContain('animals:hi'); // box-1 words fill the cap first
  });

  it('returns all due when fewer than the cap', () => {
    const { profile } = profileWithReviews({
      'animals:dog': { box: 2, due: '2026-07-02' },
      'animals:cat': { box: 1, due: '2026-07-03' },
    });
    // cat (box 1) before dog (box 2)
    expect(buildSession(profile, '2026-07-04', 10)).toEqual(['animals:cat', 'animals:dog']);
  });
});

describe('recordReview', () => {
  function stateWith(reviews) {
    const { state, profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
    profile.reviews = reviews;
    return { state, profileId: profile.id };
  }

  it('promotes a correct answer and reschedules by the new box interval', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 2, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:dog', true, '2026-07-04');
    expect(next.profiles[0].reviews['animals:dog']).toEqual({ box: 3, due: '2026-07-08' }); // +4
  });

  it('keeps a correct box-5 answer at box 5, rescheduled +14', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 5, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:dog', true, '2026-07-04');
    expect(next.profiles[0].reviews['animals:dog']).toEqual({ box: 5, due: '2026-07-18' }); // +14
  });

  it('resets a wrong answer to box 1, due tomorrow', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 4, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:dog', false, '2026-07-04');
    expect(next.profiles[0].reviews['animals:dog']).toEqual({ box: 1, due: '2026-07-05' }); // +1
  });

  it('is a no-op for an untracked key', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 1, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:nope', true, '2026-07-04');
    expect(next.profiles[0].reviews).toEqual({ 'animals:dog': { box: 1, due: '2026-07-04' } });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — the three functions are not exported.

- [ ] **Step 3: Implement**

Edit `word-islands/src/progress.js`, adding after `enterWordsForIsland`:

```js
// Keys of words due for review on or before `today`.
export function dueReviews(profile, today) {
  return Object.entries(profile.reviews || {})
    .filter(([, v]) => v.due <= today)
    .map(([k]) => k);
}

// The next practice session: up to `cap` due keys, lowest box first, then
// earliest due first.
export function buildSession(profile, today, cap = 10) {
  const reviews = profile.reviews || {};
  return dueReviews(profile, today)
    .sort((a, b) => reviews[a].box - reviews[b].box || (reviews[a].due < reviews[b].due ? -1 : 1))
    .slice(0, cap);
}

// Applies a practice answer: right promotes a box (capped at 5) and reschedules
// by that box's interval; wrong resets to box 1, due tomorrow. No-op if untracked.
export function recordReview(state, profileId, key, correct, today) {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      const entry = (p.reviews || {})[key];
      if (!entry) return p;
      const box = correct ? Math.min(entry.box + 1, 5) : 1;
      const due = correct ? addDays(today, REVIEW_INTERVALS[box]) : addDays(today, 1);
      return { ...p, reviews: { ...p.reviews, [key]: { box, due } } };
    }),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/progress.js word-islands/src/progress.test.js
git commit -m "feat(word-islands): add review scheduling reads and box movement"
```

---

### Task 3: i18n strings

**Files:**
- Modify: `word-islands/src/i18n.js`

**Interfaces:**
- Produces: `t(lang, 'practice')`, `t(lang, 'allCaughtUp')`, `t(lang, 'practiceInstruction')`, `t(lang, 'youPracticed')`, `t(lang, 'wordsWord')`, `t(lang, 'movedUp')`. Consumed by Tasks 4 and 5.

- [ ] **Step 1: Add the strings**

Edit `word-islands/src/i18n.js`. In the `en` block, add after `newTag: 'New!',`:

```js
    newTag: 'New!',
    practice: 'Practice',
    allCaughtUp: 'All caught up!',
    practiceInstruction: 'Practice your words!',
    youPracticed: 'You practiced',
    wordsWord: 'words',
    movedUp: 'moved up!',
```

In the `he` block, add after `newTag: 'חדש!',`:

```js
    newTag: 'חדש!',
    practice: 'תרגול',
    allCaughtUp: 'סיימתם הכל!',
    practiceInstruction: 'תרגלו את המילים שלכם!',
    youPracticed: 'תרגלתם',
    wordsWord: 'מילים',
    movedUp: 'עלו!',
```

- [ ] **Step 2: Run tests to verify parity**

Run (from `word-islands/`): `npm test`
Expected: PASS — `i18n.test.js`'s parity test confirms all six new keys exist in both languages.

- [ ] **Step 3: Commit**

```bash
git add word-islands/src/i18n.js
git commit -m "content(word-islands): add practice-mode strings"
```

---

### Task 4: World map Practice button

**Files:**
- Modify: `word-islands/src/components/WorldMap.jsx`
- Modify: `word-islands/src/styles.css`

**Interfaces:**
- Consumes: `t(lang, 'practice')`, `t(lang, 'allCaughtUp')` (Task 3).
- Produces: `WorldMap` now accepts `dueCount` (number) and `onPractice` (fn) props. Consumed by Task 6 (App).

No unit test (presentational; no component-render setup). Verified in-browser at Task 6.

- [ ] **Step 1: Add the button**

Edit `word-islands/src/components/WorldMap.jsx`. Change the signature:

```js
export default function WorldMap({ profile, islands, lang, dueCount, onEnter, onStickers, onPractice }) {
```

Replace the `.map-top` block:

```jsx
      <div className="map-top">
        <h2>{t(lang, 'chooseIsland')}</h2>
        <div className="map-top-buttons">
          <button onClick={onStickers}>
            📖 {t(lang, 'stickerBook')} ({profile.creatures.length}/{islands.length})
          </button>
          {dueCount > 0 ? (
            <button className="practice-btn" onClick={onPractice}>
              🔁 {t(lang, 'practice')} ({dueCount})
            </button>
          ) : (
            <button className="practice-btn practice-done" disabled>
              🔁 {t(lang, 'allCaughtUp')} 🌟
            </button>
          )}
        </div>
      </div>
```

- [ ] **Step 2: Add CSS**

Edit `word-islands/src/styles.css`. After the `.map-top` rule (in the `/* World map */` section), add:

```css
.map-top-buttons { display: flex; gap: 10px; flex-wrap: wrap; }
.practice-btn { background: var(--accent); color: #fff; }
.practice-done { background: var(--card); color: var(--text); }
```

- [ ] **Step 3: Run the suite**

Run (from `word-islands/`): `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add word-islands/src/components/WorldMap.jsx word-islands/src/styles.css
git commit -m "feat(word-islands): add Practice button to the world map"
```

---

### Task 5: PracticeSession component

**Files:**
- Create: `word-islands/src/components/PracticeSession.jsx`

**Interfaces:**
- Consumes: `makeChoices`, `shuffle` (gameLogic.js); `speak`, `isSpeechAvailable` (speech.js); `playCorrect`, `playIncorrect` (sound.js); `Celebration` (components/Celebration.jsx); `t` (i18n.js).
- Produces: `PracticeSession` default export with props `{ entries, pool, lang, young, soundOn, onAnswer, onExit }` where `entries` is `[{ key, word, box }]` (ordered), `pool` is an array of word objects for distractors, `onAnswer(key, correct)` fires per answer, `onExit()` returns to the map. Consumed by Task 6 (App).

No unit test (presentational; no component-render setup). Verified in-browser at Task 6.

- [ ] **Step 1: Create the component**

Create `word-islands/src/components/PracticeSession.jsx`:

```jsx
import { useEffect, useMemo, useState } from 'react';
import { t } from '../i18n.js';
import { makeChoices } from '../gameLogic.js';
import { speak, isSpeechAvailable } from '../speech.js';
import { playCorrect, playIncorrect } from '../sound.js';
import Celebration from './Celebration.jsx';

// A spaced-repetition practice session over pre-selected due words. Reuses the
// island quiz mechanic (young: hear word -> tap emoji; older: see emoji -> tap
// word). Reports each answer up via onAnswer so App updates the schedule live.
export default function PracticeSession({ entries, pool, lang, young, soundOn, onAnswer, onExit }) {
  const [round, setRound] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'right' | 'wrong'
  const [pickedId, setPickedId] = useState(null);
  const [movedUp, setMovedUp] = useState(0);
  const entry = entries[round];
  const target = entry?.word;
  const choices = useMemo(
    () => (target ? makeChoices(pool, target, 4) : []),
    [pool, target]
  );

  useEffect(() => {
    if (young && target) speak(target.english);
  }, [target, young]);

  const done = round >= entries.length;

  const pick = (word) => {
    if (answered) return;
    const right = word.english === target.english;
    if (right) {
      playCorrect(soundOn);
      if (entry.box < 5) setMovedUp((m) => m + 1);
    } else {
      playIncorrect(soundOn);
    }
    onAnswer(entry.key, right);
    setPickedId(word.english);
    setAnswered(right ? 'right' : 'wrong');
  };

  useEffect(() => {
    if (!answered) return;
    const id = setTimeout(() => {
      setAnswered(null);
      setPickedId(null);
      setRound((r) => r + 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [answered]);

  const choiceClass = (word) => {
    if (!answered) return 'choice';
    if (word.english === target.english) return 'choice right';
    if (word.english === pickedId) return 'choice wrong';
    return 'choice';
  };

  if (done) {
    return (
      <div className="reward">
        <Celebration />
        <h2>{t(lang, 'greatJob')}</h2>
        <p>
          {t(lang, 'youPracticed')} {entries.length} {t(lang, 'wordsWord')} 🌟
        </p>
        {movedUp > 0 && (
          <p>
            {movedUp} {t(lang, 'movedUp')}
          </p>
        )}
        <div className="reward-actions">
          <button className="big-btn" onClick={onExit}>
            {t(lang, 'backToMap')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <p className="instruction">{t(lang, 'practiceInstruction')}</p>
      <div className="prompt">
        {young ? (
          <>
            <span className="prompt-word">{target.english}</span>
            {isSpeechAvailable() && (
              <button className="audio-btn" onClick={() => speak(target.english)}>
                🔊
              </button>
            )}
          </>
        ) : (
          <span className="prompt-emoji">{target.emoji}</span>
        )}
      </div>
      <div className="choices">
        {choices.map((word) => (
          <button key={word.english} className={choiceClass(word)} onClick={() => pick(word)}>
            {young ? (
              <span className="choice-emoji">{word.emoji}</span>
            ) : (
              <span className="prompt-word" style={{ fontSize: '1.4rem' }}>
                {word.english}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="progress-text">
        {round + 1} / {entries.length}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Run the suite**

Run (from `word-islands/`): `npm test`
Expected: PASS (new file, no test changes; confirms it compiles/imports cleanly).

- [ ] **Step 3: Commit**

```bash
git add word-islands/src/components/PracticeSession.jsx
git commit -m "feat(word-islands): add PracticeSession component"
```

---

### Task 6: App integration + word resolution

**Files:**
- Modify: `word-islands/src/content/manifest.js` (word lookup helper)
- Modify: `word-islands/src/App.jsx`

**Interfaces:**
- Consumes: `enterWordsForIsland`, `dueReviews`, `buildSession`, `recordReview`, `todayStr` (Tasks 1–2); `WorldMap` `dueCount`/`onPractice` props (Task 4); `PracticeSession` (Task 5).
- Produces: `wordForKey(path, key)` in manifest.js. Fully wires the practice loop.

This is the integration task. Manual browser verification (Step 4) is done by the controller.

- [ ] **Step 1: Add the word-lookup helper**

Edit `word-islands/src/content/manifest.js`. Append:

```js
// Resolves a review key "<islandId>:<english>" to its word object for the given
// age path, or null if the island/word no longer exists in the content.
export function wordForKey(path, key) {
  const sep = key.indexOf(':');
  if (sep === -1) return null;
  const islandId = key.slice(0, sep);
  const english = key.slice(sep + 1);
  const island = (MANIFEST[path] || []).find((i) => i.id === islandId);
  return island ? island.words.find((w) => w.english === english) || null : null;
}
```

- [ ] **Step 2: Wire App.jsx**

Edit `word-islands/src/App.jsx`. Update imports:

```js
import { useState } from 'react';
import {
  loadState,
  saveState,
  createProfile,
  recordResult,
  deleteProfile,
  enterWordsForIsland,
  dueReviews,
  buildSession,
  recordReview,
  todayStr,
} from './progress.js';
import { playCreatureUnlocked } from './sound.js';
import { t } from './i18n.js';
import { MANIFEST, wordForKey } from './content/manifest.js';
import ProfilePicker from './components/ProfilePicker.jsx';
import WorldMap from './components/WorldMap.jsx';
import Island from './components/Island.jsx';
import StickerBook from './components/StickerBook.jsx';
import PracticeSession from './components/PracticeSession.jsx';
```

Add practice snapshot state next to the existing `useState` hooks:

```js
  const [islandId, setIslandId] = useState(null);
  const [practice, setPractice] = useState(null); // { entries, pool } snapshot | null
```

Add a derived due-count and a start-practice builder after the `island` line (`const island = ...`):

```js
  const dueCount = profile ? dueReviews(profile, todayStr()).length : 0;

  const startPractice = () => {
    const today = todayStr();
    const entries = buildSession(profile, today, 10)
      .map((key) => ({ key, word: wordForKey(profile.path, key), box: profile.reviews[key].box }))
      .filter((e) => e.word);
    const seen = new Set();
    const pool = Object.keys(profile.reviews || {})
      .map((key) => wordForKey(profile.path, key))
      .filter((w) => w && !seen.has(w.english) && seen.add(w.english));
    setPractice({ entries, pool });
    setScreen('practice');
  };
```

Add `dueCount`/`onPractice` to the `WorldMap` usage:

```jsx
          <WorldMap
            profile={profile}
            islands={islands}
            lang={lang}
            dueCount={dueCount}
            onEnter={(id) => {
              setIslandId(id);
              setScreen('island');
            }}
            onStickers={() => setScreen('stickers')}
            onPractice={startPractice}
          />
```

In the `Island` `onComplete`, add the review-entry call (right after the `recordResult` update):

```jsx
            onComplete={(stars, creature) => {
              const newCreature = stars >= 1 && !profile.creatures.includes(creature);
              updateFn((prev) => recordResult(prev, profile.id, island.id, stars, creature));
              updateFn((prev) => enterWordsForIsland(prev, profile.id, island.id, island.words, todayStr()));
              if (newCreature) setTimeout(() => playCreatureUnlocked(soundOn), 550);
              return newCreature;
            }}
```

Add the practice screen block (after the `stickers` block, before `</main>`):

```jsx
        {screen === 'practice' && profile && practice && (
          <PracticeSession
            entries={practice.entries}
            pool={practice.pool}
            lang={lang}
            young={profile.path === '5-7'}
            soundOn={soundOn}
            onAnswer={(key, correct) =>
              updateFn((prev) => recordReview(prev, profile.id, key, correct, todayStr()))
            }
            onExit={() => setScreen('map')}
          />
        )}
```

- [ ] **Step 3: Run the suite**

Run (from `word-islands/`): `npm test`
Expected: PASS.

- [ ] **Step 4: Controller browser verification**

Start the preview (`word-islands-worktree`, port 5199) and verify:

1. Fresh profile: the map shows **"🔁 All caught up! 🌟"** (disabled) — no words due yet.
2. Finish an island → return to map → the button now shows **"🔁 Practice (N)"** with N = that island's word count.
3. Tap Practice → a session runs the quiz mechanic; on the young path the prompt speaks and choices are emoji, on the older path the prompt is emoji and choices are words; **distractors include words from other islands** once more than one island is done.
4. Answer some right and some wrong → finish → the lighter reward shows confetti, "You practiced N words! 🌟", and "M moved up!" when any box increased; only a "Back to the map" button (no stars/creature).
5. Back on the map, the Practice count has **dropped** (words answered right are no longer due today); check `localStorage` `wordIslands` → the active profile's `reviews` shows updated `{ box, due }` values (`javascript_tool`).
6. Cap: seed >10 due words (or finish two islands) → a session presents at most 10.
7. Caught-up: when nothing is due, the button returns to the disabled "All caught up!" state.
8. No console errors; renders correctly at mobile width and in Hebrew/RTL (button label, session, and reward all localized).

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/content/manifest.js word-islands/src/App.jsx
git commit -m "feat(word-islands): wire the Practice review loop into App"
```

---

## Plan self-review notes

- **Spec coverage:** Practice button + count + caught-up state (Task 4), Leitner model/intervals/entry/movement (Tasks 1–2), session cap + ordering + quiz mechanic + cross-island distractors (Tasks 5–6), lighter reward (Task 5), `reviews` data model + backward compat via `createProfile`/`loadState` merge (Task 1), i18n (Task 3), App wiring incl. entry on island completion and live `recordReview` (Task 6) — every spec section maps to a task.
- **Signature refinement (noted to the user):** mutators `enterWordsForIsland`/`recordReview` take `(state, profileId, …)` returning new state, matching `recordResult`; reads `dueReviews`/`buildSession` take `(profile, …)`. This resolves the spec's loose wording consistently with the codebase.
- **Type consistency:** `entries` items are `{ key, word, box }` everywhere (App builds them Task 6, PracticeSession consumes them Task 5). `onAnswer(key, correct)` matches between the two. `wordForKey(path, key)` is defined in Task 6 and used only there. The `reviews` shape `{ [key]: { box, due } }` is identical across Tasks 1, 2, and 6. Interval values match the Global Constraints table.
- **No placeholders:** every step has exact code and file paths.
