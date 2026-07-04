import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../i18n.js';
import { makePairs } from '../gameLogic.js';
import { speak } from '../speech.js';

const PAIR_COUNT = 6;

export default function MemoryMatch({ words, lang, mode, onDone }) {
  const cards = useMemo(() => makePairs(words, PAIR_COUNT, mode), [words, mode]);
  const [flipped, setFlipped] = useState([]); // up to 2 card ids currently face up
  const [matched, setMatched] = useState([]); // matched wordIds
  const [busy, setBusy] = useState(false); // true while a wrong pair is showing
  const timeoutRef = useRef(null);

  // Cancel any pending reveal/finish timer if the player exits mid-game.
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const flip = (card) => {
    if (busy || flipped.includes(card.id) || matched.includes(card.wordId)) return;
    if (mode === 'emoji-emoji') speak(card.word.english);
    const next = [...flipped, card.id];
    setFlipped(next);
    if (next.length === 2) {
      const [a, b] = next.map((id) => cards.find((c) => c.id === id));
      if (a.wordId === b.wordId) {
        speak(a.word.english);
        const nowMatched = [...matched, a.wordId];
        setMatched(nowMatched);
        setFlipped([]);
        if (nowMatched.length === PAIR_COUNT) timeoutRef.current = setTimeout(onDone, 900);
      } else {
        setBusy(true);
        timeoutRef.current = setTimeout(() => {
          setFlipped([]);
          setBusy(false);
        }, 900);
      }
    }
  };

  return (
    <div className="game">
      <p className="instruction">{t(lang, 'memoryInstruction')}</p>
      <div className="memory-grid">
        {cards.map((card) => {
          const isMatched = matched.includes(card.wordId);
          const up = flipped.includes(card.id) || isMatched;
          return (
            <button
              key={card.id}
              className={`memory-card ${up ? 'up' : ''} ${isMatched ? 'matched' : ''}`}
              onClick={() => flip(card)}
            >
              {up ? (
                card.face === 'word' ? (
                  <span className="memory-word">{card.word.english}</span>
                ) : (
                  <span className="memory-emoji">{card.word.emoji}</span>
                )
              ) : (
                '❓'
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
