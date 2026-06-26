import { useState } from 'react';
import { PlayerColor, COLOR_NAMES, COLOR_BG_CLASS, PlayerInfo } from '../utils/gameEngine';
import { SpeedPreset } from '../utils/gameEngine';
import { Copy, ArrowRight, Shield, Play, Sparkles, Check, CheckCircle, Settings, Zap, Compass, Flame } from 'lucide-react';

interface LobbyProps {
  roomId: string;
  players: Record<PlayerColor, PlayerInfo | null>;
  spectators: PlayerInfo[];
  myColor: PlayerColor | null;
  myName: string;
  myUid: string;
  onSelectColor: (color: PlayerColor) => void;
  onSetReady: (ready: boolean) => void;
  onStartGame: () => void;
  onSetName: (name: string) => void;
  onLeave: () => void;
  speedPreset: SpeedPreset;
  onSetSpeedPreset: (preset: SpeedPreset) => void;
}

export default function Lobby({
  roomId,
  players,
  spectators,
  myColor,
  myName,
  myUid,
  onSelectColor,
  onSetReady,
  onStartGame,
  onSetName,
  onLeave,
  speedPreset,
  onSetSpeedPreset
}: LobbyProps) {
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(myName);

  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    const inviteUrl = window.location.origin + window.location.pathname + '#' + roomId;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Find if my player is ready
  const isMeReady = myColor ? players[myColor]?.isReady || false : false;

  // Is current user the host?
  // We can look up players to see who isHost or if spectator is host, or fall back to:
  // If myUid is the host of any claimed color or we are the first spectator
  const amIHost = Object.values(players).some((p) => p?.uid === myUid && p?.isHost) || 
                  (spectators.length > 0 && spectators[0].uid === myUid && spectators[0].isHost);

  // Count joined players (non-null)
  const joinedCount = Object.values(players).filter(Boolean).length;
  
  // Can start game?
  // Host can start if joinedCount >= 2 and all joined players are Ready
  const allReady = Object.values(players)
    .filter((p): p is PlayerInfo => p !== null)
    .every((p) => p.isReady || p.isHost); // Host is implicitly ready

  const canStart = joinedCount >= 2 && allReady;

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {/* Name and Match Setup (Col 1 & 2) */}
      <div className="md:col-span-2 space-y-6">
        {/* Nickname selection */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" /> Profilini Belirle
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              placeholder="Oyuncu adınız..."
              maxLength={16}
              className="flex-1 text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
            />
            <button
              onClick={() => {
                if (editingName.trim()) {
                  onSetName(editingName.trim());
                }
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-100 transition-all cursor-pointer active:scale-95"
            >
              Güncelle
            </button>
          </div>
        </div>

        {/* Speed / Rule Presets Selection */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-indigo-500" /> Oyun Hızı / Kural Modu Seçimi
          </h3>
          <p className="text-xs text-slate-500">
            {amIHost 
              ? "Oyun kurucu sizsiniz! Aşağıdan kural modunu değiştirerek tüm oyuncular için geçerli yapabilirsiniz."
              : "Oyun kuralları kurucu tarafından belirlenmektedir."}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* NORMAL MODE */}
            <button
              disabled={!amIHost}
              onClick={() => onSetSpeedPreset('normal')}
              className={`
                p-3 rounded-xl border text-left transition-all
                ${speedPreset === 'normal' 
                  ? 'border-indigo-500 bg-indigo-50/30 ring-2 ring-indigo-500/20' 
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'}
                ${!amIHost ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Compass className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-xs font-bold text-slate-800">Normal</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Başlangıçtan taş çıkarmak için tam <b>6</b> atmak gerekir. Standart kurallar.
              </p>
            </button>

            {/* FAST MODE */}
            <button
              disabled={!amIHost}
              onClick={() => onSetSpeedPreset('fast')}
              className={`
                p-3 rounded-xl border text-left transition-all
                ${speedPreset === 'fast' 
                  ? 'border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/15' 
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'}
                ${!amIHost ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-xs font-bold text-slate-800">Hızlı</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Taş çıkarmak için <b>5 veya 6</b> yeterlidir. Ekstra tur hakkı 5-6 atınca gelir.
              </p>
            </button>

            {/* CRAZY MODE */}
            <button
              disabled={!amIHost}
              onClick={() => onSetSpeedPreset('crazy')}
              className={`
                p-3 rounded-xl border text-left transition-all
                ${speedPreset === 'crazy' 
                  ? 'border-red-500 bg-red-50/20 ring-2 ring-red-500/15' 
                  : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/50'}
                ${!amIHost ? 'cursor-not-allowed opacity-85' : 'cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Flame className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-bold text-slate-800">Çılgın</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Taş çıkarmak için <b>4, 5 veya 6</b> yeterlidir. Ekstra zarlar havada uçuşur!
              </p>
            </button>
          </div>
        </div>

        {/* Room Info and Invitation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-3">
          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">
            Arkadaşlarını Davet Et
          </span>
          <h2 className="text-xl font-extrabold text-slate-800">
            Lobi Hazırlanıyor
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Bu Oda Kodunu arkadaşlarınıza göndererek onların bu oyuna katılmalarını sağlayabilirsiniz.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/50 flex-1">
              <span className="font-mono text-sm font-bold text-slate-700 flex-1 select-all">
                {roomId}
              </span>
              <button
                onClick={handleCopy}
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> Kodu Kopyalandı!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Kodu Kopyala
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="px-4 py-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-extrabold cursor-pointer active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-indigo-600" /> Davet Linki Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Doğrudan Davet Linki Kopyala
                </>
              )}
            </button>
          </div>
        </div>

        {/* Choose Color Area */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Bir Renk Seçin ve Savaşa Katılın!
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['red', 'green', 'blue', 'yellow'] as PlayerColor[]).map((color) => {
              const occupant = players[color];
              const isSelectedByMe = myColor === color;

              return (
                <div
                  key={color}
                  className={`
                    p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300
                    ${occupant ? 'bg-slate-50/50 border-slate-200' : 'bg-white hover:shadow-md cursor-pointer border-slate-200/80'}
                    ${isSelectedByMe ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/10' : ''}
                  `}
                  onClick={() => !occupant && onSelectColor(color)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full ${COLOR_BG_CLASS[color]} shadow-inner`} />
                      <span className="text-sm font-extrabold text-slate-800">
                        {COLOR_NAMES[color]} Oyuncu
                      </span>
                    </div>

                    {!occupant ? (
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                        Boş
                      </span>
                    ) : occupant.uid === myUid ? (
                      <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-0.5 rounded-full">
                        Seninle Dolu
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold bg-slate-200 px-2 py-0.5 rounded-full">
                        Dolu
                      </span>
                    )}
                  </div>

                  {occupant ? (
                    <div className="flex items-center justify-between mt-1 text-xs">
                      <span className="font-semibold text-slate-600">
                        👤 {occupant.name}
                      </span>
                      {occupant.isHost ? (
                        <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-1.5 py-0.2 rounded-sm uppercase">
                          Kurucu
                        </span>
                      ) : occupant.isReady ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Hazır
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Hazırlanıyor...</span>
                      )}
                    </div>
                  ) : (
                    <button
                      className="text-xs text-indigo-600 font-bold flex items-center gap-1 hover:gap-1.5 transition-all outline-none mt-2 justify-end"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectColor(color);
                      }}
                    >
                      Katıl <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Spectator / Observer notice */}
          {!myColor && (
            <div className="p-3 bg-slate-50 text-slate-500 text-xs rounded-xl border border-dashed border-slate-200 text-center font-medium">
              Sadece izlemek istiyorsan, herhangi bir renge tıklamadan bekleyebilirsin. Maç başlayınca izleyici (seyirci) olacaksın.
            </div>
          )}

          {/* Spectators List */}
          {spectators.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Seyirciler ({spectators.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {spectators.map((s) => (
                  <span key={s.uid} className="text-xs bg-slate-100 border text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    👁️ {s.name} {s.uid === myUid && '(Sen)'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Host Settings & Controls */}
          {myColor && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 justify-between items-center">
              <div>
                {!players[myColor]?.isHost && (
                  <button
                    onClick={() => onSetReady(!isMeReady)}
                    className={`
                      px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer
                      ${
                        isMeReady
                          ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100'
                      }
                    `}
                  >
                    {isMeReady ? 'Hazır Değilim De' : 'Hazırım!'}
                  </button>
                )}
              </div>

              {amIHost && (
                <button
                  onClick={onStartGame}
                  disabled={!canStart}
                  className={`
                    px-8 py-3 rounded-xl font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 cursor-pointer
                    ${
                      canStart
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100 animate-pulse'
                        : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                    }
                  `}
                >
                  <Play className="w-4 h-4 fill-white" /> Oyunu Başlat ({joinedCount}/4 Oyuncu)
                </button>
              )}
            </div>
          )}

          {amIHost && !canStart && (
            <p className="text-[10px] text-amber-600 text-center font-bold">
              * Oyunu başlatabilmek için en az 2 oyuncunun katılması ve kurucu dışındaki tüm oyuncuların "Hazır" durumuna geçmesi gerekir.
            </p>
          )}
        </div>
      </div>

      {/* Kızma Birader Rules (Col 3) */}
      <div className="space-y-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-indigo-500" /> Oyun Kuralları
          </h3>

          <ul className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
            <li className="flex gap-2.5 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">1</span>
              <div>
                <strong className="text-slate-700 block">Zarla Taş Çıkarma</strong>
                Başlangıç kalesinden (basen) yola çıkabilmek için zarın mutlaka <span className="font-bold text-red-500">6</span> gelmesi gerekir.
              </div>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">2</span>
              <div>
                <strong className="text-slate-700 block">Ekstra Hak</strong>
                Zarı atan oyuncu eğer <span className="font-bold text-amber-500">6</span> atarsa ekstra bir zar atma hakkı daha kazanır.
              </div>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">3</span>
              <div>
                <strong className="text-slate-700 block">Taş Kırma (Yeme)</strong>
                Eğer taşınız rakip oyuncunun taşıyla aynı hücreye denk gelirse, rakibin taşını <span className="font-bold text-red-500">Kırarak</span> evine geri gönderirsiniz!
              </div>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">4</span>
              <div>
                <strong className="text-slate-700 block">Güvenli Hücreler</strong>
                Kendi başlangıç hücreniz ile üzerinde yıldız (kalkan) bulunan yerler güvenli bölgedir; buralarda taşlar <span className="font-bold text-indigo-600">kırılamaz</span>.
              </div>
            </li>
            <li className="flex gap-2.5 items-start">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">5</span>
              <div>
                <strong className="text-slate-700 block">Kazanma Koşulu</strong>
                Tüm <span className="font-bold text-emerald-600">4 adet taşı</span> da merkezdeki kendi hedef rengine ulaştıran ilk oyuncu savaşı kazanır!
              </div>
            </li>
          </ul>
        </div>

        <button
          onClick={onLeave}
          className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-all cursor-pointer active:scale-95 border border-slate-200/30"
        >
          Ana Menüye Dön
        </button>
      </div>
    </div>
  );
}
