import { useState, useEffect } from 'react';
import {
  ref,
  set,
  onValue,
  get,
  remove,
  db
} from './firebase';
import {
  PlayerColor,
  PlayerInfo,
  ChatMessage,
  GameState,
  COLOR_NAMES,
  createInitialState,
  getValidMoves,
  getTokenCoords,
  checkKick,
  getNextTurn,
  getBotMove
} from './utils/gameEngine';

import Board from './components/Board';
import Dice from './components/Dice';
import Sidebar from './components/Sidebar';
import Lobby from './components/Lobby';
import Chat from './components/Chat';
import Confetti from './components/Confetti';

import { Trophy, Plus, ArrowRight, Smartphone, Compass } from 'lucide-react';

// Web Audio API Sound Generator for retro immersion
const playSound = (type: 'roll' | 'move' | 'kick' | 'win') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'roll') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'kick') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } else if (type === 'win') {
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    }
  } catch (e) {
    console.warn('Audio playback not supported or interaction blocked:', e);
  }
};

export default function App() {
  // Player identification
  const [uid, setUid] = useState('');
  const [nickname, setNickname] = useState('');
  
  // Game control
  const [view, setView] = useState<'menu' | 'lobby' | 'game'>('menu');
  const [gameMode, setGameMode] = useState<'online' | 'local' | 'vs_bots'>('vs_bots');
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [myColor, setMyColor] = useState<PlayerColor | null>(null);
  
  // States
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [botDelay, setBotDelay] = useState(1000); // ms delay for AI turns
  const [errorMessage, setErrorMessage] = useState('');
  
  // New States: Offline Sync, Statistics & Notifications
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [stats, setStats] = useState({ gamesPlayed: 0, wins: 0, losses: 0, kicks: 0 });

  // 1. Initialize Credentials, Auto-Join, Stats and Network Status
  useEffect(() => {
    let savedUid = localStorage.getItem('ludo_uid');
    if (!savedUid) {
      savedUid = 'usr_' + Math.random().toString(36).substring(2, 11);
      localStorage.setItem('ludo_uid', savedUid);
    }
    setUid(savedUid);

    let savedName = localStorage.getItem('ludo_nickname');
    if (!savedName) {
      savedName = 'Oyuncu_' + Math.floor(1000 + Math.random() * 9000);
      localStorage.setItem('ludo_nickname', savedName);
    }
    setNickname(savedName);

    // Load Local Game Statistics
    const savedStats = localStorage.getItem('ludo_stats_v2');
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Error loading stats", e);
      }
    } else {
      const initialStats = { gamesPlayed: 0, wins: 0, losses: 0, kicks: 0 };
      localStorage.setItem('ludo_stats_v2', JSON.stringify(initialStats));
      setStats(initialStats);
    }

    // Ask for HTML5 Push Notification Permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Network Online/Offline Change Observers
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Parse Room ID from Hash (e.g. https://domain.com/#ABCDEF)
    const hash = window.location.hash.replace('#', '').trim().toUpperCase();
    if (hash && hash.length === 6) {
      setInputRoomId(hash);
    } else {
      // Otherwise, attempt to recover previously saved active room session
      const savedRoomId = localStorage.getItem('ludo_active_room');
      const savedMode = localStorage.getItem('ludo_active_mode');
      if (savedRoomId && savedMode === 'online') {
        setRoomId(savedRoomId);
        setGameMode('online');
        setView('lobby');
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Trigger auto-join when hash is detected and credentials are fully loaded
  useEffect(() => {
    if (uid && nickname && inputRoomId && view === 'menu') {
      const hash = window.location.hash.replace('#', '').trim().toUpperCase();
      if (hash === inputRoomId) {
        handleJoinOnlineRoom();
      }
    }
  }, [uid, nickname, inputRoomId]);

  // 2. Firebase room subscription (For Online Mode)
  useEffect(() => {
    if (gameMode !== 'online' || !roomId) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val() as GameState;
        
        // Ensure lists or sub-objects exist safely
        if (!val.spectators) val.spectators = [];
        if (!val.players) {
          val.players = { red: null, green: null, blue: null, yellow: null };
        }
        if (!val.logs) val.logs = [];

        setGameState(val);

        // Update view if status changed
        if (val.status === 'playing' && view === 'lobby') {
          setView('game');
        }

        // Deduce myColor dynamically from active player slot with myUid
        let currentAssignedColor: PlayerColor | null = null;
        Object.entries(val.players).forEach(([color, player]) => {
          if (player && player.uid === uid) {
            currentAssignedColor = color as PlayerColor;
          }
        });
        setMyColor(currentAssignedColor);
      } else {
        setErrorMessage('Oda bulunamadı veya silinmiş.');
        setView('menu');
      }
    });

    return () => unsubscribe();
  }, [roomId, gameMode, uid, view]);

  // 3. AI Automation Effect (Bots move automatically)
  useEffect(() => {
    if (!gameState || gameState.status !== 'playing' || isRolling) return;

    const activeColor = gameState.currentTurn;
    const activePlayer = gameState.players[activeColor];

    // Determine if we should orchestrate this turn
    // If VS Bots, we orchestrate if we are the human player (Red).
    // If Online, only the HOST orchestrates bot moves to prevent race conditions.
    const isBotTurn = !activePlayer || activePlayer.isBot;
    
    let shouldOrchestrate = false;
    if (gameState.gameMode === 'vs_bots') {
      shouldOrchestrate = true;
    } else if (gameState.gameMode === 'online' && isBotTurn) {
      // Am I the host?
      const amIHost = Object.values(gameState.players).some((p) => p?.uid === uid && p?.isHost) || 
                      (gameState.spectators.length > 0 && gameState.spectators[0].uid === uid && gameState.spectators[0].isHost);
      if (amIHost) {
        shouldOrchestrate = true;
      }
    }

    if (isBotTurn && shouldOrchestrate && !gameState.hasRolled) {
      // Perform automatic Bot Dice Roll
      const timer = setTimeout(() => {
        triggerBotRoll(activeColor);
      }, botDelay);
      return () => clearTimeout(timer);
    }
  }, [gameState, isRolling, botDelay, uid]);

  // 4. Sound Sync & Turn Alert Notifications
  useEffect(() => {
    if (!gameState) return;
    // Play win sound when winner changes to a valid color
    if (gameState.winner) {
      playSound('win');
    }

    // Trigger Notification for Current Active Turn
    const activeColor = gameState.currentTurn;
    const isMyTurn = (gameMode === 'online' && activeColor === myColor) || 
                     (gameMode === 'local') || 
                     (gameMode === 'vs_bots' && activeColor === 'red');

    if (isMyTurn && !gameState.hasRolled && gameState.status === 'playing') {
      // Trigger HTML5 Web Notification if tab is backgrounded
      if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        new Notification("🎲 Sıra Sende! - Kızma Birader", {
          body: `Zar atma sırası sana geçti. Hadi oyna ve rakiplerini alt et!`,
          icon: '/favicon.ico'
        });
      }
    }
  }, [gameState?.currentTurn, gameState?.hasRolled, gameState?.status, myColor, gameMode]);

  // Trigger Local/Online database state updates
  const updateRoomState = async (updater: (prev: GameState) => GameState) => {
    if (!gameState) return;
    const nextState = updater({ ...gameState });
    nextState.lastActive = Date.now();

    if (gameMode === 'online') {
      await set(ref(db, `rooms/${roomId}`), nextState);
    } else {
      setGameState(nextState);
    }
  };

  // NICKNAME UPDATE
  const handleUpdateNickname = (newName: string) => {
    setNickname(newName);
    localStorage.setItem('ludo_nickname', newName);

    // If already inside an online lobby, sync name
    if (gameMode === 'online' && gameState) {
      updateRoomState((prev) => {
        const next = { ...prev };
        
        // Update inside claimed players
        let updated = false;
        Object.keys(next.players).forEach((color) => {
          const p = next.players[color as PlayerColor];
          if (p && p.uid === uid) {
            p.name = newName;
            updated = true;
          }
        });

        // Update inside spectators
        next.spectators = next.spectators.map((s) => {
          if (s.uid === uid) {
            s.name = newName;
            updated = true;
          }
          return s;
        });

        if (updated) {
          next.logs.push(`'${newName}' ismini güncelledi.`);
        }
        return next;
      });
    }
  };

  // INITIALIZE ROOMS (Online/Offline Modes)
  const handleCreateRoom = async (mode: 'online' | 'local' | 'vs_bots') => {
    setGameMode(mode);
    setErrorMessage('');

    if (mode === 'online') {
      const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const initialState = createInitialState(generatedId, 'online');
      
      // Register host under Red color by default
      const hostPlayer: PlayerInfo = {
        uid,
        name: nickname,
        isHost: true,
        isReady: true
      };
      initialState.players.red = hostPlayer;
      initialState.logs = [`${nickname} odayı kurdu ve Kırmızı olarak katıldı.`];

      try {
        await set(ref(db, `rooms/${generatedId}`), initialState);
        setRoomId(generatedId);
        setMyColor('red');
        setView('lobby');
        // Save to localStorage for refresh recovery
        localStorage.setItem('ludo_active_room', generatedId);
        localStorage.setItem('ludo_active_mode', 'online');
        // Update URL hash for easy sharing
        window.location.hash = generatedId;
      } catch (err) {
        setErrorMessage('Firebase bağlantı hatası oluştu. Lütfen bağlantınızı kontrol edin.');
      }
    } else if (mode === 'vs_bots') {
      // 1 human (Red), 3 Bots (Green, Blue, Yellow)
      const initialState = createInitialState('OFFLINE_AI', 'vs_bots');
      
      initialState.players.red = { uid, name: nickname, isHost: true, isReady: true };
      initialState.players.green = { uid: 'bot_green', name: 'Yeşil Bot', isBot: true };
      initialState.players.blue = { uid: 'bot_blue', name: 'Mavi Bot', isBot: true };
      initialState.players.yellow = { uid: 'bot_yellow', name: 'Sarı Bot', isBot: true };
      
      initialState.status = 'playing';
      initialState.logs = ['Yapay zeka robotlarına karşı savaş başladı! Başarılar.'];
      
      setGameState(initialState);
      setMyColor('red');
      setView('game');
      incrementStat('gamesPlayed');
    } else {
      // Offline Local (Pass and Play)
      const initialState = createInitialState('OFFLINE_LOCAL', 'local');
      
      initialState.players.red = { uid: 'local_red', name: 'Kırmızı', isReady: true };
      initialState.players.green = { uid: 'local_green', name: 'Yeşil', isReady: true };
      initialState.players.blue = { uid: 'local_blue', name: 'Mavi', isReady: true };
      initialState.players.yellow = { uid: 'local_yellow', name: 'Sarı', isReady: true };
      
      initialState.status = 'playing';
      initialState.logs = ['Aynı cihazda çok oyunculu yerel savaş başladı!'];
      
      setGameState(initialState);
      setMyColor('red'); // local player plays all, color can float
      setView('game');
      incrementStat('gamesPlayed');
    }
  };

  const handleJoinOnlineRoom = async () => {
    const targetRoom = inputRoomId.trim().toUpperCase();
    if (!targetRoom) return;

    setErrorMessage('');
    try {
      const roomSnap = await get(ref(db, `rooms/${targetRoom}`));
      if (!roomSnap.exists()) {
        setErrorMessage('Oda bulunamadı. Lütfen kodu kontrol edin.');
        return;
      }

      const val = roomSnap.val() as GameState;
      if (val.status === 'playing') {
        setErrorMessage('Bu oyun zaten başladı. İzleyici olarak katılmayı deneyebilirsiniz.');
        // Allow fallback to spectator if desired, let's let them join anyway
      }

      const joinedSpectator: PlayerInfo = {
        uid,
        name: nickname,
        isHost: false,
        isReady: false
      };

      if (!val.spectators) val.spectators = [];
      val.spectators.push(joinedSpectator);
      val.logs.push(`${nickname} izleyici olarak odaya bağlandı.`);

      await set(ref(db, `rooms/${targetRoom}`), val);
      setRoomId(targetRoom);
      setGameMode('online');
      setMyColor(null);
      setView('lobby');
      // Save to localStorage for refresh recovery
      localStorage.setItem('ludo_active_room', targetRoom);
      localStorage.setItem('ludo_active_mode', 'online');
      // Update URL hash for easy sharing
      window.location.hash = targetRoom;
    } catch (err) {
      setErrorMessage('Odaya katılırken hata oluştu.');
    }
  };

  // CLAIM COLOR IN LOBBY
  const handleSelectColor = (color: PlayerColor) => {
    if (gameMode !== 'online' || !gameState) return;

    updateRoomState((prev) => {
      const next = { ...prev };
      
      // Release any color currently claimed by this user
      Object.keys(next.players).forEach((col) => {
        const c = col as PlayerColor;
        if (next.players[c]?.uid === uid) {
          next.players[c] = null;
        }
      });

      // Claim new color
      const isHost = next.spectators.find((s) => s.uid === uid)?.isHost || false;
      next.players[color] = {
        uid,
        name: nickname,
        isHost,
        isReady: isHost // Host is ready by default
      };

      // Remove from spectators list
      next.spectators = next.spectators.filter((s) => s.uid !== uid);
      next.logs.push(`${nickname} rengini ${COLOR_NAMES[color]} olarak seçti.`);

      return next;
    });
  };

  // READY STATE TOGGLE
  const handleSetReady = (ready: boolean) => {
    if (gameMode !== 'online' || !gameState || !myColor) return;

    updateRoomState((prev) => {
      const next = { ...prev };
      const player = next.players[myColor];
      if (player) {
        player.isReady = ready;
        next.logs.push(`${nickname} şimdi ${ready ? 'HAZIR!' : 'HAZIR DEĞİL.'}`);
      }
      return next;
    });
  };

  // DYNAMIC RULE PRESET SYNC
  const handleSetSpeedPreset = (preset: 'normal' | 'fast' | 'crazy') => {
    if (gameMode !== 'online' || !gameState) return;

    updateRoomState((prev) => {
      const next = { ...prev };
      next.speedPreset = preset;
      const turkishPresetNames = { normal: 'Normal', fast: 'Hızlı', crazy: 'Çılgın' };
      next.logs.push(`Oyun kuralı kurucu tarafından '${turkishPresetNames[preset]}' olarak güncellendi.`);
      return next;
    });
  };

  // HOST START GAME WITH BOT FILLERS
  const handleStartGame = () => {
    if (gameMode !== 'online' || !gameState) return;

    updateRoomState((prev) => {
      const next = { ...prev };
      next.status = 'playing';

      // Automatically fill unclaimed player slots with intelligent AI bots
      const colors: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
      colors.forEach((col) => {
        if (!next.players[col]) {
          next.players[col] = {
            uid: `bot_${col}`,
            name: `${COLOR_NAMES[col]} Bot`,
            isBot: true,
            isReady: true
          };
        }
      });

      next.logs.push('Kurucu oyunu başlattı! Boş kalan yerler Yapay Zeka (Botlar) ile dolduruldu. Savaş başlıyor...');
      
      // Update statistic
      incrementStat('gamesPlayed');
      return next;
    });
  };

  // LEAVE GAME / ROOM
  const handleLeave = async () => {
    if (gameMode === 'online' && gameState) {
      try {
        const next = { ...gameState };
        
        // Remove from players
        Object.keys(next.players).forEach((color) => {
          const c = color as PlayerColor;
          if (next.players[c]?.uid === uid) {
            next.players[c] = null;
          }
        });

        // Remove from spectators
        next.spectators = next.spectators.filter((s) => s.uid !== uid);
        next.logs.push(`${nickname} odadan ayrıldı.`);

        // If no players or spectators left, delete room
        const activeCount = Object.values(next.players).filter(Boolean).length;
        if (activeCount === 0 && next.spectators.length === 0) {
          await remove(ref(db, `rooms/${roomId}`));
        } else {
          // If the departing client was the host, re-assign host title to someone else
          const hostExists = Object.values(next.players).some((p) => p?.isHost) || next.spectators.some((s) => s.isHost);
          if (!hostExists) {
            const firstPlayer = Object.values(next.players).find(Boolean);
            if (firstPlayer) {
              firstPlayer.isHost = true;
              firstPlayer.isReady = true;
            } else if (next.spectators.length > 0) {
              next.spectators[0].isHost = true;
            }
          }
          await set(ref(db, `rooms/${roomId}`), next);
        }
      } catch (e) {
        console.error('Error leaving online room', e);
      }
    }

    setRoomId('');
    setMyColor(null);
    setGameState(null);
    setView('menu');
    // Clear session memory on exit
    localStorage.removeItem('ludo_active_room');
    localStorage.removeItem('ludo_active_mode');
    window.location.hash = '';
  };

  // DICE ROLL TRIGGERS
  const triggerRoll = () => {
    if (!gameState || isRolling || gameState.hasRolled || gameState.winner) return;

    // Check if it is really my turn (in Online mode)
    if (gameMode === 'online' && gameState.currentTurn !== myColor) return;

    // Immediately update Firebase with rolling state so other clients animate
    updateRoomState((prev) => {
      const next = { ...prev };
      next.rollAnimState = true;
      return next;
    });

    setIsRolling(true);
    playSound('roll');

    setTimeout(() => {
      setIsRolling(false);
      const rolled = Math.floor(Math.random() * 6) + 1;
      
      updateRoomState((prev) => {
        const next = { ...prev };
        next.rollAnimState = false;
        next.diceValue = rolled;
        next.hasRolled = true;

        const pName = next.players[next.currentTurn]?.name || COLOR_NAMES[next.currentTurn];
        next.logs.push(`${COLOR_NAMES[next.currentTurn]} (${pName}) ${rolled} attı!`);

        // Check if there are any valid moves
        const valid = getValidMoves(next.currentTurn, rolled, next.tokens);
        if (valid.length === 0) {
          next.logs.push(`${COLOR_NAMES[next.currentTurn]} oyuncusunun yapabileceği hamle yok! Sıra geçiyor.`);
          
          // Auto-pass sequence after 1.5 seconds delay to let them see the roll
          setTimeout(() => {
            updateRoomState((passPrev) => {
              const passNext = { ...passPrev };
              // Ensure we haven't already advanced
              if (passNext.currentTurn === next.currentTurn && passNext.hasRolled) {
                passNext.currentTurn = getNextTurn(passNext.currentTurn, passNext.players, gameMode);
                passNext.hasRolled = false;
                passNext.diceValue = null;
              }
              return passNext;
            });
          }, 1500);
        }

        return next;
      });
    }, 700);
  };

  // AI ROLL AUTOMATION
  const triggerBotRoll = (botColor: PlayerColor) => {
    if (!gameState || isRolling || gameState.hasRolled) return;

    updateRoomState((prev) => {
      const next = { ...prev };
      next.rollAnimState = true;
      return next;
    });

    setIsRolling(true);
    playSound('roll');

    setTimeout(() => {
      setIsRolling(false);
      const rolled = Math.floor(Math.random() * 6) + 1;

      updateRoomState((prev) => {
        const next = { ...prev };
        next.rollAnimState = false;
        next.diceValue = rolled;
        next.hasRolled = true;

        next.logs.push(`${COLOR_NAMES[botColor]} [Bot] ${rolled} attı!`);

        const valid = getValidMoves(botColor, rolled, next.tokens);
        
        if (valid.length === 0) {
          next.logs.push(`${COLOR_NAMES[botColor]} [Bot] için hamle yok! Sıra geçiyor.`);
          
          setTimeout(() => {
            updateRoomState((passPrev) => {
              const passNext = { ...passPrev };
              if (passNext.currentTurn === botColor && passNext.hasRolled) {
                passNext.currentTurn = getNextTurn(passNext.currentTurn, passNext.players, gameMode);
                passNext.hasRolled = false;
                passNext.diceValue = null;
              }
              return passNext;
            });
          }, 1500);
        } else {
          // AI has valid moves, automate decision and execute
          setTimeout(() => {
            executeBotMove(botColor, rolled);
          }, botDelay / 2);
        }

        return next;
      });
    }, 700);
  };

  // BOT MOVEMENT DECISION EXECUTION
  const executeBotMove = (botColor: PlayerColor, dice: number) => {
    updateRoomState((prev) => {
      const next = { ...prev };
      const selectedTokenIdx = getBotMove(botColor, dice, next.tokens);

      if (selectedTokenIdx === null) {
        // Fallback pass if something went wrong
        next.currentTurn = getNextTurn(next.currentTurn, next.players, gameMode);
        next.hasRolled = false;
        next.diceValue = null;
        return next;
      }

      const currentStep = next.tokens[botColor][selectedTokenIdx];
      const targetStep = currentStep === -1 ? 0 : currentStep + dice;
      
      // Apply movement
      next.tokens[botColor][selectedTokenIdx] = targetStep;
      playSound('move');

      const targetCoords = getTokenCoords(botColor, selectedTokenIdx, targetStep);
      const bName = next.players[botColor]?.name || `Yapay Zeka (${COLOR_NAMES[botColor]})`;

      if (currentStep === -1) {
        next.logs.push(`${COLOR_NAMES[botColor]} [Bot] ${selectedTokenIdx + 1} nolu taşını eve çıkardı.`);
      } else if (targetStep === 56) {
        next.logs.push(`${COLOR_NAMES[botColor]} [Bot] ${selectedTokenIdx + 1} nolu taşını HEDEFE ulaştırdı! 🎉`);
      } else {
        next.logs.push(`${COLOR_NAMES[botColor]} [Bot] ${selectedTokenIdx + 1} nolu taşını oynattı.`);
      }

      // Check collision/kick back
      const kick = checkKick(botColor, targetCoords, next.tokens);
      if (kick) {
        next.tokens[kick.color][kick.index] = -1; // Send back to base!
        playSound('kick');
        const kickedName = next.players[kick.color]?.name || COLOR_NAMES[kick.color];
        next.logs.push(`💥 ${COLOR_NAMES[botColor]} [Bot], ${COLOR_NAMES[kick.color]} oyuncusunun (${kickedName}) taşını kesti ve evine yolladı!`);
      }

      // Check win condition
      const won = next.tokens[botColor].every((s) => s === 56);
      if (won) {
        next.winner = botColor;
        next.status = 'finished';
        next.logs.push(`🏆 OYUN BİTTİ! ${COLOR_NAMES[botColor]} oyuncusu (${bName}) tüm taşlarını ulaştırarak şampiyon oldu!`);
        return next;
      }

      // Transition turn
      // In Ludo, rolling a 6 grants an extra turn
      if (dice === 6) {
        next.logs.push(`🎲 ${COLOR_NAMES[botColor]} [Bot] 6 attığı için ekstra zar hakkı kazandı!`);
        next.hasRolled = false;
        next.diceValue = null;
      } else {
        next.currentTurn = getNextTurn(botColor, next.players, gameMode);
        next.hasRolled = false;
        next.diceValue = null;
      }

      return next;
    });
  };

  // LOCAL STATISTICS PERSISTENCE HELPER
  const incrementStat = (key: 'gamesPlayed' | 'wins' | 'losses' | 'kicks') => {
    const currentStats = { ...stats };
    currentStats[key] += 1;
    setStats(currentStats);
    localStorage.setItem('ludo_stats_v2', JSON.stringify(currentStats));
  };

  // HUMAN TOKEN MOVEMENT CLICK HANDLER
  const handleTokenClick = (tokenIdx: number) => {
    if (!gameState || isRolling || !gameState.hasRolled || gameState.winner) return;

    const color = gameState.currentTurn;
    const dice = gameState.diceValue;

    if (dice === null) return;

    // Concurrency verification
    if (gameMode === 'online' && color !== myColor) return;

    updateRoomState((prev) => {
      const next = { ...prev };
      const currentStep = next.tokens[color][tokenIdx];
      const targetStep = currentStep === -1 ? 0 : currentStep + dice;

      // Update position
      next.tokens[color][tokenIdx] = targetStep;
      playSound('move');

      const targetCoords = getTokenCoords(color, tokenIdx, targetStep);
      const pName = next.players[color]?.name || COLOR_NAMES[color];

      if (currentStep === -1) {
        next.logs.push(`${COLOR_NAMES[color]} (${pName}), ${tokenIdx + 1} nolu taşı baseden çıkardı.`);
      } else if (targetStep === 56) {
        next.logs.push(`🎉 ${COLOR_NAMES[color]} (${pName}), ${tokenIdx + 1} nolu taşı HEDEFE yerleştirdi!`);
      } else {
        next.logs.push(`${COLOR_NAMES[color]} (${pName}), ${tokenIdx + 1} nolu taşı ${dice} hane ilerletti.`);
      }

      // Check collision/kick
      const kick = checkKick(color, targetCoords, next.tokens);
      if (kick) {
        next.tokens[kick.color][kick.index] = -1; // Send back to base!
        playSound('kick');
        const kickedName = next.players[kick.color]?.name || COLOR_NAMES[kick.color];
        next.logs.push(`💥 RAKİP KESİLDİ! ${COLOR_NAMES[color]} oyuncusu, ${COLOR_NAMES[kick.color]} (${kickedName}) taşını kesti!`);

        // Record player kick stat if human player kicked someone
        const isMyPiece = (gameMode === 'online' && color === myColor) || 
                          (gameMode === 'vs_bots' && color === 'red') || 
                          (gameMode === 'local');
        if (isMyPiece) {
          incrementStat('kicks');
        }
      }

      // Check win condition
      const won = next.tokens[color].every((s) => s === 56);
      if (won) {
        next.winner = color;
        next.status = 'finished';
        next.logs.push(`🏆 ZAFER! ${COLOR_NAMES[color]} oyuncusu (${pName}) oyunu kazandı! Tebrikler!`);

        // Log Stats on Win
        const isMyPiece = (gameMode === 'online' && color === myColor) || 
                          (gameMode === 'vs_bots' && color === 'red');
        if (isMyPiece) {
          incrementStat('wins');
        } else {
          incrementStat('losses');
        }
        return next;
      }

      // Transition turn
      const isCrazy = next.speedPreset === 'crazy';
      const isFast = next.speedPreset === 'fast';
      const isExtraTurnDice = isCrazy ? (dice >= 4) : isFast ? (dice >= 5) : (dice === 6);

      if (isExtraTurnDice) {
        next.logs.push(`🎲 Ekstra Şans! ${COLOR_NAMES[color]} oyuncusu ${dice} attığı için bir kez daha atıyor.`);
        next.hasRolled = false;
        next.diceValue = null;
      } else {
        next.currentTurn = getNextTurn(color, next.players, gameMode);
        next.hasRolled = false;
        next.diceValue = null;
      }

      return next;
    });
  };

  // SEND CHAT MESSAGE (Lobby / Game)
  const handleSendMessage = (text: string) => {
    if (!text.trim() || !roomId || gameMode !== 'online') return;

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      sender: nickname,
      senderColor: myColor || 'system',
      text: text.trim(),
      timestamp: Date.now()
    };

    // Push message to the database list
    const chatRef = ref(db, `rooms/${roomId}/chat/${newMsg.id}`);
    set(chatRef, newMsg);
  };

  // RENDER MAIN WELCOME MENU
  const renderMenu = () => {
    return (
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-8 justify-center min-h-[80vh] px-4">
        
        {/* Left Side: Brand Visual */}
        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-xl shadow-red-200 animate-pulse">
            <Trophy className="h-7 w-7 text-white fill-amber-300" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-red-600 via-indigo-600 to-blue-600">
              Kızma Birader
            </h1>
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-widest">
              Çok Oyunculu Akıl Savaşları
            </p>
          </div>
          <p className="text-slate-500 text-sm max-w-md leading-relaxed">
            Klasik Ludo oyununu şimdi ister tek başınıza üstün yapay zeka botlarına karşı, ister aynı cihazda ailenizle, isterseniz de oda kurup arkadaşlarınızla online olarak eş zamanlı oynayın!
          </p>

          {/* Quick Profile Setup */}
          <div className="bg-white/70 backdrop-blur border border-slate-200/50 p-4 rounded-2xl shadow-sm max-w-sm space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Oyuncu Adın
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  localStorage.setItem('ludo_nickname', e.target.value);
                }}
                placeholder="Oyuncu adınız..."
                className="w-full text-sm font-semibold px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Local Statistics Widget */}
            <div className="border-t border-slate-200/50 pt-3 space-y-2">
              <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider block">
                Kişisel Performans Karnen
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-center">
                <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                  <span className="text-[9px] text-slate-400 font-bold block">Maç</span>
                  <span className="text-xs font-extrabold text-slate-700">{stats.gamesPlayed}</span>
                </div>
                <div className="bg-emerald-50/50 p-1.5 rounded-lg border border-emerald-100/40">
                  <span className="text-[9px] text-emerald-600 font-bold block">Zafer</span>
                  <span className="text-xs font-extrabold text-emerald-700">{stats.wins}</span>
                </div>
                <div className="bg-red-50/50 p-1.5 rounded-lg border border-red-100/40">
                  <span className="text-[9px] text-red-500 font-bold block">Yenilgi</span>
                  <span className="text-xs font-extrabold text-red-700">{stats.losses}</span>
                </div>
                <div className="bg-amber-50/50 p-1.5 rounded-lg border border-amber-100/40">
                  <span className="text-[9px] text-amber-600 font-bold block">Oran %</span>
                  <span className="text-xs font-extrabold text-amber-700">
                    {stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold px-1">
                <span>⚔️ Toplam Kırılan Taş:</span>
                <span className="font-bold text-slate-600">{stats.kicks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Options Menu */}
        <div className="w-full max-w-md bg-white border border-slate-200/60 p-6 md:p-8 rounded-3xl shadow-xl space-y-4 relative overflow-hidden">
          
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-70 pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-6 -mb-6 w-24 h-24 bg-red-50 rounded-full blur-2xl opacity-70 pointer-events-none" />

          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 text-center">
            Bir Oyun Modu Seçin
          </h3>

          {/* 1. VS BOTS (Solo Play) */}
          <button
            onClick={() => handleCreateRoom('vs_bots')}
            className="w-full p-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl shadow-md shadow-orange-100 flex items-center justify-between transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Compass className="w-5 h-5 text-white animate-spin" style={{ animationDuration: '10s' }} />
              </div>
              <div>
                <span className="text-sm font-extrabold block">Yapay Zekaya Karşı</span>
                <span className="text-[10px] text-orange-100 font-medium">Solo oyun: Akıllı botlara karşı pratik yapın</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-orange-100" />
          </button>

          {/* 2. PASS & PLAY (Local) */}
          <button
            onClick={() => handleCreateRoom('local')}
            className="w-full p-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl shadow-md shadow-indigo-100 flex items-center justify-between transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="flex items-center gap-3.5 text-left">
              <div className="bg-white/20 p-2.5 rounded-xl">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-sm font-extrabold block">Aynı Cihazda (Yerel Maç)</span>
                <span className="text-[10px] text-indigo-100 font-medium">Sırayla oyna: Arkadaşlarınla yan yana savaş</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-indigo-100" />
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400 font-bold tracking-wider text-[9px]">VEYA ÇEVRİMİÇİ SAVAŞ</span></div>
          </div>

          {/* 3. ONLINE LOBBY CREATION */}
          <div className="space-y-2.5">
            <button
              onClick={() => handleCreateRoom('online')}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Yeni Çevrimiçi Oda Kur
            </button>

            {/* 4. JOIN ROOM FORM */}
            <div className="flex gap-2">
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Oda Kodu Girin..."
                maxLength={6}
                className="flex-1 text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 uppercase tracking-widest text-center"
              />
              <button
                onClick={handleJoinOnlineRoom}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-50 transition-all cursor-pointer active:scale-95"
              >
                Katıl
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="text-[11px] bg-red-50 text-red-600 p-2.5 rounded-xl border border-red-200/50 font-semibold text-center leading-relaxed">
              ⚠️ {errorMessage}
            </div>
          )}

        </div>
      </div>
    );
  };

  // CHAT MESSAGES PREPARATION
  const chatMessages: ChatMessage[] = gameState?.chat
    ? Object.values(gameState.chat).sort((a, b) => a.timestamp - b.timestamp)
    : [];

  // RENDER INTERACTIVE ACTIVE BOARD GAME VIEW
  const renderGame = () => {
    if (!gameState) return null;

    const activeColor = gameState.currentTurn;

    // Check if it's currently my turn to roll
    const isMyTurnToRoll =
      gameState.winner === null &&
      !gameState.hasRolled &&
      !isRolling &&
      (gameMode !== 'online' || activeColor === myColor);

    // Calculate valid moves indices for rendering
    const validMoves = gameState.hasRolled && gameState.diceValue !== null
      ? getValidMoves(activeColor, gameState.diceValue, gameState.tokens)
      : [];

    return (
      <div className="max-w-6xl mx-auto px-2 py-4 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Confetti Overlay for Victory */}
        {gameState.winner && <Confetti />}

        {/* Board Renderer (Col 1 to 6) */}
        <div className="lg:col-span-6 flex flex-col items-center gap-4">
          
          <div className="w-full flex items-center justify-between px-2">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Kızma Birader</h2>
              {gameMode === 'online' && (
                <span className="text-[10px] bg-slate-100 border border-slate-200 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">
                  Oda: {roomId}
                </span>
              )}
            </div>

            {/* Displaying simple sound notice */}
            <span className="text-[9px] text-slate-400 font-semibold flex items-center gap-1">
              🔊 Ses Efektleri Etkin
            </span>
          </div>

          <Board
            tokens={gameState.tokens}
            currentTurn={activeColor}
            diceValue={gameState.diceValue}
            validMoves={validMoves}
            onTokenClick={handleTokenClick}
            myColor={gameMode === 'online' ? myColor : activeColor}
            hasRolled={gameState.hasRolled}
          />
        </div>

        {/* Controls, Dice, Stats, and Sidebar (Col 7 to 9) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Active Player Status Overlay */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-950 text-white p-4 rounded-2xl shadow-xl border border-indigo-950 space-y-3.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-14 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Hamle Alanı
              </span>
              {gameState.diceValue && (
                <span className="text-xs font-bold text-amber-300">
                  Zar Sonucu: {gameState.diceValue}
                </span>
              )}
            </div>

            {/* Dice control wrapper */}
            <div className="flex items-center justify-center py-2">
              <Dice
                value={gameState.diceValue}
                onRoll={triggerRoll}
                disabled={!isMyTurnToRoll}
                isRolling={isRolling || !!gameState.rollAnimState}
              />
            </div>

            {/* Prompt instructions */}
            <div className="text-center text-xs font-semibold leading-relaxed">
              {gameState.winner ? (
                <span className="text-emerald-400 font-bold animate-pulse">🏆 Oyun Bitti! Şampiyon İlan Edildi.</span>
              ) : (isRolling || !!gameState.rollAnimState) ? (
                <span className="text-amber-300 animate-pulse">🎲 Zar atılıyor, lütfen bekleyin...</span>
              ) : !gameState.hasRolled ? (
                isMyTurnToRoll ? (
                  <span className="text-green-400 animate-bounce block">👉 Zar atma sırası sizde!</span>
                ) : (
                  <span className="text-slate-300">Sıra {COLOR_NAMES[activeColor]} oyuncuda...</span>
                )
              ) : validMoves.length > 0 ? (
                isMyTurnToRoll || gameMode !== 'online' ? (
                  <span className="text-indigo-300 animate-pulse block font-extrabold">⚡ Oynatmak için tahtadaki taşlardan birine tıklayın!</span>
                ) : (
                  <span className="text-slate-300">{COLOR_NAMES[activeColor]} oyuncusu taşını seçiyor...</span>
                )
              ) : (
                <span className="text-red-400 font-medium">Bu zar ile gidilecek hamle yok! Sıra geçiyor...</span>
              )}
            </div>
          </div>

          {/* Real-time Game Chat inside Online Mode */}
          {gameMode === 'online' && (
            <Chat
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              myColor={myColor}
              myName={nickname}
            />
          )}
        </div>

        {/* Sidebar Status Summary & History Logs (Col 10 to 12) */}
        <div className="lg:col-span-3">
          <Sidebar
            players={gameState.players}
            currentTurn={activeColor}
            tokens={gameState.tokens}
            winner={gameState.winner}
            logs={gameState.logs}
            onLeave={handleLeave}
            gameMode={gameMode}
            myColor={gameMode === 'online' ? myColor : null}
            botDelay={botDelay}
            setBotDelay={setBotDelay}
          />
        </div>

      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-2xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={handleLeave}
            className="flex items-center gap-2 hover:opacity-85 transition-all text-left outline-none"
          >
            <div className="h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md flex">
              <Trophy className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 leading-tight">Kızma Birader</h1>
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-widest">Multiplayer</span>
            </div>
          </button>

          {/* Connection Status Indicator */}
          {!isOnline && (
            <span className="text-[10px] bg-red-50 border border-red-200 text-red-600 px-3 py-1 rounded-full font-extrabold animate-pulse uppercase tracking-wide">
              ⚠️ İnternet Yok (Çevrimdışı)
            </span>
          )}

          {/* Quick status displays */}
          {view !== 'menu' && (
            <button
              onClick={handleLeave}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border text-slate-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Odadan Ayrıl
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto py-6">
        {view === 'menu' && renderMenu()}
        {view === 'lobby' && (
          <Lobby
            roomId={roomId}
            players={gameState?.players || { red: null, green: null, blue: null, yellow: null }}
            spectators={gameState?.spectators || []}
            myColor={myColor}
            myName={nickname}
            myUid={uid}
            onSelectColor={handleSelectColor}
            onSetReady={handleSetReady}
            onStartGame={handleStartGame}
            onSetName={handleUpdateNickname}
            onLeave={handleLeave}
            speedPreset={gameState?.speedPreset || 'normal'}
            onSetSpeedPreset={handleSetSpeedPreset}
          />
        )}
        {view === 'game' && renderGame()}
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-200/40 py-6 mt-12 bg-white text-center text-xs text-slate-400 font-semibold uppercase tracking-wider">
        Kızma Birader Multiplayer © 2026 • Tüm Hakları Saklıdır
      </footer>
    </div>
  );
}
