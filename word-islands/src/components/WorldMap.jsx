import { t } from '../i18n.js';

export default function WorldMap({ profile, islands, lang, dueCount, onEnter, onStickers, onPractice }) {
  return (
    <div className="world-map">
      <div className="map-top">
        <h2>{t(lang, 'chooseIsland')}</h2>
        <div className="map-top-buttons">
          <button onClick={onStickers}>
            📖 {t(lang, 'stickerBook')} ({profile.creatures.length}/{islands.length})
          </button>
          {dueCount > 0 ? (
            <button className="practice-btn" onClick={onPractice}>
              🔁 {t(lang, 'practice')} ({dueCount})
            </button>
          ) : (
            <button className="practice-btn practice-done" disabled>
              🔁 {t(lang, 'allCaughtUp')} 🌟
            </button>
          )}
        </div>
      </div>
      <div className="islands">
        {islands.map((island) => {
          const stars = profile.islands[island.id]?.stars || 0;
          return (
            <button key={island.id} className="island-tile" onClick={() => onEnter(island.id)}>
              <span className="island-icon">{island.icon}</span>
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
