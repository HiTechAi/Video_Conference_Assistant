const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;
let roomName;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function showRoom(){
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText=`Room ${roomName}`;
    const msgform = room.querySelector("#msg");
    const nameform = room.querySelector("#name");
    msgform.addEventListener("submit",handleMessageSubmit);
    nameform.addEventListener("submit",handleNicknameSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = form.querySelector("input");
    socket.emit("enter_room",input.value,showRoom);
    roomName = input.value;
    input.value = "";
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message",value,roomName,()=>{
        addMessage(`you: ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#name input");
    const value = input.value;
    socket.emit("nickname",value);
    input.value = "";
}

form.addEventListener("submit",handleRoomSubmit);

socket.on("welcome",(userNicname) =>{
    addMessage(`${userNicname}, arrived`);
})
socket.on("bye",(userNicname)=>{
    addMessage(`${userNicname}, left`);
})
socket.on("new_message",(msg)=>{
    addMessage(msg);
})
socket.on("room_change",(rooms)=>{
    addMessage(rooms);
})