# 🏝️ Word Islands

A browser game that teaches English vocabulary to Hebrew-speaking kids
(ages 5–7 and 8–10) through themed islands, flashcards, mini-games,
stars, and a creature sticker book.

## Run

    npm install
    npm run dev

## Test

    npm test

## Adding vocabulary

Edit `src/content/islands57.json` (ages 5–7, 8 words per island) or
`src/content/islands810.json` (ages 8–10, 10 words per island).
Each word is `{ "english": "...", "hebrew": "...", "emoji": "..." }`.
New islands need `id`, `icon`, `name` (en/he), a unique `creature`
emoji, and a `words` array — no code changes required.

Any word may also carry an optional `"video"` field (a YouTube URL or
bare video id). When set, its flashcard shows a "Funny video!" button
that opens the clip in an embedded overlay. Leave it as `""` to hide
the button. Animal words on both age paths already have empty `video`
slots ready to fill in.

Design spec: `docs/superpowers/specs/2026-07-03-word-islands-design.md`
