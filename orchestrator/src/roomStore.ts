import type WebSocket from 'ws';
import { customAlphabet } from 'nanoid';
import { config } from './config.js';
import type { Role, RoomConnection, RoomState } from './types.js';

const generateRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);

export class RoomStore {
  private rooms = new Map<string, RoomState>();

  constructor() {
    setInterval(() => this.cleanup(), config.cleanupIntervalMs).unref();
  }

  createRoom(): RoomState {
    let code = '';
    do {
      code = generateRoomCode();
    } while (this.rooms.has(code));

    const room: RoomState = {
      code,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      players: new Map(),
    };
    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): RoomState | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  deleteRoom(code: string) {
    this.rooms.delete(code.toUpperCase());
  }

  touchRoom(room: RoomState) {
    room.updatedAt = Date.now();
  }

  attachSocket(
    room: RoomState,
    role: Role,
    connectionId: string,
    socket: WebSocket,
    metadata?: Partial<RoomConnection>
  ) {
    if (role === 'HOST') {
      room.host = { id: connectionId, socket, ...metadata };
    } else {
      const existing = room.players.get(connectionId) || { id: connectionId };
      room.players.set(connectionId, { ...existing, ...metadata, socket });
    }
    this.touchRoom(room);
  }

  detachSocket(room: RoomState, role: Role, connectionId: string) {
    if (role === 'HOST') {
      room.host = undefined;
      // When host disconnects, drop room entirely
      this.deleteRoom(room.code);
      return;
    }
    const player = room.players.get(connectionId);
    if (player) {
      player.socket = undefined;
      room.players.delete(connectionId);
    }
    if (!room.host && room.players.size === 0) {
      this.deleteRoom(room.code);
    }
  }

  broadcastToPlayers(room: RoomState, data: any, exceptId?: string) {
    for (const [playerId, player] of room.players.entries()) {
      if (playerId === exceptId) continue;
      player.socket?.send(JSON.stringify(data));
    }
  }

  sendToPlayer(room: RoomState, playerId: string, data: any) {
    const player = room.players.get(playerId);
    player?.socket?.send(JSON.stringify(data));
  }

  sendToHost(room: RoomState, data: any) {
    room.host?.socket?.send(JSON.stringify(data));
  }

  private cleanup() {
    const now = Date.now();
    for (const [code, room] of this.rooms.entries()) {
      if (now - room.updatedAt > config.roomTtlMs) {
        this.rooms.delete(code);
      }
    }
  }
}
