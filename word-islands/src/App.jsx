import { useEffect, useState } from 'react';
import {
  loadState,
  saveState,
  createProfile,
  recordResult,
  deleteProfile,
  enterWordsForIsland,
  backfillReviews,
  dueReviews,
  buildSession,
  recordReview,
  todayStr,
} from './progress.js';
import { playCreatureUnlocked } from './sound.js';
import { t } from './i18n.js';
import { MANIFEST, wordForKey } from './content/manifest.js';
import ProfilePicker from './components/ProfilePicker.jsx';
import WorldMap from './components/WorldMap.jsx';
import Island from './components/Island.jsx';
import StickerBook from './components/StickerBook.jsx';
import PracticeSession from './components/PracticeSession.jsx';

export default function App() {
  const [state, setState] = useState(loadState);
  const [screen, setScreen] = useState('profiles'); // profiles | map | island | stickers | practice
  const [islandId, setIslandId] = useState(null);
  const [practice, setPractice] = useState(null); // { entries, pool } snapshot | null

  const lang = state.uiLang || 'en';
  const soundOn = state.soundOn !== false;
  const update = (next) => {
    saveState(next);
    setState(next);
  };
  const updateFn = (fn) =>
    setState((prev) => {
      const next = fn(prev);
      saveState(next);
      return next;
    });

  const profile = state.profiles.find((p) => p.id === state.activeProfileId) || null;
  const islands = profile ? MANIFEST[profile.path] : [];
  const island = islands.find((i) => i.id === islandId) || null;

  const dueCount = profile ? dueReviews(profile, todayStr()).length : 0;

  useEffect(() => {
    if (!profile) return;
    updateFn((prev) => backfillReviews(prev, profile.id, MANIFEST[profile.path], todayStr()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const startPractice = () => {
    const today = todayStr();
    const entries = buildSession(profile, today, 10)
      .map((key) => ({ key, word: wordForKey(profile.path, key), box: profile.reviews[key].box }))
      .filter((e) => e.word);
    if (!entries.length) return;
    const seen = new Set();
    const pool = Object.keys(profile.reviews || {})
      .map((key) => wordForKey(profile.path, key))
      .filter((w) => w && !seen.has(w.english) && seen.add(w.english));
    setPractice({ entries, pool });
    setScreen('practice');
  };

  return (
    <div className="app" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <header className="app-header">
        <h1>🏝️ {t(lang, 'title')}</h1>
        <div className="header-right">
          {profile && screen !== 'profiles' && (
            <button className="chip" onClick={() => setScreen('profiles')}>
              {profile.avatar} {profile.name}
            </button>
          )}
          <button
            className="chip"
            onClick={() => update({ ...state, uiLang: lang === 'en' ? 'he' : 'en' })}
          >
            {lang === 'en' ? 'עברית' : 'English'}
          </button>
          <button className="chip" onClick={() => update({ ...state, soundOn: !soundOn })}>
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </header>
      <main>
        {screen === 'profiles' && (
          <ProfilePicker
            profiles={state.profiles}
            lang={lang}
            onSelect={(id) => {
              update({ ...state, activeProfileId: id });
              setScreen('map');
            }}
            onCreate={(info) => {
              updateFn((prev) => createProfile(prev, info).state);
              setScreen('map');
            }}
            onDelete={(id) => updateFn((prev) => deleteProfile(prev, id))}
          />
        )}
        {screen === 'map' && profile && (
          <WorldMap
            profile={profile}
            islands={islands}
            lang={lang}
            dueCount={dueCount}
            onEnter={(id) => {
              setIslandId(id);
              setScreen('island');
            }}
            onStickers={() => setScreen('stickers')}
            onPractice={startPractice}
          />
        )}
        {screen === 'island' && island && profile && (
          <Island
            island={island}
            path={profile.path}
            lang={lang}
            soundOn={soundOn}
            collectedCount={profile.creatures.length}
            totalCreatures={islands.length}
            onComplete={(stars, creature) => {
              const newCreature = stars >= 1 && !profile.creatures.includes(creature);
              updateFn((prev) => recordResult(prev, profile.id, island.id, stars, creature));
              updateFn((prev) => enterWordsForIsland(prev, profile.id, island.id, island.words, todayStr()));
              // Delay so this doesn't overlap playStars(), which Island.jsx's
              // quiz onDone callback fires in the same tick and which plays
              // out to ~0.51s from AudioContext.currentTime.
              if (newCreature) setTimeout(() => playCreatureUnlocked(soundOn), 550);
              return newCreature;
            }}
            onExit={() => setScreen('map')}
          />
        )}
        {screen === 'stickers' && profile && (
          <StickerBook profile={profile} islands={islands} lang={lang} onBack={() => setScreen('map')} />
        )}
        {screen === 'practice' && profile && practice && (
          <PracticeSession
            entries={practice.entries}
            pool={practice.pool}
            lang={lang}
            young={profile.path === '5-7'}
            soundOn={soundOn}
            onAnswer={(key, correct) =>
              updateFn((prev) => recordReview(prev, profile.id, key, correct, todayStr()))
            }
            onExit={() => setScreen('map')}
          />
        )}
      </main>
    </div>
  );
}
