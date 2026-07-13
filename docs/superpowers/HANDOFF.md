# Word Islands — Session Handoff

**Last updated:** 2026-07-11 (end of the session that built Track 1: Content)

Read this first in any new session working on Word Islands. It has the
facts a fresh session can't otherwise reconstruct: where things live,
what's done, what's next, and the environment gotchas that cost real
time to discover.

## What this project is

A browser game teaching English vocabulary to Hebrew-speaking kids
(ages 5–7 and 8–10) via themed islands, flashcards, mini-games, stars,
and a creature sticker book. Vite + React + Vitest, no backend,
per-profile progress in `localStorage`.

**Live site:** https://dwolfpack.github.io/word-islands/
**GitHub repo:** https://github.com/dwolfpack/word-islands (public)
**Deploys automatically** via GitHub Actions on every push to `main`
(runs `npm test` then builds and publishes `word-islands/dist`).

## Where the code actually lives on this machine

This project was originally built inside a shared monorepo
(`C:\Users\drorw\Documents\claude_projects`), then extracted into its
own dedicated repo/worktree because **that shared directory has
multiple concurrent Claude Code sessions running in it, switching
branches on each other** (confirmed repeatedly — do not assume you're
the only session touching it).

The dedicated, isolated working copy is:

```
C:\Users\drorw\Documents\word-islands-worktree\
```

This is a **git worktree**, currently on branch `main`. **Always work
from here for Word Islands**, not from the shared `claude_projects`
directory — the worktree is immune to other sessions' branch switches.

### Git remote naming gotcha

Git remotes are stored in the repo's shared config and are **visible
across every worktree of the same repo** — they are not per-worktree.
In this environment, the remote name `origin` is already claimed by
an unrelated project (`geo-kids`) from another concurrent session
sharing the same underlying git plumbing. **Never touch `origin` here.**
The correct remote for Word Islands is:

```
word-islands-origin  ->  https://github.com/dwolfpack/word-islands.git
```

Always `git push word-islands-origin <branch>`, `git fetch
word-islands-origin main`, etc. — never bare `origin`.

### Dev server / preview

`.claude/launch.json` in the **shared** `claude_projects` directory
(not this worktree) has an entry:

```json
{
  "name": "word-islands-worktree",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev", "--prefix", "../word-islands-worktree/word-islands", "--", "--port", "5199", "--strictPort"],
  "port": 5199
}
```

Use `mcp__Claude_Browser__preview_start` with name
`"word-islands-worktree"` to serve this worktree in isolation on port
5199 (chosen to avoid collisions with other projects' dev servers on
that same shared machine — check for port conflicts if 5199 is ever
taken and bump the number in both the `port` field and the `--port`
arg).

## Process being used

Every unit of work goes: **brainstorm → spec → plan → subagent-driven
implementation → small PR per task → merge**. Specs live in
`docs/superpowers/specs/`, plans in `docs/superpowers/plans/`, both
inside this repo now (not the old monorepo location).

- Small PRs, one per plan task, each with its own implementer subagent
  + task reviewer subagent (spec compliance + code quality) before
  merge.
- **Merging a PR always needs the human's explicit go-ahead per PR** —
  an auto-mode safety classifier blocks self-merge without it, even
  when the review passed clean. Ask before merging unless the user has
  pre-authorized a whole batch (e.g. "create small PRs and merge
  them").
- A progress ledger lives at `.superpowers/sdd/progress.md` **inside
  the worktree** — but that path is git-ignored scratch space and does
  **not** survive if the worktree is ever deleted/recreated. This
  handoff doc is the durable record; the ledger is just a same-session
  convenience.

### Environment quirks worth knowing before you hit them again

- The `claude-sonnet-5` safety classifier that gates Agent/Bash calls
  goes temporarily unavailable sometimes (observed multiple times this
  session). It always recovered within a few retries — just retry the
  same call, don't work around it.
- Subagents' own browser-preview tool calls frequently time out or
  misbehave when doing manual UI spot-checks (observed on ~5 separate
  task implementations). When a visual check actually matters (e.g.
  verifying a new interactive feature renders correctly), it's more
  reliable to do it yourself directly with `mcp__Claude_Browser__*`
  tools in the controlling session rather than trust the subagent's
  attempt.
- `gh repo create --source=. --push` (or similar bulk "create+push
  everything in this directory" commands) will get blocked by the auto
  mode safety classifier when run from the shared monorepo directory,
  because it would publish unrelated private projects living alongside
  Word Islands. Always create an **empty** remote repo first (`gh repo
  create <name> --private` or `--public`, no `--source`), add it as a
  distinct remote, and push only the specific branch you intend.

## Status: Track 1 (Content) — ✅ COMPLETE, merged, deployed

Spec: `docs/superpowers/specs/2026-07-11-content-expansion-design.md`
Plan: `docs/superpowers/plans/2026-07-11-content-expansion.md`

All 7 plan tasks + 1 plan-bug fix + 1 post-review fix + 1 final-review
cosmetic fix are merged into `main` (PRs #3 through #12, all merged).
Shipped:

- `contentShape.test.js` — regression suite over both content JSON
  files (unique ids, exact word counts 8/10, non-empty fields, unique
  emoji within each island, unique creature emoji across both files
  combined). 9 tests, part of the 44-test suite (`npm test` from
  `word-islands/`).
- Tone fix: "skull"/💀 → "shoulder"/🤷 in the 8–10 Body island.
- Three new islands, each on both age paths: **Numbers** (🦔/🦫),
  **Weather** (🐨/🦦), **Family** (🦭/🐿️) — 9 islands total per age
  path now (was 6).
- All 18 existing Animal-island words (8 on the 5–7 path, 10 on the
  8–10 path) got a real "funny video" YouTube link, researched by
  Claude and approved by Dror in chat, verified live in the browser on
  both age paths with zero console errors.

Two things worth knowing if you touch this content again:
- Every existing island theme uses a **different creature emoji per
  age-path file** (e.g. `animals` is 🦁 in `islands57.json` and 🐉 in
  `islands810.json`) — I initially missed this pattern when planning
  the three new islands and had to fix it mid-implementation. Don't
  repeat that mistake.
- Video links only exist on the **Animals** island by design — Numbers/
  Weather/Family intentionally don't get a `video` field.

## Status: Track 2 (UX Polish) — ✅ COMPLETE, merged

All 7 plan tasks are merged into `main`. One deliberate deviation from
the original design spec, recorded here so a future session doesn't
"restore" it thinking something was missed: the spec called for
`sound.js` to export `isSoundEnabled()`/`setSoundEnabled()` accessors
and for `progress.js`'s `recordResult` to return `{ state, newCreature
}`. Both were simplified away during implementation — `soundOn` is
read directly from app state (`state.soundOn !== false` in
`App.jsx`), and `newCreature` is computed inline in `App.jsx`'s
`onComplete` callback from the pre-update `profile` snapshot instead
of changing `recordResult`'s return shape. This keeps `recordResult`
backward compatible with its existing tests and avoids extra stateful
accessors; it was reviewed and approved, not an oversight.

## What's next: two more tracks, not yet started

These were identified in conversation but **never brainstormed into a
spec** — that's the next step for each, not skippable given the
project's process.

**Track 2 — UX** (rough ideas from conversation, needs brainstorming):
- Sound effects on correct/incorrect answers (currently only
  speech-synthesis word pronunciation, no game-feel audio)
- Profile switching/deletion without going through the full profile
  picker flow each time; no "delete a profile" option exists at all
  currently
- Cross-device progress: currently `localStorage`-only, so a kid's
  progress doesn't follow them between devices/browsers — open
  question whether this needs solving or is acceptable as-is

**Track 3 — Technical** (rough ideas from conversation, needs
brainstorming):
- No CI check on pull requests before merge — the GitHub Actions
  workflow only runs on push to `main`, so a broken PR could still get
  reviewed-and-merged without its own gate; add a second workflow
  triggered on `pull_request`
- No custom domain — currently `dwolfpack.github.io/word-islands`
- Dev tooling parity — the `.claude/launch.json` entry described above
  already exists; nothing further planned here unless something new
  comes up

To resume: open a session rooted at
`C:\Users\drorw\Documents\word-islands-worktree\`, pick a track, and
start with `superpowers:brainstorming` per the process above.
