const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

let peerConnection;
let dataChannel;

export function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      // Send the candidate to the other peer
      console.log('New ICE candidate:', event.candidate);
    }
  };

  peerConnection.ondatachannel = event => {
    dataChannel = event.channel;
    dataChannel.onmessage = event => {
      console.log('Received message:', event.data);
    };
  };

  return peerConnection;
}

export function createDataChannel(pc) {
    dataChannel = pc.createDataChannel('game-data');

    dataChannel.onopen = () => {
        console.log('Data channel opened');
    };

    dataChannel.onclose = () => {
        console.log('Data channel closed');
    };

    return dataChannel;
}

export function sendMessage(message) {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(message));
    }
}
