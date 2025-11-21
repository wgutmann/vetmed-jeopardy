const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const apiGatewayManagementApi = new AWS.ApiGatewayManagementApi({
    endpoint: process.env.WEBSOCKET_ENDPOINT
});

const connectionsTableName = 'vetmed-jeopardy-connections';

exports.handler = async (event) => {
    const { body, requestContext: { connectionId, routeKey } } = event;

    switch (routeKey) {
        case '$connect':
            await ddb.put({
                TableName: connectionsTableName,
                Item: { connectionId }
            }).promise();
            break;

        case '$disconnect':
            await ddb.delete({
                TableName: connectionsTableName,
                Key: { connectionId }
            }).promise();
            break;

        case 'sendmessage':
            const { data } = JSON.parse(body);
            const connections = await ddb.scan({ TableName: connectionsTableName }).promise();

            const postCalls = connections.Items.map(async ({ connectionId: id }) => {
                if (id !== connectionId) {
                    await apiGatewayManagementApi.postToConnection({
                        ConnectionId: id,
                        Data: JSON.stringify(data)
                    }).promise();
                }
            });

            await Promise.all(postCalls);
            break;

        default:
            return { statusCode: 404, body: 'Not Found' };
    }

    return { statusCode: 200, body: 'Ok' };
};
