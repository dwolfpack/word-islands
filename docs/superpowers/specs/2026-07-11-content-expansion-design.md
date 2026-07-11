# Word Islands — Content Expansion (Track 1 of 3: Content)

**Date:** 2026-07-11
**Status:** Approved by Dror
**Repo:** dwolfpack/word-islands (deployed at https://dwolfpack.github.io/word-islands/)

## Context

Word Islands shipped with 6 themed islands (Animals, Colors, Food, Home, Body, Clothes) on two age paths (5–7, 8–10). This is the first of three independent improvement tracks identified after launch (Content, UX, Technical — see chat history; UX and Technical will each get their own spec+plan cycle later). This track covers everything content-shaped: safety net, a tone fix, three new islands, and filling in the funny-video feature that shipped with empty slots.

## Requirements (locked in during brainstorming)

1. **Content-shape regression test** — add automated invariant checks over both `islands57.json` and `islands810.json` before adding more content, so mistakes in new islands are caught immediately rather than discovered by playing the game.
2. **Tone fix** — replace "skull"/💀 in the 8–10 Body Island with a gentler word, same word/creature counts.
3. **Three new islands**: Numbers, Weather, Family. Each gets 8 words (5–7 path) + 10 words (8–10 path), following the existing `{ english, hebrew, emoji }` shape, plus a unique `creature` reward emoji and an `icon` for the map tile.
4. **Funny-video links** for the 18 existing animal words (8 on the 5–7 path, 10 on the 8–10 path) that currently ship with `"video": ""`. Claude web-searches for family-friendly candidates, presents shortlists in chat for Dror to approve/reject/swap (in two batches, one per age path), then commits only approved links.

## Architecture / Approach

No application code changes are required for new islands — `WorldMap.jsx`, `progress.js`'s `isIslandUnlocked`, and the CSS grid (`repeat(auto-fill, minmax(180px, 1fr))`) all iterate over the islands array generically with no hardcoded count. This was verified against the current code before writing this spec. New islands are therefore pure data additions to `src/content/islands57.json` and `src/content/islands810.json`, each requiring:
- A new object appended to both JSON files with a fresh `id`, `icon`, `name.en`/`name.he`, a `creature` emoji not already used by any existing island (in either file), and the appropriate-length `words` array.
- No changes to `manifest.js`, since it already imports the full JSON files.

The content-shape test (`word-islands/src/content/contentShape.test.js`) is a new Vitest suite, following the existing pattern of `gameLogic.test.js`/`progress.test.js` — pure data assertions, no React, no DOM. It imports both JSON files directly and checks:
- Every island in a file has a unique `id`.
- Every island's `words` array has exactly 8 entries (`islands57.json`) or exactly 10 (`islands810.json`).
- Every word has non-empty `english`, `hebrew`, and `emoji` string fields.
- Every `creature` emoji is unique across all islands in both files combined (Sticker Book identity and the unlock/reward system are keyed on creature emoji — a collision would make two islands award the same sticker).

The video-link feature (`videoEmbedUrl` in `src/video.js`) already exists and is fully tested (7 unit tests) — this track only fills in data (the `video` field on 18 word objects), no code changes.

## Content values

**Tone fix (Body Island, 8–10 path):** replace the "skull"/💀/גולגולת entry with "shoulder"/כתף/🤷 (or a comparable neutral body word), keeping its position in the list so word count stays at 10.

**New islands** — Claude drafts word lists (English/Hebrew/emoji, verified for accuracy the same way the original 12 island lists were reviewed) for:
- **Numbers** — counting words (one–eight for 5–7, one–ten for 8–10), icon 🔢, creature 🦔 (hedgehog).
- **Weather** — sun, rain, cloud, wind, snow, etc., icon ☀️, creature 🐨 (koala).
- **Family** — mom, dad, sister, brother, grandma, grandpa, baby, etc., icon 👪, creature 🦭 (seal).

All three creature emoji were checked against every existing island's `creature` field (`🦁 🦜 🐸 🐢 🦉 🐬 🐉 🦚 🦊 🦥 🦖 🧜`) and confirmed unused; the content-shape test enforces this invariant going forward so any future collision fails immediately rather than shipping.

## Video-link workflow

For each of the 18 animal words (in two batches: the 5–7 path's 8 words, then the 8–10 path's 10 words):
1. Claude web-searches for a short, family-friendly video of the animal (funny/cute clips from known kid-safe channels preferred).
2. Claude presents a shortlist (title, URL, one-line description) per word in chat.
3. Dror approves, rejects, or asks for alternatives per word.
4. Once a batch is fully resolved, Claude fills in the approved URLs (or bare video IDs) in the `video` field for that batch and opens one PR for that batch.

This is a two-PR deliverable (one per age path's batch), not one PR per word — 18 individual PRs would be excessive process overhead for a content-only change.

## Testing

- `contentShape.test.js` runs alongside the existing suite (`npm test`) and must pass before and after every content PR in this track.
- No manual browser verification is required for pure content/data PRs (the existing app code already renders arbitrary islands/words correctly, per the architecture note above) — except the tone-fix and new-island PRs should each get one quick manual spot-check in the browser (enter the island, page through flashcards, confirm Hebrew/emoji look right) before merging, since content correctness (accurate translations, sensible emoji) isn't something a unit test can verify.
- The video-link PRs need no browser verification beyond confirming `videoEmbedUrl()` parses the approved URLs correctly (already covered by existing tests) — actually playing embedded videos was already verified working in the original build.

## Out of scope (this track)

- UX changes (sound effects, profile management, cross-device sync) — separate track.
- Technical/infra changes (PR-triggered CI, custom domain) — separate track.
- Video links for any island other than Animals (Numbers/Weather/Family/etc. don't get video slots in this track; that's a future decision if wanted).
