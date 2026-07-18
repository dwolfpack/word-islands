# Success Screen Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the island reward screen with confetti/balloons, 3-star context slots with sequenced pop-in, a staged creature reveal with a "New!" tag, a performance-scaled headline, collection progress, and a "Play again" button.

**Architecture:** All work is scoped to the island reward phase. A new presentational `Celebration.jsx` renders a pure-CSS confetti + balloon burst. `Island.jsx`'s reward block is progressively enhanced. `App.jsx` threads two counts down and returns the newly-unlocked flag from its existing `onComplete`. Sounds are unchanged — the existing `playStars` chime's three notes provide the per-star "tick", so the star pop-in is timed to match it.

**Tech Stack:** React 18, Vite, Vitest (default `node` env — no jsdom, no component-render tests, matching this repo's existing suite).

## Global Constraints

- Pure CSS animation only — no new runtime dependency, no animation/confetti library (spec, non-goals).
- No new sound functions — reuse the existing `playStars(soundOn)` and `playCreatureUnlocked(soundOn)` (spec §7). Star pop-in stagger is 0.13s to match `playStars`'s three notes at 0 / 0.13 / 0.26s.
- The confetti/balloon overlay must be `pointer-events: none` and must NOT use `position: fixed` — it is absolutely positioned inside `.reward`, which becomes `position: relative` (spec §2).
- Every English i18n key added needs a Hebrew counterpart — enforced by the existing `i18n.test.js` parity test.
- Show all 3 star slots always: earned = `⭐`, unearned = `☆` dim, matching the world map's filled+outline convention (spec §1).
- Headline scales with stars and is never a failure state: 3→`perfect`, 2→`greatJob`, 1→`youDidIt` (spec §4).
- The `youEarned` subline and the "New!" tag appear only when a creature was newly unlocked this run (spec §3, §4).
- Scope is the reward screen only — no changes to scoring, unlocking, content, or the other mini-games (spec, non-goals).
- Follow existing code style: components take plain props (no context/redux); CSS additions are additive and use the existing `--accent`/`--green`/`--card`/`--text` variables.
- This repo has no component-render test setup; presentational tasks are verified in the browser, not by unit tests. `npm test` (run from `word-islands/`) must stay green after every task.

---

### Task 1: New i18n strings

**Files:**
- Modify: `word-islands/src/i18n.js`

**Interfaces:**
- Produces: `t(lang, 'perfect')`, `t(lang, 'youDidIt')`, `t(lang, 'playAgain')`, `t(lang, 'newTag')` — consumed by Task 4.

- [ ] **Step 1: Add the strings**

Edit `word-islands/src/i18n.js`. In the `en` block, add after `youEarned: 'You earned a new friend for your sticker book!',`:

```js
    youEarned: 'You earned a new friend for your sticker book!',
    perfect: 'Perfect!',
    youDidIt: 'You did it!',
    playAgain: 'Play again',
    newTag: 'New!',
```

In the `he` block, add after `youEarned: 'הרווחתם חבר חדש לאלבום המדבקות!',`:

```js
    youEarned: 'הרווחתם חבר חדש לאלבום המדבקות!',
    perfect: 'מושלם!',
    youDidIt: 'הצלחתם!',
    playAgain: 'לשחק שוב',
    newTag: 'חדש!',
```

- [ ] **Step 2: Run tests to verify parity**

Run (from `word-islands/`): `npm test`
Expected: PASS — `i18n.test.js`'s "has a Hebrew translation for every English key" test confirms all four new keys exist in both languages.

- [ ] **Step 3: Commit**

```bash
git add word-islands/src/i18n.js
git commit -m "content(word-islands): add success-screen strings (perfect, youDidIt, playAgain, newTag)"
```

---

### Task 2: Celebration component (confetti + balloons)

**Files:**
- Create: `word-islands/src/components/Celebration.jsx`
- Modify: `word-islands/src/components/Island.jsx` (import + render inside the reward block)
- Modify: `word-islands/src/styles.css` (reward container + celebration animations)

**Interfaces:**
- Produces: `Celebration` — a default-exported component taking no props, rendering a `pointer-events: none` overlay of confetti pieces and balloons. Consumed (rendered) in `Island.jsx`'s reward block.

No unit test — this project has no component-render test setup; verified in the browser during the Task 4 integration check and by the controller. `npm test` in Step 4 only confirms nothing else broke.

- [ ] **Step 1: Create the component**

Create `word-islands/src/components/Celebration.jsx`:

```jsx
import { useMemo } from 'react';

const CONFETTI_COLORS = ['#ff8a3d', '#4caf50', '#ef5350', '#42a5f5', '#ffca28', '#ab47bc'];

// A pure-CSS burst: falling confetti pieces + a few rising balloons.
// pointer-events:none so it never blocks the buttons underneath. All
// randomness is fixed once on mount, so each reward screen is a fresh burst.
export default function Celebration() {
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 0.7,
        rotate: Math.floor(Math.random() * 360),
      })),
    []
  );
  const balloons = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        left: 5 + Math.random() * 90,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 0.8,
      })),
    []
  );

  return (
    <div className="celebration" aria-hidden="true">
      {confetti.map((c, i) => (
        <span
          key={`c${i}`}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            '--r': `${c.rotate}deg`,
          }}
        />
      ))}
      {balloons.map((b, i) => (
        <span
          key={`b${i}`}
          className="balloon"
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          🎈
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Render it in the reward block**

Edit `word-islands/src/components/Island.jsx`. Add the import after the existing component imports (after `import QuickQuiz from './QuickQuiz.jsx';`):

```js
import Celebration from './Celebration.jsx';
```

In the reward block, add `<Celebration />` as the first child of the `.reward` div:

```jsx
      {phase === 'reward' && (
        <div className="reward">
          <Celebration />
          <div className="reward-stars">{'⭐'.repeat(stars)}</div>
```

(Leave the rest of the reward block unchanged for now — later tasks refine it.)

- [ ] **Step 3: Add the CSS**

Edit `word-islands/src/styles.css`. Replace the `.reward { text-align: center; padding-top: 30px; }` line (in the `/* Reward */` section) with:

```css
.reward { text-align: center; padding-top: 30px; position: relative; overflow: hidden; }
.celebration { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.confetti-piece {
  position: absolute; top: -20px; width: 10px; height: 14px; border-radius: 2px;
  animation-name: confetti-fall; animation-timing-function: ease-in; animation-fill-mode: forwards;
}
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(var(--r, 0deg)); opacity: 1; }
  100% { transform: translateY(380px) rotate(calc(var(--r, 0deg) + 540deg)); opacity: 0; }
}
.balloon {
  position: absolute; bottom: -40px; font-size: 2.4rem; opacity: 0;
  animation-name: balloon-rise; animation-timing-function: ease-out; animation-fill-mode: forwards;
}
@keyframes balloon-rise {
  0% { transform: translateY(0); opacity: 0; }
  15% { opacity: 1; }
  100% { transform: translateY(-380px); opacity: 0; }
}
```

- [ ] **Step 4: Run the suite**

Run (from `word-islands/`): `npm test`
Expected: PASS — no test file changed; confirms nothing else broke.

- [ ] **Step 5: Commit**

```bash
git add word-islands/src/components/Celebration.jsx word-islands/src/components/Island.jsx word-islands/src/styles.css
git commit -m "feat(word-islands): add confetti + balloon celebration to the reward screen"
```

---

### Task 3: Star row with context + sequenced pop-in

**Files:**
- Modify: `word-islands/src/components/Island.jsx` (reward-stars render)
- Modify: `word-islands/src/styles.css` (`.reward-stars` + star animation)

**Interfaces:**
- Consumes: the local `stars` state already present in `Island` (0–3).
- Produces: nothing new for later tasks — a self-contained visual change.

No unit test (presentational, no component-render setup). Verified in-browser at Task 4.

- [ ] **Step 1: Change the star render**

Edit `word-islands/src/components/Island.jsx`. Replace this line in the reward block:

```jsx
          <div className="reward-stars">{'⭐'.repeat(stars)}</div>
```

with a 3-slot row (earned = filled ⭐ with a staggered pop, unearned = dim ☆):

```jsx
          <div className="reward-stars">
            {[0, 1, 2].map((i) =>
              i < stars ? (
                <span key={i} className="reward-star filled" style={{ '--d': `${i * 0.13}s` }}>
                  ⭐
                </span>
              ) : (
                <span key={i} className="reward-star empty">
                  ☆
                </span>
              )
            )}
          </div>
```

- [ ] **Step 2: Update the CSS**

Edit `word-islands/src/styles.css`. Replace the existing line:

```css
.reward-stars { font-size: 3rem; letter-spacing: 8px; }
```

with:

```css
.reward-stars { display: flex; justify-content: center; gap: 10px; font-size: 3rem; }
.reward-star.empty { opacity: 0.35; }
.reward-star.filled { display: inline-block; animation: star-pop 0.5s var(--d, 0s) both; }
@keyframes star-pop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```

- [ ] **Step 3: Run the suite**

Run (from `word-islands/`): `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add word-islands/src/components/Island.jsx word-islands/src/styles.css
git commit -m "feat(word-islands): show all 3 star slots with sequenced pop-in on the reward screen"
```

---

### Task 4: Reward content + data threading (creature reveal, headline, progress, Play again)

**Files:**
- Modify: `word-islands/src/App.jsx` (return newCreature; pass collectedCount + totalCreatures)
- Modify: `word-islands/src/components/Island.jsx` (props, isNewCreature state, Play again, reward content)
- Modify: `word-islands/src/styles.css` (creature badge, New tag, progress bar, actions)

**Interfaces:**
- Consumes: `t(lang, 'perfect')`, `t(lang, 'youDidIt')`, `t(lang, 'playAgain')`, `t(lang, 'newTag')` (Task 1); `Celebration` (Task 2); the star row (Task 3).
- Produces: `Island` now accepts `collectedCount` and `totalCreatures` props; `App`'s `onComplete` prop now returns a `newCreature` boolean.

This is the integration task. Manual browser verification (Step 5) is required and is done by the controller, not the implementer subagent (subagent browser checks are unreliable in this repo).

- [ ] **Step 1: App.jsx — return newCreature and pass the counts**

Edit `word-islands/src/App.jsx`. Replace the `Island` usage (the `{screen === 'island' && ...}` block) with:

```jsx
        {screen === 'island' && island && profile && (
          <Island
            island={island}
            path={profile.path}
            lang={lang}
            soundOn={soundOn}
            collectedCount={profile.creatures.length}
            totalCreatures={islands.length}
            onComplete={(stars, creature) => {
              const newCreature = stars >= 1 && !profile.creatures.includes(creature);
              updateFn((prev) => recordResult(prev, profile.id, island.id, stars, creature));
              if (newCreature) setTimeout(() => playCreatureUnlocked(soundOn), 550);
              return newCreature;
            }}
            onExit={() => setScreen('map')}
          />
        )}
```

(The only changes vs. current: two new props `collectedCount`/`totalCreatures`, and `return newCreature;` at the end of `onComplete`. The `newCreature` computation and delayed `playCreatureUnlocked` are unchanged.)

- [ ] **Step 2: Island.jsx — accept props, capture isNewCreature, add Play again**

Edit `word-islands/src/components/Island.jsx`. Change the signature:

```jsx
export default function Island({
  island,
  path,
  lang,
  soundOn,
  collectedCount,
  totalCreatures,
  onComplete,
  onExit,
}) {
```

Add `isNewCreature` state next to the existing state (after `const [stars, setStars] = useState(0);`):

```jsx
  const [isNewCreature, setIsNewCreature] = useState(false);
```

Add a Play again handler after the `young` line (`const young = path === '5-7';`):

```jsx
  const playAgain = () => {
    setStars(0);
    setIsNewCreature(false);
    setPhase('learn');
  };
```

Update the quiz `onDone` to capture the returned flag:

```jsx
          onDone={(correct, total) => {
            const earned = starsForScore(correct, total);
            setStars(earned);
            playStars(soundOn);
            const isNew = onComplete(earned, island.creature);
            setIsNewCreature(Boolean(isNew));
            setPhase('reward');
          }}
```

- [ ] **Step 3: Island.jsx — rebuild the reward block content**

Replace the reward block's contents (everything inside `{phase === 'reward' && (...)}`) with the following. `Celebration` and the star row from Tasks 2–3 stay; the creature, headline, subline, progress, and actions are new:

```jsx
      {phase === 'reward' && (
        <div className="reward">
          <Celebration />
          <div className="reward-stars">
            {[0, 1, 2].map((i) =>
              i < stars ? (
                <span key={i} className="reward-star filled" style={{ '--d': `${i * 0.13}s` }}>
                  ⭐
                </span>
              ) : (
                <span key={i} className="reward-star empty">
                  ☆
                </span>
              )
            )}
          </div>
          <div className="reward-creature-badge">
            <span className="reward-creature">{island.creature}</span>
            {isNewCreature && <span className="new-tag">{t(lang, 'newTag')}</span>}
          </div>
          <h2>{stars === 3 ? t(lang, 'perfect') : stars === 2 ? t(lang, 'greatJob') : t(lang, 'youDidIt')}</h2>
          {isNewCreature && <p>{t(lang, 'youEarned')}</p>}
          <div className="reward-progress">
            <span className="reward-progress-label">
              {t(lang, 'stickerBook')} {collectedCount} / {totalCreatures}
            </span>
            <div className="reward-progress-bar">
              <div
                className="reward-progress-fill"
                style={{ width: `${totalCreatures ? (collectedCount / totalCreatures) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="reward-actions">
            <button className="big-btn" onClick={onExit}>
              {t(lang, 'backToMap')}
            </button>
            <button className="secondary-btn" onClick={playAgain}>
              {t(lang, 'playAgain')}
            </button>
          </div>
        </div>
      )}
```

- [ ] **Step 4: styles.css — creature badge, New tag, progress, actions**

Edit `word-islands/src/styles.css`. Replace these two existing lines in the `/* Reward */` section:

```css
.reward-creature { font-size: 7rem; margin: 18px 0; animation: pop 0.6s; }
```
and
```css
.reward .big-btn { margin-top: 20px; }
```

with:

```css
.reward-creature-badge {
  position: relative; display: inline-flex; align-items: center; justify-content: center;
  width: 160px; height: 160px; margin: 18px auto; background: var(--card);
  border-radius: 50%; box-shadow: 0 4px 0 rgba(0, 0, 0, 0.1);
}
.reward-creature { font-size: 6rem; animation: pop 0.6s 0.4s both; }
.new-tag {
  position: absolute; top: -6px; inset-inline-end: -6px; background: var(--accent);
  color: #fff; font-size: 0.9rem; font-weight: bold; padding: 4px 10px; border-radius: 999px;
}
.reward-progress { margin: 16px auto 0; width: min(300px, 80vw); }
.reward-progress-label { font-size: 1rem; color: var(--text); }
.reward-progress-bar {
  height: 10px; background: #fff; border-radius: 5px; overflow: hidden; margin-top: 6px;
}
.reward-progress-fill { height: 100%; background: var(--green); transition: width 0.6s ease; }
.reward-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 22px; }
.secondary-btn { background: var(--card); color: var(--text); }
```

(The existing `@keyframes pop` stays — `.reward-creature` now reuses it with a 0.4s delay so the creature lands after the stars.)

- [ ] **Step 5: Run the suite, then verify in the browser**

Run (from `word-islands/`): `npm test`
Expected: PASS.

Then the controller verifies in the browser (preview name `word-islands-worktree`, port 5199):

1. Complete an island perfectly → reward shows ⭐⭐⭐ (all filled, popping in staggered), creature in its circular badge with a "New!" tag, headline "Perfect!", the "You earned a new friend…" subline, confetti + balloons animating, progress bar advanced, and both buttons.
2. Complete an island with a wrong answer or two → 2 stars show 2 filled + 1 outline, headline "Great job!". An all-wrong run → 1 filled + 2 outline, headline "You did it!".
3. Replay an already-completed island (via "Play again" or re-entering) → no "New!" tag and no "You earned…" subline (creature already collected), but stars/headline/confetti still show.
4. "Play again" restarts the island from the flashcards phase.
5. "Back to the map" still returns to the map; the map tile reflects the earned stars.
6. Check `read_console_messages` for errors (expect none), and confirm the confetti overlay does not block the buttons (they remain clickable).
7. Resize to mobile width and switch to Hebrew (RTL) → layout holds, the "New!" tag sits on the correct side, no horizontal overflow.

- [ ] **Step 6: Commit**

```bash
git add word-islands/src/App.jsx word-islands/src/components/Island.jsx word-islands/src/styles.css
git commit -m "feat(word-islands): staged creature reveal, scaled headline, collection progress, and Play again on the reward screen"
```

---

## Plan self-review notes

- **Spec coverage:** star row + pop-in (Task 3, timed to `playStars` per Global Constraints), confetti + balloons (Task 2), staged creature reveal + New tag (Task 4), performance-scaled headline (Task 4), collection progress reusing `stickerBook` (Task 4), Play again (Task 4), sound unchanged (no task touches `sound.js`), data threading — collectedCount/totalCreatures props + onComplete returning newCreature (Tasks 4/1) — every spec section maps to a task.
- **Type consistency:** `collectedCount` and `totalCreatures` are used with identical names in `App.jsx` (Task 4 Step 1) and `Island.jsx`'s signature + reward block (Task 4 Steps 2–3). `onComplete` returns a boolean captured as `isNew` → `setIsNewCreature`. The four i18n keys (`perfect`, `youDidIt`, `playAgain`, `newTag`) added in Task 1 are exactly those consumed in Task 4. The `--d`/`--r` CSS custom properties set inline match those read in the `star-pop`/`confetti-fall` keyframes.
- **No placeholders:** every step contains the exact code and file location.
