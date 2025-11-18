import dotenv from 'dotenv';

dotenv.config();

const requiredEnv = (key: string, fallback?: string) => {
  const value = process.env[key] ?? fallback;
  if (!value) throw new Error(`Missing required environment variable ${key}`);
  return value;
};

export const config = {
  port: Number(process.env.PORT ?? 8788),
  jwtSecret: requiredEnv('SIGNALING_JWT_SECRET', 'local-dev-secret-change-me'),
  roomTtlMs: Number(process.env.ROOM_TTL_MS ?? 1000 * 60 * 60), // 1 hour default
  cleanupIntervalMs: Number(process.env.CLEANUP_INTERVAL_MS ?? 1000 * 60 * 5),
};
