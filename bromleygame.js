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

// root server handling
app.get('/', (req, res) => {
  res.redirect('https://matchajoejoe.github.io/games/bromley-game/');
})


io.on('connection', (socket) => {
  socket.on('new game', (gameType) => {
    newGame(socket, gameType);
  });
  socket.on('join game', (gameId) => {
    joinGame(socket, gameId)
  });
});
io.of("/").adapter.on("join-room", (room, id) => {
  if(room != id){
    var thisSocket = io.sockets.sockets.get(id);
    thisSocket.broadcast.to(room).emit('player joined', id);
    console.log(`socket ${id} has joined room ${room}`);
  }
});

io.of("/").adapter.on("leave-room", (room, id) => {
  if(room != id){
    var thisSocket = io.sockets.sockets.get(id);
    thisSocket.broadcast.to(room).emit('player left', id);
    console.log(`socket ${id} has left room ${room}`);
  }
});

http.listen(port, function() {
   console.log('listening on *:' + port);
});
// function to create new game
async function newGame(socket, gameType){
  // figure out what new game looks like
  console.log('new game initiated');
}

// function to join a game
async function joinGame(socket, gameId){
  // figure out join game looks like
  console.log('join game initiated');
}
