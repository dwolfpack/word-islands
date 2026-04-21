# AI Introduction Curriculum — Design Spec

**Date:** 2026-04-21
**Author:** Dror Wolf (with Claude)
**Status:** Curriculum design approved; website is a separate follow-on spec.

---

## 1. Purpose & Scope

This spec defines the **curriculum** for an introduction-to-AI learning program that Dror's family will consume via a dedicated website. The goal is to take complete beginners (mixed ages, kids 10+) and grow them into confident, critical **power users** of modern AI chat tools and a first taste of agents.

**In scope (this spec):**
- Curriculum structure: modules, sessions, learning objectives.
- Session anatomy (the lesson template used everywhere).
- Content principles (tone, bilingual handling, age-accessibility).
- Exercise mode design (per-session A/B/C picker).
- Module 1 content blueprint (the first draft template).

**Out of scope (separate spec):**
- Website architecture, tech stack, data model, auth flow, UI design.
- Full content of Modules 2–5 (drafted after Module 1 is validated).

---

## 2. Audience & Goal

- **Audience:** Dror's family — mixed ages, including kids 10 years and up. Tone must be accessible but never childish.
- **Goal:** Power users. After completing the full program, a learner should be able to:
  - Use ChatGPT, Claude, and Gemini confidently for real tasks.
  - Write effective prompts using established patterns.
  - Compare tools and pick the right one for a task.
  - Spot hallucinations and protect their privacy.
  - Understand, at a plain-language level, what agents are and how AI works.

---

## 3. Format Decisions

| Decision | Value |
|---|---|
| Session length | Up to 15 minutes |
| Structure | Modular — ~5 modules × ~5 sessions each |
| Release model | Open-ended; ship MVP (Module 1) first, grow over time |
| Tool focus | Chat (ChatGPT, Claude, Gemini) + agents. No focus on image/voice. |
| Languages | Bilingual EN + HE, with a toggle. HE rendered RTL. Examples localized where helpful. |
| Progress model | Per-user accounts; progress syncs across devices. |
| Exercise modes | Per-session user pick: (A) go try externally, (B) copy prompt, (C) in-page chat widget |
| Content drafting | Claude drafts Module 1 fully as a template, then Dror decides on continuation |

---

## 4. Curriculum Structure — Approach 2: Application First

Chosen because it hooks mixed-age learners with utility in session 1 and layers concepts in as they become relevant. Approach 1 (Foundations First) is retained as a documented fallback in project memory in case Approach 2 underperforms during execution.

### Module 1 — Your First AI Conversations
1. Meet AI: what it is, what it isn't
2. Your first real task with AI
3. The golden rule: AI can be confidently wrong
4. Safety & privacy: what never to share
5. Module 1 recap + weekly challenge

### Module 2 — Better Prompts, Better Results
1. Why the same question gives different answers
2. Pattern 1: Give it a role
3. Pattern 2: Show examples (few-shot)
4. Pattern 3: Think step-by-step
5. Prompt makeover workshop

### Module 3 — Picking the Right Tool
1. Meet ChatGPT, Claude, and Gemini
2. Head-to-head: the same prompt in all three
3. Each tool's personality & strengths
4. Hallucinations in the wild: spotting and verifying
5. Your "which-tool-when" mental map

### Module 4 — Personalizing AI
1. Custom GPTs & Claude Projects — what and why
2. Build your first Custom GPT
3. AI as a tutor (Feynman-style)
4. AI for creative writing and brainstorming
5. AI for daily life: trips, meals, planning

### Module 5 — Agents & Looking Under the Hood
1. What is an "agent"? (vs. a chatbot)
2. A simple agent in action
3. How AI actually works (tokens, patterns — plain language)
4. Ethics: bias, jobs, deepfakes, AI-generated content
5. Where it's going + your family's next steps

### Per-Module "Go Deeper" Panel
At the end of **every** module, a curated resource panel with 3–5 YouTube links (creators such as 3Blue1Brown, Andrej Karpathy, Fireship, Two Minute Papers, Computerphile; plus Hebrew-language equivalents in the HE version). Each link carries a one-line "what you'll learn" blurb.

---

## 5. Session Anatomy

Every 15-minute session follows the same shape:

1. **Hook (~1 min)** — a sentence answering "why should I care?"
2. **Core idea (~3 min)** — one concept, plain language, one analogy max.
3. **Show me (~2 min)** — a concrete example (prompt + answer, screenshot, or short clip).
4. **Your turn — pick a mode (~7 min)** — A, B, or C (see §7).
5. **Wrap-up (~2 min)** — one-sentence recap + one reflection question + "mark complete" button.

**Persistent elements on every session page:**
- Collapsible **"For younger learners"** box where simplification helps.
- **Glossary chips** — every jargon term is clickable, opens a one-line definition.
- Estimated session time shown at the top.

---

## 6. Content Principles

Applied when authoring every lesson:

- **One concept per session.** Two concepts = two sessions.
- **Show, don't just tell.** At least one concrete example per session.
- **Plain language first, jargon second.** Introduce a term only after demonstrating it. All jargon becomes a glossary chip.
- **Mixed-age tone.** Default prose reads naturally to a curious adult; add a "For younger learners" collapsible wherever a 10-year-old would stall.
- **Bilingual parity, not literal translation.** EN and HE versions each exist as first-class content. HE examples are localized (Hebrew prompts, Israeli context where it helps). HE renders RTL.
- **Tool-neutral.** Real products shown honestly. No fanboy language, no "AI is magic," no doomerism.
- **Honesty over hype.** Limitations acknowledged. Hallucinations and privacy intentionally land in Module 1.
- **No dead ends.** Every session ends with something actionable.
- **Safety defaults for kids.** No example prompt asks a kid to paste personal info. Model "what not to paste."

---

## 7. Exercise Modes

Each session exposes a mode picker. The session author sets a default; the user can override.

### Mode A — "Go try it" (external)
- Card with: target tool, direct link (opens in new tab), numbered step-by-step instructions.
- No site-side capture of the learner's prompt or response.
- Return-to-site "I did it" button advances the session.
- Best for: exercises that must use the real tool (tool comparisons in M3, Custom GPTs in M4).

### Mode B — "Copy this prompt"
- Prompt block with a one-click copy button and brief "paste this into any AI chat" guidance.
- Optional expandable "sample answer" preview.
- Best for: quick try-it-yourself moments that don't strictly require leaving the site.

### Mode C — "Try it here" (in-page chat)
- Embedded chat widget pre-configured with a system prompt matching the lesson.
- Conversation is scoped to the session — not persistent across sessions.
- **Cost control:** per-user rate limit (default ~20 messages/day, configurable).
- **Model default:** one cheap model (Claude Haiku or GPT-4o-mini class) so family-scale cost is trivial.
- **Key management:** API key server-side only; never exposed to the browser.
- Best for: rapid experimentation without tab-switching; friendlier for younger learners who find signing up for real tools annoying.

---

## 8. Module 1 Content Blueprint (the Template)

Module 1 is the first fully-drafted module. It sets the content pattern for every later module.

### M1.S1 — Meet AI: what it is, what it isn't
- **Hook:** "You've probably used AI today without noticing. Here's the one you haven't."
- **Core idea:** AI as a very well-read assistant that writes one word at a time. Not a search engine, not a brain, not a person.
- **Show me:** one prompt → one response, annotated.
- **Your turn:** mode picker — "Say hi and ask it to introduce itself."
- **Wrap:** reflection — "What surprised you?"

### M1.S2 — Your first real task with AI
- **Hook:** Pick a real, small task from your week.
- **Core idea:** AI works best on concrete tasks, not vague ones.
- **Show me:** vague prompt vs. specific prompt, side by side.
- **Your turn:** do a real task (homework help / email draft / meal idea) in the chosen mode.
- **Wrap:** reflection — "Was the first answer or the second try better?"

### M1.S3 — The golden rule: AI can be confidently wrong
- **Hook:** a famous hallucination example (non-scary, ideally funny).
- **Core idea:** AI can make up facts and sound certain. Sanity-check important things.
- **Show me:** a wrong answer we let the model generate, then the real answer.
- **Your turn:** try a "trap" prompt and see how the AI handles it.
- **Wrap:** reflection — "Where would it matter most that you checked?"

### M1.S4 — Safety & privacy: what never to share
- **Hook:** "Imagine printing your prompt on a billboard."
- **Core idea:** Don't paste what you'd hate to see public — passwords, ID numbers, sensitive health/financial info, others' private info.
- **Show me:** a "red-line" prompt rewritten into a safe version.
- **Your turn:** take a "bad" example prompt and rewrite it to be safe.
- **Wrap:** reflection — "Family rule you'd want everyone to follow?"

### M1.S5 — Module 1 recap + weekly challenge
- **Hook:** what you can now do that you couldn't last week.
- **Core idea:** consolidation — one sentence per prior session.
- **Show me:** small checklist of "you've learned."
- **Your turn:** "This week, use AI for one real thing and share it at dinner."
- **Wrap:** reflection → unlock Module 2.

### M1 "Go Deeper" Panel (candidate list)
- 3Blue1Brown — *But what is a neural network?*
- Andrej Karpathy — *Intro to Large Language Models*
- Fireship — *ChatGPT in 100 seconds*
- One Hebrew-language equivalent (TBD during content drafting)
- One additional slot reserved for a short, family-friendly "what is AI" explainer

---

## 9. Open Questions (for the website spec, not this one)

- Exact tech stack and hosting for the website.
- Auth approach (email/password, magic link, or OAuth).
- Data model for user progress, language preference, and per-session mode default.
- Where session content is stored (markdown files in repo vs. CMS).
- How the Mode C chat widget integrates: which API, key management, rate-limit storage.
- Analytics — if any — and what we'd measure.

These are intentionally deferred. The next brainstorm covers the website.

---

## 10. Fallback

If Approach 2 (Application First) underperforms in practice — for example, if learners struggle without concept scaffolding early — **Approach 1 (Foundations First)** is retained as an alternative curriculum structure:

- M1: What is AI? (concepts, light "how it works," hallucinations, privacy)
- M2: Chat basics (ChatGPT, Claude, Gemini)
- M3: Prompt craft (patterns, roles, examples)
- M4: Applying AI (learning, creative, planning)
- M5: Power moves (Custom GPTs, agents, ethics)

Switching approaches is a conscious decision, not a drift — propose it explicitly if signals warrant.
