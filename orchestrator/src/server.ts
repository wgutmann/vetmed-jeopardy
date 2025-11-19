import Fastify, { type FastifyRequest } from 'fastify';
import websocketPlugin from '@fastify/websocket';
import cors from '@fastify/cors';
import { nanoid } from 'nanoid';
import type WebSocket from 'ws';

import { config } from './config.js';
import { RoomStore } from './roomStore.js';
import { createToken, verifyToken } from './auth.js';
import type { ConnectionContext, PlayerInboundPacket, RelayPacket } from './types.js';

export const buildServer = () => {
  const app = Fastify({ logger: true });
  const rooms = new RoomStore();

  app.register(cors, {
    origin: (origin, cb) => {
      // Allow localhost, LAN, and App Runner origins
      const allowed = [
        /^https?:\/\/localhost(:\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
        /^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
        /^https?:\/\/z8w3v8e3ri\.us-east-2\.awsapprunner\.com$/,
      ];
      if (!origin || allowed.some((re) => re.test(origin))) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  app.register(websocketPlugin);

  app.get('/healthz', async () => ({ status: 'ok' }));

  app.post('/rooms', async () => {
    const room = rooms.createRoom();
    const hostId = nanoid();
    const token = createToken(room.code, 'HOST');
    return { roomCode: room.code, hostToken: token, hostId };
  });

  app.post<{ Params: { code: string } }>(
    '/rooms/:code/join',
    async (request, reply) => {
      const code = request.params.code?.toUpperCase();
      const { name } = (request.body as { name?: string }) ?? {};
      if (!name) return reply.code(400).send({ error: 'Name is required' });
      const room = rooms.getRoom(code);
      if (!room) return reply.code(404).send({ error: 'Room not found' });
      if (!room.host) return reply.code(409).send({ error: 'Host not connected' });

      const playerId = nanoid();
      const token = createToken(code, 'PLAYER', playerId);
      room.players.set(playerId, { id: playerId, name });
      rooms.touchRoom(room);
      return { roomCode: code, playerId, playerToken: token };
    }
  );

  app.get(
    '/ws',
    { websocket: true },
    (socket, req: FastifyRequest) => {
      const token = extractToken(req);
      if (!token) {
        socket.close(4001, 'Token missing');
        return;
      }

      let ctx: ConnectionContext;
      try {
        const claims = verifyToken(token);
        const room = rooms.getRoom(claims.roomCode);
        if (!room) throw new Error('Room not found');
        ctx = { room, role: claims.role, playerId: claims.playerId };
        rooms.attachSocket(room, claims.role, claims.playerId ?? claims.role, socket);
      } catch (err) {
        socket.close(4002, (err as Error).message);
        return;
      }

      socket.on('message', (raw: Buffer) => {
        try {
          const data = JSON.parse(raw.toString());
          handleMessage(ctx!, data, rooms, socket);
        } catch (err) {
          socket.send(
            JSON.stringify({ type: 'ERROR', message: (err as Error).message || 'Invalid payload' })
          );
        }
      });

      socket.on('close', () => {
        rooms.detachSocket(ctx.room, ctx.role, ctx.playerId ?? ctx.role);
      });
    }
  );

  return app;
};

const extractToken = (req: FastifyRequest) => {
  const queryToken = (req.query as { token?: string } | undefined)?.token;
  if (queryToken) return queryToken;

  try {
    const rawUrl = req.raw?.url ?? '';
    const url = new URL(rawUrl, 'http://localhost');
    return url.searchParams.get('token') ?? undefined;
  } catch {
    return undefined;
  }
};

const handleMessage = (
  ctx: ConnectionContext,
  data: any,
  rooms: RoomStore,
  socket: WebSocket
) => {
  if (!ctx.room) throw new Error('Room not initialized');

  if (ctx.role === 'HOST') {
    const payload = data as RelayPacket;
    if (!payload?.message) throw new Error('Missing message payload');

    if (payload.target === 'PLAYER' && payload.playerId) {
      rooms.sendToPlayer(ctx.room, payload.playerId, {
        from: 'HOST',
        message: payload.message,
      });
    } else {
      rooms.broadcastToPlayers(ctx.room, { from: 'HOST', message: payload.message });
    }
  } else {
    const payload = data as PlayerInboundPacket;
    if (!payload?.message) throw new Error('Missing message');
    rooms.sendToHost(ctx.room, {
      from: 'PLAYER',
      playerId: ctx.playerId,
      message: payload.message,
    });
  }

  rooms.touchRoom(ctx.room);
};
