import { useState } from 'react';
import { t } from '../i18n.js';
import { starsForScore } from '../gameLogic.js';
import { playStars } from '../sound.js';
import Flashcards from './Flashcards.jsx';
import TapTheRightOne from './TapTheRightOne.jsx';
import MemoryMatch from './MemoryMatch.jsx';
import QuickQuiz from './QuickQuiz.jsx';

export default function Island({ island, path, lang, soundOn, onComplete, onExit }) {
  const [phase, setPhase] = useState('learn'); // learn | tap | memory | quiz | reward
  const [stars, setStars] = useState(0);
  const young = path === '5-7';

  return (
    <div className="island">
      <div className="island-header">
        <button onClick={onExit}>← {t(lang, 'back')}</button>
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
          choiceCount={young ? 3 : 4}
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
            onComplete(earned, island.creature);
            setPhase('reward');
          }}
        />
      )}
      {phase === 'reward' && (
        <div className="reward">
          <div className="reward-stars">{'⭐'.repeat(stars)}</div>
          <div className="reward-creature">{island.creature}</div>
          <h2>{t(lang, 'greatJob')}</h2>
          <p>{t(lang, 'youEarned')}</p>
          <button className="big-btn" onClick={onExit}>
            {t(lang, 'backToMap')}
          </button>
        </div>
      )}
    </div>
  );
}
