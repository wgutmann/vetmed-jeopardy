const { randomBytes } = require('crypto');

exports.handler = async (event) => {
    const roomCode = randomBytes(3).toString('hex').toUpperCase();
    console.log(`Generated room code: ${roomCode}`);

    // In a real application, you would store this code in a database
    // and check for collisions.

    return {
        statusCode: 200,
        body: JSON.stringify({ roomCode }),
        headers: {
            "Content-Type": "application/json"
        }
    };
};
