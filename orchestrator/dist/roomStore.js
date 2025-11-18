import { customAlphabet } from 'nanoid';
import { config } from './config.js';
const generateRoomCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);
export class RoomStore {
    constructor() {
        this.rooms = new Map();
        setInterval(() => this.cleanup(), config.cleanupIntervalMs).unref();
    }
    createRoom() {
        let code = '';
        do {
            code = generateRoomCode();
        } while (this.rooms.has(code));
        const room = {
            code,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            players: new Map(),
        };
        this.rooms.set(code, room);
        return room;
    }
    getRoom(code) {
        return this.rooms.get(code.toUpperCase());
    }
    deleteRoom(code) {
        this.rooms.delete(code.toUpperCase());
    }
    touchRoom(room) {
        room.updatedAt = Date.now();
    }
    attachSocket(room, role, connectionId, socket, metadata) {
        if (role === 'HOST') {
            room.host = { id: connectionId, socket, ...metadata };
        }
        else {
            const existing = room.players.get(connectionId) || { id: connectionId };
            room.players.set(connectionId, { ...existing, ...metadata, socket });
        }
        this.touchRoom(room);
    }
    detachSocket(room, role, connectionId) {
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
    broadcastToPlayers(room, data, exceptId) {
        for (const [playerId, player] of room.players.entries()) {
            if (playerId === exceptId)
                continue;
            player.socket?.send(JSON.stringify(data));
        }
    }
    sendToPlayer(room, playerId, data) {
        const player = room.players.get(playerId);
        player?.socket?.send(JSON.stringify(data));
    }
    sendToHost(room, data) {
        room.host?.socket?.send(JSON.stringify(data));
    }
    cleanup() {
        const now = Date.now();
        for (const [code, room] of this.rooms.entries()) {
            if (now - room.updatedAt > config.roomTtlMs) {
                this.rooms.delete(code);
            }
        }
    }
}
