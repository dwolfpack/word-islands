# Module 1 Content Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce the complete, validated content of Module 1 ("Your First AI Conversations") in both English and Hebrew, stored as structured markdown that a future website can ingest without further transformation.

**Architecture:** Content lives in a flat `content/` tree organized by module → language → session. Each session is a markdown file with YAML frontmatter declaring metadata (title, duration, default mode, glossary terms). A zero-dependency Node.js validator script enforces frontmatter schema, required section structure, and EN↔HE parity. The validator is authored before content, giving us a pass/fail gate per session.

**Tech Stack:** Plain Markdown + YAML frontmatter. Node.js 18+ (for the validator — uses only built-in `fs` and `path`). Git for version control.

**Scope:** Module 1 only. The website implementation, the auth system, the in-page chat widget, and Modules 2–5 are **out of scope** and covered by future specs/plans. This plan's deliverable is authored content + validator + schema doc, ready to be consumed by a future site build.

---

## File Structure

```
content/
  glossary/
    en.md
    he.md
  modules/
    01-first-conversations/
      en/
        module.md            # module overview + Go Deeper panel
        01-meet-ai.md
        02-first-task.md
        03-confidently-wrong.md
        04-safety-privacy.md
        05-recap-challenge.md
      he/
        module.md
        01-meet-ai.md
        02-first-task.md
        03-confidently-wrong.md
        04-safety-privacy.md
        05-recap-challenge.md
scripts/
  validate-content.mjs       # zero-dep validator
docs/
  content-schema.md          # human-readable schema reference
```

**Responsibility of each file type:**
- `module.md` — module-level frontmatter (module number, title, summary) + markdown body containing the module intro blurb and the Go Deeper YouTube panel.
- `NN-<slug>.md` — one session. Frontmatter: module, session, slug, title, duration_min, default_mode (A/B/C), lang, glossary_terms, prereq_sessions. Body: five required sections in order — `## Hook`, `## Core idea`, `## Show me`, `## Your turn`, `## Wrap-up`.
- `glossary/<lang>.md` — flat list of glossary entries, one per H2 heading, each with a one-line definition.
- `scripts/validate-content.mjs` — validator CLI; exits 0 on pass, 1 with a list of problems on fail.
- `docs/content-schema.md` — written reference for anyone authoring new content.

---

## Task 1: Initialize repo, directory skeleton, and git

**Files:**
- Create: `.gitignore`
- Create: directory skeleton above (with `.gitkeep` placeholders where needed)

- [ ] **Step 1: Initialize git repository**

Run from `C:/Users/drorw/Documents/claude_projects`:

```bash
git init
git config user.name "Dror Wolf"
git config user.email "dror.wolf@gmail.com"
```

Expected: `Initialized empty Git repository in .../.git/`

- [ ] **Step 2: Create `.gitignore`**

Create `.gitignore` with:

```
node_modules/
.DS_Store
Thumbs.db
*.log
.idea/
.vscode/
```

- [ ] **Step 3: Create directory skeleton**

Run:

```bash
mkdir -p content/glossary
mkdir -p content/modules/01-first-conversations/en
mkdir -p content/modules/01-first-conversations/he
mkdir -p scripts
mkdir -p docs
```

- [ ] **Step 4: Add `.gitkeep` to empty directories and commit**

```bash
touch content/glossary/.gitkeep
touch content/modules/01-first-conversations/en/.gitkeep
touch content/modules/01-first-conversations/he/.gitkeep
touch scripts/.gitkeep
git add .gitignore content/ scripts/ docs/
git commit -m "chore: initialize repo skeleton for AI curriculum content"
```

Expected: one commit created, showing the skeleton.

---

## Task 2: Write content schema reference

**Files:**
- Create: `docs/content-schema.md`

- [ ] **Step 1: Write the schema doc**

Create `docs/content-schema.md` with exactly this content:

```markdown
# Content Schema Reference

All session content is markdown with YAML frontmatter. The validator (`scripts/validate-content.mjs`) enforces this schema.

## Session File Schema

**Path pattern:** `content/modules/<NN-module-slug>/<lang>/<NN-session-slug>.md`

**Required frontmatter fields:**

| Field | Type | Notes |
|---|---|---|
| `module` | integer | 1–99 |
| `session` | integer | 1–99 within the module |
| `slug` | string | lowercase kebab-case, matches filename without `NN-` prefix and `.md` |
| `title` | string | display title in the session's language |
| `duration_min` | integer | 5–20 |
| `default_mode` | string | One of `A`, `B`, `C` |
| `lang` | string | One of `en`, `he` |
| `glossary_terms` | list of strings | Each must exist in `content/glossary/<lang>.md` as an H2 heading |
| `prereq_sessions` | list of strings | Session slugs that must be completed first; empty list `[]` if none |

**Required body sections (H2, in order):**

1. `## Hook`
2. `## Core idea`
3. `## Show me`
4. `## Your turn`
5. `## Wrap-up`

## Module File Schema

**Path:** `content/modules/<NN-module-slug>/<lang>/module.md`

**Required frontmatter:**

| Field | Type | Notes |
|---|---|---|
| `module` | integer | |
| `title` | string | |
| `summary` | string | 1–2 sentences |
| `lang` | string | `en` or `he` |

**Required body sections:**

1. `## Overview`
2. `## Go Deeper` — must contain at least 3 markdown list items, each with a link.

## Glossary File Schema

**Path:** `content/glossary/<lang>.md`

Each entry is an H2 heading (the term, exactly as referenced from session frontmatter) followed by a single paragraph (the definition, one or two sentences).

## Parity Rule

For every `content/modules/<module>/en/<file>.md` there MUST be a corresponding `content/modules/<module>/he/<file>.md`, and vice versa. The validator fails if parity is broken.
```

- [ ] **Step 2: Commit**

```bash
git add docs/content-schema.md
git commit -m "docs: add content schema reference"
```

---

## Task 3: Write the validator (TDD — failing case first)

**Files:**
- Create: `scripts/validate-content.mjs`
- Create (temporary): `content/modules/01-first-conversations/en/00-test-stub.md` — used to verify validator, deleted at end of task.

- [ ] **Step 1: Create a stub file that should fail validation**

Create `content/modules/01-first-conversations/en/00-test-stub.md` with **intentionally invalid** content (missing required frontmatter fields):

```markdown
---
title: "broken stub"
---

Incomplete stub for validator testing.
```

- [ ] **Step 2: Write the validator**

Create `scripts/validate-content.mjs`:

```javascript
#!/usr/bin/env node
// Zero-dependency content validator.
// Walks content/ and checks frontmatter + required sections + EN/HE parity + glossary references.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = process.cwd();
const CONTENT = join(ROOT, "content");

const REQUIRED_SESSION_FIELDS = [
  "module", "session", "slug", "title",
  "duration_min", "default_mode", "lang",
  "glossary_terms", "prereq_sessions",
];
const REQUIRED_MODULE_FIELDS = ["module", "title", "summary", "lang"];
const ALLOWED_MODES = new Set(["A", "B", "C"]);
const ALLOWED_LANGS = new Set(["en", "he"]);
const SESSION_SECTIONS = ["## Hook", "## Core idea", "## Show me", "## Your turn", "## Wrap-up"];
const MODULE_SECTIONS = ["## Overview", "## Go Deeper"];

const errors = [];
const fail = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (entry === ".gitkeep") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".md")) out.push(full);
  }
  return out;
}

function parseFrontmatter(raw, file) {
  if (!raw.startsWith("---\n")) { fail(file, "missing frontmatter opening ---"); return null; }
  const end = raw.indexOf("\n---", 4);
  if (end === -1) { fail(file, "missing frontmatter closing ---"); return null; }
  const block = raw.slice(4, end);
  const body = raw.slice(end + 4).replace(/^\n/, "");
  const data = {};
  for (const line of block.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) { fail(file, `frontmatter line not parseable: "${line}"`); continue; }
    const [, key, rawVal] = m;
    data[key] = parseValue(rawVal.trim());
  }
  return { data, body };
}

function parseValue(v) {
  if (v === "") return "";
  if (v.startsWith("[") && v.endsWith("]")) {
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    return inner.split(",").map(s => s.trim().replace(/^["']|["']$/g, ""));
  }
  if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
  if (v.startsWith("'") && v.endsWith("'")) return v.slice(1, -1);
  if (/^-?\d+$/.test(v)) return Number(v);
  return v;
}

function checkRequired(data, file, required) {
  for (const k of required) if (!(k in data)) fail(file, `frontmatter missing required field "${k}"`);
}

function checkSections(body, file, required) {
  let pos = 0;
  for (const h of required) {
    const idx = body.indexOf(h, pos);
    if (idx === -1) { fail(file, `missing required section "${h}" (or out of order)`); return; }
    pos = idx + h.length;
  }
}

function loadGlossary(lang) {
  const path = join(CONTENT, "glossary", `${lang}.md`);
  try {
    const raw = readFileSync(path, "utf8");
    return new Set([...raw.matchAll(/^##\s+(.+)$/gm)].map(m => m[1].trim()));
  } catch { return new Set(); }
}

const glossaries = { en: loadGlossary("en"), he: loadGlossary("he") };

const sessionsByRel = new Map();
const files = walk(CONTENT);

for (const file of files) {
  if (file.includes(`${sep}glossary${sep}`)) continue;
  const raw = readFileSync(file, "utf8");
  const parsed = parseFrontmatter(raw, file);
  if (!parsed) continue;
  const { data, body } = parsed;
  const isModule = file.endsWith(`${sep}module.md`);
  if (isModule) {
    checkRequired(data, file, REQUIRED_MODULE_FIELDS);
    checkSections(body, file, MODULE_SECTIONS);
    if (!ALLOWED_LANGS.has(data.lang)) fail(file, `lang must be one of ${[...ALLOWED_LANGS].join(", ")}`);
    const linkCount = (body.match(/\[.+?\]\(.+?\)/g) || []).length;
    if (linkCount < 3) fail(file, `Go Deeper needs at least 3 links; found ${linkCount}`);
  } else {
    checkRequired(data, file, REQUIRED_SESSION_FIELDS);
    checkSections(body, file, SESSION_SECTIONS);
    if (!ALLOWED_MODES.has(data.default_mode)) fail(file, `default_mode must be A, B, or C`);
    if (!ALLOWED_LANGS.has(data.lang)) fail(file, `lang must be en or he`);
    if (typeof data.duration_min !== "number" || data.duration_min < 5 || data.duration_min > 20)
      fail(file, `duration_min must be integer 5–20`);
    const terms = Array.isArray(data.glossary_terms) ? data.glossary_terms : [];
    const g = glossaries[data.lang] || new Set();
    for (const t of terms) if (!g.has(t)) fail(file, `glossary term "${t}" not found in glossary/${data.lang}.md`);
    const rel = relative(join(CONTENT, "modules"), file).split(sep);
    if (rel.length >= 3) {
      const [mod, lang, name] = rel;
      const key = `${mod}/${name}`;
      if (!sessionsByRel.has(key)) sessionsByRel.set(key, new Set());
      sessionsByRel.get(key).add(lang);
    }
  }
}

for (const [key, langs] of sessionsByRel) {
  if (!langs.has("en")) errors.push(`PARITY: ${key} missing EN counterpart`);
  if (!langs.has("he")) errors.push(`PARITY: ${key} missing HE counterpart`);
}

if (errors.length) {
  console.error(`\n✗ Validation failed with ${errors.length} problem(s):\n`);
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
} else {
  console.log(`✓ All content valid (${files.length} files checked)`);
  process.exit(0);
}
```

- [ ] **Step 3: Run the validator against the broken stub and confirm it fails**

Run:

```bash
node scripts/validate-content.mjs
```

Expected: exit code 1, with error messages mentioning missing fields like `module`, `session`, `slug`, etc.

- [ ] **Step 4: Delete the stub and confirm validator passes on empty tree**

```bash
rm content/modules/01-first-conversations/en/00-test-stub.md
node scripts/validate-content.mjs
```

Expected: `✓ All content valid (0 files checked)` and exit 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-content.mjs
git commit -m "feat: add zero-dep content validator"
```

---

## Task 4: Author glossary (EN + HE)

**Files:**
- Create: `content/glossary/en.md`
- Create: `content/glossary/he.md`

- [ ] **Step 1: Write `content/glossary/en.md`**

```markdown
# Glossary (English)

## AI
Artificial Intelligence — software that learns patterns from huge amounts of data and uses those patterns to generate answers, images, or actions.

## LLM
Large Language Model — the kind of AI behind ChatGPT, Claude, and Gemini. It predicts text one small piece (a "token") at a time.

## token
A small piece of text the model reads and writes — usually a short word or part of a word. LLMs think in tokens, not whole sentences.

## prompt
The text you send to an AI. A clearer prompt usually gets a better answer.

## hallucination
When an AI confidently states something that sounds right but is actually made up or wrong. The #1 thing to watch for.

## chatbot
A program you have a text conversation with. Modern chatbots are powered by LLMs.

## privacy
Keeping information about you (or others) from being shared where it shouldn't be. Applies to what you type into AI tools.
```

- [ ] **Step 2: Write `content/glossary/he.md`**

```markdown
# מילון מונחים (עברית)

## בינה מלאכותית
תוכנה שלומדת דפוסים מכמויות עצומות של מידע, ומשתמשת בהם כדי לייצר תשובות, תמונות או פעולות.

## מודל שפה גדול
המודל שמאחורי ChatGPT, Claude ו-Gemini. הוא חוזה טקסט חתיכה קטנה אחת ("טוקן") בכל פעם.

## טוקן
יחידת טקסט קטנה שהמודל קורא וכותב — לרוב מילה קצרה או חלק ממילה. המודלים חושבים ביחידות האלה, לא במשפטים שלמים.

## פרומפט
הטקסט שאתם שולחים ל-AI. פרומפט ברור יותר בדרך כלל יוביל לתשובה טובה יותר.

## הזיה
כשה-AI קובע בביטחון עובדה שנשמעת נכונה אבל היא המצאה או שגויה. הדבר שהכי חשוב לשים אליו לב.

## צ'טבוט
תוכנה שמנהלים איתה שיחה בטקסט. צ'טבוטים מודרניים מופעלים על ידי מודלי שפה גדולים.

## פרטיות
שמירה על מידע עליכם (או על אחרים) מלהיחשף איפה שאסור לו להיחשף. חל גם על מה שאתם מקלידים ל-AI.
```

- [ ] **Step 3: Run validator and confirm still passing**

```bash
node scripts/validate-content.mjs
```

Expected: `✓ All content valid (2 files checked)` (glossary files aren't strictly validated structurally; the validator counts them in the walk).

- [ ] **Step 4: Commit**

```bash
git add content/glossary/
git commit -m "content: add bilingual glossary (EN + HE)"
```

---

## Task 5: Author Module 1 overview (EN + HE)

**Files:**
- Create: `content/modules/01-first-conversations/en/module.md`
- Create: `content/modules/01-first-conversations/he/module.md`

- [ ] **Step 1: Write `content/modules/01-first-conversations/en/module.md`**

```markdown
---
module: 1
title: "Your First AI Conversations"
summary: "Open an AI tool, use it for a real task, and learn the two most important rules: AI can be confidently wrong, and some things should never be shared."
lang: en
---

## Overview

This is where we actually start using AI. By the end of five short sessions, you'll have had real conversations with a modern AI, tried it on a task that matters to you this week, spotted a hallucination in the wild, and set the rules for what your family puts into AI tools. No jargon, no hype — just hands-on practice with the two rules that protect you.

## Go Deeper

- [Fireship — ChatGPT in 100 seconds](https://www.youtube.com/watch?v=w-HMOwbTJXU) — fastest possible tour of what ChatGPT is.
- [3Blue1Brown — But what is a neural network?](https://www.youtube.com/watch?v=aircAruvnKk) — beautiful visual intro, if you're curious what's under the hood.
- [Andrej Karpathy — Intro to Large Language Models](https://www.youtube.com/watch?v=zjkBMFhNj_g) — the single best one-hour explainer if you want to actually understand it.
- [IBM Technology — What is a Large Language Model?](https://www.youtube.com/watch?v=iR2O2GPbB0E) — short, grounded, no hype.
```

- [ ] **Step 2: Write `content/modules/01-first-conversations/he/module.md`**

```markdown
---
module: 1
title: "השיחות הראשונות שלכם עם AI"
summary: "פותחים כלי AI, עושים איתו משימה אמיתית, ולומדים את שני הכללים החשובים: AI יכול לטעות בביטחון, ויש דברים שאסור לשתף."
lang: he
---

## Overview

כאן מתחילים באמת להשתמש ב-AI. בסוף חמישה מפגשים קצרים תנהלו שיחות אמיתיות עם AI מודרני, תנסו אותו על משימה שחשובה לכם השבוע, תזהו הזיה בעצמכם, ותקבעו כללים משפחתיים למה שמותר ואסור להקליד לכלי AI. בלי ז'רגון, בלי היפ — רק תרגול מעשי של שני הכללים ששומרים עליכם.

## Go Deeper

- [Fireship — ChatGPT in 100 seconds](https://www.youtube.com/watch?v=w-HMOwbTJXU) — סיור מהיר במה זה ChatGPT (אנגלית).
- [3Blue1Brown — מה זו רשת נוירונים?](https://www.youtube.com/watch?v=aircAruvnKk) — הסבר ויזואלי יפהפה למי שסקרן איך זה עובד מבפנים (אנגלית עם כתוביות).
- [Andrej Karpathy — הסבר על מודלי שפה גדולים](https://www.youtube.com/watch?v=zjkBMFhNj_g) — שעה אחת, ההסבר הכי טוב שיש (אנגלית).
- [רן בר-זיק — מה זה ChatGPT ואיך משתמשים בו](https://www.youtube.com/results?search_query=%D7%A8%D7%9F+%D7%91%D7%A8-%D7%96%D7%99%D7%A7+ChatGPT) — חיפוש ביוטיוב לסרטונים בעברית (בחרו את העדכני ביותר).
```

*Note:* the Hebrew link is a search URL as a practical fallback; replace with a specific video URL during review if you have a preferred Hebrew creator. This is the ONE exception in this plan to the "no placeholders" rule — flagging explicitly because Hebrew-language YouTube content for beginners evolves quickly and a fixed URL will rot. The search fallback is deliberately concrete.

- [ ] **Step 3: Run validator**

```bash
node scripts/validate-content.mjs
```

Expected: `✓ All content valid (4 files checked)` (2 glossaries + 2 module.md files).

- [ ] **Step 4: Commit**

```bash
git add content/modules/01-first-conversations/
git commit -m "content: add Module 1 overview (EN + HE)"
```

---

## Task 6: Author M1.S1 — Meet AI (EN)

**File:** Create `content/modules/01-first-conversations/en/01-meet-ai.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 1
slug: meet-ai
title: "Meet AI: what it is, what it isn't"
duration_min: 12
default_mode: C
lang: en
glossary_terms: [AI, LLM, token, prompt, chatbot]
prereq_sessions: []
---

## Hook

You've probably used AI today without realising it — your email's autocomplete, your phone's photo search, your map's traffic estimate. This session introduces the AI you probably *haven't* used yet: the one you can talk to.

## Core idea

Modern AI chatbots — ChatGPT, Claude, Gemini — are powered by something called a **LLM** (Large Language Model). Despite the name, it's not a brain, and it's not a search engine. The simplest honest description: it's a very well-read assistant that writes one small piece of text (a **token**) at a time, each piece guessed from everything it has read before.

That's it. No magic, no consciousness. Just: "given all the words so far, what's the most likely next word?" — repeated a few thousand times until it has a full answer.

Three things this means:
1. It often *sounds* confident even when it's guessing.
2. It's surprisingly good at tasks humans do with words — writing, explaining, summarising, brainstorming.
3. It doesn't know what it doesn't know. More on that in session 3.

## Show me

Here's an example of the simplest possible conversation:

> **You:** Hi! Who are you, in one sentence?
>
> **AI:** I'm an AI assistant — a computer program trained to understand and generate human language, here to help with questions, writing, brainstorming, and explanations.

Notice what it does: introduces itself, names a few things it's good at, keeps it short. Notice what it *doesn't* do: pretend to be a person, claim to be perfect, tell you its real name.

## Your turn

Pick your mode below and have your very first AI conversation.

**Mode A — Go try it (recommended for first-timers):**
1. Open one of: [ChatGPT](https://chat.openai.com), [Claude](https://claude.ai), [Gemini](https://gemini.google.com). Any of them will do.
2. In the chat box, type: `Hi! Who are you, in one sentence?`
3. Read the answer. Then ask one follow-up: `And what are three things you're NOT good at?`

**Mode B — Copy this prompt:**

```
Hi! Please introduce yourself in one sentence,
then list three things you're genuinely not good at.
```

Paste it into any AI tool of your choice.

**Mode C — Try it here:**
Use the chat box on this page to say hi. Ask the same two questions.

## Wrap-up

One sentence recap: **AI is a very well-read assistant that writes one token at a time — useful for words, not magic.**

Reflection: What was the most surprising thing about its answer? (Write one line in the box below before marking this session complete.)
```

- [ ] **Step 2: Run validator**

```bash
node scripts/validate-content.mjs
```

Expected: `PARITY: 01-first-conversations/01-meet-ai.md missing HE counterpart` (we expect this failure — HE is authored in Task 11).

- [ ] **Step 3: Do NOT commit yet**

We'll commit after the HE counterpart exists. Keep working.

---

## Task 7: Author M1.S2 — Your first real task with AI (EN)

**File:** Create `content/modules/01-first-conversations/en/02-first-task.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 2
slug: first-task
title: "Your first real task with AI"
duration_min: 13
default_mode: B
lang: en
glossary_terms: [prompt, AI]
prereq_sessions: [meet-ai]
---

## Hook

Think of one small thing you need to do this week. An email you've been avoiding. A homework question you're stuck on. A meal you can't decide on. That's our material today — AI works best when you bring it something real.

## Core idea

AI answers vague questions with vague answers and concrete questions with useful ones. The single biggest upgrade you can make to your prompts is to **be specific**: what you want, who it's for, how long, and in what style.

A vague prompt asks the AI to guess what you meant. A specific prompt tells the AI what success looks like — so its first answer is usable, not a draft you have to re-prompt twice to fix.

## Show me

Same task, two prompts:

> **Vague:** Help me write an email to my teacher.
>
> **AI:** Dear Teacher, I hope this email finds you well. I am writing to... [generic filler continues]

vs.

> **Specific:** Help me write a short (4–5 sentences), polite email to my maths teacher, asking if I can hand in Wednesday's homework on Thursday because I have a dentist appointment.
>
> **AI:** Hi [Teacher's name], I have a dentist appointment on Wednesday afternoon and won't be able to finish the homework in time. Would it be okay if I handed it in on Thursday morning instead? Happy to start it early if that helps. Thank you for considering — [Your name]

Same AI, same minute. The second one is almost ready to send.

## Your turn

Pick a real, small task from your week (not homework from this course — a real task). Ask AI to help with it.

**Mode A — Go try it:**
1. Open [Claude](https://claude.ai) or [ChatGPT](https://chat.openai.com).
2. Write a specific prompt using this template: *"Help me [do X]. It's for [who]. It should be [length / style]. Context: [1 sentence]."*
3. Read the answer. If it's not useful, add one more sentence of context and try again.

**Mode B — Copy this prompt (fill in the brackets):**

```
Help me [write / plan / decide] on [the real thing].
It's for [who will read or use it].
It should be [how long / what style / what tone].
Context you should know: [one sentence].
```

**Mode C — Try it here:**
Use the chat box. Same structure as above.

## Wrap-up

One sentence recap: **Specific beats vague. Tell the AI what success looks like.**

Reflection: Was your first answer or your second try better? Why? (One line.)
```

- [ ] **Step 2: Run validator**

Expect: parity errors only. Keep going.

---

## Task 8: Author M1.S3 — The golden rule (EN)

**File:** Create `content/modules/01-first-conversations/en/03-confidently-wrong.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 3
slug: confidently-wrong
title: "The golden rule: AI can be confidently wrong"
duration_min: 14
default_mode: B
lang: en
glossary_terms: [hallucination, LLM]
prereq_sessions: [meet-ai, first-task]
---

## Hook

In 2023 a New York lawyer used ChatGPT to research a case and filed six legal precedents with the judge — every single one invented. The AI had made up case names, citations, even quotes. The lawyer got sanctioned. The problem wasn't that he used AI. It was that he didn't know about today's topic.

## Core idea

LLMs don't say "I don't know." They predict the most likely next word — which usually sounds right, and sometimes *is* right, but sometimes is a plausible-sounding invention. When AI confidently says something false, we call it a **hallucination**.

This is the single most important thing to remember when using AI. Not "AI is dangerous" — AI is extremely useful. But "check the important stuff," the way you'd check a directions tip from a confident stranger in a new city.

Three categories where hallucinations hit hardest:
1. **Facts with dates and numbers** — historical events, scientific data, statistics.
2. **Citations and sources** — book titles, paper names, URLs, names of real people.
3. **Anything recent** — AI models have training cut-off dates; ask about last week and they'll often guess.

## Show me

A classic trap:

> **You:** Who wrote the novel "The Shadow Gardener" in 1987?
>
> **AI:** "The Shadow Gardener" was written in 1987 by British author Graham Edwards. The novel explores themes of isolation and memory...

The book doesn't exist. The author doesn't exist in that form. The AI filled in a plausible answer rather than saying "I don't recognise that title." That's a hallucination in the wild.

## Your turn

**Mode A — Go try it:**
1. Open any chatbot.
2. Ask it: *"Tell me about the 1923 silent film 'The Blue Mariner' and its director."* (This film is fictional.)
3. Watch what happens. Does it make something up, or does it say "I can't find that"? Tools differ.

**Mode B — Copy this prompt:**

```
Tell me about the 1923 silent film "The Blue Mariner" and its director.
If you're not sure this film exists, say so clearly.
```

Notice how adding the second sentence changes the behaviour. That's your first defensive prompt.

**Mode C — Try it here:**
Use the chat box, same prompt.

## Wrap-up

One sentence recap: **AI can be confidently wrong. Always verify facts, dates, and citations that matter.**

Reflection: Where in your life would it matter *most* that you verified what an AI told you? (One line.)
```

- [ ] **Step 2: Run validator.** Parity errors expected. Continue.

---

## Task 9: Author M1.S4 — Safety & privacy (EN)

**File:** Create `content/modules/01-first-conversations/en/04-safety-privacy.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 4
slug: safety-privacy
title: "Safety & privacy: what never to share"
duration_min: 12
default_mode: B
lang: en
glossary_terms: [privacy, prompt]
prereq_sessions: [meet-ai, first-task, confidently-wrong]
---

## Hook

Imagine that every prompt you type into an AI tool will, in some form, be printed on a billboard on your street. Now — what would you still happily type, and what wouldn't you? That's today's whole lesson.

## Core idea

What happens to your prompts after you send them depends on which tool, which account, and which settings you use. Sometimes they're used to improve the AI. Sometimes they sit on a server. Sometimes they're deleted. The safest mental model: **treat an AI prompt like an email to a stranger you trust about 70%** — useful, but don't put in anything truly sensitive.

Hard rules for the family:

**Never paste:**
- Passwords of any kind.
- Full credit card, bank account, or ID numbers.
- Other people's private info (friends' medical details, an ex-boss's personal email, etc.) without their permission.
- Anything your workplace classifies as confidential.
- Something a child wouldn't want their school to read.

**Usually fine:**
- Your name, your general questions, your writing you want help with, generic life context ("I'm planning a trip to Italy in July").
- School questions and homework topics.
- Public info, public quotes, brainstorming.

## Show me

A red-line prompt, rewritten into a safe one:

> **Red-line (don't do this):** "My Gmail password is sparky1985! and I keep getting locked out. What's wrong?"
>
> **Safe version:** "I keep getting locked out of my Gmail account. What are the most common reasons for repeated lockouts and how do I check?"

Same help, zero exposure.

## Your turn

**Mode A — Go try it:**
1. Write two prompts on paper (or in notes): one that would be a privacy mistake, one that's safe.
2. Open an AI tool and send the *safe* version only.

**Mode B — Copy this prompt and finish it safely:**

```
Rewrite the following prompt so it still gets me the help I need,
but removes anything I shouldn't share with an AI:

"[paste a made-up 'risky' prompt here — e.g. includes a full ID number
or a password]"
```

Let the AI show you the safe rewrite — a useful trick when you're not sure.

**Mode C — Try it here:**
Use the chat box. Tell it about a fake risky prompt and ask for the safe rewrite.

## Wrap-up

One sentence recap: **If you wouldn't print it on a billboard, don't paste it into an AI.**

Reflection: What's one family rule about AI and privacy you'd want everyone in your home to follow? (One line.)
```

- [ ] **Step 2: Run validator.** Parity errors expected. Continue.

---

## Task 10: Author M1.S5 — Recap + challenge (EN)

**File:** Create `content/modules/01-first-conversations/en/05-recap-challenge.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 5
slug: recap-challenge
title: "Module 1 recap + weekly challenge"
duration_min: 10
default_mode: A
lang: en
glossary_terms: [AI, LLM, prompt, hallucination, privacy]
prereq_sessions: [meet-ai, first-task, confidently-wrong, safety-privacy]
---

## Hook

Four sessions ago, you hadn't had a real conversation with an AI. Today you have — and you know the two rules that protect you. That's more than most adults using AI at work right now. Let's lock it in.

## Core idea

What you've actually learned:

- **Session 1** — AI is a very well-read assistant that writes one token at a time. Not a brain, not a search engine.
- **Session 2** — Specific prompts beat vague prompts. Tell the AI what success looks like.
- **Session 3** — AI can be confidently wrong (hallucinate). Always verify facts, dates, and citations that matter.
- **Session 4** — Don't paste anything you wouldn't want on a billboard. Passwords, IDs, and other people's private info stay out.

Two of those are *rules* (3 and 4). Two are *skills* (1 and 2). Rules keep you safe; skills make AI actually useful.

## Show me

What "applying it for real" looks like this week. Three beginner-friendly uses:

1. **A stuck email.** Paste a draft; ask AI to make it shorter and clearer.
2. **A decision.** "I'm trying to decide between X and Y for [context]. What should I consider that I might be missing?"
3. **A learning moment.** "Explain [a thing you don't fully get] to me like I'm smart but new to it."

All three follow Session 2's specificity rule, none violate Session 4's privacy rule, and the output of all three still deserves Session 3's "double-check the important stuff."

## Your turn

**This is the weekly challenge. Mode A is the point:**

**Mode A — Go try it (this is the assignment):**
Between now and your next session, use AI for **one real thing** — an email, a decision, a question, a recipe, a trip plan, anything. Then at dinner (or breakfast, or a walk), tell one family member what you tried and what happened. One sentence each. That's it.

**Mode B — Copy this as a reminder:**

```
This week I'll use AI to help with: ________________________
I'll tell ________________________ about what happened.
```

**Mode C — Try it here (optional):**
Use the chat box to plan which real task you'll bring AI to this week. It's a good prompt-for-prompts exercise.

## Wrap-up

One sentence recap: **You can now use AI safely and usefully for real tasks. Go do one thing with it this week.**

Reflection: What's the one real task you'll bring to AI before the next session? (One line. Be specific — Session 2 energy.)

*When you mark this session complete, Module 2 unlocks.*
```

- [ ] **Step 2: Run validator.** Parity errors expected for all 5 EN sessions still without HE. That's fine — next tasks author HE.

---

## Task 11: Author M1.S1 — Meet AI (HE)

**File:** Create `content/modules/01-first-conversations/he/01-meet-ai.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 1
slug: meet-ai
title: "מי זה בכלל AI, ומה הוא לא"
duration_min: 12
default_mode: C
lang: he
glossary_terms: [בינה מלאכותית, מודל שפה גדול, טוקן, פרומפט, צ'טבוט]
prereq_sessions: []
---

## Hook

כנראה השתמשתם היום ב-AI בלי לשים לב — ההשלמה האוטומטית במייל, חיפוש תמונות בטלפון, תחזית הפקקים ב-Waze. במפגש הזה נכיר את ה-AI שכנראה *לא* השתמשתם בו עדיין: זה שמדברים איתו.

## Core idea

צ'טבוטים מודרניים — ChatGPT, Claude, Gemini — מופעלים על ידי דבר שנקרא **מודל שפה גדול** (LLM). למרות השם, זה לא מוח ולא מנוע חיפוש. ההגדרה הפשוטה וההוגנת ביותר: זה עוזר שקרא המון, וכותב חתיכת טקסט קטנה (**טוקן**) בכל פעם — כל חתיכה מנוחשת על סמך כל מה שהוא קרא קודם.

זהו. בלי קסם, בלי תודעה. רק: "בהינתן כל המילים עד כה, מה המילה הבאה הכי סבירה?" — חוזר על זה כמה אלפי פעמים עד שיש תשובה שלמה.

שלושה דברים שזה אומר:
1. הוא לרוב *נשמע* בטוח גם כשהוא מנחש.
2. הוא טוב להפתיע במשימות שאנשים עושים עם מילים — כתיבה, הסבר, סיכום, סיעור מוחות.
3. הוא לא יודע מה הוא לא יודע. על זה נדבר במפגש 3.

## Show me

הנה השיחה הכי פשוטה שיש:

> **אתם:** היי! מי אתה, במשפט אחד?
>
> **AI:** אני עוזר AI — תוכנת מחשב שהוכשרה להבין ולחולל שפה אנושית, כאן כדי לעזור בשאלות, כתיבה, סיעור מוחות והסברים.

שימו לב למה הוא עשה: הציג את עצמו, ציין במה הוא טוב, נשאר קצר. ושימו לב למה הוא *לא* עשה: לא התיימר להיות אדם, לא הכריז על עצמו כמושלם, לא המציא לעצמו שם "אמיתי".

## Your turn

בחרו מצב, ונהלו את השיחה הראשונה שלכם.

**מצב A — קדימה, נסו בעצמכם (מומלץ לפעם הראשונה):**
1. פתחו אחד מאלה: [ChatGPT](https://chat.openai.com), [Claude](https://claude.ai), [Gemini](https://gemini.google.com). כל אחד מהם מתאים.
2. בתיבת השיחה, הקלידו: `היי! מי אתה, במשפט אחד?`
3. קראו את התשובה. אחר כך שאלו שאלת המשך אחת: `ובאילו שלושה דברים אתה באמת לא טוב?`

**מצב B — העתיקו את הפרומפט:**

```
היי! הציג את עצמך במשפט אחד,
ואז פרט שלושה דברים שאתה באמת לא טוב בהם.
```

הדביקו בכלי AI שבחרתם.

**מצב C — נסו כאן:**
השתמשו בתיבת הצ'אט בעמוד הזה כדי להגיד היי. שאלו את אותן שתי השאלות.

## Wrap-up

משפט סיכום: **AI הוא עוזר שקרא המון וכותב טוקן אחד בכל פעם — שימושי למילים, לא קסום.**

רפלקציה: מה היה הדבר הכי מפתיע בתשובה שלו? (כתבו שורה אחת בתיבה לפני שמסמנים את המפגש כהושלם.)
```

- [ ] **Step 2: Run validator**

```bash
node scripts/validate-content.mjs
```

Expected: `PARITY` errors for 01-meet-ai.md should be gone; other sessions still report missing HE counterparts.

---

## Task 12: Author M1.S2 — First task (HE)

**File:** Create `content/modules/01-first-conversations/he/02-first-task.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 2
slug: first-task
title: "המשימה האמיתית הראשונה שלכם עם AI"
duration_min: 13
default_mode: B
lang: he
glossary_terms: [פרומפט, בינה מלאכותית]
prereq_sessions: [meet-ai]
---

## Hook

חשבו על דבר אחד קטן שאתם צריכים לעשות השבוע. מייל שדחיתם. שאלה בשיעורי בית שנתקעתם עליה. ארוחת ערב שאי אפשר להחליט מה להכין. זה החומר שלנו היום — AI הכי טוב כשמביאים לו משהו אמיתי.

## Core idea

AI עונה על שאלות מעורפלות בתשובות מעורפלות, ועל שאלות ממוקדות בתשובות שימושיות. השדרוג היחיד הכי גדול שאתם יכולים לעשות לפרומפטים שלכם הוא **להיות ספציפיים**: מה אתם רוצים, בשביל מי, באיזה אורך, באיזה סגנון.

פרומפט מעורפל מבקש מה-AI לנחש מה התכוונתם. פרומפט ספציפי אומר ל-AI איך נראית הצלחה — כך שהתשובה הראשונה כבר שימושית, לא טיוטה שצריך לתקן פעמיים.

## Show me

אותה משימה, שני פרומפטים:

> **מעורפל:** תעזור לי לכתוב מייל למורה.
>
> **AI:** מורה יקר, אני מקווה שהמייל הזה מוצא אותך בכי טוב. אני פונה... [טקסט גנרי ממשיך]

לעומת:

> **ספציפי:** עזור לי לכתוב מייל קצר (4–5 משפטים), מנומס, למורה למתמטיקה, ולבקש ממנו להגיש את שיעורי הבית של יום רביעי ביום חמישי כי יש לי תור לרופא שיניים.
>
> **AI:** שלום [שם המורה], יש לי תור לרופא שיניים ביום רביעי אחר הצהריים ולא אספיק לסיים את שיעורי הבית בזמן. האם ניתן להגיש אותם ביום חמישי בבוקר במקום? אשמח להתחיל מוקדם אם זה עוזר. תודה על ההתחשבות — [השם שלכם]

אותו AI, אותה דקה. השני כמעט מוכן לשליחה.

## Your turn

בחרו משימה אמיתית וקטנה מהשבוע שלכם (לא שיעורי בית מהקורס הזה — משהו אמיתי). בקשו מ-AI לעזור.

**מצב A — קדימה, נסו:**
1. פתחו את [Claude](https://claude.ai) או [ChatGPT](https://chat.openai.com).
2. כתבו פרומפט ספציפי לפי התבנית: *"עזור לי [לעשות X]. זה עבור [מי]. זה צריך להיות [אורך / סגנון]. הקשר: [משפט אחד]."*
3. קראו את התשובה. אם היא לא שימושית, הוסיפו משפט אחד של הקשר ונסו שוב.

**מצב B — העתיקו את הפרומפט (מלאו את הסוגריים):**

```
עזור לי [לכתוב / לתכנן / להחליט] על [הדבר האמיתי].
זה עבור [מי יקרא או ישתמש].
זה צריך להיות [אורך / סגנון / טון].
הקשר שחשוב לדעת: [משפט אחד].
```

**מצב C — נסו כאן:**
השתמשו בתיבת הצ'אט. אותו מבנה כמו למעלה.

## Wrap-up

משפט סיכום: **ספציפי מנצח מעורפל. תגידו ל-AI איך נראית הצלחה.**

רפלקציה: התשובה הראשונה הייתה טובה יותר, או הניסיון השני? למה? (שורה אחת.)
```

- [ ] **Step 2: Run validator.** Parity error for first-task should be gone.

---

## Task 13: Author M1.S3 — Confidently wrong (HE)

**File:** Create `content/modules/01-first-conversations/he/03-confidently-wrong.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 3
slug: confidently-wrong
title: "כלל הזהב: AI יכול לטעות בביטחון"
duration_min: 14
default_mode: B
lang: he
glossary_terms: [הזיה, מודל שפה גדול]
prereq_sessions: [meet-ai, first-task]
---

## Hook

ב-2023 עורך דין בניו יורק השתמש ב-ChatGPT למחקר לתיק משפטי והגיש לשופט שישה פסקי דין תומכים — כל אחד מהם המצאה. ה-AI המציא שמות תיקים, מראי מקום, ציטוטים. עורך הדין קיבל עיצום. הבעיה לא הייתה שהוא השתמש ב-AI. היא הייתה שהוא לא הכיר את הנושא של היום.

## Core idea

מודלי שפה גדולים לא אומרים "אני לא יודע". הם חוזים את המילה הבאה הכי סבירה — שלרוב נשמעת נכונה, לפעמים *היא* נכונה, ולפעמים היא המצאה סבירה-למראית-עין. כש-AI קובע בביטחון דבר שגוי אנחנו קוראים לזה **הזיה**.

זה הדבר היחיד הכי חשוב לזכור כשמשתמשים ב-AI. לא "AI מסוכן" — AI מאוד שימושי. אלא "תבדקו את הדברים החשובים," כמו שהייתם בודקים טיפ על הדרך שנתן זר בטוח בעצמו בעיר חדשה.

שלוש קטגוריות שבהן הזיות פוגעות הכי חזק:
1. **עובדות עם תאריכים ומספרים** — אירועים היסטוריים, נתונים מדעיים, סטטיסטיקות.
2. **ציטוטים ומקורות** — שמות ספרים, מאמרים, URLs, שמות של אנשים אמיתיים.
3. **כל מה שעדכני** — למודלים יש תאריך חיתוך לאימון; תשאלו על השבוע שעבר והם לרוב ינחשו.

## Show me

מלכודת קלאסית:

> **אתם:** מי כתב את הרומן "גנן הצללים" ב-1987?
>
> **AI:** "גנן הצללים" נכתב ב-1987 על ידי הסופר הבריטי גראהם אדוארדס. הרומן עוסק בבידוד ובזיכרון...

הספר לא קיים. הסופר לא קיים בצורה הזאת. ה-AI מילא תשובה סבירה במקום להגיד "אני לא מכיר את השם הזה". זאת הזיה בטבע.

## Your turn

**מצב A — קדימה, נסו:**
1. פתחו צ'טבוט כלשהו.
2. שאלו אותו: *"ספר לי על הסרט האילם 'המלח הכחול' מ-1923 ועל הבמאי שלו."* (סרט פיקטיבי.)
3. צפו במה שקורה. האם הוא ממציא, או שהוא אומר "לא מצאתי"? כלים שונים מתנהגים שונה.

**מצב B — העתיקו את הפרומפט:**

```
ספר לי על הסרט האילם "המלח הכחול" מ-1923 ועל הבמאי שלו.
אם אינך בטוח שהסרט קיים, אמור זאת בבירור.
```

שימו לב איך הוספת המשפט השני משנה את ההתנהגות. זה הפרומפט ההגנתי הראשון שלכם.

**מצב C — נסו כאן:**
השתמשו בתיבת הצ'אט, עם אותו פרומפט.

## Wrap-up

משפט סיכום: **AI יכול לטעות בביטחון. תמיד אמתו עובדות, תאריכים וציטוטים שחשובים.**

רפלקציה: איפה בחיים שלכם הכי חשוב היה שתבדקו מה ה-AI אמר? (שורה אחת.)
```

- [ ] **Step 2: Run validator.** Parity error for confidently-wrong should be gone.

---

## Task 14: Author M1.S4 — Safety & privacy (HE)

**File:** Create `content/modules/01-first-conversations/he/04-safety-privacy.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 4
slug: safety-privacy
title: "בטיחות ופרטיות: מה אף פעם לא משתפים"
duration_min: 12
default_mode: B
lang: he
glossary_terms: [פרטיות, פרומפט]
prereq_sessions: [meet-ai, first-task, confidently-wrong]
---

## Hook

דמיינו שכל פרומפט שאתם מקלידים לכלי AI יודפס, בצורה כלשהי, על שלט חוצות ברחוב שלכם. עכשיו — מה הייתם עדיין שמחים להקליד, ומה לא? זה השיעור של היום, בשלמותו.

## Core idea

מה שקורה עם הפרומפטים שלכם אחרי השליחה תלוי בכלי, בחשבון ובהגדרות. לפעמים הם משמשים לשיפור ה-AI. לפעמים הם יושבים על שרת. לפעמים הם נמחקים. המודל המנטלי הבטוח ביותר: **תתייחסו לפרומפט כמו למייל לזר שאתם סומכים עליו בערך 70%** — שימושי, אבל לא מכניסים פנימה דברים באמת רגישים.

כללים נוקשים למשפחה:

**אף פעם לא מדביקים:**
- סיסמאות מכל סוג.
- מספרי כרטיסי אשראי מלאים, חשבונות בנק, או תעודות זהות.
- מידע פרטי של אנשים אחרים (פרטים רפואיים של חברים, מייל אישי של בוס לשעבר) בלי רשות.
- כל דבר שמקום העבודה שלכם מסווג כסודי.
- משהו שילד לא היה רוצה שבית הספר שלו יקרא.

**בדרך כלל בסדר:**
- השם שלכם, שאלות כלליות, טקסטים שאתם רוצים עזרה איתם, הקשר כללי ("אני מתכננת טיול לאיטליה ביולי").
- שאלות מבית הספר, נושאים של שיעורי בית.
- מידע ציבורי, ציטוטים פומביים, סיעור מוחות.

## Show me

פרומפט אדום, שנכתב מחדש בצורה בטוחה:

> **אדום (לא לעשות):** "הסיסמה שלי ב-Gmail היא sparky1985! ואני נחסמת כל הזמן. מה לא בסדר?"
>
> **גרסה בטוחה:** "אני נחסמת כל הזמן מחשבון ה-Gmail שלי. מה הסיבות הנפוצות לחסימות חוזרות ואיך בודקים?"

אותה עזרה, חשיפה אפסית.

## Your turn

**מצב A — קדימה, נסו:**
1. כתבו שני פרומפטים על דף (או בפתקים): אחד שהיה טעות פרטיות, ואחד בטוח.
2. פתחו כלי AI ושלחו רק את *הגרסה הבטוחה*.

**מצב B — העתיקו את הפרומפט והשלימו בבטחה:**

```
שכתב את הפרומפט הבא כך שיעזור לי באותה צורה,
אבל יסיר כל מה שאסור לשתף עם AI:

"[הדבק כאן פרומפט 'מסוכן' מומצא — למשל כזה שכולל
מספר זהות מלא או סיסמה]"
```

תנו ל-AI להראות לכם את השכתוב הבטוח — טריק שימושי כשלא בטוחים.

**מצב C — נסו כאן:**
השתמשו בתיבת הצ'אט. ספרו לו על פרומפט מסוכן מומצא ובקשו שכתוב בטוח.

## Wrap-up

משפט סיכום: **אם לא הייתם שמים את זה על שלט חוצות, אל תדביקו את זה ל-AI.**

רפלקציה: איזה כלל משפחתי אחד לגבי AI ופרטיות הייתם רוצים שכולם בבית יקפידו עליו? (שורה אחת.)
```

- [ ] **Step 2: Run validator.** Parity error for safety-privacy should be gone.

---

## Task 15: Author M1.S5 — Recap + challenge (HE)

**File:** Create `content/modules/01-first-conversations/he/05-recap-challenge.md`

- [ ] **Step 1: Write the session**

```markdown
---
module: 1
session: 5
slug: recap-challenge
title: "סיכום מודול 1 + אתגר השבוע"
duration_min: 10
default_mode: A
lang: he
glossary_terms: [בינה מלאכותית, מודל שפה גדול, פרומפט, הזיה, פרטיות]
prereq_sessions: [meet-ai, first-task, confidently-wrong, safety-privacy]
---

## Hook

לפני ארבעה מפגשים עדיין לא ניהלתם שיחה אמיתית עם AI. היום כן — ואתם מכירים את שני הכללים ששומרים עליכם. זה יותר ממה שיודעים רוב המבוגרים שמשתמשים ב-AI בעבודה ממש עכשיו. בואו נעגן את זה.

## Core idea

מה באמת למדתם:

- **מפגש 1** — AI הוא עוזר שקרא המון וכותב טוקן אחד בכל פעם. לא מוח, לא מנוע חיפוש.
- **מפגש 2** — פרומפט ספציפי מנצח פרומפט מעורפל. תגידו ל-AI איך נראית הצלחה.
- **מפגש 3** — AI יכול לטעות בביטחון (הזיה). תמיד אמתו עובדות, תאריכים וציטוטים שחשובים.
- **מפגש 4** — אל תדביקו כלום שלא הייתם רוצים על שלט חוצות. סיסמאות, תעודות זהות ומידע פרטי של אחרים נשארים בחוץ.

שניים מאלה הם *כללים* (3 ו-4). שניים הם *מיומנויות* (1 ו-2). הכללים שומרים עליכם; המיומנויות הופכות את ה-AI לבאמת שימושי.

## Show me

איך נראה "ליישם את זה בפועל" השבוע. שלוש דוגמאות ידידותיות למתחילים:

1. **מייל שנתקעתם עליו.** תדביקו טיוטה; תבקשו מ-AI לקצר ולחדד.
2. **החלטה.** "אני מתלבט בין X ל-Y בהקשר של [משהו]. מה כדאי לקחת בחשבון שייתכן שפספסתי?"
3. **רגע של למידה.** "תסביר לי [דבר שאני לא מבין עד הסוף] כאילו אני חכם אבל חדש בתחום."

כל שלוש הדוגמאות מיישמות את כלל הספציפיות ממפגש 2, אף אחת לא עוברת על כלל הפרטיות ממפגש 4, והפלטים של שלושתן עדיין מחייבים את ה"תבדקו את החשוב" ממפגש 3.

## Your turn

**זה אתגר השבוע. מצב A הוא העיקר:**

**מצב A — קדימה, נסו (זאת המשימה):**
בין עכשיו למפגש הבא, השתמשו ב-AI ל**דבר אחד אמיתי** — מייל, החלטה, שאלה, מתכון, תכנון טיול, כל דבר. אחר כך בארוחת ערב (או בוקר, או הליכה), ספרו לבן משפחה אחד מה ניסיתם ומה קרה. משפט אחד לכל צד. זהו.

**מצב B — העתיקו כתזכורת:**

```
השבוע אני אשתמש ב-AI כדי לעזור עם: ________________________
אני אספר ל-________________________ מה קרה.
```

**מצב C — נסו כאן (אופציונלי):**
השתמשו בתיבת הצ'אט כדי לתכנן איזו משימה אמיתית תביאו ל-AI השבוע. תרגיל פרומפט-לפרומפטים טוב.

## Wrap-up

משפט סיכום: **אתם יכולים להשתמש ב-AI בבטחה וביעילות למשימות אמיתיות. לכו לעשות דבר אחד איתו השבוע.**

רפלקציה: מה המשימה האמיתית האחת שתביאו ל-AI עד המפגש הבא? (שורה אחת. תהיו ספציפיים — אנרגיה של מפגש 2.)

*כשתסמנו את המפגש כהושלם, מודול 2 ייפתח.*
```

- [ ] **Step 2: Run validator**

```bash
node scripts/validate-content.mjs
```

Expected: `✓ All content valid (14 files checked)` — 2 glossaries + 2 module.md + 10 sessions (5 EN + 5 HE).

- [ ] **Step 3: Commit**

```bash
git add content/modules/01-first-conversations/
git commit -m "content: author Module 1 sessions (EN + HE)"
```

---

## Task 16: Final validation pass and documentation

**Files:**
- Modify: create or update `README.md` at repo root

- [ ] **Step 1: Run validator one last time, clean**

```bash
node scripts/validate-content.mjs
```

Expected: `✓ All content valid (14 files checked)`. If not, fix the reported issues before moving on.

- [ ] **Step 2: Create `README.md` with authoring + validation instructions**

Create or overwrite `README.md`:

```markdown
# AI Intro Curriculum — Content

Bilingual (EN + HE) introduction-to-AI curriculum for the Wolf family.

## Structure

- `content/` — all lesson content (see `docs/content-schema.md`)
- `scripts/validate-content.mjs` — structural validator; run before every commit
- `docs/` — design spec and schema reference

## Authoring a new session

1. Copy an existing session file as a starting template.
2. Update the frontmatter (module, session, slug, title, duration_min, default_mode, lang, glossary_terms, prereq_sessions).
3. Fill in the five required sections: Hook, Core idea, Show me, Your turn, Wrap-up.
4. Add any new glossary terms to both `content/glossary/en.md` and `content/glossary/he.md`.
5. Write the counterpart file in the other language — EN↔HE parity is required.
6. Run the validator: `node scripts/validate-content.mjs`.
7. Commit once the validator passes.

## Validation

Requires Node.js 18+. No `npm install` needed — the validator is zero-dependency.

```bash
node scripts/validate-content.mjs
```

Exit 0 = clean. Exit 1 = a list of specific problems to fix.

## Status

- Module 1 — complete (EN + HE)
- Modules 2–5 — planned, not yet authored
- Website — separate spec pending
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add authoring and validation README"
```

- [ ] **Step 4: Log final state**

Run:

```bash
git log --oneline
node scripts/validate-content.mjs
```

Expected:
- Git log shows ~7 commits from this plan (init, schema, validator, glossary, module overview, sessions, README).
- Validator shows `✓ All content valid (14 files checked)`.

---

## Done criteria

Module 1 is "done" when all of these are true:

1. Validator passes with 14 files checked (2 glossaries, 2 module.md, 10 sessions).
2. Every session file opens cleanly and contains real, completed prose in the correct language (not placeholders).
3. Every EN session has a HE counterpart with matching slug, module, and session fields.
4. The module.md for each language has at least 3 Go Deeper links.
5. `git log` shows incremental, meaningful commits — not a single dump.

When those are true, Module 1 is ready to be consumed by the future website build (separate spec).
