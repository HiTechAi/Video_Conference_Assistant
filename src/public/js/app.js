// const sc1 = new WebSocket("http://localhost:3000");
const socket = new WebSocket(`ws://${window.location.host}`);

// 연결이 열렸을 때
socket.addEventListener("open", () => {
    console.log("Connected to Server");

    // 연결이 확인된 후 5초 뒤 메시지 전송
    setTimeout(() => {
        socket.send("hello brooooooo");
    }, 5000);
});

// 서버로부터 메시지를 받았을 때
socket.addEventListener("message", (event) => {
    console.log("Just got this:\n", event.data, "\nfrom the server");
});

// 연결이 닫혔을 때
socket.addEventListener("close", () => {
    console.log("Disconnected from Server");
});

// 에러 발생 시
socket.addEventListener("error", (err) => {
    console.error("WebSocket error:", err);
});