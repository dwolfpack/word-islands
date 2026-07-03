import { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { speak, isSpeechAvailable } from '../speech.js';

export default function Flashcards({ words, lang, onDone }) {
  const [index, setIndex] = useState(0);
  const word = words[index];

  useEffect(() => {
    speak(word.english);
  }, [word]);

  return (
    <div className="flashcards">
      <p className="instruction">{t(lang, 'learnInstruction')}</p>
      <div className="card" onClick={() => speak(word.english)}>
        <div className="card-emoji">{word.emoji}</div>
        <div className="card-word">{word.english}</div>
        {lang === 'he' && <div className="card-translation">{word.hebrew}</div>}
        {isSpeechAvailable() && (
          <button
            className="audio-btn"
            onClick={(e) => {
              e.stopPropagation();
              speak(word.english);
            }}
          >
            🔊
          </button>
        )}
      </div>
      <div className="nav">
        <button disabled={index === 0} onClick={() => setIndex(index - 1)}>
          ←
        </button>
        <span>
          {index + 1} / {words.length}
        </span>
        {index < words.length - 1 ? (
          <button onClick={() => setIndex(index + 1)}>→</button>
        ) : (
          <button className="big-btn" onClick={onDone}>
            {t(lang, 'letsPlay')}
          </button>
        )}
      </div>
    </div>
  );
}
