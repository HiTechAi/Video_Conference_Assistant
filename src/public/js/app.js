const socket = io();
const myFace = document.getElementById("myFace");
const muteBtn =document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const cameraSelect = document.getElementById("cameras");
const call = document.getElementById("call");

let myStream;
let muted = false;
let cameraoff=false;
let roomName;
let myPeerConnection; 
let myDataChannel;

//Welcome Form (join a room)
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

call.hidden = true;

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room",input.value);
    roomName = input.value;
    input.value="";
}
welcomeForm.addEventListener("submit",handleWelcomeSubmit);

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((devices) => devices.kind ==="videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) =>{
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label == camera.label){
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        });
    } catch (error) {
        console.log(error);
    }
}

async function getMedia(deviceId) {
    const initialConstraints ={
        audio: true,
        video: {facingMode:"user"},
    };
    const cameraConstraints={
        audio: true,
        video: {deviceId:{exact:deviceId}}
    };
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints: initialConstraints
        );
       myFace.srcObject = myStream;
       if(!deviceId){
       await getCameras();}
    } catch (error) {
        console.log(error);
    }
}



function handleMuteClick(){
    myStream.getAudioTracks().forEach((track) =>(track.enabled=!track.enabled));
    if(!muted){
        muteBtn.innerText = "Un Mute";
        muted = true;
    }else{
        muteBtn.innerText = "Mute";
        muted = false;
    }
}

function handleCameraClick(){
    myStream.getVideoTracks().forEach((track) =>(track.enabled=!track.enabled));
    if(!cameraoff){
        cameraBtn.innerText = "Turn Camera On";
        cameraoff = true;
    }else{
        cameraBtn.innerText = "Turn Camera Off";
        cameraoff = false;
    }
}

async function handleCameraChange(){
    await getMedia(cameraSelect.value);
    if(myPeerConnection){
        const VideoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
        .getSenders()
        .find((sender)=> sender.track.kind === "video");
        videoSender.replaceTrack(VideoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click",handleCameraClick);
cameraSelect.addEventListener("input",handleCameraChange);

//Socket code

socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer",offer, roomName);
});

socket.on("offer",async(offer)=>{
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
   
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer",answer,roomName);
})

socket.on("answer",answer=>{
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice",ice=>{
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

function makeConnection(){
    myPeerConnection = new RTCPeerConnection(
        {
    iceServers:[
        {
            urls:[
                "stun:stun1.l.google.com:19302",
                "stun:stun2.l.google.com:19302",
                "stun:stun3.l.google.com:19302",
                "stun:stun4.l.google.com:19302",
                "stun:stun.l.google.com:19302",
            ]
        }
    ]
}
    );
    myPeerConnection.addEventListener("icecandidate",handleIce);
    myPeerConnection.addEventListener("addstream",handleAddStream);
    myStream.getTracks()
   .forEach(track=>myPeerConnection.addTrack(track,myStream));
}

function handleIce(data){
    console.log("sent candidate");
    socket.emit("ice", data.candidate,roomName);
}

function handleAddStream(data){
   const peerFace = document.getElementById("peerFace");
   peerFace.srcObject = data.stream;
}