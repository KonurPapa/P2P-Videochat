import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

function App() {
    const [inviteSent, setInviteSent] = useState(false);
    const [inviteAccepted, setInviteAccepted] = useState(false);
    const [popoutWindow, setPopoutWindow] = useState(null);
    const [playBlocked, setPlayBlocked] = useState(false);

    // WebRTC DOM references
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);

    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);

    // We need to keep references to the peers across re-renders
    const peerARef = useRef(null);
    const peerBRef = useRef(null);

    useEffect(() => {
        if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
            localVideoRef.current.play().catch(err => console.error("Local play error:", err));
        }
        if (remoteVideoRef.current && remoteStreamRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play()
                .then(() => setPlayBlocked(false))
                .catch(err => {
                    console.error("Remote play error:", err);
                    setPlayBlocked(true);
                });
        }
    }, [popoutWindow, inviteAccepted]);

    const startLocalStream = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
            return stream;
        } catch (err) {
            console.error(err);
            alert("Could not access camera/microphone.");
        }
    };

    const sendInvite = async () => {
        openVideoWindow();
        const stream = await startLocalStream();
        if (!stream) return;

        // Initialize Peer A (Host)
        const peerA = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        peerARef.current = peerA;

        // Add tracks to Peer A
        stream.getTracks().forEach(track => {
            peerA.addTrack(track, stream);
        });

        // Initialize Peer B (Client) - usually this is on another machine
        const peerB = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        peerBRef.current = peerB;

        // Handle ICE candidates Exchange (In memory)
        peerA.onicecandidate = e => {
            if (e.candidate) {
                // In a real app, send over signaling server
                peerB.addIceCandidate(e.candidate);
            }
        };

        peerB.onicecandidate = e => {
            if (e.candidate) {
                // In a real app, send over signaling server
                peerA.addIceCandidate(e.candidate);
            }
        };

        // Handle Peer B receiving tracks
        peerB.ontrack = e => {
            if (e.streams[0]) {
                remoteStreamRef.current = e.streams[0];
                if (remoteVideoRef.current) {
                    remoteVideoRef.current.srcObject = e.streams[0];
                }
            }
        };

        // Create Offer
        const offer = await peerA.createOffer();
        await peerA.setLocalDescription(offer);

        // In a real app, send this offer via Nostr!
        console.log("Offer created and set as local description for Peer A", offer);

        setInviteSent(true);
    };

    const acceptInvite = async () => {
        openVideoWindow();
        const peerA = peerARef.current;
        const peerB = peerBRef.current;

        if (!peerA || !peerB) return;

        // Peer B receives the offer from Peer A
        await peerB.setRemoteDescription(peerA.localDescription);

        // Peer B creates an answer
        const answer = await peerB.createAnswer();
        await peerB.setLocalDescription(answer);

        // Peer A receives the answer from Peer B
        await peerA.setRemoteDescription(peerB.localDescription);

        setInviteAccepted(true);
        console.log("Answer created and WebRTC connection established in-memory");
    };

    const disconnect = () => {
        // Stop local video tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (localVideoRef.current) {
            localVideoRef.current.srcObject = null;
        }

        // Clear remote video
        remoteStreamRef.current = null;
        if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
        }

        // Close peer connections
        if (peerARef.current) {
            peerARef.current.close();
            peerARef.current = null;
        }
        if (peerBRef.current) {
            peerBRef.current.close();
            peerBRef.current = null;
        }

        if (popoutWindow) {
            popoutWindow.close();
            setPopoutWindow(null);
        }

        // Reset state
        setInviteSent(false);
        setInviteAccepted(false);
        setPlayBlocked(false);
        console.log("Disconnected and reset everything.");
    };

    const openVideoWindow = () => {
        if (!popoutWindow || popoutWindow.closed) {
            const win = window.open('', '', 'width=800,height=500,left=200,top=200');
            if (!win) {
                alert("Popup blocked! Please allow popups for this site.");
                return;
            }
            win.document.title = 'PipeLine Video Call';

            const container = win.document.createElement('div');
            container.id = 'popout-root';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
            container.style.justifyContent = 'center';
            container.style.minHeight = '100vh';
            container.style.backgroundColor = '#222';
            container.style.color = 'white';
            win.document.body.style.margin = '0';
            win.document.body.appendChild(container);

            win.addEventListener('beforeunload', () => {
                setPopoutWindow(null);
            });

            setPopoutWindow(win);
        } else {
            popoutWindow.focus();
        }
    };

    const videoSection = (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <div>
                    <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Local Video</h3>
                    <video
                        key="local-popout"
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '320px', height: '240px', backgroundColor: '#111', borderRadius: '8px', objectFit: 'cover' }}
                    />
                </div>
                <div style={{ position: 'relative' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Remote Video</h3>
                    <video
                        key="remote-popout"
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '320px', height: '240px', backgroundColor: '#111', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    {playBlocked && (
                        <div style={{ position: 'absolute', top: '34px', left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: '8px' }}>
                            <button
                                onClick={() => {
                                    if (remoteVideoRef.current) {
                                        remoteVideoRef.current.play().then(() => setPlayBlocked(false)).catch(e => console.error(e));
                                    }
                                }}
                                style={{ ...btnStyle, backgroundColor: '#e67e22' }}
                            >
                                Click to Play Audio/Video
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
            <h1>| PipeLine</h1>
            <p>Peer-to-Peer Conferencing Local Testing</p>

            {popoutWindow && createPortal(videoSection, popoutWindow.document.getElementById('popout-root'))}

            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' }}>
                <button
                    onClick={sendInvite}
                    disabled={inviteSent}
                    style={{ ...btnStyle, opacity: inviteSent ? 0.5 : 1, backgroundColor: '#3498db' }}
                >
                    {inviteSent ? "Invite Sent" : "Send Invite"}
                </button>

                <button
                    onClick={acceptInvite}
                    disabled={!inviteSent || inviteAccepted}
                    style={{ ...btnStyle, opacity: (!inviteSent || inviteAccepted) ? 0.5 : 1, backgroundColor: '#27ae60' }}
                >
                    {inviteAccepted ? "Joined" : "Accept Invite"}
                </button>

                <button
                    onClick={disconnect}
                    disabled={!inviteSent && !inviteAccepted}
                    style={{ ...btnStyle, opacity: (!inviteSent && !inviteAccepted) ? 0.5 : 1, backgroundColor: '#e74c3c' }}
                >
                    Disconnect
                </button>
            </div>
        </div>
    );
}

const btnStyle = { padding: '12px 24px', fontSize: '16px', cursor: 'pointer', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', transition: 'opacity 0.2s' };

export default App;