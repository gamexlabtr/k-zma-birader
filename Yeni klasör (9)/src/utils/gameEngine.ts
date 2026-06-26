export type PlayerColor = 'red' | 'green' | 'blue' | 'yellow';

export interface PlayerInfo {
  uid: string;
  name: string;
  isHost?: boolean;
  isBot?: boolean;
  isReady?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: string;
  senderColor?: PlayerColor | 'system';
  text: string;
  timestamp: number;
}

export type SpeedPreset = 'normal' | 'fast' | 'crazy';

export interface EmojiReaction {
  sender: string;
  emoji: string;
  timestamp: number;
}

export interface GameState {
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Record<PlayerColor, PlayerInfo | null>;
  spectators: PlayerInfo[];
  currentTurn: PlayerColor;
  diceValue: number | null;
  hasRolled: boolean;
  extraTurn: boolean; // True if rolled 6 and gets another turn
  tokens: Record<PlayerColor, number[]>; // Array of 4 steps per color (-1 is Base, 56 is Goal)
  winner: PlayerColor | null;
  logs: string[];
  chat?: Record<string, ChatMessage>;
  createdAt: number;
  lastActive: number;
  rollAnimState?: boolean; // For visual trigger
  gameMode: 'online' | 'local' | 'vs_bots';
  speedPreset?: SpeedPreset; // normal, fast, crazy
  reactions?: Record<string, EmojiReaction>; // real-time sync reactions
}

export const COLORS: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];

export const COLOR_NAMES: Record<PlayerColor, string> = {
  red: 'Kırmızı',
  green: 'Yeşil',
  blue: 'Mavi',
  yellow: 'Sarı'
};

export const COLOR_HEX: Record<PlayerColor, string> = {
  red: '#ef4444',
  green: '#22c55e',
  blue: '#3b82f6',
  yellow: '#eab308'
};

export const COLOR_BG_CLASS: Record<PlayerColor, string> = {
  red: 'bg-red-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500'
};

export const COLOR_TEXT_CLASS: Record<PlayerColor, string> = {
  red: 'text-red-500',
  green: 'text-green-500',
  blue: 'text-blue-500',
  yellow: 'text-yellow-500'
};

export const COLOR_BORDER_CLASS: Record<PlayerColor, string> = {
  red: 'border-red-500',
  green: 'border-green-500',
  blue: 'border-blue-500',
  yellow: 'border-yellow-500'
};

// 15x15 Ludo board outer circular track
export const OUTER_TRACK_COORDS = [
  { r: 6, c: 0 }, { r: 6, c: 1 }, { r: 6, c: 2 }, { r: 6, c: 3 }, { r: 6, c: 4 }, { r: 6, c: 5 }, // 0-5
  { r: 5, c: 6 }, { r: 4, c: 6 }, { r: 3, c: 6 }, { r: 2, c: 6 }, { r: 1, c: 6 }, { r: 0, c: 6 }, // 6-11
  { r: 0, c: 7 }, // 12
  { r: 0, c: 8 }, { r: 1, c: 8 }, { r: 2, c: 8 }, { r: 3, c: 8 }, { r: 4, c: 8 }, { r: 5, c: 8 }, // 13-18
  { r: 6, c: 9 }, { r: 6, c: 10 }, { r: 6, c: 11 }, { r: 6, c: 12 }, { r: 6, c: 13 }, { r: 6, c: 14 }, // 19-24
  { r: 7, c: 14 }, // 25
  { r: 8, c: 14 }, { r: 8, c: 13 }, { r: 8, c: 12 }, { r: 8, c: 11 }, { r: 8, c: 10 }, { r: 8, c: 9 }, // 26-31
  { r: 9, c: 8 }, { r: 10, c: 8 }, { r: 11, c: 8 }, { r: 12, c: 8 }, { r: 13, c: 8 }, { r: 14, c: 8 }, // 32-37
  { r: 14, c: 7 }, // 38
  { r: 14, c: 6 }, { r: 13, c: 6 }, { r: 12, c: 6 }, { r: 11, c: 6 }, { r: 10, c: 6 }, { r: 9, c: 6 }, // 39-44
  { r: 8, c: 5 }, { r: 8, c: 4 }, { r: 8, c: 3 }, { r: 8, c: 2 }, { r: 8, c: 1 }, { r: 8, c: 0 }, // 45-50
  { r: 7, c: 0 } // 51
];

// Start cell offsets on OUTER_TRACK_COORDS
export const COLOR_START_INDEX: Record<PlayerColor, number> = {
  red: 1,       // (6, 1)
  green: 14,    // (1, 8)
  blue: 27,     // (8, 13)
  yellow: 40    // (13, 6)
};

// Safe zones indices on OUTER_TRACK_COORDS (Usually starting cells)
export const SAFE_COORDS = [
  { r: 6, c: 1 },  // Red start
  { r: 1, c: 8 },  // Green start
  { r: 8, c: 13 }, // Blue start
  { r: 13, c: 6 }, // Yellow start
  { r: 2, c: 6 },  // Bonus safe
  { r: 6, c: 12 }, // Bonus safe
  { r: 12, c: 8 }, // Bonus safe
  { r: 8, c: 2 }   // Bonus safe
];

export const isCellSafe = (r: number, c: number): boolean => {
  return SAFE_COORDS.some(coord => coord.r === r && coord.c === c);
};

// Base coordinates for tokens (4 slots each)
export const BASE_COORDS: Record<PlayerColor, { r: number, c: number }[]> = {
  red: [
    { r: 2, c: 2 }, { r: 2, c: 3 },
    { r: 3, c: 2 }, { r: 3, c: 3 }
  ],
  green: [
    { r: 2, c: 11 }, { r: 2, c: 12 },
    { r: 3, c: 11 }, { r: 3, c: 12 }
  ],
  blue: [
    { r: 11, c: 11 }, { r: 11, c: 12 },
    { r: 12, c: 11 }, { r: 12, c: 12 }
  ],
  yellow: [
    { r: 11, c: 2 }, { r: 11, c: 3 },
    { r: 12, c: 2 }, { r: 12, c: 3 }
  ]
};

// Home Run track coordinates (5 steps before Goal)
export const HOME_RUN_COORDS: Record<PlayerColor, { r: number, c: number }[]> = {
  red: [
    { r: 7, c: 1 }, { r: 7, c: 2 }, { r: 7, c: 3 }, { r: 7, c: 4 }, { r: 7, c: 5 }
  ],
  green: [
    { r: 1, c: 7 }, { r: 2, c: 7 }, { r: 3, c: 7 }, { r: 4, c: 7 }, { r: 5, c: 7 }
  ],
  blue: [
    { r: 7, c: 13 }, { r: 7, c: 12 }, { r: 7, c: 11 }, { r: 7, c: 10 }, { r: 7, c: 9 }
  ],
  yellow: [
    { r: 13, c: 7 }, { r: 12, c: 7 }, { r: 11, c: 7 }, { r: 10, c: 7 }, { r: 9, c: 7 }
  ]
};

// Home Goal coordinates (step 56)
export const GOAL_COORDS: Record<PlayerColor, { r: number, c: number }> = {
  red: { r: 7, c: 6 },
  green: { r: 6, c: 7 },
  blue: { r: 7, c: 8 },
  yellow: { r: 8, c: 7 }
};

/**
 * Returns the 15x15 grid coordinates for a specific token at a specific step
 */
export const getTokenCoords = (color: PlayerColor, tokenIdx: number, step: number): { r: number, c: number } => {
  if (step === -1) {
    // Inside base
    return BASE_COORDS[color][tokenIdx];
  }
  if (step >= 0 && step <= 50) {
    // Outer track
    const startIdx = COLOR_START_INDEX[color];
    const cellIdx = (startIdx + step) % 52;
    return OUTER_TRACK_COORDS[cellIdx];
  }
  if (step >= 51 && step <= 55) {
    // Home run path
    const runIdx = step - 51;
    return HOME_RUN_COORDS[color][runIdx];
  }
  // Step 56: Goal
  return GOAL_COORDS[color];
};

/**
 * Checks if a token can make a move with the current dice roll
 */
export const canTokenMove = (
  color: PlayerColor,
  tokenIdx: number,
  step: number,
  dice: number,
  allTokens: Record<PlayerColor, number[]>,
  speedPreset: SpeedPreset = 'normal'
): boolean => {
  // Goal already reached
  if (step === 56) return false;

  // In Base: check exit requirement based on speed preset
  if (step === -1) {
    if (speedPreset === 'crazy') {
      if (dice < 4) return false;
    } else if (speedPreset === 'fast') {
      if (dice < 5) return false;
    } else {
      if (dice !== 6) return false;
    }
    return true;
  }

  // Moving along path
  const targetStep = step + dice;
  if (targetStep > 56) {
    // Exact count needed to reach Goal (step 56)
    return false;
  }

  // Prevent landing on your own piece in the home run path (depending on rules, but let's allow it in general, or deny if it's the exact same cell in home run track)
  if (targetStep > 50 && targetStep < 56) {
    const targetCoords = getTokenCoords(color, tokenIdx, targetStep);
    const ownTokensOnTarget = allTokens[color].some((s, idx) => {
      if (idx === tokenIdx || s === -1 || s === 56) return false;
      const c = getTokenCoords(color, idx, s);
      return c.r === targetCoords.r && c.c === targetCoords.c;
    });
    // Optional: block duplicate pieces in home run to force progression
    if (ownTokensOnTarget) return false;
  }

  return true;
};

/**
 * Returns a list of indexes (0-3) of tokens that can move
 */
export const getValidMoves = (
  color: PlayerColor,
  dice: number,
  allTokens: Record<PlayerColor, number[]>,
  speedPreset: SpeedPreset = 'normal'
): number[] => {
  const valid: number[] = [];
  const tokens = allTokens[color];
  for (let i = 0; i < tokens.length; i++) {
    if (canTokenMove(color, i, tokens[i], dice, allTokens, speedPreset)) {
      valid.push(i);
    }
  }
  return valid;
};

/**
 * Creates initial clean game state
 */
export const createInitialState = (roomId: string, mode: 'online' | 'local' | 'vs_bots'): GameState => {
  const initialTokens: Record<PlayerColor, number[]> = {
    red: [-1, -1, -1, -1],
    green: [-1, -1, -1, -1],
    blue: [-1, -1, -1, -1],
    yellow: [-1, -1, -1, -1]
  };

  const initialPlayers: Record<PlayerColor, PlayerInfo | null> = {
    red: null,
    green: null,
    blue: null,
    yellow: null
  };

  return {
    roomId,
    status: 'waiting',
    players: initialPlayers,
    spectators: [],
    currentTurn: 'red',
    diceValue: null,
    hasRolled: false,
    extraTurn: false,
    tokens: initialTokens,
    winner: null,
    logs: ['Oyun odası kuruldu. Oyuncuların katılması bekleniyor.'],
    createdAt: Date.now(),
    lastActive: Date.now(),
    gameMode: mode,
    speedPreset: 'normal'
  };
};

/**
 * Finds if there is an opponent token on the target coordinate that can be kicked.
 * Returns { color: PlayerColor, index: number } or null.
 */
export const checkKick = (
  movingColor: PlayerColor,
  targetCoords: { r: number, c: number },
  allTokens: Record<PlayerColor, number[]>
): { color: PlayerColor, index: number } | null => {
  // If target is safe zone, no kicking is possible
  if (isCellSafe(targetCoords.r, targetCoords.c)) {
    return null;
  }

  for (const color of COLORS) {
    if (color === movingColor) continue; // Cannot kick own token
    const tokens = allTokens[color];
    for (let i = 0; i < tokens.length; i++) {
      const step = tokens[i];
      if (step === -1 || step === 56) continue; // Base or Goal is safe

      const coord = getTokenCoords(color, i, step);
      if (coord.r === targetCoords.r && coord.c === targetCoords.c) {
        return { color, index: i };
      }
    }
  }
  return null;
};

/**
 * Switch turn to the next player
 */
export const getNextTurn = (
  current: PlayerColor,
  players: Record<PlayerColor, PlayerInfo | null>,
  mode: 'online' | 'local' | 'vs_bots'
): PlayerColor => {
  const order: PlayerColor[] = ['red', 'green', 'blue', 'yellow'];
  const startIdx = order.indexOf(current);

  // We loop to find the next active player or bot
  for (let i = 1; i <= 4; i++) {
    const nextColor = order[(startIdx + i) % 4];
    
    if (mode === 'vs_bots') {
      // In VS Bots, all 4 slots are active (either human or bot)
      return nextColor;
    } else if (mode === 'local') {
      // In local mode, all 4 slots are playable by default, or let's say at least the joined ones.
      // Let's assume all colors are playable in local mode to allow up to 4 players pass and play!
      return nextColor;
    } else {
      // In online mode, we only pass turn to a color that has a registered player!
      if (players[nextColor] !== null) {
        return nextColor;
      }
    }
  }
  return current; // Fallback
};

/**
 * Intelligent Bot Move Decider
 * Returns index of token to move, or null if no moves possible.
 */
export const getBotMove = (
  color: PlayerColor,
  dice: number,
  allTokens: Record<PlayerColor, number[]>,
  speedPreset: SpeedPreset = 'normal'
): number | null => {
  const validMoves = getValidMoves(color, dice, allTokens, speedPreset);
  if (validMoves.length === 0) return null;

  // 1. Can we kick someone? (Priority 1)
  for (const idx of validMoves) {
    const currentStep = allTokens[color][idx];
    const targetStep = currentStep === -1 ? 0 : currentStep + dice;
    const targetCoords = getTokenCoords(color, idx, targetStep);
    
    const kick = checkKick(color, targetCoords, allTokens);
    if (kick !== null) {
      return idx; // Kicking is extremely high value!
    }
  }

  // 2. Can we score a goal? (Priority 2)
  for (const idx of validMoves) {
    const currentStep = allTokens[color][idx];
    if (currentStep + dice === 56) {
      return idx;
    }
  }

  // 3. Can we get out of base (with a 6)? (Priority 3)
  for (const idx of validMoves) {
    if (allTokens[color][idx] === -1 && dice === 6) {
      // Make sure our starting cell is not blocked by another of our own pieces if possible
      const startCoords = getTokenCoords(color, idx, 0);
      const isStartBlockedByOwn = allTokens[color].some((s, i) => {
        if (i === idx || s === -1 || s === 56) return false;
        const c = getTokenCoords(color, i, s);
        return c.r === startCoords.r && c.c === startCoords.c;
      });
      if (!isStartBlockedByOwn) {
        return idx;
      }
    }
  }

  // 4. Move pieces that are on the board, prioritizing the one furthest along (getting it home!)
  let bestIdx = validMoves[0];
  let maxStep = -2;
  for (const idx of validMoves) {
    const step = allTokens[color][idx];
    if (step > maxStep) {
      maxStep = step;
      bestIdx = idx;
    }
  }

  return bestIdx;
};
