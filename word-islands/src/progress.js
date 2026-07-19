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

// Permanently removes a profile and its progress. If it was the active
// profile, clears activeProfileId so the app falls back to the picker.
export function deleteProfile(state, profileId) {
  return {
    ...state,
    profiles: state.profiles.filter((p) => p.id !== profileId),
    activeProfileId: state.activeProfileId === profileId ? null : state.activeProfileId,
  };
}
