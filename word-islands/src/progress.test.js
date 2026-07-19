import { describe, it, expect } from 'vitest';
import {
  loadState,
  saveState,
  createProfile,
  recordResult,
  deleteProfile,
  todayStr,
  enterWordsForIsland,
  dueReviews,
  buildSession,
  recordReview,
} from './progress.js';

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

describe('loadState', () => {
  it('returns default state when storage is empty', () => {
    const s = loadState(fakeStorage());
    expect(s).toEqual({ profiles: [], activeProfileId: null, uiLang: 'en', soundOn: true });
  });

  it('round-trips through saveState', () => {
    const storage = fakeStorage();
    const s = loadState(storage);
    const { state: withProfile } = createProfile(s, { name: 'Noa', avatar: '🦊', path: '5-7' });
    saveState(withProfile, storage);
    const reloaded = loadState(storage);
    expect(reloaded.profiles).toHaveLength(1);
    expect(reloaded.profiles[0].name).toBe('Noa');
    expect(reloaded.activeProfileId).toBe(reloaded.profiles[0].id);
  });

  it('falls back to default state on corrupt JSON', () => {
    const s = loadState(fakeStorage({ wordIslands: '{not json!!' }));
    expect(s).toEqual({ profiles: [], activeProfileId: null, uiLang: 'en', soundOn: true });
  });

  it('falls back to default state when profiles is not an array', () => {
    const s = loadState(fakeStorage({ wordIslands: '{"profiles": 42}' }));
    expect(s.profiles).toEqual([]);
  });

  it('does not throw when storage itself is unavailable', () => {
    expect(() => loadState(undefined)).not.toThrow();
    expect(loadState(undefined).profiles).toEqual([]);
  });
});

describe('createProfile', () => {
  it('adds a profile with empty progress and makes it active', () => {
    const { state, profile } = createProfile(loadState(fakeStorage()), {
      name: 'Adam',
      avatar: '🐼',
      path: '8-10',
    });
    expect(profile.islands).toEqual({});
    expect(profile.creatures).toEqual([]);
    expect(profile.path).toBe('8-10');
    expect(state.activeProfileId).toBe(profile.id);
  });

  it('gives distinct ids to profiles created back-to-back', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    expect(a.profile.id).not.toBe(b.profile.id);
  });
});

describe('recordResult', () => {
  function stateWithProfile() {
    return createProfile(loadState(fakeStorage()), { name: 'Noa', avatar: '🦊', path: '5-7' });
  }

  it('records stars and awards the creature', () => {
    const { state, profile } = stateWithProfile();
    const next = recordResult(state, profile.id, 'animals', 2, '🦁');
    expect(next.profiles[0].islands.animals.stars).toBe(2);
    expect(next.profiles[0].creatures).toEqual(['🦁']);
  });

  it('keeps the best star count on replay and does not duplicate creatures', () => {
    const { state, profile } = stateWithProfile();
    let next = recordResult(state, profile.id, 'animals', 3, '🦁');
    next = recordResult(next, profile.id, 'animals', 1, '🦁');
    expect(next.profiles[0].islands.animals.stars).toBe(3);
    expect(next.profiles[0].creatures).toEqual(['🦁']);
  });

  it('does not modify other profiles', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    const next = recordResult(b.state, b.profile.id, 'animals', 2, '🦁');
    const profileA = next.profiles.find((p) => p.id === a.profile.id);
    expect(profileA.islands).toEqual({});
  });
});

describe('deleteProfile', () => {
  it('removes the target profile', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    const next = deleteProfile(b.state, a.profile.id);
    expect(next.profiles).toHaveLength(1);
    expect(next.profiles[0].id).toBe(b.profile.id);
  });

  it('clears activeProfileId when the deleted profile was active', () => {
    const { state, profile } = createProfile(loadState(fakeStorage()), {
      name: 'A',
      avatar: '🦊',
      path: '5-7',
    });
    expect(state.activeProfileId).toBe(profile.id);
    const next = deleteProfile(state, profile.id);
    expect(next.activeProfileId).toBeNull();
  });

  it('leaves activeProfileId untouched when a different profile is deleted', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    const next = deleteProfile(b.state, a.profile.id);
    expect(next.activeProfileId).toBe(b.profile.id);
  });

  it('is a no-op for an unknown profile id', () => {
    const { state } = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const next = deleteProfile(state, 'no-such-id');
    expect(next.profiles).toHaveLength(1);
    expect(next.activeProfileId).toBe(state.activeProfileId);
  });
});

describe('createProfile reviews', () => {
  it('seeds an empty reviews map on new profiles', () => {
    const { profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
    expect(profile.reviews).toEqual({});
  });
});

describe('todayStr', () => {
  it('formats a date as local YYYY-MM-DD', () => {
    expect(todayStr(new Date(2026, 6, 4))).toBe('2026-07-04');
    expect(todayStr(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('enterWordsForIsland', () => {
  const WORDS = [
    { english: 'dog', hebrew: 'כלב', emoji: '🐶' },
    { english: 'cat', hebrew: 'חתול', emoji: '🐱' },
  ];
  function seeded() {
    return createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
  }

  it('adds untracked island words at box 1, due today', () => {
    const { state, profile } = seeded();
    const next = enterWordsForIsland(state, profile.id, 'animals', WORDS, '2026-07-04');
    expect(next.profiles[0].reviews).toEqual({
      'animals:dog': { box: 1, due: '2026-07-04' },
      'animals:cat': { box: 1, due: '2026-07-04' },
    });
  });

  it('does not reset words already tracked', () => {
    const { state, profile } = seeded();
    let next = enterWordsForIsland(state, profile.id, 'animals', WORDS, '2026-07-04');
    next.profiles[0].reviews['animals:dog'] = { box: 3, due: '2026-07-20' };
    const again = enterWordsForIsland(next, profile.id, 'animals', WORDS, '2026-07-10');
    expect(again.profiles[0].reviews['animals:dog']).toEqual({ box: 3, due: '2026-07-20' });
    expect(again.profiles[0].reviews['animals:cat']).toEqual({ box: 1, due: '2026-07-04' });
  });

  it('does not modify other profiles', () => {
    const a = createProfile(loadState(fakeStorage()), { name: 'A', avatar: '🦊', path: '5-7' });
    const b = createProfile(a.state, { name: 'B', avatar: '🐼', path: '5-7' });
    const next = enterWordsForIsland(b.state, b.profile.id, 'animals', WORDS, '2026-07-04');
    const profileA = next.profiles.find((p) => p.id === a.profile.id);
    expect(profileA.reviews).toEqual({});
  });
});

function profileWithReviews(reviews) {
  const { state, profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
  profile.reviews = reviews;
  return { state, profile };
}

describe('dueReviews', () => {
  it('returns only keys due on or before today', () => {
    const { profile } = profileWithReviews({
      'animals:dog': { box: 1, due: '2026-07-04' },
      'animals:cat': { box: 2, due: '2026-07-10' },
      'animals:fish': { box: 1, due: '2026-07-03' },
    });
    expect(dueReviews(profile, '2026-07-04').sort()).toEqual(['animals:dog', 'animals:fish']);
  });

  it('is empty when nothing is tracked', () => {
    const { profile } = profileWithReviews({});
    expect(dueReviews(profile, '2026-07-04')).toEqual([]);
  });
});

describe('buildSession', () => {
  it('orders by lowest box then earliest due, and caps the count', () => {
    const reviews = {};
    for (let i = 0; i < 12; i++) reviews[`animals:w${i}`] = { box: 1, due: '2026-07-01' };
    reviews['animals:hi'] = { box: 3, due: '2026-06-01' }; // higher box, should come after box-1s
    const { profile } = profileWithReviews(reviews);
    const session = buildSession(profile, '2026-07-04', 10);
    expect(session).toHaveLength(10);
    expect(session).not.toContain('animals:hi'); // box-1 words fill the cap first
  });

  it('returns all due when fewer than the cap', () => {
    const { profile } = profileWithReviews({
      'animals:dog': { box: 2, due: '2026-07-02' },
      'animals:cat': { box: 1, due: '2026-07-03' },
    });
    // cat (box 1) before dog (box 2)
    expect(buildSession(profile, '2026-07-04', 10)).toEqual(['animals:cat', 'animals:dog']);
  });
});

describe('recordReview', () => {
  function stateWith(reviews) {
    const { state, profile } = createProfile(loadState(fakeStorage()), { name: 'N', avatar: '🦊', path: '5-7' });
    profile.reviews = reviews;
    return { state, profileId: profile.id };
  }

  it('promotes a correct answer and reschedules by the new box interval', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 2, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:dog', true, '2026-07-04');
    expect(next.profiles[0].reviews['animals:dog']).toEqual({ box: 3, due: '2026-07-08' }); // +4
  });

  it('keeps a correct box-5 answer at box 5, rescheduled +14', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 5, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:dog', true, '2026-07-04');
    expect(next.profiles[0].reviews['animals:dog']).toEqual({ box: 5, due: '2026-07-18' }); // +14
  });

  it('resets a wrong answer to box 1, due tomorrow', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 4, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:dog', false, '2026-07-04');
    expect(next.profiles[0].reviews['animals:dog']).toEqual({ box: 1, due: '2026-07-05' }); // +1
  });

  it('is a no-op for an untracked key', () => {
    const { state, profileId } = stateWith({ 'animals:dog': { box: 1, due: '2026-07-04' } });
    const next = recordReview(state, profileId, 'animals:nope', true, '2026-07-04');
    expect(next.profiles[0].reviews).toEqual({ 'animals:dog': { box: 1, due: '2026-07-04' } });
  });
});
