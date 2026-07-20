import { useEffect, useMemo, useState } from 'react';
import { t } from '../i18n.js';
import { makeChoices } from '../gameLogic.js';
import { speak, isSpeechAvailable } from '../speech.js';
import { playCorrect, playIncorrect } from '../sound.js';
import Celebration from './Celebration.jsx';

// A spaced-repetition practice session over pre-selected due words. Reuses the
// island quiz mechanic (young: hear word -> tap emoji; older: see emoji -> tap
// word). Reports each answer up via onAnswer so App updates the schedule live.
export default function PracticeSession({ entries, pool, lang, young, soundOn, onAnswer, onExit }) {
  const [round, setRound] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'right' | 'wrong'
  const [pickedId, setPickedId] = useState(null);
  const [movedUp, setMovedUp] = useState(0);
  const entry = entries[round];
  const target = entry?.word;
  const choices = useMemo(
    () => (target ? makeChoices(pool, target, 4) : []),
    [pool, target]
  );

  useEffect(() => {
    if (young && target) speak(target.english);
  }, [target, young]);

  const done = round >= entries.length;

  const pick = (word) => {
    if (answered) return;
    const right = word.english === target.english;
    if (right) {
      playCorrect(soundOn);
      if (entry.box < 5) setMovedUp((m) => m + 1);
    } else {
      playIncorrect(soundOn);
    }
    onAnswer(entry.key, right);
    setPickedId(word.english);
    setAnswered(right ? 'right' : 'wrong');
  };

  useEffect(() => {
    if (!answered) return;
    const id = setTimeout(() => {
      setAnswered(null);
      setPickedId(null);
      setRound((r) => r + 1);
    }, 1000);
    return () => clearTimeout(id);
  }, [answered]);

  const choiceClass = (word) => {
    if (!answered) return 'choice';
    if (word.english === target.english) return 'choice right';
    if (word.english === pickedId) return 'choice wrong';
    return 'choice';
  };

  if (done) {
    return (
      <div className="reward">
        <Celebration />
        <h2>{t(lang, 'greatJob')}</h2>
        <p>
          {t(lang, 'youPracticed')} {entries.length}{' '}
          {t(lang, entries.length === 1 ? 'wordWord' : 'wordsWord')} 🌟
        </p>
        {movedUp > 0 && (
          <p>
            {movedUp} {t(lang, movedUp === 1 ? 'movedUpOne' : 'movedUp')}
          </p>
        )}
        <div className="reward-actions">
          <button className="big-btn" onClick={onExit}>
            {t(lang, 'backToMap')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game">
      <div className="island-header">
        <button onClick={onExit}>{lang === 'he' ? '→' : '←'} {t(lang, 'back')}</button>
      </div>
      <p className="instruction">{t(lang, 'practiceInstruction')}</p>
      <div className="prompt">
        {young ? (
          <>
            <span className="prompt-word">{target.english}</span>
            {isSpeechAvailable() && (
              <button className="audio-btn" onClick={() => speak(target.english)}>
                🔊
              </button>
            )}
          </>
        ) : (
          <span className="prompt-emoji">{target.emoji}</span>
        )}
      </div>
      <div className="choices">
        {choices.map((word) => (
          <button key={word.english} className={choiceClass(word)} onClick={() => pick(word)}>
            {young ? (
              <span className="choice-emoji">{word.emoji}</span>
            ) : (
              <span className="prompt-word" style={{ fontSize: '1.4rem' }}>
                {word.english}
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="progress-text">
        {round + 1} / {entries.length}
      </p>
    </div>
  );
}
