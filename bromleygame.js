const port = process.env.PORT || 8000;

// setting up express
const express = require('express');
const app = express();
const cors = require('cors')
app.use(cors());
const http = require('http').Server(app);
const io = require('socket.io')(http, {
  cors: {
    origin:"*",
    methods: ["GET", "POST"]
  }
});
var roomsList = [];
var count = 0;

// root server handling
app.get('/', (req, res) => {
  res.redirect('https://bromley-game.github.io/');
})

io.on('connection', (socket) => {
  console.log(`socket ${socket.id} has connected`);

  socket.on('list games', (socketId) => {
    joinLFG(socket, socketId);
  });
  socket.on('join game', (connectionInfo) =>{
    joinGame(socket, connectionInfo);
  });
  socket.on('host game', (roomName) => {
    hostGame(socket, roomName);
  });
  socket.on('player ready', (playerData) => {
    sendPlayerData(socket, playerData);
  });
  socket.on('ship moved', (shipData) => {
    sendShipData(socket, shipData);
  });
  socket.on('disconnect', function () {
      console.log(`socket ${socket.id} has disconnected`);
  });
  socket.on('disconnect me', (socketId) => {
    if(socketId == socket.id){
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
// function to send player data
function sendPlayerData(socket, playerData){
  playerDataObj = JSON.parse(playerData);
  io.to(playerDataObj.roomName).emit("player-ready", playerData);

}
function sendShipData(socket, shipData){
  shipDataObj = JSON.parse(shipData);
  io.to(shipDataObj.roomName).emit("ship-moved", shipData);
}

// function to find all socket names
function findSockets(){
  connectedSockets = [];
  var sockets = Array.from(io.sockets.sockets);
  for (var i=0;i<sockets.length;i++) {
    thisSocket = sockets[i][0];
    connectedSockets.push(thisSocket);
  }
  return connectedSockets;
}
// function to find all room names
function findRooms() {
  var clients = findSockets();
  var availableRooms = [];
  var rooms =  Array.from(io.sockets.adapter.rooms);
  for (var i=0;i<rooms.length;i++) {
    thisRoom = rooms[i][0];
    if(!clients.includes(thisRoom) && thisRoom != "LFG"){
      availableRooms.push(thisRoom);
    }
  }
  return availableRooms;
}
// function to list available games
async function listGames(socket, socketId){
  theRooms = findRooms();
  openRooms = [];
  for (var i=0;i<theRooms.length;i++){
    thisRoom = theRooms[i];
    var roomSize = io.sockets.adapter.rooms.get(thisRoom).size;
    if(roomSize == 1){
      openRooms.push(thisRoom);
    }
  }
  var stringList = {
    strings: openRooms
  }
  io.to(socketId).emit("games-list", JSON.stringify(stringList));
}
// function to host a game
async function hostGame(socket, roomName){
  if (io.sockets.adapter.rooms.has(roomName) || roomName == "LFG") {
    io.to(socket.id).emit("room-created", "false");
  } else {
    socket.join(roomName);
    roomsList.push(roomName);
    io.to(socket.id).emit("room-created", "true");
    if (io.sockets.adapter.rooms.has("LFG")) {
      listGames(socket, "LFG");
    }
  }
}
// function to join lfg room and list games
function joinLFG(socket, socketId){
  socket.join("LFG");
  listGames(socket, socketId);
}
// function to join a game
async function joinGame(socket, connectionInfo){
  connectionObj = JSON.parse(connectionInfo);
  socket.leave("LFG");
  socket.join(connectionObj.gameName);
  io.to(connectionObj.gameName).emit("player-joined", connectionObj.playerName);

}
