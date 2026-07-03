// Profile progress + persistence. Storage is injectable for tests;
// the app uses the browser's localStorage by default. Every failure
// falls back to a fresh state — the kid never sees an error.

const STORAGE_KEY = 'wordIslands';

function defaultState() {
  return { profiles: [], activeProfileId: null, uiLang: 'en' };
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
  const profile = { id, name, avatar, path, islands: {}, creatures: [] };
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

// Island 0 is always open; each next island needs 2+ stars on the previous one.
export function isIslandUnlocked(profile, index, islands) {
  if (index === 0) return true;
  const prev = islands[index - 1];
  return (profile.islands[prev.id]?.stars || 0) >= 2;
}
