import { useEffect, useMemo, useState } from 'react';
import { t } from '../i18n.js';
import { shuffle, makeChoices } from '../gameLogic.js';
import { speak, isSpeechAvailable } from '../speech.js';
import { playCorrect, playIncorrect } from '../sound.js';

export default function TapTheRightOne({ words, lang, choiceCount, soundOn, onDone }) {
  const order = useMemo(() => shuffle(words), [words]);
  const [round, setRound] = useState(0);
  const [wrongId, setWrongId] = useState(null);
  const target = order[round];
  const choices = useMemo(
    () => makeChoices(words, target, choiceCount),
    [words, target, choiceCount]
  );

  useEffect(() => {
    speak(target.english);
  }, [target]);

  const pick = (word) => {
    if (word.english === target.english) {
      playCorrect(soundOn);
      setWrongId(null);
      if (round + 1 < order.length) setRound(round + 1);
      else onDone();
    } else {
      playIncorrect(soundOn);
      setWrongId(word.english);
    }
  };

  return (
    <div className="game">
      <p className="instruction">{t(lang, 'tapInstruction')}</p>
      <div className="prompt">
        <span className="prompt-word">{target.english}</span>
        {isSpeechAvailable() && (
          <button className="audio-btn" onClick={() => speak(target.english)}>
            🔊
          </button>
        )}
      </div>
      <div className="choices">
        {choices.map((word) => (
          <button
            key={word.english}
            className={`choice ${wrongId === word.english ? 'wrong' : ''}`}
            onClick={() => pick(word)}
          >
            <span className="choice-emoji">{word.emoji}</span>
          </button>
        ))}
      </div>
      <p className="progress-text">
        {round + 1} / {order.length}
      </p>
      {wrongId && <p className="feedback">{t(lang, 'tryAgain')}</p>}
    </div>
  );
}
