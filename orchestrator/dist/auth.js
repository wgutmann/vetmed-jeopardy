import jwt from 'jsonwebtoken';
import { config } from './config.js';
const TOKEN_TTL_SECONDS = Number(process.env.TOKEN_TTL_SECONDS ?? 60 * 60); // 1 hour
export const createToken = (roomCode, role, playerId) => {
    const payload = { roomCode, role };
    if (role === 'PLAYER' && playerId)
        payload.playerId = playerId;
    return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_TTL_SECONDS });
};
export const verifyToken = (token) => {
    const payload = jwt.verify(token, config.jwtSecret);
    if (!payload || typeof payload !== 'object')
        throw new Error('Invalid token payload');
    return payload;
};
