import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  shape: 'circle' | 'square' | 'triangle';
  delay: number;
  duration: number;
  rotation: number;
}

const SHAPES: ('circle' | 'square' | 'triangle')[] = ['circle', 'square', 'triangle'];
const COLORS = [
  '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', 
  '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#a855f7'
];

export default function Confetti() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < 80; i++) {
      arr.push({
        id: i,
        x: Math.random() * 100, // Left %
        y: Math.random() * -20 - 5, // Top start %
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 6, // size in px
        shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
        delay: Math.random() * 4, // delay in s
        duration: Math.random() * 3 + 3, // duration in s
        rotation: Math.random() * 360
      });
    }
    setParticles(arr);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {particles.map((p) => {
        const shapeStyle =
          p.shape === 'circle'
            ? 'rounded-full'
            : p.shape === 'triangle'
            ? 'clip-triangle'
            : 'rounded-sm';

        return (
          <div
            key={p.id}
            className={`absolute animate-confetti-fall ${shapeStyle}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.shape === 'triangle' ? 'transparent' : p.color,
              borderLeft: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
              borderRight: p.shape === 'triangle' ? `${p.size / 2}px solid transparent` : undefined,
              borderBottom: p.shape === 'triangle' ? `${p.size}px solid ${p.color}` : undefined,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              transform: `rotate(${p.rotation}deg)`,
              opacity: 0.8,
            }}
          />
        );
      })}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0.3;
          }
        }
        .animate-confetti-fall {
          animation-name: confetti-fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .clip-triangle {
          width: 0 !important;
          height: 0 !important;
        }
      `}</style>
    </div>
  );
}
