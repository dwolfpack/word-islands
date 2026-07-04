import { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { speak, isSpeechAvailable } from '../speech.js';
import { videoEmbedUrl } from '../video.js';

export default function Flashcards({ words, lang, onDone }) {
  const [index, setIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const word = words[index];
  const embedUrl = videoEmbedUrl(word.video);

  useEffect(() => {
    speak(word.english);
    setVideoOpen(false);
  }, [word.english]);

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
        {embedUrl && (
          <button
            className="video-btn"
            onClick={(e) => {
              e.stopPropagation();
              setVideoOpen(true);
            }}
          >
            🎬 {t(lang, 'watchVideo')}
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
      {videoOpen && embedUrl && (
        <div className="video-overlay" onClick={() => setVideoOpen(false)}>
          <div className="video-box" onClick={(e) => e.stopPropagation()}>
            <button className="video-close" onClick={() => setVideoOpen(false)}>
              ✖
            </button>
            <iframe
              src={embedUrl}
              title={`${word.english} video`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
}
