import type { NetworkMessage } from '../types';

const getWin = () => (typeof window === 'undefined' ? undefined : window);

const getBaseUrl = () => {
  const configured = import.meta.env.PUBLIC_SIGNALING_URL || (getWin() as any)?.__SIGNALING_URL__;
  if (configured) return configured.replace(/\/$/, '');
  if (import.meta.env.DEV) return 'http://localhost:8788';
  throw new Error('PUBLIC_SIGNALING_URL is not configured');
};

const toWsUrl = (url: string) => url.replace(/^http/, 'ws');

export interface HostSession {
  roomCode: string;
  hostToken: string;
}

export interface PlayerSession {
  roomCode: string;
  playerId: string;
  playerToken: string;
}

interface ConnectOptions {
  token: string;
  role: 'HOST' | 'PLAYER';
  onHostMessage?: (message: NetworkMessage) => void;
  onPlayerMessage?: (payload: { playerId: string; message: NetworkMessage }) => void;
  onClose?: () => void;
  onOpen?: () => void;
}

export interface RealtimeClient {
  close: () => void;
  sendToAll: (message: NetworkMessage) => void;
  sendToPlayer: (playerId: string, message: NetworkMessage) => void;
  sendToHost: (message: NetworkMessage) => void;
}

export const createHostSession = async (): Promise<HostSession> => {
  const res = await fetch(`${getBaseUrl()}/rooms`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create room');
  return res.json();
};

export const joinRoomSession = async (roomCode: string, name: string): Promise<PlayerSession> => {
  const res = await fetch(`${getBaseUrl()}/rooms/${roomCode}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || 'Unable to join room');
  }
  return res.json();
};

export const connectRealtime = (options: ConnectOptions): RealtimeClient => {
  let socket: WebSocket | null = null;
  let stopped = false;
  let attempt = 0;
  let isOpen = false;

  const url = `${toWsUrl(getBaseUrl())}/ws?token=${options.token}`;

  const connect = () => {
    socket = new WebSocket(url);

    socket.addEventListener('open', () => {
      isOpen = true;
      attempt = 0;
      options.onOpen?.();
    });

    socket.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.from === 'HOST') options.onHostMessage?.(payload.message);
        else if (payload.from === 'PLAYER') {
          options.onPlayerMessage?.({ playerId: payload.playerId, message: payload.message });
        }
      } catch (err) {
        console.error('Failed to parse realtime payload', err);
      }
    });

    socket.addEventListener('close', () => {
      isOpen = false;
      options.onClose?.();
      if (!stopped) scheduleReconnect();
    });

    socket.addEventListener('error', () => {
      socket?.close();
    });
  };

  const scheduleReconnect = () => {
    attempt += 1;
    const delay = Math.min(10000, 1000 * Math.pow(2, attempt));
    setTimeout(() => {
      if (!stopped) connect();
    }, delay);
  };

  connect();

  return {
    close: () => {
      stopped = true;
      socket?.close();
    },
    sendToAll: (message: NetworkMessage) => {
      if (options.role !== 'HOST') return;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ target: 'ALL', message }));
    },
    sendToPlayer: (playerId: string, message: NetworkMessage) => {
      if (options.role !== 'HOST') return;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ target: 'PLAYER', playerId, message }));
    },
    sendToHost: (message: NetworkMessage) => {
      if (options.role !== 'PLAYER') return;
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ message }));
    },
  };
};
