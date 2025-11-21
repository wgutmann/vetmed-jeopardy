import { handler } from '../terraform/modules/lambda_room_management/src/index';

describe('Room Management Lambda', () => {
    test('should return a room code', async () => {
        const result = await handler({});
        expect(result.statusCode).toBe(200);
        const body = JSON.parse(result.body);
        expect(body.roomCode).toBeDefined();
        expect(body.roomCode).toHaveLength(6);
    });
});
