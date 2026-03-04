# P2P Videochat

This boilerplate template outlines an end-to-end encrypted (E2EE), decentralized video-messenger. It is specifically designed with an engineer-first approach, prioritizing privacy, security, and true a "zero-trust" architecture.

## Architecture

This project utilizes a Hybrid Approach to decentralized secure communication:
- **Frontend Layer:** Built with React and Vite. Focused on providing a smooth client experience.
- **Signaling Layer:** Nostr Protocol via `nostr-tools`. It specifically plans for NIP-17 (Private Direct Messages/Gift Wraps) exchanging to privately negotiate signaling between pairs without centralized servers knowing who's talking.
- **Data Tunnel Layer:** Holesail (`holesail-server` & `holesail-client`). This resolves standard NAT Traverse/WebRTC firewall problems using DHT UDP holepunching and the Noise Protocol.

## Getting Started

### 1. Installation

To setup the boilerplate, run the standard install tasks from the boilerplate root directory `/boilerplate`:

```bash
npm run install:all
```
*(This installs root dependencies for the headless Holesail server and `cd`s into `client` to install React dependencies)*

### 2. Running the Headless Holesail Server (The Host)

Run this locally to mock a headless E2EE Holesail broadcast node:
```bash
npm run start:host 
# Or: node server/index.cjs
```
- It starts a mock HTTP server serving a text stream.
- It then opens a Holesail tunnel to map `localhost:5000` to the decentralized P2P network.
- **Copy the "Connection Key" printed to your console.** This is what needs to be delivered via Nostr to clients. 

### 3. Running the Dev Client (The UI/Signaling API)

In a new terminal instance, start the Vite frontend framework:
```bash
npm run dev:client
# Or: cd client && npm run dev
```

Browse to the provided local URL (typically `http://localhost:5173`).

### 4. How the Demo Work Flow Operates
1. Launch the Client and paste a dummy Nostr private hex key.
2. Input a target pubkey and the **Holesail Connection Key** generated in Step 2 into the UI.
3. Push 'Send Video Invite via Nostr'. This will compute the NIP event locally via `nostr-tools`. You can visualize the event console outputs representing your encrypted signaling sequence.
4. If joining a call, use the 2nd box to paste a friend's Holesail key!

## Future Enhancements
- Use a polyfill package or migrate the UI into an Electron/Tauri container (the `holesail-client` typically leverages Node `net`/TCP primitives that do not run cleanly in raw browser environments).
- Integrate a local wallet extension (NIP-07 like Alby) instead of raw private hex copying.
- Streamline actual WebRTC/video bridging over the localized Holesail TCP ports!
