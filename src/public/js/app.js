// const sc1 = new WebSocket("http://localhost:3000");
const socket = new WebSocket(`ws://${window.location.host}`);
const messageList = document.querySelector("ul");
const messageForm = document.querySelector("form");

socket.addEventListener("open", () => {
    console.log("Connected to Server");
});

socket.addEventListener("message", (message) => {
    const li = document.createElement("li");
    li.innerText = message.data;
    messageList.append(li);
});

socket.addEventListener("close", () => {
    console.log("Disconnected from Server");
});

socket.addEventListener("error", (err) => {
    console.error("WebSocket error:", err);
});
 
function handleSubmit(event) {
    event.preventDefault();
    const input = messageForm.querySelector("input");
    socket.send(input.value); 
    input.value ="";
}

messageForm.addEventListener("submit",handleSubmit);