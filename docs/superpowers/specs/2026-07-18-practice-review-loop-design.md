# Practice Review Loop (Spaced Repetition)

**Status:** approved, ready for planning
**Branch base:** `main`
**Design origin:** `docs/superpowers/design/2026-07-18-word-islands-design-pass.md`
(top opportunity — strengthens the weak day/week progression loop and the
educational mission at once).

## Goal

Give children a reason to return between islands, and improve real vocabulary
retention, by adding a spaced-repetition **Practice** mode that reviews
previously-learned words on a Leitner schedule.

## Experience

- The world map gains a **"🔁 Practice (N)"** button beside the sticker book,
  where **N = the number of words due today** (total, not capped).
- When **N = 0**, the button shows a calm **"🔁 All caught up! 🌟"** state and
  is disabled — never nagging.
- Tapping starts a short **Practice session** (a mini-quiz over due words) →
  ends on a light celebration summary → returns to the map.
- Words become due **the day a child finishes an island**, so Practice lights
  up immediately after the first island completion.

## Leitner model

Each learned word is tracked per profile as `{ box, due }`:

- `box`: integer 1–5.
- `due`: a local date string `'YYYY-MM-DD'`. A word is **due** when
  `due <= today`.
- Keyed by `"<islandId>:<english>"`. Word display details (emoji, hebrew) are
  resolved from the content manifest at session-build time, so the stored
  review data stays tiny. A key whose word no longer exists in the manifest
  is silently skipped.

**Intervals** (days until next due, by the box a word lands in):

| Box | Interval |
|---|---|
| 1 | +1 day |
| 2 | +2 days |
| 3 | +4 days |
| 4 | +7 days |
| 5 | +14 days (maintenance — recurs, never retires) |

**Entry:** when a child finishes an island's quiz, every word in that island
that is **not already tracked** enters at **Box 1, due today** (immediately
practiceable). Replaying an island does **not** reset already-tracked words.

**Movement:**
- **Answer right:** `box = min(box + 1, 5)`; `due = today + interval[box]`.
  (At Box 5, it stays Box 5 and re-schedules `+14`.)
- **Answer wrong:** `box = 1`; `due = today + 1` (tomorrow).

Day-granularity dates mean a word answered right won't reappear the same day —
preventing cramming after the first pass, while entry-due-today still gives an
immediate first practice.

## Session mechanics

- **Length:** at most **10** due words per session, ordered **lowest box
  first, then most-overdue (earliest `due`) first**. Remaining due words wait
  for the next session.
- **Format:** the existing quiz mechanic — young path (`5-7`) hears the
  English word and taps the matching emoji among 4; older path (`8-10`) sees
  the emoji and taps the matching English word among 4. Right/wrong drives the
  Leitner box movement above.
- **Distractors:** `makeChoices` draws distractors from the **pool of all the
  child's learned words** (across every island they've entered into review),
  not just the current word's island — so review genuinely mixes islands. The
  pool is the set of word objects resolved from the profile's review keys.
- **Sounds:** reuse `playCorrect` / `playIncorrect` per answer, exactly as the
  island quiz does.

## End-of-session reward

Deliberately **lighter** than island completion — practice is its own gentle
reward, and stars/creatures stay exclusive to island mastery:

- Reuse the confetti burst (the `Celebration` component).
- A friendly summary: **"You practiced N words! 🌟"** plus a secondary line
  **"M moved up!"** when M > 0 words were promoted a box this session.
- **No stars, no new creature, no sticker.**
- A single "Back to the map" button.

## Data flow & architecture

- **Pure logic in `progress.js`** (unit-tested, matching the repo's pattern):
  - `enterWordsForIsland(profile, islandId, words, today)` → returns a new
    profile with any not-yet-tracked island words added at Box 1, due `today`.
  - `dueReviews(profile, today)` → array of due review keys (for the count and
    session build).
  - `buildSession(profile, today, cap = 10)` → ordered, capped array of due
    keys (lowest box, then earliest due).
  - `recordReview(profile, key, correct, today)` → returns a new profile with
    that key's `{ box, due }` updated per the movement rules.
  - `today` is injected (a `'YYYY-MM-DD'` string) so the logic is deterministic
    and testable; the app supplies the real local date.
- **`reviews` on the profile:** a map `{ "<islandId>:<english>": { box, due } }`,
  added to `defaultState`/`createProfile` as `reviews: {}`. `loadState`'s
  existing default-merge makes pre-existing saved profiles load with
  `reviews: {}` — backward compatible.
- **`App.jsx`:** a new `'practice'` screen value; the world map's `onPractice`
  handler switches to it. `Island`'s `onComplete` (in `App.jsx`) additionally
  calls `enterWordsForIsland` for the finished island. The map button's count
  comes from `dueReviews(profile, today).length`.
- **`WorldMap.jsx`:** renders the Practice button (with count / caught-up
  state) alongside the sticker-book button.
- **New `PracticeSession.jsx`:** modeled on `QuickQuiz.jsx` — reuses
  `makeChoices`, `speak`, `isSpeechAvailable`, `playCorrect`/`playIncorrect`,
  and the young/old prompt rendering. `App.jsx` builds and passes in the
  ordered **due-word entries** (each `{ key, word, box }`, where `word` is the
  resolved content object and `box` is the current box) plus the resolved
  **distractor pool**. Per answer it calls an `onAnswer(key, correct)` prop
  that `App.jsx` wires to `updateFn((prev) => recordReview(prev, key, correct,
  today))` (mirroring `recordResult`). The component computes the **"moved up"**
  count itself: increment when an answer is right **and** that entry's starting
  `box < 5` (a Box-5 correct answer doesn't move up). On completion it shows
  the lighter reward (reusing `Celebration`).
- No backend, no new runtime dependency, localStorage as today.

## i18n

New keys (both `en` and `he`, enforced by `i18n.test.js`):

- `practice` — "Practice"
- `allCaughtUp` — "All caught up!"
- `practiceSummary` — "You practiced" (composed with the count in the
  component, mirroring how the reward progress line composes `stickerBook`)
- `wordsWord` — "words" (for the summary count phrase)
- `movedUp` — "moved up!"
- `practiceInstruction` — the session's instruction line (parallel to
  `quizInstruction`)

## Testing

- **Unit tests** (`progress.test.js`) for every pure function, with an injected
  `today`:
  - `enterWordsForIsland`: adds untracked words at Box 1/due-today; does not
    reset already-tracked words; does not touch other profiles.
  - `dueReviews`: returns only words with `due <= today`; excludes
    future-scheduled words; empty when none tracked.
  - `buildSession`: caps at 10; orders lowest-box-then-earliest-due; returns
    all when fewer than the cap are due.
  - `recordReview`: right promotes and re-schedules by the new box's interval;
    Box 5 right stays Box 5 at +14; wrong resets to Box 1 at +1; leaves other
    words untouched.
- **Browser verification** (the reliable path for this repo, done by the
  controller): finishing an island makes the Practice count appear; a session
  presents due words with cross-island distractors; right/wrong answers move
  boxes and change the count; the cap holds when >10 are due; the caught-up
  state shows when nothing is due; the lighter reward shows the right counts;
  and it renders correctly at mobile width and in Hebrew/RTL.

## Non-goals

- No adaptive difficulty within a session (separate design-pass opportunity).
- No parent dashboard / learning report (separate opportunity).
- No new mini-game formats for practice — reuse the quiz mechanic only.
- No stars, creatures, or unlocking tied to practice.
- No cross-device sync — still localStorage per device (unchanged, still
  deferred).
- No time-of-day scheduling or push reminders — day-granularity only,
  child-initiated.
