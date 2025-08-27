import express from 'express';
import http from "http";
import SocketIO from "socket.io";
import axios from "axios";
import fs from "fs";
import path from "path";


const app = express();

app.use(express.json());

app.set("view engine","pug");
app.set("views", __dirname + "/views");
app.use("/public",express.static(__dirname+"/public"));

const dataDir = path.join(__dirname, "..", "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.post("/api/download", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, message: "URL is required" });
    }

    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    const urlObject = new URL(url);
    let fileName = path.basename(urlObject.pathname);
    if (!fileName || fileName === '/') {
        fileName = 'downloaded_file';
    }
    
    const filePath = path.join(dataDir, fileName);

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", () => {
      res.json({ success: true, message: `File downloaded to ${filePath}` });
    });

    writer.on("error", (err) => {
      console.error("File write error:", err);
      res.status(500).json({ success: false, message: "Failed to save file." });
    });
  } catch (error) {
    console.error("Download error:", error);
    res.status(500).json({ success: false, message: "Failed to download file." });
  }
});

app.get("/",(req,res)=> res.render("home"));
//app.get("/*",(req,res)=> res.redirect("/"));



const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection",(socket)=>{
    socket.on("join_room",(roomName, nickname)=>{
        socket.join(roomName);
        socket["nickname"] = nickname;

        const clientsInRoom = wsServer.sockets.adapter.rooms.get(roomName);
        if (clientsInRoom.size === 2) {
            const otherSocketId = Array.from(clientsInRoom).find(id => id !== socket.id);
            const otherSocket = wsServer.sockets.sockets.get(otherSocketId);
            if (otherSocket) {
                socket.to(roomName).emit("opponent_nickname", nickname);
                socket.emit("opponent_nickname", otherSocket.nickname);
            }
        }
        socket.to(roomName).emit("welcome");
    });

    socket.on("offer",(offer,roomName) =>{
        socket.to(roomName).emit("offer",offer);
    });

    socket.on("answer",(answer,roomName) =>{
        socket.to(roomName).emit("answer",answer);
    });
    socket.on("ice",(ice,roomName) =>{
        socket.to(roomName).emit("ice",ice);
    });

    socket.on("start_rec", (roomName) => {
        socket.broadcast.to(roomName).emit("rec_started");
    });

    socket.on("stop_rec", (roomName) => {
        socket.broadcast.to(roomName).emit("rec_stopped");
    });
});

const handleListen = () => console.log("Listening on http://localhost:3000");

httpServer.listen(3000,handleListen);

