import express from 'express';
import http from "http";
import SocketIO from "socket.io";
import multer from 'multer';
import path from 'path';

const app = express();

// --- Multer Setup ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'audio_uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));

// Correct Routes
app.get("/login", (req, res) => res.render("login"));
app.get("/register", (req, res) => res.render("register"));
app.get("/", (req, res) => res.render("login"));
app.get("/home", (req, res) => res.render("home"));
app.get("/mypage", (req, res) => res.render("mypage"));
app.get("/dashboard", (req, res) => res.render("dashboard"));

// Upload Route
app.post("/upload", upload.single('audio'), (req, res) => {
    const email = req.body.email;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: "File not uploaded." });
    }

    console.log(`Received upload for email: ${email}`);
    console.log(`File saved to: ${file.path}`);

    res.json({ 
        success: true, 
        message: "Upload successful", 
        email: email, 
        filePath: file.path 
    });
});

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName, nickname) => {
        socket.join(roomName);
        socket["nickname"] = nickname;

        const otherUsers = [];
        const clientsInRoom = wsServer.sockets.adapter.rooms.get(roomName);
        if (clientsInRoom) {
            clientsInRoom.forEach(id => {
                if (id !== socket.id) {
                    const otherSocket = wsServer.sockets.sockets.get(id);
                    if (otherSocket) {
                        otherUsers.push({
                            id: id,
                            nickname: otherSocket.nickname
                        });
                    }
                }
            });
        }
        socket.emit("all_users", otherUsers);

        socket.to(roomName).emit("user_joined", { id: socket.id, nickname: socket.nickname });
    });

    socket.on("offer", (offer, targetSocketId, nickname) => {
        socket.to(targetSocketId).emit("offer", offer, socket.id, nickname);
    });

    socket.on("answer", (answer, targetSocketId) => {
        socket.to(targetSocketId).emit("answer", answer, socket.id);
    });

    socket.on("ice", (ice, targetSocketId) => {
        socket.to(targetSocketId).emit("ice", ice, socket.id);
    });

    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) =>
            socket.to(room).emit("user_disconnected", socket.id)
        );
    });

    socket.on("start_rec_sync", (roomName) => {
        wsServer.to(roomName).emit("rec_started_sync");
    });

    socket.on("stop_rec_sync", (roomName) => {
        wsServer.to(roomName).emit("rec_stopped_sync");
    });
});

const handleListen = () => console.log("Listening on http://localhost:3000");
httpServer.listen(3000, "0.0.0.0", handleListen);
