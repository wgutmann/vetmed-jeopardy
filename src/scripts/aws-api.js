const WEBSOCKET_URL = 'wss://cfv6fou6e5.execute-api.us-east-1.amazonaws.com';

let socket;

export function connectWebSocket(onMessage) {
    socket = new WebSocket(WEBSOCKET_URL);

    socket.onopen = () => {
        console.log('WebSocket connected');
    };

    socket.onmessage = (event) => {
        onMessage(JSON.parse(event.data));
    };

    socket.onclose = () => {
        console.log('WebSocket disconnected');
    };
}

export function sendWebSocketMessage(message) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'sendmessage', data: message }));
    }
}
