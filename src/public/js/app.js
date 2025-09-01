const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const micsSelect = document.getElementById("mics");
const call = document.getElementById("call");
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
const videosContainer = document.getElementById("videos");

let myStream;
let roomName;
let nickname;
const peerConnections = {};

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
        
        const currentCamera = myStream.getVideoTracks()[0];
        const currentMic = myStream.getAudioTracks()[0];

        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera && currentCamera.label === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });

        mics.forEach((mic) => {
            const option = document.createElement("option");
            option.value = mic.deviceId;
            option.innerText = mic.label;
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
    const pc = peerConnections[socketId];
    if (pc) {
        pc.close();
        delete peerConnections[socketId];
    }
    removeVideoStream(socketId);
});

// --- Init and Event Listeners ---
async function initCall() {
    welcome.classList.add("hidden");
    call.classList.remove("hidden");
    await getMedia();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const roomNameInput = welcomeForm.querySelector("#roomName");
    const nicknameInput = welcomeForm.querySelector("#nickname");
    nickname = nicknameInput.value || "Guest";
    roomName = roomNameInput.value;
    await initCall();
    socket.emit("join_room", roomName, nickname);
    const roomHeader = document.getElementById("roomHeader");
    roomHeader.innerText = `Room: ${roomName}`;
    const myNicknameDiv = document.getElementById("myNickname");
    myNicknameDiv.innerText = nickname;
    roomNameInput.value = "";
    nicknameInput.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);
muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
cameraSelect.addEventListener("input", handleCameraChange);
micsSelect.addEventListener("input", handleMicChange);

// --- Recording Logic ---
const startRecBtn = document.getElementById("startRec");
const stopRecBtn = document.getElementById("stopRec");
const downloadAudioLink = document.getElementById("downloadAudio");

let mediaAudioRecorder;
let recordedAudioChunks = [];

function startRecording() {
    downloadAudioLink.classList.add("hidden");
    downloadAudioLink.classList.remove("downloaded");
    downloadAudioLink.querySelector("span").innerText = " Audio";
    startRecBtn.classList.add("recording");
    recordedAudioChunks = [];
    const audioStream = new MediaStream(myStream.getAudioTracks());
    mediaAudioRecorder = new MediaRecorder(audioStream, { mimeType: "audio/webm" });
    mediaAudioRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordedAudioChunks.push(event.data);
    };
    mediaAudioRecorder.onstop = () => {
        const date = new Date();
        const fileName = `${nickname}_${roomName}_${(date.getMonth()+1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}`;
        const audioBlob = new Blob(recordedAudioChunks, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        downloadAudioLink.href = audioUrl;
        downloadAudioLink.download = `${fileName}_audio.webm`;
        downloadAudioLink.classList.remove("hidden");
        console.log("Audio recording stopped and file is ready for download.");
        uploadAudio(audioBlob, `${fileName}_audio.webm`);
    };
    mediaAudioRecorder.start();
    startRecBtn.disabled = true;
    stopRecBtn.disabled = false;
}

async function uploadAudio(blob, fileName) {
    const formData = new FormData();
    formData.append("file", blob, fileName);
    try {
        const response = await fetch("http://172.31.57.147:8001/process_video/", {
            method: "POST",
            body: formData,
        });
        if (!response.ok) {
            console.error("Failed to upload file:", response.statusText);
            return;
        }
        const result = await response.json();
        console.log("File uploaded successfully:", result);
        const rSummaryRes = await fetch("http://172.31.57.143:8010/process_llm", {
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
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

function handleStartRecClick() {
    socket.emit("start_rec", roomName);
    startRecording();
}

function stopRecording() {
    if (!startRecBtn.classList.contains("recording")) return;
    startRecBtn.classList.remove("recording");
    mediaAudioRecorder.stop();
    startRecBtn.disabled = false;
    stopRecBtn.disabled = true;
}

function handleStopRecClick() {
    socket.emit("stop_rec", roomName);
    stopRecording();
}

startRecBtn.addEventListener("click", handleStartRecClick);
stopRecBtn.addEventListener("click", handleStopRecClick);

