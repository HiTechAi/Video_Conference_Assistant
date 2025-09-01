import express from 'express';
import http from "http";
import SocketIO from "socket.io";



const app = express();

app.set("view engine","pug");
app.set("views", __dirname + "/views");
app.use("/public",express.static(__dirname+"/public"));
app.get("/",(req,res)=> res.render("home"));
//app.get("/*",(req,res)=> res.redirect("/"));



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
        // Send the list of existing users (with nicknames) to the new user
        socket.emit("all_users", otherUsers);
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

    // Recording events remain the same
    socket.on("start_rec", (roomName) => {
        socket.broadcast.to(roomName).emit("rec_started");
    });

    socket.on("stop_rec", (roomName) => {
        socket.broadcast.to(roomName).emit("rec_stopped");
    });
});

const handleListen = () => console.log("Listening on http://<Your-Local-IP>:3000");

httpServer.listen(3000, "0.0.0.0", handleListen);

