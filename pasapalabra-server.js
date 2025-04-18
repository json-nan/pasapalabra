
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
    letters: {},
    timerSeconds: 4 * 60, // 5 minutes in seconds
    timerRunning: false // Default: timer not running until game is started
  };
  
  // Inicializar todas las letras del abecedario
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
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
    
    // Si el temporizador estaba pausado, reanudar
    if (!games[gameId].timerRunning) {
      games[gameId].timerRunning = true;
    }
    
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
    games[gameId].timerRunning = false; // Pause the timer
    
    io.to(gameId).emit('gameState', games[gameId]);
  });
  
  // Evento para actualizar el tiempo restante
  socket.on('updateTimerSeconds', ({gameId, seconds}) => {
    if (!games[gameId]) return;
    games[gameId].timerSeconds = seconds;
  });

  // Evento para iniciar el juego (inicia el temporizador)
  socket.on('startGame', (gameId) => {
    if (!games[gameId]) return;
    games[gameId].timerRunning = true;
    io.to(gameId).emit('gameState', games[gameId]);
  });

  // Evento para pausar el juego (pausa el temporizador)
  socket.on('pauseGame', (gameId) => {
    if (!games[gameId]) return;
    games[gameId].timerRunning = false;
    io.to(gameId).emit('gameState', games[gameId]);
  });

  // Evento para reiniciar un juego específico
  socket.on('resetGame', (gameId) => {
    if (!games[gameId]) return;
    
    Object.keys(games[gameId].letters).forEach(letter => {
      games[gameId].letters[letter].status = 'pending';
    });
    games[gameId].currentLetter = null;
    games[gameId].timerSeconds = 4 * 60; // Reset to 5 minutes
    games[gameId].timerRunning = true;
    
    io.to(gameId).emit('gameState', games[gameId]);
  });
});

const PORT = process.env.PORT || 3000;

server.listen({
  port: PORT,
  host: '0.0.0.0'
}, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
