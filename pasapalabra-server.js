
// --------- SERVIDOR WEBSOCKET (pasapalabra-server.js) ---------
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    activeGames: Object.keys(games).length 
  });
});

// Almacén de múltiples juegos
const games = {};
const socketToRoom = {};
const gameTimers = {}; // Store timer intervals for each game

// Función para crear un nuevo juego
function createNewGame(gameId) {
  const newGame = {
    id: gameId,
    currentLetter: null,
    letters: {},
    timerSeconds: 4 * 60, // 4 minutes in seconds
    timerRunning: false, // Default: timer not running until game is started
    score: 0,
    correctCount: 0,
    incorrectCount: 0,
    startTime: null,
    endTime: null
  };
  
  // Inicializar todas las letras del abecedario
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(letter => {
    newGame.letters[letter] = {
      status: 'pending', // pending, correct, incorrect, current
      id: `letter-${gameId}-${letter}`,
      attempts: 0
    };
  });
  
  games[gameId] = newGame;
  return newGame;
}

// Función para iniciar el temporizador del servidor
function startGameTimer(gameId) {
  if (gameTimers[gameId]) {
    clearInterval(gameTimers[gameId]);
  }
  
  gameTimers[gameId] = setInterval(() => {
    const game = games[gameId];
    if (!game || !game.timerRunning) {
      clearInterval(gameTimers[gameId]);
      delete gameTimers[gameId];
      return;
    }
    
    if (game.timerSeconds > 0) {
      game.timerSeconds--;
      io.to(gameId).emit('gameState', game);
    } else {
      // Game finished
      game.timerRunning = false;
      game.endTime = new Date();
      clearInterval(gameTimers[gameId]);
      delete gameTimers[gameId];
      io.to(gameId).emit('gameFinished', game);
      io.to(gameId).emit('gameState', game);
    }
  }, 1000);
}

// Función para pausar el temporizador del servidor
function pauseGameTimer(gameId) {
  if (gameTimers[gameId]) {
    clearInterval(gameTimers[gameId]);
    delete gameTimers[gameId];
  }
}

// Conexión de websockets
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado');
  
  // Unirse a un juego específico
  socket.on('joinGame', (gameId) => {
    try {
      // Validar gameId
      if (!gameId || typeof gameId !== 'string' || gameId.length > 50) {
        socket.emit('error', 'ID de juego inválido');
        return;
      }
      
      // Si el juego no existe, lo creamos automáticamente
      if (!games[gameId]) {
        createNewGame(gameId);
        console.log(`Nuevo juego creado: ${gameId}`);
      }
      
      socket.join(gameId);
      socketToRoom[socket.id] = gameId;
      socket.emit('gameState', games[gameId]);
      console.log(`Cliente unido al juego: ${gameId}`);
    } catch (error) {
      console.error('Error al unirse al juego:', error);
      socket.emit('error', 'Error interno del servidor');
    }
  });
  
  // Evento para cambiar a la siguiente letra en un juego específico
  socket.on('nextLetter', ({gameId, letter}) => {
    try {
      if (!games[gameId]) {
        socket.emit('error', 'Juego no encontrado');
        return;
      }
      
      // Validar letra
      if (!letter || !/^[A-Z]$/.test(letter)) {
        socket.emit('error', 'Letra inválida');
        return;
      }
      
      const game = games[gameId];
      
      // Restablecer la letra actual si existe
      if (game.currentLetter) {
        game.letters[game.currentLetter].status = 'pending';
      }
      
      game.currentLetter = letter;
      game.letters[letter].status = 'current';
      
      // Si el temporizador estaba pausado, reanudar
      if (!game.timerRunning) {
        game.timerRunning = true;
        startGameTimer(gameId);
      }
      
      // Emitir a todos los clientes subscritos a este juego
      io.to(gameId).emit('gameState', game);
      console.log(`Letra cambiada a ${letter} en juego ${gameId}`);
    } catch (error) {
      console.error('Error al cambiar letra:', error);
      socket.emit('error', 'Error interno del servidor');
    }
  });
  
  // Evento para marcar letra como correcta
  socket.on('correctLetter', ({gameId, letter}) => {
    try {
      if (!games[gameId]) {
        socket.emit('error', 'Juego no encontrado');
        return;
      }
      
      const game = games[gameId];
      if (!game.letters[letter] || game.letters[letter].status !== 'current') {
        socket.emit('error', 'No hay letra activa para marcar como correcta');
        return;
      }
      
      game.letters[letter].status = 'correct';
      game.letters[letter].attempts++;
      game.currentLetter = null;
      game.correctCount++;
      game.score += 10; // 10 points per correct answer
      
      io.to(gameId).emit('gameState', game);
      io.to(gameId).emit('letterResult', { letter, result: 'correct', score: game.score });
      console.log(`Letra ${letter} marcada como correcta en juego ${gameId}. Puntuación: ${game.score}`);
    } catch (error) {
      console.error('Error al marcar letra como correcta:', error);
      socket.emit('error', 'Error interno del servidor');
    }
  });
  
  // Evento para marcar letra como incorrecta
  socket.on('incorrectLetter', ({gameId, letter}) => {
    try {
      if (!games[gameId]) {
        socket.emit('error', 'Juego no encontrado');
        return;
      }
      
      const game = games[gameId];
      if (!game.letters[letter] || game.letters[letter].status !== 'current') {
        socket.emit('error', 'No hay letra activa para marcar como incorrecta');
        return;
      }
      
      game.letters[letter].status = 'incorrect';
      game.letters[letter].attempts++;
      game.currentLetter = null;
      game.incorrectCount++;
      game.score = Math.max(0, game.score - 5); // -5 points per incorrect answer
      
      io.to(gameId).emit('gameState', game);
      io.to(gameId).emit('letterResult', { letter, result: 'incorrect', score: game.score });
      console.log(`Letra ${letter} marcada como incorrecta en juego ${gameId}. Puntuación: ${game.score}`);
    } catch (error) {
      console.error('Error al marcar letra como incorrecta:', error);
      socket.emit('error', 'Error interno del servidor');
    }
  });
  
  // Evento para iniciar el juego (inicia el temporizador)
  socket.on('startGame', (gameId) => {
    if (!games[gameId]) return;
    const game = games[gameId];
    game.timerRunning = true;
    game.startTime = new Date();
    startGameTimer(gameId);
    io.to(gameId).emit('gameState', game);
    io.to(gameId).emit('gameStarted', game);
  });

  // Evento para pausar el juego (pausa el temporizador)
  socket.on('pauseGame', (gameId) => {
    if (!games[gameId]) return;
    const game = games[gameId];
    game.timerRunning = false;
    pauseGameTimer(gameId);
    io.to(gameId).emit('gameState', game);
    io.to(gameId).emit('gamePaused', game);
  });

  // Evento para reiniciar un juego específico
  socket.on('resetGame', (gameId) => {
    if (!games[gameId]) return;
    
    const game = games[gameId];
    pauseGameTimer(gameId);
    
    Object.keys(game.letters).forEach(letter => {
      game.letters[letter].status = 'pending';
      game.letters[letter].attempts = 0;
    });
    game.currentLetter = null;
    game.timerSeconds = 4 * 60; // Reset to 4 minutes
    game.timerRunning = false;
    game.score = 0;
    game.correctCount = 0;
    game.incorrectCount = 0;
    game.startTime = null;
    game.endTime = null;
    
    io.to(gameId).emit('gameState', game);
    io.to(gameId).emit('gameReset', game);
  });

  socket.on('disconnect', () => {
    console.log('Un cliente se ha desconectado');
    const gameId = socketToRoom[socket.id];
    if (!gameId) return;
    
    const room = io.sockets.adapter.rooms.get(gameId);

    if (!room || room.size === 0) {
      console.log(`Sala ${gameId} está vacía. Eliminando...`);
      pauseGameTimer(gameId);
      delete games[gameId];
    }

    delete socketToRoom[socket.id]; // limpieza
  });
});



const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  console.log(`Panel de Control: http://localhost:${PORT}/panel-control.html?id=test`);
  console.log(`Widget OBS: http://localhost:${PORT}/obs-widget.html?id=test`);
});
