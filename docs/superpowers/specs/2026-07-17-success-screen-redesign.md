# Success Screen Redesign

**Status:** approved, ready for planning
**Branch base:** `main`

## Background

The island reward screen (shown after finishing an island's quiz) is
currently minimal and has a readability gap:

```jsx
{phase === 'reward' && (
  <div className="reward">
    <div className="reward-stars">{'⭐'.repeat(stars)}</div>
    <div className="reward-creature">{island.creature}</div>
    <h2>{t(lang, 'greatJob')}</h2>
    <p>{t(lang, 'youEarned')}</p>
    <button className="big-btn" onClick={onExit}>{t(lang, 'backToMap')}</button>
  </div>
)}
```

Problems this redesign addresses:

- **Stars have no context.** `'⭐'.repeat(stars)` renders only the
  earned stars, with no empty slots. A kid who earns 1 star sees a
  single small ⭐ floating alone — no sense of "1 of 3." The world map
  already shows filled + outline stars (`'⭐'.repeat(stars) +
  '☆'.repeat(3 - stars)`); the reward screen should match.
- **No celebration.** The moment a kid finishes an island is the
  game's biggest reward, but it appears statically with only a small
  `pop` scale on the creature. The user asked for confetti, balloons,
  sounds, and animations here.
- **No ongoing goal.** Nothing shows how the sticker-book collection is
  progressing.

## Goals

Make island completion feel celebratory and legible at every score
(1, 2, or 3 stars), using pure CSS/SVG animation and the existing
sound — no new runtime dependency.

## Design

All changes are scoped to the reward phase of `Island.jsx`, a new
`Celebration.jsx` component, `App.jsx` (data threading), and
`styles.css` (animations). Content files, game logic, and the other
mini-games are untouched.

### 1. Star row with context + sequenced pop-in

Always render all 3 star slots. Earned slots are gold ⭐; unearned
slots are dim outline ☆ (matching the world map's convention). The
earned stars animate in one at a time with a bounce (scale from 0 with
overshoot), staggered so star 1 lands at ~0s, star 2 at ~0.13s, star 3
at ~0.26s — the same cadence as the existing `playStars` sound's three
ascending notes, so the audio naturally "ticks" per star with no new
sound code. Outline stars fade in gently underneath.

A 1-star result now reads clearly as "1 of 3" and still lands with a
satisfying bounce instead of appearing as a lone static star.

### 2. Confetti + balloons

New component `src/components/Celebration.jsx`, rendered inside the
reward block. Mirrors the project's zero-dependency, pure-CSS style:

- ~24 confetti pieces — small colored `<span>` rectangles, each with a
  randomized horizontal start position, color (from a small fixed
  palette), rotation, fall duration (~1.8–2.5s), and start delay.
- ~5 balloon emoji (🎈) rising from the bottom, each with randomized
  horizontal position and a gentle sway, fading out near the top.
- All randomization computed once via `useMemo` on mount, so each
  reward screen shows a fresh burst. React remounts the component each
  time the reward phase is entered (including replays), so a fresh
  burst plays every time — consistent with `playStars` already firing
  on every completion.
- The overlay is `pointer-events: none` so it never intercepts taps on
  the buttons underneath. It uses in-flow layout (absolutely positioned
  within the `.reward` container, which is `position: relative`), not
  `position: fixed`.

### 3. Staged creature reveal

The new creature scales/bounces in **after** the stars (a slightly
later animation delay), inside a soft circular "spotlight" badge (a
rounded background circle behind the emoji). When the creature was
newly unlocked this run, a small "New!" tag (localized) appears on the
badge. The reveal sequence reads: stars pop in → creature bounces in →
confetti/balloons throughout.

### 4. Performance-scaled headline

The headline scales with stars, always encouraging, never a failure
state:

- 3 stars → "Perfect!" (new i18n key `perfect`)
- 2 stars → "Great job!" (existing `greatJob`)
- 1 star → "You did it!" (new i18n key `youDidIt`)

The existing `youEarned` subline ("You earned a new friend…") shows
only when a new creature was unlocked this run; on a replay of an
already-collected island, it is hidden (there's no new friend to
announce).

### 5. Collection progress

A small line under the creature showing the sticker-book label followed
by an "N / M" fraction, where N is the profile's collected-creature
count (including the one just earned) and M is the total number of
islands on that age path. The label reuses the existing `stickerBook`
i18n key ("Sticker book" / "אלבום מדבקות"), composed as
`{t(lang,'stickerBook')} {N} / {M}` — a label plus a language-neutral
fraction, so no new sentence-structure key is needed. A thin progress
bar visualizes N / M. This gives an ongoing goal to chase back into the
map.

### 6. Two actions

- Primary: "Back to the map" (existing `backToMap`) — the current
  `big-btn`.
- Secondary: "Play again" (new i18n key `playAgain`) — restarts the
  same island from the beginning (flashcards). Styled as a secondary
  button (less prominent than the primary).

### 7. Sound

Unchanged. `playStars(soundOn)` already fires once when the reward
phase is entered, and `playCreatureUnlocked(soundOn)` already fires
(delayed 550ms to avoid overlapping `playStars`) when a new creature is
unlocked. The star pop-in animations are timed to `playStars`'s three
notes; no new sound functions are added, so the earlier overlap fix
needs no re-tuning.

## Data flow changes

The reward screen needs three facts it doesn't currently have. All are
threaded from `App.jsx`, which already holds `profile` and `islands`:

- **Collection count + total** — `App.jsx` passes
  `collectedCount={profile.creatures.length}` and
  `totalCreatures={islands.length}` as props to `Island`. After
  `onComplete` runs, `App` re-renders `Island` with the updated
  `profile`, so `collectedCount` includes the just-earned creature by
  the time the reward screen renders.
- **Whether this creature was newly unlocked** — `App.jsx`'s
  `onComplete` already computes `newCreature`; it will `return` that
  boolean. `Island`'s quiz `onDone` captures the return value into new
  local state (`isNewCreature`) to drive the "New!" tag and the
  `youEarned` subline.
- **Play again** — handled entirely within `Island` by resetting its
  local `phase` back to `'learn'` and `stars` to `0`. No `App`
  involvement.

## New i18n keys

Added to both `en` and `he` in `i18n.js` (the existing `i18n.test.js`
parity test enforces both languages):

- `perfect` — "Perfect!" / Hebrew equivalent
- `youDidIt` — "You did it!" / Hebrew equivalent
- `playAgain` — "Play again" / Hebrew equivalent
- `newTag` — "New!" / Hebrew equivalent

The collection-progress line reuses the existing `stickerBook` key (see
§5), so no key is added for it.

## Testing

- No new pure-logic functions are introduced that need unit tests — the
  celebration is presentational, and the star/creature/count values all
  come from existing tested logic (`starsForScore`, `recordResult`).
- `i18n.test.js` automatically covers the new keys' EN/HE parity.
- The redesign is verified in the browser (the reliable path for this
  project, per prior sessions): all three scores (1/2/3 stars) show the
  correct filled/outline star split; confetti and balloons render and
  auto-clear; the creature reveal and "New!" tag appear on a first
  unlock and the tag is absent on a replay; collection progress shows
  the right N / M; "Play again" restarts the island; "Back to the map"
  still works; no console errors; and it renders correctly at mobile
  width and in Hebrew/RTL.

## Non-goals

- No confetti/celebration on individual correct answers in the
  mini-games (this redesign is scoped to island completion only).
- No new sound-effect functions (reuse `playStars` /
  `playCreatureUnlocked`).
- No third-party animation or confetti library — pure CSS, consistent
  with the project's zero-runtime-dependency pattern.
- No changes to scoring, unlocking, content, or the other mini-games.
