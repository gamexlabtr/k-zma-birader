import { useEffect, useRef } from 'react';
import {
  PlayerColor,
  PlayerInfo,
  COLOR_BG_CLASS,
  COLOR_NAMES,
  COLOR_TEXT_CLASS,
  COLORS
} from '../utils/gameEngine';
import { Flame, LogOut, Trophy, User, Zap } from 'lucide-react';

interface SidebarProps {
  players: Record<PlayerColor, PlayerInfo | null>;
  currentTurn: PlayerColor;
  tokens: Record<PlayerColor, number[]>;
  winner: PlayerColor | null;
  logs: string[];
  onLeave: () => void;
  gameMode: 'online' | 'local' | 'vs_bots';
  myColor: PlayerColor | null;
  botDelay: number;
  setBotDelay?: (delay: number) => void;
}

export default function Sidebar({
  players,
  currentTurn,
  tokens,
  winner,
  logs,
  onLeave,
  gameMode,
  myColor,
  botDelay,
  setBotDelay
}: SidebarProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Count token statistics for a color
  const getTokenStats = (color: PlayerColor) => {
    const arr = tokens[color];
    const inBase = arr.filter((s) => s === -1).length;
    const inGoal = arr.filter((s) => s === 56).length;
    const onTrack = 4 - inBase - inGoal;
    return { inBase, onTrack, inGoal };
  };

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      {/* Turn Indicator & General Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm relative overflow-hidden">
        {winner ? (
          <div className="text-center space-y-2 py-2 animate-bounce">
            <Trophy className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
            <h3 className="text-lg font-bold text-slate-800">
              Tebrikler! Kazanan:
            </h3>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white font-bold ${COLOR_BG_CLASS[winner]}`}>
              {COLOR_NAMES[winner]} Oyuncu
            </div>
            {players[winner] && (
              <p className="text-xs text-slate-500 font-medium mt-1">
                ({players[winner]?.name})
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Sıradaki Oyuncu
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-block w-3.5 h-3.5 rounded-full ${COLOR_BG_CLASS[currentTurn]} animate-ping`} />
                <span className={`text-base font-extrabold ${COLOR_TEXT_CLASS[currentTurn]}`}>
                  {COLOR_NAMES[currentTurn]}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {players[currentTurn]
                    ? `(${players[currentTurn]?.name})`
                    : gameMode === 'vs_bots'
                    ? '(Yapay Zeka)'
                    : '(Local Oyuncu)'}
                </span>
              </div>
            </div>
            {myColor && (
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Senin Rengin
                </span>
                <span className={`text-xs font-bold ${COLOR_TEXT_CLASS[myColor]} bg-slate-50 border px-2 py-0.5 rounded-full inline-block mt-1`}>
                  {COLOR_NAMES[myColor]}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Mode tag */}
        <span className="absolute top-2 right-2 text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold uppercase">
          {gameMode === 'online'
            ? 'Çevrimiçi'
            : gameMode === 'vs_bots'
            ? 'Yapay Zeka'
            : 'Yerel Maç'}
        </span>
      </div>

      {/* Players List & Token Counters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex-1 space-y-3 overflow-y-auto">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-indigo-500" /> Oyuncu İstatistikleri
        </h4>

        <div className="grid grid-cols-1 gap-2">
          {COLORS.map((color) => {
            const player = players[color];
            const stats = getTokenStats(color);
            const isTurn = currentTurn === color && !winner;

            // Skip rendering empty slots in online mode, unless they are placeholders
            if (gameMode === 'online' && !player) {
              return (
                <div key={color} className="p-2.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between opacity-50">
                  <span className={`text-xs font-medium ${COLOR_TEXT_CLASS[color]}`}>
                    {COLOR_NAMES[color]}: Katılım Bekleniyor
                  </span>
                </div>
              );
            }

            return (
              <div
                key={color}
                className={`
                  p-2.5 rounded-xl border transition-all duration-300
                  ${isTurn ? 'border-indigo-400 bg-indigo-50/20 ring-1 ring-indigo-400 shadow-md shadow-indigo-100/50' : 'border-slate-100 bg-slate-50/30'}
                `}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${COLOR_BG_CLASS[color]}`} />
                    <span className="text-xs font-extrabold text-slate-800">
                      {player ? player.name : `${COLOR_NAMES[color]} (Bot)`}
                    </span>
                    {player?.isBot && (
                      <span className="text-[8px] bg-amber-50 border border-amber-200 text-amber-700 px-1 rounded-sm font-semibold uppercase flex items-center gap-0.5">
                        <Zap className="w-2 h-2 fill-amber-500 text-amber-500" /> Bot
                      </span>
                    )}
                  </div>
                  {/* Score indicator (how many in goal) */}
                  <div className="flex items-center gap-0.5 bg-amber-100/40 text-amber-700 text-[10px] px-1.5 py-0.5 rounded-full font-bold border border-amber-200/20">
                    🏆 {stats.inGoal}/4
                  </div>
                </div>

                {/* Tokens Status Bar */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-medium text-slate-500 text-center">
                  <div className="bg-white/90 py-1 px-1 rounded border border-slate-100 shadow-2xs">
                    <span className="block text-slate-400 text-[8px] uppercase font-bold">Evde</span>
                    <span className="font-extrabold text-slate-700">{stats.inBase} Taş</span>
                  </div>
                  <div className="bg-white/90 py-1 px-1 rounded border border-slate-100 shadow-2xs">
                    <span className="block text-slate-400 text-[8px] uppercase font-bold">Yolda</span>
                    <span className="font-extrabold text-indigo-600">{stats.onTrack} Taş</span>
                  </div>
                  <div className="bg-white/90 py-1 px-1 rounded border border-slate-100 shadow-2xs">
                    <span className="block text-slate-400 text-[8px] uppercase font-bold">Hedefte</span>
                    <span className="font-extrabold text-emerald-600">{stats.inGoal} Taş</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bot Speed Control (Only in VS Bot mode) */}
      {gameMode === 'vs_bots' && setBotDelay && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-1.5">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Yapay Zeka Hızı
          </label>
          <input
            type="range"
            min="300"
            max="2500"
            step="100"
            value={botDelay}
            onChange={(e) => setBotDelay(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
            <span>Hızlı ({botDelay}ms)</span>
            <span>Yavaş</span>
          </div>
        </div>
      )}

      {/* Game Logs Area */}
      <div className="bg-slate-900 text-slate-200 p-3 rounded-2xl border border-slate-850 shadow-inner flex-1 max-h-[160px] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500" /> Oyun Geçmişi
          </span>
          <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">Canlı</span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 text-[10px] font-mono scrollbar-thin">
          {logs.map((log, i) => (
            <div key={i} className="py-0.5 border-b border-slate-800/20 leading-relaxed text-slate-300">
              <span className="text-slate-500 mr-1">&gt;</span> {log}
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Leave Game Action */}
      <button
        onClick={onLeave}
        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-red-200/50 transition-all cursor-pointer active:scale-95"
      >
        <LogOut className="w-3.5 h-3.5" /> Oyundan Çık
      </button>
    </div>
  );
}
