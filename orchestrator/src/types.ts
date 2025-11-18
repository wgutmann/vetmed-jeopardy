import type WebSocket from 'ws';

export type Role = 'HOST' | 'PLAYER';

export interface TokenClaims {
  roomCode: string;
  role: Role;
  playerId?: string;
  iat?: number;
  exp?: number;
}

export interface RelayPacket {
  target: 'ALL' | 'PLAYER';
  playerId?: string;
  message: any;
}

export interface PlayerInboundPacket {
  message: any;
}

export interface RoomConnection {
  id: string;
  name?: string;
}

export interface RoomState {
  code: string;
  createdAt: number;
  updatedAt: number;
  host?: RoomConnection & { socket?: WebSocket };
  players: Map<string, RoomConnection & { socket?: WebSocket }>; // key playerId
}

export interface ConnectionContext {
  room: RoomState;
  role: Role;
  playerId?: string;
}
