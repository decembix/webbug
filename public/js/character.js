const socket = io();
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let players = {};
let myId = null;
let playerName = "";
let selectedCharacterImage = "caterpillar.png"; // 기본 캐릭터

let keysPressed = {}; // 키보드 입력 상태
let characterImages = {}; // 이미지 객체 저장

// 캐릭터 이미지 목록
const characterList = ["caterpillar.png", "snail.png", "ant.png", "worm.png"];
characterList.forEach(name => {
    const img = new Image();
    img.src = `/assets/characters/${name}`;
    characterImages[name] = img;
});

// 게임 시작 버튼 클릭 시
document.getElementById("startGame").addEventListener("click", () => {
    playerName = document.getElementById("characterName").value.trim();
    if (playerName === "") {
        alert("이름을 입력해주세요!");
        return;
    }

    selectedCharacterImage = document.querySelector('input[name="character"]:checked').value;

    document.getElementById("nameForm").style.display = "none";
    document.getElementById("gameArea").style.display = "block";

    socket.emit("setPlayerName", {
        id: socket.id,
        name: playerName,
        character: selectedCharacterImage
    });
});

// 서버 연결
socket.on("connect", () => {
    myId = socket.id;
});

socket.on("updatePlayers", (serverPlayers) => {
    players = serverPlayers;
    draw();
});

// 방향키 누를 때 키 상태 저장
document.addEventListener("keydown", (e) => {
    keysPressed[e.key] = true;

    if (e.key === " ") {
        e.preventDefault();
        toggleChat();
    }
});

document.addEventListener("keyup", (e) => {
    keysPressed[e.key] = false;
});

// 이동 처리 루프
setInterval(() => {
    if (!myId || !players[myId]) return;
    const speed = 3;
    const character = players[myId];

    if (keysPressed["ArrowLeft"]) character.x -= speed;
    if (keysPressed["ArrowRight"]) character.x += speed;
    if (keysPressed["ArrowUp"]) character.y -= speed;
    if (keysPressed["ArrowDown"]) character.y += speed;

    socket.emit("moveCharacter", character);
}, 30);

// 그리기 함수
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let id in players) {
        const player = players[id];
        const img = characterImages[player.character] || characterImages["caterpillar.png"];
        ctx.drawImage(img, player.x, player.y, player.size, player.size);

        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText(player.name, player.x, player.y - 5);
    }
}

draw();


// ✅ 채팅 기능
function toggleChat() {
    let chatInput = document.getElementById("chatInput");
    if (!chatInput) {
        chatInput = document.createElement("input");
        chatInput.type = "text";
        chatInput.id = "chatInput";
        chatInput.placeholder = "채팅을 입력하세요...";
        chatInput.style.position = "absolute";
        chatInput.style.bottom = "10px";
        chatInput.style.left = "50%";
        chatInput.style.transform = "translateX(-50%)";
        document.body.appendChild(chatInput);
        chatInput.focus();

        chatInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const message = chatInput.value.trim();
                if (message !== "") {
                    socket.emit("chatMessage", { id: myId, message });
                }
                chatInput.remove();
            }
        });
    } else {
        chatInput.remove();
    }
}
