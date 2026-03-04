import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries


const firebaseConfig = {

  apiKey: "AIzaSyAJsoUcK9tcfS1FGkWlXBDkgAh7BzcdK8c",

  authDomain: "pipe-messenger-0.firebaseapp.com",

  databaseURL: "https://pipe-messenger-0-default-rtdb.firebaseio.com",

  projectId: "pipe-messenger-0",

  storageBucket: "pipe-messenger-0.firebasestorage.app",

  messagingSenderId: "1034079740336",

  appId: "1:1034079740336:web:f90292eb2a82e7baaa3675",

  measurementId: "G-J5HJSXN9RT"

};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);


const servers = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun2.l.google.com:19302"]
    }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: "relay",
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
}

var pc = new RTCPeerConnection(servers);
let localStream, remoteStream = null;


const webcamButton = document.querySelector('#webcamButton')

webcamButton.addEventListener('click', async () => {
  // Get local stream
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  remoteStream = new MediaStream()

  // Add local stream to peer connection
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream)
  })

  // Add remote stream to peer connection
  pc.ontrack = (event) => {
    remoteStream.addTrack(event.track)
  }

  // Create offer
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await sendOffer(offer)
})


document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="webcamButton" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`
