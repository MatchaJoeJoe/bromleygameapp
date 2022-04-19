const port = process.env.PORT || 8000;

// setting up express
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin:"*",
    methods: ["GET", "POST"]
  }
});
var roomsList = [];

// root server handling
app.get('/', (req, res) => {
  res.redirect('https://matchajoejoe.github.io/games/bromley-game/');
})

io.on('connection', (socket) => {
  console.log(`socket ${socket.id} has connected`);
  socket.on('list games', (socketId) => {
    listGames(socket, socketId);
  });
  socket.on('host game', (roomName) => {
    hostGame(socket, roomName);
  });
  socket.on('disconnect me', (socketId) => {
    if(socketId == socket.id){
      console.log(`socket ${socket.id} has disconnected`);
      socket.disconnect();
    }
  });
  io.to(socket.id).emit('socket-id', socket.id);
});
io.of("/").adapter.on("join-room", (room, id) => {
  if(room != id){
    var thisSocket = io.sockets.sockets.get(id);
    thisSocket.broadcast.to(room).emit('player joined', id);
    var roomSize = io.sockets.adapter.rooms.get(room).size;
    console.log(`socket ${id} has joined room ${room} (${roomSize})`);
  }
});

io.of("/").adapter.on("leave-room", (room, id) => {
  if(room != id){
    var thisSocket = io.sockets.sockets.get(id);
    thisSocket.broadcast.to(room).emit('player left', id);
    var roomSize = io.sockets.adapter.rooms.get(room).size;
    console.log(`socket ${id} has left room ${room} (${roomSize})`);
  }
});

http.listen(port, function() {
   console.log('listening on *:' + port);
});

// function to list available games
async function listGames(socket, socketId){
  var stringList = {
    strings: roomsList
  }
  io.to(socketId).emit("games-list", JSON.stringify(stringList));
}
async function hostGame(socket, roomName){
  if(roomsList.includes(roomName)){
    io.to(socket.id).emit("room-created", false);
  } else {
    socket.join(roomName);
    roomsList.push(roomName);
    console.log(socket.id + " created " + roomName)
  }

}
// function to join a game
async function joinGame(socket, gameId){
  socket.join(gameId, function () {
    console.log(socket.id + " now in rooms ", socket.rooms);
  });
}
