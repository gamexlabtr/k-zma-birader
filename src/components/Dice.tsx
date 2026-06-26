import { useState, useEffect } from 'react';

interface DiceProps {
  value: number | null;
  onRoll: () => void;
  disabled: boolean;
  isRolling: boolean;
}

export default function Dice({ value, onRoll, disabled, isRolling }: DiceProps) {
  const [localRolling, setLocalRolling] = useState(false);
  const [fakeValue, setFakeValue] = useState(1);

  useEffect(() => {
    if (isRolling) {
      setLocalRolling(true);
      const interval = setInterval(() => {
        setFakeValue(Math.floor(Math.random() * 6) + 1);
      }, 80);

      const timeout = setTimeout(() => {
        clearInterval(interval);
        setLocalRolling(false);
      }, 700);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isRolling]);

  const displayValue = localRolling ? fakeValue : value || 1;

  // Render dice dots
  const renderDots = (num: number) => {
    const dotPositions: Record<number, string[]> = {
      1: ['col-start-2 row-start-2'],
      2: ['col-start-1 row-start-1', 'col-start-3 row-start-3'],
      3: ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'],
      4: [
        'col-start-1 row-start-1', 'col-start-3 row-start-1',
        'col-start-1 row-start-3', 'col-start-3 row-start-3'
      ],
      5: [
        'col-start-1 row-start-1', 'col-start-3 row-start-1',
        'col-start-2 row-start-2',
        'col-start-1 row-start-3', 'col-start-3 row-start-3'
      ],
      6: [
        'col-start-1 row-start-1', 'col-start-3 row-start-1',
        'col-start-1 row-start-2', 'col-start-3 row-start-2',
        'col-start-1 row-start-3', 'col-start-3 row-start-3'
      ]
    };

    const positions = dotPositions[num] || [];

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 w-12 h-12 p-1.5">
        {positions.map((pos, idx) => (
          <div
            key={idx}
            className={`${pos} w-2.5 h-2.5 bg-slate-800 rounded-full shadow-inner animate-pulse`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-white/60 backdrop-blur-md rounded-2xl border border-slate-200/50 shadow-sm">
      <button
        onClick={onRoll}
        disabled={disabled || localRolling}
        className={`
          relative w-20 h-20 bg-gradient-to-br from-amber-50 to-white 
          rounded-2xl shadow-lg border border-amber-200/40 flex items-center justify-center
          transition-all duration-300 transform outline-none focus:outline-none
          ${disabled ? 'opacity-80 cursor-not-allowed filter grayscale' : 'hover:scale-105 active:scale-95 hover:shadow-xl hover:border-amber-400 cursor-pointer'}
          ${localRolling ? 'animate-bounce rotate-180 scale-110 border-red-400 bg-red-50' : ''}
        `}
      >
        {/* Glow effect when active */}
        {!disabled && !localRolling && (
          <span className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 opacity-20 blur animate-pulse" />
        )}

        <div className="relative bg-white border border-slate-200 rounded-xl shadow-inner p-1">
          {renderDots(displayValue)}
        </div>
      </button>

      <span className="text-xs font-semibold text-slate-500 mt-2 tracking-wide uppercase">
        {localRolling ? 'Zar Atılıyor...' : disabled ? 'Zar Sırası Değil' : 'Zar Atmak İçin Tıkla'}
      </span>
    </div>
  );
}
