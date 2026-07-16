import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n.js';
import { shuffle, makeChoices } from '../gameLogic.js';
import { speak, isSpeechAvailable } from '../speech.js';
import { playCorrect, playIncorrect } from '../sound.js';

const TIME_LIMIT = 10; // seconds per question, 8-10 path only

export default function QuickQuiz({ words, lang, young, soundOn, onDone }) {
  const order = useMemo(() => shuffle(words), [words]);
  const [round, setRound] = useState(0);
  const [answered, setAnswered] = useState(null); // null | 'right' | 'wrong' | 'timeout'
  const [pickedId, setPickedId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const correctRef = useRef(0);
  const target = order[round];
  const choices = useMemo(() => makeChoices(words, target, 4), [words, target]);

  // New question: reset the clock, speak the word for young players.
  useEffect(() => {
    setTimeLeft(TIME_LIMIT);
    if (young) speak(target.english);
  }, [target, young]);

  // Countdown (8-10 only), paused once answered.
  useEffect(() => {
    if (young || answered) return;
    if (timeLeft <= 0) {
      setAnswered('timeout');
      return;
    }
    const id = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, answered, young]);

  // After feedback, advance or finish.
  useEffect(() => {
    if (!answered) return;
    const id = setTimeout(() => {
      if (round + 1 < order.length) {
        setAnswered(null);
        setPickedId(null);
        setRound((r) => r + 1);
      } else {
        onDone(correctRef.current, order.length);
      }
    }, 1000);
    return () => clearTimeout(id);
  }, [answered, round, order.length, onDone]);

  const pick = (word) => {
    if (answered) return;
    const right = word.english === target.english;
    if (right) {
      correctRef.current += 1;
      playCorrect(soundOn);
    } else {
      playIncorrect(soundOn);
    }
    setPickedId(word.english);
    setAnswered(right ? 'right' : 'wrong');
  };

  const choiceClass = (word) => {
    if (!answered) return 'choice';
    if (word.english === target.english) return 'choice right';
    if (word.english === pickedId) return 'choice wrong';
    return 'choice';
  };

  return (
    <div className="game">
      <p className="instruction">{t(lang, 'quizInstruction')}</p>
      {!young && (
        <div className="timer-bar">
          <div className="timer-fill" style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }} />
        </div>
      )}
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
              <span className="prompt-word" style={{ fontSize: '1.4rem' }}>{word.english}</span>
            )}
          </button>
        ))}
      </div>
      <p className="progress-text">
        {round + 1} / {order.length}
      </p>
    </div>
  );
}
