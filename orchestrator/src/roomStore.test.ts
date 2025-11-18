import { describe, expect, it } from 'vitest';
import { RoomStore } from './roomStore.js';

const noopSocket = { send: () => {} } as any;

describe('RoomStore', () => {
  it('creates unique room codes', () => {
    const store = new RoomStore();
    const room1 = store.createRoom();
    const room2 = store.createRoom();
    expect(room1.code).not.toEqual(room2.code);
  });

  it('attaches and detaches players', () => {
    const store = new RoomStore();
    const room = store.createRoom();
    store.attachSocket(room, 'PLAYER', 'p1', noopSocket);
    expect(room.players.size).toBe(1);
    store.detachSocket(room, 'PLAYER', 'p1');
    expect(room.players.size).toBe(0);
  });
});
