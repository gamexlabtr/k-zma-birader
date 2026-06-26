import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, PlayerColor, COLOR_TEXT_CLASS } from '../utils/gameEngine';
import { Send } from 'lucide-react';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  myColor: PlayerColor | null;
  myName: string;
}

export default function Chat({ messages, onSendMessage, myColor, myName }: ChatProps) {
  const [text, setText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
  };

  const getSenderColorClass = (color?: PlayerColor | 'system') => {
    if (!color) return 'text-slate-600';
    if (color === 'system') return 'text-indigo-500 font-bold';
    return COLOR_TEXT_CLASS[color] + ' font-bold';
  };

  return (
    <div className="flex flex-col h-[280px] bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-100 px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">Sohbet</span>
        {myColor && (
          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-medium">
            Karakterin: {myName}
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 italic text-center px-4">
            Henüz mesaj yok. Arkadaşlarına merhaba de!
          </div>
        ) : (
          messages.map((m) => {
            const isSystem = m.senderColor === 'system';
            return (
              <div key={m.id} className={`p-1.5 rounded-lg ${isSystem ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                <span className={getSenderColorClass(m.senderColor)}>
                  {m.sender}:{' '}
                </span>
                <span className="text-slate-700 break-words">{m.text}</span>
                <span className="block text-[8px] text-slate-400 mt-0.5 text-right">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-slate-100 p-2 flex gap-1.5 bg-slate-50">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yazın..."
          className="flex-1 text-xs px-3 py-2 bg-white rounded-xl border border-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
        />
        <button
          type="submit"
          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 transition-all flex items-center justify-center active:scale-95 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
