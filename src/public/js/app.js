const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const micsSelect = document.getElementById("mics");
const micsSelect = document.getElementById("mics");
const call = document.getElementById("call");
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const videosContainer = document.getElementById("videos");
const exitBtn = document.getElementById("exitBtn");

let myStream;
let roomName;
let nickname;
const peerConnections = {};
let participants = {};
const userList = document.getElementById("userList");

function updateUserListDOM() {
    if (!userList) return;
    userList.innerHTML = ""; // Clear list
    for (const [id, participant] of Object.entries(participants)) {
        const li = document.createElement("li");
        const icon = document.createElement("i");
        icon.className = "fas fa-circle";
        li.appendChild(icon);
        li.appendChild(document.createTextNode(participant.nickname));
        if (id === socket.id) {
            li.appendChild(document.createTextNode(" (You)"));
        }
        userList.appendChild(li);
    }
    updateVideoGrid(); // Update video grid layout
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('https://172.31.57.147:8001/members/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const userData = await response.json();
        nickname = userData.name; // 전역 변수에 닉네임 저장
        const myNicknameDiv = document.getElementById("myNickname");
        if(myNicknameDiv) myNicknameDiv.innerText = nickname;

        // Add self to participants list
        participants[socket.id] = { nickname };

    } catch (error) {
        console.error('Failed to fetch user data:', error);
        // 오류 발생 시 로그인 페이지로 보낼 수도 있습니다.
        window.location.href = '/login';
    }

    welcomeForm.addEventListener("submit", handleWelcomeSubmit);

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('token');
            sessionStorage.removeItem('nickname');
            window.location.href = '/login';
        });
    }
});

// --- UI Functions ---
function addVideoStream(stream, socketId, peerNickname) {
    if (document.getElementById(socketId)) {
        return;
    }
    const peerDiv = document.createElement("div");
    peerDiv.id = socketId;
    peerDiv.classList.add("video-container");

    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;

    const nicknameDiv = document.createElement("div");
    nicknameDiv.classList.add("nickname");
    nicknameDiv.innerText = peerNickname;

    peerDiv.appendChild(video);
    peerDiv.appendChild(nicknameDiv);
    videosContainer.appendChild(peerDiv);
}

function removeVideoStream(socketId) {
    const peerDiv = document.getElementById(socketId);
    if (peerDiv) {
        peerDiv.remove();
    }
}

function updateVideoGrid() {
    const numParticipants = Object.keys(participants).length;
    if (numParticipants === 0) return;

    // Calculate the best grid layout
    const container = document.getElementById("videos");
    let cols = Math.ceil(Math.sqrt(numParticipants));
    let rows = Math.ceil(numParticipants / cols);

    // For certain numbers, a different layout is better.
    // E.g., for 3, a 3x1 is better than 2x2. For 6, 3x2 is better than 3x3.
    if (numParticipants === 3) {
        cols = 3;
        rows = 1;
    } else if (numParticipants === 5 || numParticipants === 6) {
        cols = 3;
        rows = 2;
    } else if (numParticipants === 7 || numParticipants === 8) {
        cols = 4;
        rows = 2;
    }

    container.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    container.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
}

// --- Media Functions ---
async function getMedia(deviceId, micId) {
    const initialConstraints = {
        audio: true,
        video: { facingMode: "user" },
    };
    const specificConstraints = {
        audio: { deviceId: micId ? { exact: micId } : undefined },
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId || micId ? specificConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if (!deviceId && !micId) {
            await getDevices();
        }
    } catch (e) {
        console.log(e);
    }
}

async function getDevices() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const mics = devices.filter((device) => device.kind === "audioinput");
        
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const mics = devices.filter((device) => device.kind === "audioinput");
        
        const currentCamera = myStream.getVideoTracks()[0];
        const currentMic = myStream.getAudioTracks()[0];

        cameras.forEach((camera, index) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label || `Camera ${index + 1}`;
            if (currentCamera && currentCamera.label === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });

        mics.forEach((mic, index) => {
            const option = document.createElement("option");
            option.value = mic.deviceId;
            option.innerText = mic.label || `Microphone ${index + 1}`;
            if (currentMic && currentMic.label === mic.label) {
                option.selected = true;
            }
            micsSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

function handleMuteClick() {
function handleMuteClick() {
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    const muteIcon = muteBtn.querySelector("i");
    if (myStream.getAudioTracks()[0].enabled) {
        muteIcon.classList.remove("fa-microphone-slash");
        muteIcon.classList.add("fa-microphone");
    } else {
        muteIcon.classList.remove("fa-microphone");
        muteIcon.classList.add("fa-microphone-slash");
    }
}

function handleCameraClick() {
function handleCameraClick() {
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    const cameraIcon = cameraBtn.querySelector("i");
    if (myStream.getVideoTracks()[0].enabled) {
        cameraIcon.classList.remove("fa-video-slash");
        cameraIcon.classList.add("fa-video");
    } else {
        cameraIcon.classList.remove("fa-video");
        cameraIcon.classList.add("fa-video-slash");
    }
}

async function handleCameraChange() {
    await getMedia(cameraSelect.value, micsSelect.value);
    Object.values(peerConnections).forEach(pc => {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = pc.getSenders().find(sender => sender.track.kind === "video");
        if (videoSender) {
            videoSender.replaceTrack(videoTrack);
        }
    });
}

async function handleMicChange() {
    await getMedia(cameraSelect.value, micsSelect.value);
    Object.values(peerConnections).forEach(pc => {
        const audioTrack = myStream.getAudioTracks()[0];
        const audioSender = pc.getSenders().find(sender => sender.track.kind === "audio");
        if (audioSender) {
            audioSender.replaceTrack(audioTrack);
        }
    });
}

// --- WebRTC Functions ---
function createPeerConnection(targetSocketId, peerNickname) {
    const pc = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ],
    });

    pc.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit("ice", event.candidate, targetSocketId);
        }
    };

    pc.ontrack = (event) => {
        addVideoStream(event.streams[0], targetSocketId, peerNickname);
    };

    myStream.getTracks().forEach((track) => pc.addTrack(track, myStream));

    peerConnections[targetSocketId] = pc;
    return pc;
}

// --- Socket Event Handlers ---
socket.on("all_users", (users) => {
    // Add other users to our participants list
    users.forEach(user => {
        participants[user.id] = { nickname: user.nickname };
    });
    updateUserListDOM();

    // Create peer connections for all other users
    users.forEach(async (user) => {
        const pc = createPeerConnection(user.id, user.nickname);
        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit("offer", offer, user.id, nickname);
        } catch (err) {
            console.error(err);
        }
    });
});

socket.on("user_joined", (user) => {
    participants[user.id] = { nickname: user.nickname };
    updateUserListDOM();
});

socket.on("offer", async (offer, offererId, offererNickname) => {
    const pc = createPeerConnection(offererId, offererNickname);
    try {
        await pc.setRemoteDescription(offer);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", answer, offererId);
    } catch (err) {
        console.error(err);
    }
});

socket.on("answer", async (answer, answererId) => {
    const pc = peerConnections[answererId];
    if (pc) {
        await pc.setRemoteDescription(answer);
    }
});

socket.on("ice", (ice, senderId) => {
    const pc = peerConnections[senderId];
    if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(ice));
    }
});

socket.on("user_disconnected", (socketId) => {
    // Close PeerConnection
    const pc = peerConnections[socketId];
    if (pc) {
        pc.close();
        delete peerConnections[socketId];
    }
    // Remove video stream from DOM
    removeVideoStream(socketId);
    // Remove from participants list
    delete participants[socketId];
    updateUserListDOM();
});

// --- Init and Event Listeners ---
async function initCall() {
    welcome.classList.add("hidden");
    call.classList.remove("hidden");
    await getMedia();
}

async function handleWelcomeSubmit(event) {
    console.log("Enter Room form submitted");
    event.preventDefault();
    const roomNameInput = document.getElementById("roomName");
    roomName = roomNameInput.value;
    roomNameInput.value = "";
    
    // Set room name in header
    const roomHeader = document.getElementById("roomHeader");
    roomHeader.innerText = roomName;

    await initCall(); // Wait for media stream to be ready
    
    // Now that myStream is ready, join the room
    socket.emit("join_room", roomName, nickname);
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
micsSelect.addEventListener("input", handleMicChange);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
micsSelect.addEventListener("input", handleMicChange);

// --- Recording Logic ---
// --- Recording Logic ---
const startRecBtn = document.getElementById("startRec");
const stopRecBtn = document.getElementById("stopRec");
const downloadAudioLink = document.getElementById("downloadAudio");

let mediaAudioRecorder;
let recordedAudioChunks = [];

// Listen for server commands to start/stop recording
socket.on("rec_started_sync", () => {
    console.log("Received command to start recording.");
    startRecording();
});

socket.on("rec_stopped_sync", () => {
    console.log("Received command to stop recording.");
    stopRecording();
});

function startRecording() {
    if (mediaAudioRecorder && mediaAudioRecorder.state === "recording") return;
    console.log("Starting local recording...");

    downloadAudioLink.classList.add("hidden");
    startRecBtn.classList.add("recording");
    recordedAudioChunks = [];
    const audioStream = new MediaStream(myStream.getAudioTracks());
    mediaAudioRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
    mediaAudioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedAudioChunks.push(event.data);
        if (event.data.size > 0) recordedAudioChunks.push(event.data);
    };
    mediaAudioRecorder.onstop = () => {
        const date = new Date();
        const fileName = `${nickname}_${roomName}_${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
        const audioBlob = new Blob(recordedAudioChunks, { type: "audio/webm" });
        
        console.log("Audio recording stopped. Uploading file...");
        uploadAudio(audioBlob, `${fileName}_audio.webm`);
    };
    mediaAudioRecorder.start();
    startRecBtn.disabled = true;
    stopRecBtn.disabled = false;
}
    mediaAudioRecorder.start();
    startRecBtn.disabled = true;
    stopRecBtn.disabled = false;
}

async function uploadAudio(blob, fileName) {
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("nickname", nickname); // Add nickname to the form data

    try {
        const response = await fetch("https://172.31.57.147:8001/whispers/process_video", {
            method: "POST",
            body: formData,
        });
        if (!response.ok) {
            console.error("Failed to upload file:", response.statusText);
            return;
        }
        const result = await response.json();
        console.log("File uploaded successfully:", result);
        // The summary logic seems out of place for individual uploads, commenting out for now
        /*
        const rSummaryRes = await fetch("https://172.31.57.143:8010/process_llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: result.transcription }),
        });
        if (!rSummaryRes.ok) {
            console.error("Failed to get summary:", rSummaryRes.statusText);
            return;
        }
        const rSummary = await rSummaryRes.json();
        console.log("--- LLM 서버 응답 (rSummary) ---");
        console.log(rSummary);
        console.log("---------------------------------");
        */
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

function stopRecording() {
    if (!mediaAudioRecorder || mediaAudioRecorder.state !== "recording") return;
    console.log("Stopping local recording...");

    startRecBtn.classList.remove("recording");
    mediaAudioRecorder.stop();
    startRecBtn.disabled = false;
    stopRecBtn.disabled = true;
}

// Emit sync events when buttons are clicked
function handleStartRecClick() {
    console.log("Start Record button clicked. Emitting to server...");
    socket.emit("start_rec_sync", roomName);
}

function handleStopRecClick() {
    console.log("Stop Record button clicked. Emitting to server...");
    socket.emit("stop_rec_sync", roomName);
}

startRecBtn.addEventListener("click", handleStartRecClick);
stopRecBtn.addEventListener("click", handleStopRecClick);
exitBtn.addEventListener("click", () => {
    window.location.reload();
});

window.addEventListener("resize", updateVideoGrid);