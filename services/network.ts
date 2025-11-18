import { Player } from '../types';

// Helper to generate a friendly 4-letter code
export const generateRoomCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const PRE_ID = 'vetmed-jeopardy-v1-';

// Wrapper for PeerJS interactions
// Note: In a real app, we would use a more robust signaling server or handling
// but for this demo, we rely on the public PeerJS cloud.

export class GameNetwork {
  peer: any;
  connections: Map<string, any> = new Map();
  isHost: boolean = false;

  constructor() {
    // @ts-ignore - Peer is loaded via CDN in index.html
    if (window.Peer) {
      // @ts-ignore
      this.peer = null;
    }
  }

  destroy() {
    if (this.peer) {
      this.peer.destroy();
    }
    this.connections.clear();
  }
}
