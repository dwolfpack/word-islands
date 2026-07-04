import { useState } from 'react';
import { loadState, saveState, createProfile, recordResult } from './progress.js';
import { t } from './i18n.js';
import { MANIFEST } from './content/manifest.js';
import ProfilePicker from './components/ProfilePicker.jsx';
import WorldMap from './components/WorldMap.jsx';
import Island from './components/Island.jsx';
import StickerBook from './components/StickerBook.jsx';

export default function App() {
  const [state, setState] = useState(loadState);
  const [screen, setScreen] = useState('profiles'); // profiles | map | island | stickers
  const [islandId, setIslandId] = useState(null);

  const lang = state.uiLang || 'en';
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
          />
        )}
        {screen === 'map' && profile && (
          <WorldMap
            profile={profile}
            islands={islands}
            lang={lang}
            onEnter={(id) => {
              setIslandId(id);
              setScreen('island');
            }}
            onStickers={() => setScreen('stickers')}
          />
        )}
        {screen === 'island' && island && profile && (
          <Island
            island={island}
            path={profile.path}
            lang={lang}
            onComplete={(stars, creature) =>
              updateFn((prev) => recordResult(prev, profile.id, island.id, stars, creature))
            }
            onExit={() => setScreen('map')}
          />
        )}
        {screen === 'stickers' && profile && (
          <StickerBook profile={profile} islands={islands} lang={lang} onBack={() => setScreen('map')} />
        )}
      </main>
    </div>
  );
}
