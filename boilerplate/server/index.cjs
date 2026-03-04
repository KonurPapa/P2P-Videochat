const HolesailServer = require('holesail-server');
// Removed local HTTP video server as video streams are handled by WebRTC

// 2. Start Holesail to tunnel port 5000 to the P2P network
const server = new HolesailServer();

async function startPipeNode() {
    // Use .serve() as per holesail-server API
    server.serve({
        port: 5000,
        address: '127.0.0.1',
        secure: true // Use 'secure' to prevent leaking access on the DHT
    }, () => {
        console.log('P2P Tunnel Active!');
        console.log('Your Connection Key:', server.getPublicKey());

        // The key generated here (server.getPublicKey()) will be used by the Nostr client to signal.
        // NEXT STEP: Send server.getPublicKey() to your friend via Nostr NIP-17
    });
}

startPipeNode();
