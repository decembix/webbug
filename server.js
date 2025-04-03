const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const players = {}; // 플레이어들의 위치와 이름 정보를 저장

// public 폴더에서 정적 파일 제공
//app.use(express.static("public")); 밑에걸로 변경
app.use(express.static(path.join(__dirname,'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname,'public','html' ,'index.html'));
});

app.get('/health', (req, res) => {
    res.sendFile(path.join(__dirname,'public','html' ,'health.html'));
});

io.on("connection", (socket) => {
    console.log("새로운 플레이어 접속:", socket.id);
    socket.on("chatMessage", (data) => {
        io.emit("chatMessage", data);
    });
    

    // 새로운 플레이어가 접속하면 기본 위치 설정
    players[socket.id] = {
        x: 200,
        y: 200,
        size: 30,
        name: "",
        character: "caterpillar.png"
    };
        
    // 서버가 클라이언트에 플레이어 상태 전송
    io.emit("updatePlayers", players);

    socket.on("setPlayerName", (data) => {
        players[data.id].name = data.name;
        players[data.id].character = data.character;
        io.emit("updatePlayers", players);
    });



    // 플레이어 이동 이벤트 처리
    socket.on("moveCharacter", (data) => {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        io.emit("updatePlayers", players); // 이동 후 다른 클라이언트에 업데이트
    });

    // 플레이어가 나갔을 때 삭제
    socket.on("disconnect", () => {
        console.log("플레이어 퇴장:", socket.id);
        delete players[socket.id];
        io.emit("updatePlayers", players); // 퇴장 후 다른 클라이언트에 업데이트
    });
});

server.listen(3001, () => {
    console.log("서버 실행 중: http://localhost:3001");
});