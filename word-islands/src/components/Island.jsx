import { useState } from 'react';
import { t } from '../i18n.js';
import { starsForScore } from '../gameLogic.js';
import { playStars } from '../sound.js';
import Flashcards from './Flashcards.jsx';
import TapTheRightOne from './TapTheRightOne.jsx';
import MemoryMatch from './MemoryMatch.jsx';
import QuickQuiz from './QuickQuiz.jsx';
import Celebration from './Celebration.jsx';

export default function Island({
  island,
  path,
  lang,
  soundOn,
  collectedCount,
  totalCreatures,
  onComplete,
  onExit,
}) {
  const [phase, setPhase] = useState('learn'); // learn | tap | memory | quiz | reward
  const [stars, setStars] = useState(0);
  const [isNewCreature, setIsNewCreature] = useState(false);
  const young = path === '5-7';

  const playAgain = () => {
    setStars(0);
    setIsNewCreature(false);
    setPhase('learn');
  };

  return (
    <div className="island">
      <div className="island-header">
        <button onClick={onExit}>{lang === 'he' ? '→' : '←'} {t(lang, 'back')}</button>
        <h2>
          {island.icon} {island.name[lang]}
        </h2>
      </div>

      {phase === 'learn' && (
        <Flashcards words={island.words} lang={lang} onDone={() => setPhase('tap')} />
      )}
      {phase === 'tap' && (
        <TapTheRightOne
          words={island.words}
          lang={lang}
          choiceCount={4}
          soundOn={soundOn}
          onDone={() => setPhase('memory')}
        />
      )}
      {phase === 'memory' && (
        <MemoryMatch
          words={island.words}
          lang={lang}
          mode={young ? 'emoji-emoji' : 'emoji-word'}
          soundOn={soundOn}
          onDone={() => setPhase('quiz')}
        />
      )}
      {phase === 'quiz' && (
        <QuickQuiz
          words={island.words}
          lang={lang}
          young={young}
          soundOn={soundOn}
          onDone={(correct, total) => {
            const earned = starsForScore(correct, total);
            setStars(earned);
            playStars(soundOn);
            const isNew = onComplete(earned, island.creature);
            setIsNewCreature(Boolean(isNew));
            setPhase('reward');
          }}
        />
      )}
      {phase === 'reward' && (
        <div className="reward">
          <Celebration />
          <div className="reward-stars">
            {[0, 1, 2].map((i) =>
              i < stars ? (
                <span key={i} className="reward-star filled" style={{ '--d': `${i * 0.13}s` }}>
                  ⭐
                </span>
              ) : (
                <span key={i} className="reward-star empty">
                  ☆
                </span>
              )
            )}
          </div>
          <div className="reward-creature-badge">
            <span className="reward-creature">{island.creature}</span>
            {isNewCreature && <span className="new-tag">{t(lang, 'newTag')}</span>}
          </div>
          <h2>{stars === 3 ? t(lang, 'perfect') : stars === 2 ? t(lang, 'greatJob') : t(lang, 'youDidIt')}</h2>
          {isNewCreature && <p>{t(lang, 'youEarned')}</p>}
          <div className="reward-progress">
            <span className="reward-progress-label">
              {t(lang, 'stickerBook')} {collectedCount} / {totalCreatures}
            </span>
            <div className="reward-progress-bar">
              <div
                className="reward-progress-fill"
                style={{ width: `${totalCreatures ? (collectedCount / totalCreatures) * 100 : 0}%` }}
              />
            </div>
          </div>
          <div className="reward-actions">
            <button className="big-btn" onClick={onExit}>
              {t(lang, 'backToMap')}
            </button>
            <button className="secondary-btn" onClick={playAgain}>
              {t(lang, 'playAgain')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
