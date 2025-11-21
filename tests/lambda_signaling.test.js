import AWS from 'aws-sdk';
import { handler } from '../terraform/modules/lambda_signaling/src/index';

jest.mock('aws-sdk', () => {
    const mockDocumentClient = {
        put: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        scan: jest.fn().mockReturnThis(),
        promise: jest.fn(),
    };
    const mockApiGatewayManagementApi = {
        postToConnection: jest.fn().mockReturnThis(),
        promise: jest.fn(),
    };
    return {
        DynamoDB: {
            DocumentClient: jest.fn(() => mockDocumentClient),
        },
        ApiGatewayManagementApi: jest.fn(() => mockApiGatewayManagementApi),
    };
});

describe('Signaling Lambda', () => {
    let mockDdb;
    let mockApiGateway;

    beforeEach(() => {
        mockDdb = new AWS.DynamoDB.DocumentClient();
        mockApiGateway = new AWS.ApiGatewayManagementApi();
    });

    test('should handle connect event', async () => {
        const event = { requestContext: { connectionId: '123', routeKey: '$connect' } };
        await handler(event);
        expect(mockDdb.put).toHaveBeenCalledWith({
            TableName: 'vetmed-jeopardy-connections',
            Item: { connectionId: '123' },
        });
    });

    test('should handle disconnect event', async () => {
        const event = { requestContext: { connectionId: '123', routeKey: '$disconnect' } };
        await handler(event);
        expect(mockDdb.delete).toHaveBeenCalledWith({
            TableName: 'vetmed-jeopardy-connections',
            Key: { connectionId: '123' },
        });
    });

    test('should handle sendmessage event', async () => {
        mockDdb.promise.mockResolvedValueOnce({ Items: [{ connectionId: '456' }] });
        const event = {
            requestContext: { connectionId: '123', routeKey: 'sendmessage' },
            body: JSON.stringify({ data: 'test message' }),
        };
        await handler(event);
        expect(mockApiGateway.postToConnection).toHaveBeenCalledWith({
            ConnectionId: '456',
            Data: JSON.stringify('test message'),
        });
    });
});
