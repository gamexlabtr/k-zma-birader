import { Laugh } from 'lucide-react';

interface ReactionsProps {
  onSendReaction: (emoji: string) => void;
}

const EMOJIS = ['😂', '😮', '😠', '🎉', '💩', '👍', '🔥', '👑'];

export default function Reactions({ onSendReaction }: ReactionsProps) {
  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <Laugh className="w-3.5 h-3.5 text-indigo-500" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Hızlı Tepkiler</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="text-xl p-1.5 bg-slate-50 hover:bg-indigo-50 hover:scale-110 active:scale-95 border border-slate-100 hover:border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center justify-center"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
