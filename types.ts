export enum GameStatus {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface Player {
  id: string; // Peer ID
  name: string;
  score: number;
  isConnected: boolean;
}

export interface Clue {
  id: string;
  value: number;
  question: string;
  answer: string; // The correct answer (for reference)
  isAnswered: boolean;
  winnerId?: string; // ID of the player who answered correctly, if any
  isDailyDouble?: boolean;
  imageUrl?: string; // URL for visual diagnosis images
}

export interface Category {
  id: string;
  title: string;
  clues: Clue[];
}

export interface GameBoardData {
  categories: Category[];
}

// --- Networking Types ---

export type NetworkMessageType =
  | 'JOIN'
  | 'WELCOME'
  | 'BUZZ'
  | 'UPDATE_PLAYERS'
  | 'BUZZER_STATUS'
  | 'AWARD'
  | 'BOARD_UPDATE'
  | 'CLUE_SELECTED'
  | 'CLUE_CLOSED'
  | 'PING'
  | 'PONG'
  | 'RESYNC';

export interface NetworkMessage {
  type: NetworkMessageType;
  payload: any;
}

export type BuzzerStatus = 'LOCKED' | 'ARMED' | 'BUZZED';

export interface BuzzerState {
  status: BuzzerStatus;
  buzzedPlayerId: string | null;
}