
// --------- SERVIDOR WEBSOCKET (pasapalabra-server.js) ---------
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

// Almacén de múltiples juegos
const games = {};

// Función para crear un nuevo juego
function createNewGame(gameId) {
  const newGame = {
    id: gameId,
    currentLetter: null,
    letters: {}
  };
  
  // Inicializar todas las letras del abecedario
  'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').forEach(letter => {
    newGame.letters[letter] = {
      status: 'pending', // pending, correct, incorrect, current
      id: `letter-${gameId}-${letter}`
    };
  });
  
  games[gameId] = newGame;
  return newGame;
}

// Conexión de websockets
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');
  
  // Unirse a un juego específico
  socket.on('joinGame', (gameId) => {
    // Si el juego no existe, lo creamos automáticamente
    if (!games[gameId]) {
      createNewGame(gameId);
    }
    
    socket.join(gameId);
    socket.emit('gameState', games[gameId]);
  });
  
  // Evento para cambiar a la siguiente letra en un juego específico
  socket.on('nextLetter', ({gameId, letter}) => {
    if (!games[gameId]) return;
    
    // Restablecer la letra actual si existe
    if (games[gameId].currentLetter) {
      games[gameId].letters[games[gameId].currentLetter].status = 'pending';
    }
    
    games[gameId].currentLetter = letter;
    games[gameId].letters[letter].status = 'current';
    
    // Emitir a todos los clientes subscritos a este juego
    io.to(gameId).emit('gameState', games[gameId]);
  });
  
  // Evento para marcar letra como correcta
  socket.on('correctLetter', ({gameId, letter}) => {
    if (!games[gameId]) return;
    
    games[gameId].letters[letter].status = 'correct';
    games[gameId].currentLetter = null;
    
    io.to(gameId).emit('gameState', games[gameId]);
  });
  
  // Evento para marcar letra como incorrecta
  socket.on('incorrectLetter', ({gameId, letter}) => {
    if (!games[gameId]) return;
    
    games[gameId].letters[letter].status = 'incorrect';
    games[gameId].currentLetter = null;
    
    io.to(gameId).emit('gameState', games[gameId]);
  });
  
  // Evento para reiniciar un juego específico
  socket.on('resetGame', (gameId) => {
    if (!games[gameId]) return;
    
    Object.keys(games[gameId].letters).forEach(letter => {
      games[gameId].letters[letter].status = 'pending';
    });
    games[gameId].currentLetter = null;
    
    io.to(gameId).emit('gameState', games[gameId]);
  });
});

server.listen(3000, () => {
  console.log('Servidor escuchando en http://localhost:3000');
});
