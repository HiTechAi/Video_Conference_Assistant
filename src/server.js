import express from 'express';
import http from "http";
import SocketIO from "socket.io";

const app = express();

app.set("view engine","pug");
app.set("views", __dirname + "/views");
app.use("/public",express.static(__dirname+"/public"));
app.get("/",(req,res)=> res.render("home"));
app.get("/",(req,res)=> res.redirect("/"));



const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

function publicRooms(){
   
    const {
        socket:{
            adapter:{sids,rooms},
        },
    } = wsServer;

    const publicRooms= [];
    rooms.forEach((_,key)=>{
        if(sids.get(key) === undefined){
            publicRooms.push(key)
        }
    })
    return publicRooms;
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anon";
    socket.onAny((event)=>{
        console.log(wsServer.sockets.adapter);
        console.log(`Socket Event:${event}`);
    });
    socket.on("enter_room",(roomName,done)=>{
        done();
        socket.join(roomName);
        socket.to(roomName).emit("welcome",socket.nickname);
        wsServer.sockets.emit("room_change",publicRooms());
        });
        socket.on("disconnectiong",()=>{
            socket.rooms.forEach(room =>
                socket.to(room).emit("bye",nickname)
            );
        });

        socket.on("disconnect",() =>{
            wsServer.sockets.emit("room_chage",publicRooms());
        });

        socket.on("new_message",(msg,room,done)=>{
            socket.to(room).emit("new_message",`${socket.nickname}:${msg}`);
            done();
        });
        socket.on("nickname",(nickname)=>(socket["nickname"] = nickname));
});

const handleListen = () => console.log("Listening on http://localhost:3000");

httpServer.listen(3000,handleListen);