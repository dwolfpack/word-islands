import { describe, it, expect } from 'vitest';
import {
  loadState,
  saveState,
  createProfile,
  recordResult,
  deleteProfile,
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
