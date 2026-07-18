import { useMemo } from 'react';

const CONFETTI_COLORS = ['#ff8a3d', '#4caf50', '#ef5350', '#42a5f5', '#ffca28', '#ab47bc'];

// A pure-CSS burst: falling confetti pieces + a few rising balloons.
// pointer-events:none so it never blocks the buttons underneath. All
// randomness is fixed once on mount, so each reward screen is a fresh burst.
export default function Celebration() {
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, () => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.5,
        duration: 1.8 + Math.random() * 0.7,
        rotate: Math.floor(Math.random() * 360),
      })),
    []
  );
  const balloons = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        left: 5 + Math.random() * 90,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 0.8,
      })),
    []
  );

  return (
    <div className="celebration" aria-hidden="true">
      {confetti.map((c, i) => (
        <span
          key={`c${i}`}
          className="confetti-piece"
          style={{
            left: `${c.left}%`,
            background: c.color,
            animationDelay: `${c.delay}s`,
            animationDuration: `${c.duration}s`,
            '--r': `${c.rotate}deg`,
          }}
        />
      ))}
      {balloons.map((b, i) => (
        <span
          key={`b${i}`}
          className="balloon"
          style={{
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
          }}
        >
          🎈
        </span>
      ))}
    </div>
  );
}
