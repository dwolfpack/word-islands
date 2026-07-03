import { t } from '../i18n.js';

export default function StickerBook({ profile, islands, lang, onBack }) {
  return (
    <div className="sticker-book">
      <button onClick={onBack}>← {t(lang, 'back')}</button>
      <h2>
        📖 {t(lang, 'stickerBook')} — {profile.avatar} {profile.name}
      </h2>
      <div className="stickers">
        {islands.map((island) => {
          const earned = profile.creatures.includes(island.creature);
          return (
            <div key={island.id} className={`sticker ${earned ? '' : 'locked'}`}>
              {earned ? island.creature : '❔'}
            </div>
          );
        })}
      </div>
    </div>
  );
}
