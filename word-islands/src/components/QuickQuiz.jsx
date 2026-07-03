export default function QuickQuiz({ words, onDone }) {
  return (
    <button className="big-btn" onClick={() => onDone(words.length, words.length)}>
      Quiz (stub) — perfect score
    </button>
  );
}
