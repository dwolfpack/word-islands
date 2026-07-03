# Word Islands — English Vocabulary Adventure for Kids

**Date:** 2026-07-03
**Status:** Approved by Dror
**Audience:** Kids learning English as a second language (Hebrew speakers), two paths: ages 5–7 and ages 8–10

## Purpose

A fun, browser-based game that teaches English vocabulary through an adventure world map. Kids learn themed word sets with picture flashcards and spoken audio, then play games to earn stars, unlock islands, and collect creatures.

## Requirements (locked in during brainstorming)

- **Two learning paths:** ages 5–7 (early readers — pictures + audio, minimal reading) and ages 8–10 (written words included, faster games).
- **Focus:** vocabulary only (no grammar, spelling, or writing exercises).
- **Platform:** web app, runs in any modern browser (desktop and tablet).
- **Fun mechanics:** matching/flashcard games, quiz-adventure map progression, rewards & creature collection.
- **Languages:** EN/HE toggle for all UI text and instructions, with RTL layout in Hebrew. English vocabulary words are always displayed and spoken in English.
- **Profiles:** local per-kid profiles (name + avatar) stored in localStorage. No accounts, no backend, no sync.

## Concept & Flow

1. **Profile picker** — kid picks (or creates) their profile: name + avatar. Progress is per-profile.
2. **Path selection** — profile is tied to a path (5–7 or 8–10), chosen at profile creation (parent-assisted).
3. **World map** — a map of 6 themed islands per path. Islands unlock sequentially by earning stars.
4. **Island flow:**
   - **Learn** — flashcards for the island's word set (~8 words for 5–7, ~10 for 8–10). Each card: big emoji picture, English word, tap to hear it spoken. Hebrew translation shown when UI language is Hebrew.
   - **Games** — play games with those words to earn up to 3 stars per island.
   - **Reward** — completing an island (earning stars) adds a collectible creature to the kid's sticker book.
5. **Sticker book** — collection page showing earned creatures; the return-visit motivator.

## Games

| Game | Ages 5–7 | Ages 8–10 |
|------|----------|-----------|
| Tap the Right One | Hear a word, tap the matching picture (3 choices) | See/hear a word, tap the matching picture (4 choices) |
| Memory Match | Flip cards: picture ↔ picture (audio plays on flip) | Flip cards: picture ↔ written word |
| Quick Quiz (star finale) | Picture-choice questions, no timer | Written-word choices, gentle timer |

Star rules: Quick Quiz score determines 1–3 stars. Unlocking the next island requires ≥2 stars on the previous one. Islands can be replayed to improve stars.

## Island Themes (initial content)

Both paths: Animals, Colors, Food, My Home, Body, Clothes. The 8–10 path uses larger, harder word sets within the same themes (content is data-driven, so themes can diverge later).

## Architecture

- **Stack:** Vite + React, plain CSS (kid-friendly large touch targets). No backend.
- **Project location:** new top-level directory `word-islands/` in the claude_projects repo.
- **Content as data:** word lists in JSON files under `src/content/` — one file per island per path. Each entry: `{ english, hebrew, emoji }`. Island metadata (id, theme name EN/HE, creature reward emoji, word file) in a manifest. Adding content requires no code changes.
- **Audio:** Web Speech API (`speechSynthesis`) with an English voice. If no English voice is available, audio buttons are hidden and the experience remains fully usable visually.
- **i18n:** small dictionary object for UI strings (EN/HE); `dir="rtl"` applied when Hebrew is active. No i18n library needed at this scale.
- **State/persistence:** React state + a small progress module that reads/writes localStorage. Schema: `{ profiles: [{ id, name, avatar, path, islands: { [islandId]: { stars } }, creatures: [] }], activeProfileId, uiLang }`. Corrupt/missing data falls back to a fresh state without crashing.

### Component map

- `App` — routing between screens, language context
- `ProfilePicker` — create/select profiles
- `WorldMap` — islands, lock/unlock state, sticker-book entry point
- `Island` — orchestrates Learn → Games → Reward sequence
- `Flashcards`, `TapTheRightOne`, `MemoryMatch`, `QuickQuiz` — game components, each receiving a word set + difficulty config
- `StickerBook` — creature collection
- `progress.js` — pure logic: star scoring, unlock rules, profile persistence (unit-testable, no React)
- `speech.js` — TTS wrapper with voice detection and graceful fallback

## Error handling

- TTS unavailable → hide audio buttons, games still playable.
- localStorage unavailable/corrupt → start fresh session state, show no error to the kid.
- No answer-blocking failure states: wrong answers get friendly retry feedback, never a dead end.

## Testing

- **Vitest** unit tests for `progress.js` (star scoring, unlock rules, save/load round-trip, corrupt-data fallback) and game logic helpers (answer shuffling, pair generation).
- Manual browser verification of the full flow in both languages and both paths.

## Funny videos (added 2026-07-03 during implementation)

Any word may carry an optional `video` field (YouTube URL or bare video id). When present, its flashcard shows a "Funny video!" button that opens the video in an overlay using a privacy-friendly `youtube-nocookie` embed. Animal words on both paths ship with empty `video` slots for Dror to fill with vetted links; empty or unrecognized values show no button. Parsing lives in `src/video.js` (unit-tested).

## Out of scope (YAGNI)

- Accounts / cross-device sync
- Spelling, writing, grammar, or speaking (mic) exercises
- Custom illustrations or recorded audio
- Mobile app packaging
