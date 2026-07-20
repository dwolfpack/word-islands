// Profile progress + persistence. Storage is injectable for tests;
// the app uses the browser's localStorage by default. Every failure
// falls back to a fresh state — the kid never sees an error.

const STORAGE_KEY = 'wordIslands';

// Leitner box -> days until the word is next due once it lands in that box.
const REVIEW_INTERVALS = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 14 };

// Local date as 'YYYY-MM-DD'. Zero-padded so string comparison equals date order.
export function todayStr(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Adds n days to a 'YYYY-MM-DD' string, returning a 'YYYY-MM-DD' string.
function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return todayStr(dt);
}

function defaultState() {
  return { profiles: [], activeProfileId: null, uiLang: 'en', soundOn: true };
}

export function loadState(storage = globalThis.localStorage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.profiles)) return defaultState();
    return { ...defaultState(), ...parsed };
  } catch {
    return defaultState();
  }
}

export function saveState(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode / quota errors: play on without persistence.
  }
}

export function createProfile(state, { name, avatar, path }) {
  const id = `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const profile = { id, name, avatar, path, islands: {}, creatures: [], reviews: {} };
  return {
    state: { ...state, profiles: [...state.profiles, profile], activeProfileId: id },
    profile,
  };
}

// Records a quiz result: keeps the best star count, awards the creature once.
export function recordResult(state, profileId, islandId, stars, creature) {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      const prev = p.islands[islandId]?.stars || 0;
      const creatures =
        stars >= 1 && !p.creatures.includes(creature) ? [...p.creatures, creature] : p.creatures;
      return {
        ...p,
        islands: { ...p.islands, [islandId]: { stars: Math.max(prev, stars) } },
        creatures,
      };
    }),
  };
}

// On finishing an island, adds any of its words not already tracked to the
// review schedule at box 1, due today. Never resets already-tracked words.
export function enterWordsForIsland(state, profileId, islandId, words, today) {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      const reviews = { ...(p.reviews || {}) };
      for (const w of words) {
        const key = `${islandId}:${w.english}`;
        if (!reviews[key]) reviews[key] = { box: 1, due: today };
      }
      return { ...p, reviews };
    }),
  };
}

// Backfills the review schedule for islands a profile already completed
// before the practice feature existed. Reuses enterWordsForIsland, so words
// already tracked are never reset.
export function backfillReviews(state, profileId, islands, today) {
  const profile = state.profiles.find((p) => p.id === profileId);
  if (!profile) return state;
  let next = state;
  for (const island of islands) {
    if (profile.islands[island.id]) {
      next = enterWordsForIsland(next, profileId, island.id, island.words, today);
    }
  }
  return next;
}

// Keys of words due for review on or before `today`.
export function dueReviews(profile, today) {
  return Object.entries(profile.reviews || {})
    .filter(([, v]) => v.due <= today)
    .map(([k]) => k);
}

// The next practice session: up to `cap` due keys, lowest box first, then
// earliest due first.
export function buildSession(profile, today, cap = 10) {
  const reviews = profile.reviews || {};
  return dueReviews(profile, today)
    .sort((a, b) => reviews[a].box - reviews[b].box || (reviews[a].due < reviews[b].due ? -1 : 1))
    .slice(0, cap);
}

// Applies a practice answer: right promotes a box (capped at 5) and reschedules
// by that box's interval; wrong resets to box 1, due tomorrow. No-op if untracked.
export function recordReview(state, profileId, key, correct, today) {
  return {
    ...state,
    profiles: state.profiles.map((p) => {
      if (p.id !== profileId) return p;
      const entry = (p.reviews || {})[key];
      if (!entry) return p;
      const box = correct ? Math.min(entry.box + 1, 5) : 1;
      const due = correct ? addDays(today, REVIEW_INTERVALS[box]) : addDays(today, 1);
      return { ...p, reviews: { ...p.reviews, [key]: { box, due } } };
    }),
  };
}

// Permanently removes a profile and its progress. If it was the active
// profile, clears activeProfileId so the app falls back to the picker.
export function deleteProfile(state, profileId) {
  return {
    ...state,
    profiles: state.profiles.filter((p) => p.id !== profileId),
    activeProfileId: state.activeProfileId === profileId ? null : state.activeProfileId,
  };
}
