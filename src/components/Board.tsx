import { useState } from 'react';
import {
  PlayerColor,
  getTokenCoords,
  COLOR_BG_CLASS,
  COLOR_HEX,
  isCellSafe
} from '../utils/gameEngine';
import { Shield, Sparkles } from 'lucide-react';

interface BoardProps {
  tokens: Record<PlayerColor, number[]>;
  currentTurn: PlayerColor;
  diceValue: number | null;
  validMoves: number[];
  onTokenClick: (tokenIdx: number) => void;
  myColor: PlayerColor | null;
  hasRolled: boolean;
}

export default function Board({
  tokens,
  currentTurn,
  diceValue,
  validMoves,
  onTokenClick,
  myColor,
  hasRolled
}: BoardProps) {
  const [hoveredToken, setHoveredToken] = useState<{ color: PlayerColor; index: number } | null>(null);

  // Is it my turn to move?
  const isMyTurnToMove = myColor === currentTurn && hasRolled && validMoves.length > 0;

  // Group tokens by coordinate to handle overlapping
  const tokenCoordsMap: Record<string, { color: PlayerColor; index: number; step: number }[]> = {};

  const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];

  colors.forEach((color) => {
    tokens[color].forEach((step, index) => {
      const coords = getTokenCoords(color, index, step);
      const key = `${coords.r}_${coords.c}`;
      if (!tokenCoordsMap[key]) {
        tokenCoordsMap[key] = [];
      }
      tokenCoordsMap[key].push({ color, index, step });
    });
  });

  // Check if a cell is a base slot coordinate
  const getBaseSlotOwner = (r: number, c: number): PlayerColor | null => {
    if (r >= 2 && r <= 3 && c >= 2 && c <= 3) return 'red';
    if (r >= 2 && r <= 3 && c >= 11 && c <= 12) return 'green';
    if (r >= 11 && r <= 12 && c >= 11 && c <= 12) return 'blue';
    if (r >= 11 && r <= 12 && c >= 2 && c <= 3) return 'yellow';
    return null;
  };

  // Determine background color/style for each cell in 15x15 grid
  const getCellClassName = (r: number, c: number): string => {
    // Red Base (Top-Left 6x6)
    if (r < 6 && c < 6) {
      if ((r === 1 || r === 4) && (c === 1 || c === 4)) return 'bg-red-100 border-2 border-red-500/30';
      return 'bg-red-500/15 border border-red-500/10';
    }
    // Green Base (Top-Right 6x6)
    if (r < 6 && c > 8) {
      if ((r === 1 || r === 4) && (c === 10 || c === 13)) return 'bg-green-100 border-2 border-green-500/30';
      return 'bg-green-500/15 border border-green-500/10';
    }
    // Yellow Base (Bottom-Left 6x6)
    if (r > 8 && c < 6) {
      if ((r === 10 || r === 13) && (c === 1 || c === 4)) return 'bg-yellow-100 border-2 border-yellow-500/30';
      return 'bg-yellow-500/15 border border-yellow-500/10';
    }
    // Blue Base (Bottom-Right 6x6)
    if (r > 8 && c > 8) {
      if ((r === 10 || r === 13) && (c === 10 || c === 13)) return 'bg-blue-100 border-2 border-blue-500/30';
      return 'bg-blue-500/15 border border-blue-500/10';
    }

    // Home Runs
    if (r === 7 && c >= 1 && c <= 5) return 'bg-red-500/80 border border-red-600/20';
    if (c === 7 && r >= 1 && r <= 5) return 'bg-green-500/80 border border-green-600/20';
    if (r === 7 && c >= 9 && c <= 13) return 'bg-blue-500/80 border border-blue-600/20';
    if (c === 7 && r >= 9 && r <= 13) return 'bg-yellow-500/80 border border-yellow-600/20';

    // Start Cells (Star / special icons)
    if (r === 6 && c === 1) return 'bg-red-500 border border-red-600 shadow-inner text-white';
    if (r === 1 && c === 8) return 'bg-green-500 border border-green-600 shadow-inner text-white';
    if (r === 8 && c === 13) return 'bg-blue-500 border border-blue-600 shadow-inner text-white';
    if (r === 13 && c === 6) return 'bg-yellow-500 border border-yellow-600 shadow-inner text-white';

    // Other safe zone cells
    if (isCellSafe(r, c)) return 'bg-indigo-50 border border-slate-300';

    // Central Goal (3x3)
    if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
      if (r === 7 && c === 6) return 'bg-red-500/90 border border-red-600/30';
      if (r === 6 && c === 7) return 'bg-green-500/90 border border-green-600/30';
      if (r === 7 && c === 8) return 'bg-blue-500/90 border border-blue-600/30';
      if (r === 8 && c === 7) return 'bg-yellow-500/90 border border-yellow-600/30';
      if (r === 7 && c === 7) return 'bg-gradient-to-br from-amber-400 to-yellow-300 border border-amber-500';
      return 'bg-amber-100/50';
    }

    // Default neutral track cell
    return 'bg-white border border-slate-200 shadow-inner';
  };

  // Render the background grid
  const renderGrid = () => {
    const grid = [];
    for (let r = 0; r < 15; r++) {
      for (let c = 0; c < 15; c++) {
        const isGoalCell = r >= 6 && r <= 8 && c >= 6 && c <= 8;
        const cellClass = getCellClassName(r, c);
        const slotOwner = getBaseSlotOwner(r, c);
        const safe = isCellSafe(r, c);

        // Calculate if this cell is highlighted as a hovered token destination
        let isDestinationHighlight = false;
        if (hoveredToken && diceValue) {
          const tStep = tokens[hoveredToken.color][hoveredToken.index];
          if (tStep !== -1 && tStep + diceValue <= 56) {
            const destCoords = getTokenCoords(hoveredToken.color, hoveredToken.index, tStep + diceValue);
            if (destCoords.r === r && destCoords.c === c) {
              isDestinationHighlight = true;
            }
          } else if (tStep === -1 && diceValue === 6) {
            const destCoords = getTokenCoords(hoveredToken.color, hoveredToken.index, 0);
            if (destCoords.r === r && destCoords.c === c) {
              isDestinationHighlight = true;
            }
          }
        }

        grid.push(
          <div
            key={`${r}_${c}`}
            className={`
              relative flex items-center justify-center aspect-square transition-all duration-300
              ${cellClass}
              ${isDestinationHighlight ? 'ring-4 ring-purple-500 ring-inset scale-105 z-10 shadow-lg shadow-purple-200' : ''}
            `}
            style={{
              gridRowStart: r + 1,
              gridColumnStart: c + 1
            }}
          >
            {/* Slot circles in player bases */}
            {slotOwner && (
              <div
                className={`
                  w-4/5 h-4/5 rounded-full border-2 border-dashed bg-white/70 flex items-center justify-center
                  ${
                    slotOwner === 'red'
                      ? 'border-red-400'
                      : slotOwner === 'green'
                      ? 'border-green-400'
                      : slotOwner === 'blue'
                      ? 'border-blue-400'
                      : 'border-yellow-400'
                  }
                `}
              />
            )}

            {/* Shield icon for safe cells (except start cells which are colored) */}
            {safe && !isGoalCell && !(r === 6 && c === 1) && !(r === 1 && c === 8) && !(r === 8 && c === 13) && !(r === 13 && c === 6) && (
              <Shield className="w-3.5 h-3.5 text-indigo-400 opacity-60" />
            )}

            {/* Special crown icon for center cell */}
            {r === 7 && c === 7 && (
              <Sparkles className="w-5 h-5 text-amber-700 animate-spin" style={{ animationDuration: '8s' }} />
            )}
          </div>
        );
      }
    }
    return grid;
  };

  // Render active tokens layered over the same grid
  const renderTokens = () => {
    return Object.entries(tokenCoordsMap).map(([coordKey, tokenList]) => {
      const [rStr, cStr] = coordKey.split('_');
      const r = parseInt(rStr);
      const c = parseInt(cStr);

      const count = tokenList.length;

      // Class to layout overlapping tokens inside a single grid cell
      let layoutClass = 'flex items-center justify-center w-full h-full';
      if (count === 2) {
        layoutClass = 'grid grid-cols-2 w-full h-full p-0.5 gap-0.5';
      } else if (count >= 3) {
        layoutClass = 'grid grid-cols-2 grid-rows-2 w-full h-full p-0.5 gap-0.5';
      }

      return (
        <div
          key={coordKey}
          className={`${layoutClass} z-20 pointer-events-auto`}
          style={{
            gridRowStart: r + 1,
            gridColumnStart: c + 1
          }}
        >
          {tokenList.map(({ color, index }) => {
            const isMovable =
              color === currentTurn &&
              isMyTurnToMove &&
              validMoves.includes(index);

            // Style of token
            const baseBg = COLOR_BG_CLASS[color];
            const tokenHex = COLOR_HEX[color];

            return (
              <button
                key={`${color}_${index}`}
                onMouseEnter={() => isMovable && setHoveredToken({ color, index })}
                onMouseLeave={() => setHoveredToken(null)}
                onClick={() => {
                  if (isMovable) {
                    onTokenClick(index);
                    setHoveredToken(null);
                  }
                }}
                disabled={!isMovable}
                style={{
                  boxShadow: `0 4px 6px -1px ${tokenHex}40, 0 2px 4px -1px ${tokenHex}30, inset 0 2px 4px rgba(255,255,255,0.4)`
                }}
                className={`
                  rounded-full border border-white aspect-square relative flex items-center justify-center transition-all duration-200 outline-none focus:outline-none
                  ${baseBg}
                  ${count === 1 ? 'w-4/5 h-4/5' : count === 2 ? 'w-full h-full' : 'w-full h-full'}
                  ${isMovable ? 'animate-bounce cursor-pointer ring-4 ring-white ring-offset-2 ring-offset-purple-500 scale-110 z-30' : ''}
                  hover:scale-105 active:scale-95
                `}
              >
                {/* Inner white circle for classic token style */}
                <div className="w-1/2 h-1/2 rounded-full border border-white/40 bg-white/25 shadow-inner flex items-center justify-center font-bold text-[8px] text-white">
                  {index + 1}
                </div>

                {/* Turn Indicator Dot */}
                {isMovable && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500 border border-white"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="relative p-1.5 md:p-3 bg-slate-900 rounded-2xl shadow-2xl border-4 border-slate-800 flex items-center justify-center w-full max-w-[500px] aspect-square select-none">
      {/* 15x15 main game board */}
      <div className="grid grid-cols-15 grid-rows-15 gap-[1.5px] w-full h-full bg-slate-800 rounded-lg overflow-hidden relative">
        {renderGrid()}
        {renderTokens()}
      </div>
    </div>
  );
}
