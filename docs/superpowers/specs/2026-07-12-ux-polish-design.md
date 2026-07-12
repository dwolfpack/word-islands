# UX Polish (Track 2): sound effects + profile deletion

**Status:** approved, ready for planning
**Branch base:** `main` (up to date with PR #13 merged)

## Background

Track 1 (Content) shipped and is live. Track 2 was identified in the
project handoff (`docs/superpowers/HANDOFF.md`) as three rough ideas:
sound effects, profile switching/deletion, and cross-device progress.

This spec covers the first two, scoped down after brainstorming:

- **Sound effects** — the game currently has zero audio besides
  speech-synthesis word pronunciation; right/wrong feedback in all
  three mini-games is silent.
- **Profile deletion** — there is no way to remove a profile today.
  Profile *switching* turns out to already be covered by the existing
  header chip (tap avatar+name → back to picker → tap another
  profile), so no new switching UI is needed.

**Out of scope for this spec:** cross-device progress (deferred —
still an open question whether it's needed at all, and would require
its own architecture discussion: backend, export/import, or accounts).

## 1. Sound effects

### New module: `src/sound.js`

Mirrors the style of `src/speech.js` — a thin, defensive wrapper that
never throws and never blocks gameplay if audio is unavailable.

- Uses the Web Audio API (`AudioContext` + `OscillatorNode`) to
  synthesize short tones. No audio asset files, no licensing to track.
- Exports four play functions, each a no-op if sound is disabled or
  `AudioContext` isn't available:
  - `playCorrect()` — short pleasant chime (e.g. a quick two-note
    up-chirp)
  - `playIncorrect()` — short low buzz/thud
  - `playStars()` — a slightly longer celebratory jingle, played on
    island completion
  - `playCreatureUnlocked()` — a distinct fanfare, played the moment a
    new creature is added to the sticker book
- Exports `isSoundEnabled()` and `setSoundEnabled(bool)`, backed by a
  `soundOn` flag stored on top-level app state (same tier as
  `uiLang`), defaulting to `true`. This is a device-level setting, not
  per-profile.

### Wiring

- `QuickQuiz.jsx`, `TapTheRightOne.jsx`, `MemoryMatch.jsx`: call
  `playCorrect()` / `playIncorrect()` at the same point each already
  sets its right/wrong feedback state (e.g. in `QuickQuiz`'s `pick()`
  function, right where `setAnswered(right ? 'right' : 'wrong')` is
  set).
- Island-complete flow (wherever stars are finalized and `onComplete`
  fires up to `App.jsx`): call `playStars()`.
- `recordResult()` in `progress.js` already computes whether a
  creature was newly earned this call (`stars >= 1 &&
  !p.creatures.includes(creature)`); the caller needs to know this
  happened so it can trigger `playCreatureUnlocked()`. `recordResult`
  will be adjusted to also return whether a new creature was unlocked
  (e.g. by returning `{ state, newCreature: boolean }` instead of just
  `state`), and call sites updated accordingly.

### Header control

- A new 🔊/🔇 chip in `App.jsx`'s header, next to the existing
  language-switcher chip, toggling `soundOn` through the same
  `update()` pattern already used for `uiLang`.
- New i18n strings for the toggle if needed (or icon-only, no text,
  consistent with how the language chip is icon+text but sound could
  be icon-only — decide during implementation based on what fits the
  header visually).

### Testing

- `sound.js` gets unit tests analogous to how `speech.js` /
  `video.js` are tested: verify the play functions no-op safely when
  `AudioContext` is undefined (jsdom has no Web Audio API), and that
  `isSoundEnabled()`/`setSoundEnabled()` round-trip correctly.
- Existing mini-game tests (if any exercise `pick()`/answer flows)
  should keep passing with sound calls added — sound functions must
  not throw in the jsdom test environment.

## 2. Profile deletion

### `progress.js`

New pure function:

```js
export function deleteProfile(state, profileId) {
  return {
    ...state,
    profiles: state.profiles.filter((p) => p.id !== profileId),
    activeProfileId: state.activeProfileId === profileId ? null : state.activeProfileId,
  };
}
```

- Removes the profile from `state.profiles`.
- If the deleted profile was the active one, clears
  `activeProfileId` to `null` — the app already renders the
  `profiles` screen whenever there's no matching active profile
  (`App.jsx`'s `profile` lookup falls back to `null`), so no
  additional screen-routing logic is needed beyond what exists.
- Deleting an unknown/already-gone id is a harmless no-op (filter
  matches nothing, active id comparison fails).

### `ProfilePicker.jsx`

- Each profile card gets a small delete button (🗑️) alongside the
  existing select button, not nested inside it (so tapping delete
  doesn't also trigger select).
- On click: `window.confirm(...)` with a message naming the profile
  and warning the action can't be undone (new `t()` key, EN+HE). On
  confirm, calls a new `onDelete(id)` prop passed down from `App.jsx`.
- If the profile list becomes empty after deletion, the existing
  `creating` state logic (`useState(profiles.length === 0)`) only sets
  the *initial* value — deleting the last profile while the picker is
  already mounted won't auto-flip into the creation form. This is
  acceptable: the picker will show just the "+ new profile" button,
  which the kid/parent can tap. No special-casing needed.

### `App.jsx`

- Passes `onDelete={(id) => updateFn((prev) => deleteProfile(prev, id))}`
  to `ProfilePicker`.

### i18n

- New key (e.g. `confirmDeleteProfile`) added to both `en` and `he`
  entries in `i18n.js`, interpolating the profile name.

### Testing

- `progress.test.js`: new cases for `deleteProfile` — removes the
  target profile, clears `activeProfileId` only when it matched,
  leaves other profiles and state untouched, no-ops on an unknown id.
- No component-level test changes required beyond what the project's
  existing testing patterns already cover for `ProfilePicker`
  (currently none — component tests are not part of this project's
  test suite, per the existing 44-test suite being logic/content
  focused).

## Non-goals

- No quick-switch dropdown from the header chip — the existing
  picker-based flow is sufficient.
- No type-to-confirm deletion — a simple `confirm()` dialog is enough
  friction for a kids' app with no server-side backup to restore from
  anyway.
- No cross-device progress work (separate future spec).
