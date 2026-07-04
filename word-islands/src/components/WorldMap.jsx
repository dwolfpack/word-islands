import { t } from '../i18n.js';
import { isIslandUnlocked } from '../progress.js';

export default function WorldMap({ profile, islands, lang, onEnter, onStickers }) {
  return (
    <div className="world-map">
      <div className="map-top">
        <h2>{t(lang, 'chooseIsland')}</h2>
        <button onClick={onStickers}>
          📖 {t(lang, 'stickerBook')} ({profile.creatures.length}/{islands.length})
        </button>
      </div>
      <div className="islands">
        {islands.map((island, i) => {
          const unlocked = isIslandUnlocked(profile, i, islands);
          const stars = profile.islands[island.id]?.stars || 0;
          return (
            <button
              key={island.id}
              className={`island-tile ${unlocked ? '' : 'locked'}`}
              disabled={!unlocked}
              onClick={() => onEnter(island.id)}
            >
              <span className="island-icon">{unlocked ? island.icon : '🔒'}</span>
              <span className="island-name">{island.name[lang]}</span>
              <span className="island-stars">
                {'⭐'.repeat(stars)}
                {'☆'.repeat(3 - stars)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
