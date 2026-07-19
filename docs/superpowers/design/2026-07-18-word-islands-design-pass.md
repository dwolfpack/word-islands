# Word Islands — Game Design Pass

**Date:** 2026-07-18
**Method:** The CCGS `brainstorm` skill's game-design frameworks (MDA, four
core loops, Self-Determination Theory, pillars/anti-pillars, player types),
applied retrospectively to the existing game to name the design and surface
gaps. Not a plan — a design record. The top opportunity it identifies (a
spaced-repetition review loop) is being taken into the normal
brainstorm → spec → plan → build flow separately.

## Creative brief (inferred)

A warm, low-pressure English-vocabulary game for Hebrew-speaking children
(ages 5–7 and 8–10). Emotional goal: **joyful discovery**, never failure.
Solo-built, buildless web (Vite + React, localStorage, no backend), ~5-minute
sessions. The real "customer" is a **pair** — the child who plays and the
parent who chooses and trusts it.

## MDA (mechanics → dynamics → aesthetics)

- **Mechanics:** listen-flashcard, tap-the-picture, memory-match,
  multiple-choice quiz, star scoring, creature collection.
- **Dynamics:** a *learn → test* escalation inside each island; a
  *collect-them-all* pull from the sticker book; *star-chasing* for mastery.
- **Aesthetics (the feelings actually being sold):** **Discovery** (new
  words/creatures) and **Sensation/Comfort** (cozy, safe pastime), with a
  light dash of **Challenge** (the quiz). Almost no *Fellowship*,
  *Expression*, or *Narrative* — fine, but it marks the ceiling.

## The four core loops

| Loop | What it is today | Health |
|---|---|---|
| **30-sec** (moment) | Tap a card/picture → instant audio + emoji + sound feedback | Strong — forgiving, juicy |
| **5-min** (short) | Clear one of the 4 phases inside an island | Good — the learn→tap→memory→quiz arc gives "one more phase" |
| **Session** (one sitting) | Finish island → reward screen → map → next island | Good — the redesigned reward screen is the payoff |
| **Progression** (days/weeks) | Collect all 9 creatures; 3-star every island | **Weakest link** — once collected and 3-starred, no reason to return |

## Self-Determination Theory (why a kid keeps playing)

- **Autonomy — low.** They pick an island, but the path inside is fixed. No
  choice of *how* to play.
- **Competence — moderate/good.** Stars are a clear mastery signal (now with
  1/2/3 slots + Play-again). But **no adaptive difficulty** — the same word
  set and choice count for a struggling 5-year-old and a sharp one.
- **Relatedness — low.** The creatures are the only "bond." No guide
  character, no parent/sibling co-play, nothing social (appropriately, for
  kids).

## Pillars (proposed — with the tension that makes them useful)

1. **Joyful, never punishing** — always celebrate, always ≥1 star.
   *Test: fail-state vs. always-reward → always-reward.*
2. **Hear it, see it** — every word is audio + emoji + text.
   *Test: text-only vs. multi-sensory → multi-sensory.*
3. **Bite-sized** — something meaningful in ~5 minutes.
   *Test: one long island vs. two short → short.*
4. **Collect and return** — the sticker book is the reason to come back.
   *Test: one-off reward vs. persistent collectible → collectible.*

**Anti-pillars** (scope guards):
- No timers/fail-states on the young path (breaks #1).
- No accounts/social features (breaks #3 + kid privacy).
- Never translate the English vocabulary words (breaks #2's immersion).

## Player types (adapted for a kids' educational game)

- **Primary: Achiever/Collector** — the child chasing stars and creatures
  (Quantic: Completionist).
- **Secondary: Explorer** — new islands, new words.
- **The hidden second player: the parent** — motivation is "*is my kid
  learning, safely, no ads/IAP?*" Currently given nothing to see.
- **Not for:** competitive/multiplayer kids, or 11+ (will feel babyish).

## Biggest design gaps, prioritized

1. **Weak return loop (highest leverage).** Pillar #4 says "collect and
   return," but nothing pulls a kid back once collected. Best fit:
   **spaced-repetition review** — a small daily "words to practice" pull from
   previously-learned islands. Rare feature that simultaneously (a) creates a
   real reason to return daily, (b) *actually improves vocabulary retention*
   — the whole point of the game, and (c) reinforces the existing pillars.
2. **No adaptive difficulty** — missed words never come back; strong kids
   aren't stretched. A light touch (re-ask missed words, or ramp choice
   count) closes the competence gap.
3. **Low autonomy** — a "free play / just flashcards" mode, or letting the
   kid pick the next mini-game, adds meaningful choice cheaply.
4. **The invisible parent** — a simple "learned 24 words this week" view
   serves the real decision-maker and doubles as relatedness/pride.

**Recommendation:** the spaced-repetition review loop (#1) is the single
most valuable next design move — it strengthens the weakest loop *and* the
educational mission at once, and it is Word-Islands-sized.
