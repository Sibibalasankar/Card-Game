const { initGame, playCard, rebuildTurnOrder } = require('./gameEngine');
const User = require('../models/User');
const Match = require('../models/Match');

// Global memory store for rooms
global.rooms = global.rooms || {};

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Track active user ID associated with this socket
    let socketUser = null;
    let activeRoomCode = null;

    // Helper: Find room by code
    const getRoom = (code) => {
      if (!code) return null;
      return global.rooms[code.toUpperCase()];
    };

    // Helper: Broadcast room updates
    const broadcastRoomUpdate = (room) => {
      if (!room) return;
      
      // Strip sensitive information (other players' hands) before broadcasting
      const safePlayers = room.players.map(p => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        isReady: p.isReady,
        isHost: p.isHost,
        isConnected: p.isConnected,
        cardCount: room.gameState ? (room.gameState.players.find(gp => gp.id === p.id)?.hand.length || 0) : 0,
        isSafe: room.gameState ? (room.gameState.players.find(gp => gp.id === p.id)?.isSafe || false) : false,
        exitOrder: room.gameState ? (room.gameState.players.find(gp => gp.id === p.id)?.exitOrder || null) : null
      }));

      const roomData = {
        code: room.code,
        creatorId: room.creatorId,
        status: room.status,
        players: safePlayers,
        isPrivate: room.isPrivate,
        chatMessages: room.chatMessages,
        gameState: room.gameState ? {
          status: room.gameState.status,
          isFirstRound: room.gameState.isFirstRound,
          roundStarterId: room.gameState.roundStarterId,
          turnOrder: room.gameState.turnOrder,
          activePlayerIndex: room.gameState.activePlayerIndex,
          playedCards: room.gameState.playedCards,
          openedSuit: room.gameState.openedSuit,
          isBreakRound: room.gameState.isBreakRound,
          safeCount: room.gameState.safeCount,
          donkeyId: room.gameState.donkeyId,
          donkeyName: room.gameState.donkeyName,
          lastAction: room.gameState.lastAction,
          lastRoundResult: room.gameState.lastRoundResult
        } : null,
        timerRemaining: room.timerRemaining,
        activePlayerId: room.gameState ? room.gameState.turnOrder[room.gameState.activePlayerIndex] : null
      };

      io.to(room.code).emit('room_updated', roomData);

      // Send individual hands only to corresponding connected players
      if (room.gameState && room.status === 'playing') {
        room.players.forEach(p => {
          if (p.isConnected) {
            const gameStatePlayer = room.gameState.players.find(gp => gp.id === p.id);
            if (gameStatePlayer) {
              io.to(p.socketId).emit('hand_updated', gameStatePlayer.hand);
            }
          }
        });
      }
    };

    // Helper: Turn Timer management
    const startTurnTimer = (room) => {
      // Clear existing timer
      if (room.timer) {
        clearInterval(room.timer);
      }

      if (room.status !== 'playing' || room.gameState.status === 'completed') return;

      room.timerRemaining = 20; // 20 seconds turn timer for fast action
      broadcastRoomUpdate(room);

      room.timer = setInterval(async () => {
        room.timerRemaining--;

        if (room.timerRemaining <= 0) {
          clearInterval(room.timer);
          
          // Auto-play move
          try {
            const activePlayerId = room.gameState.turnOrder[room.gameState.activePlayerIndex];
            const activePlayer = room.gameState.players.find(p => p.id === activePlayerId);
            
            if (activePlayer && activePlayer.hand.length > 0) {
              let selectedCard = null;

              // Validate first card must be Ace of Spades
              if (room.gameState.isFirstRound && room.gameState.playedCards.length === 0) {
                selectedCard = activePlayer.hand.find(c => c.id === 'Spades-A');
              }

              // Follow suit check
              if (!selectedCard && room.gameState.playedCards.length > 0) {
                const openedSuit = room.gameState.openedSuit;
                const matchingCards = activePlayer.hand.filter(c => c.suit === openedSuit);
                if (matchingCards.length > 0) {
                  selectedCard = matchingCards[0];
                }
              }

              // Default: pick first card
              if (!selectedCard) {
                selectedCard = activePlayer.hand[0];
              }

              console.log(`Timer timeout! Auto-playing card ${selectedCard.id} for player ${activePlayer.name}`);
              
              const prevRoundResult = room.gameState.lastRoundResult;
              
              // Play card authoritative engine
              playCard(room.gameState, activePlayerId, selectedCard.id);
              
              // Broadcast chat message about auto-play
              room.chatMessages.push({
                sender: 'System',
                text: `${activePlayer.name} took too long! Auto-played ${selectedCard.rank} of ${selectedCard.suit}.`,
                timestamp: Date.now()
              });

              // Check if round resolved and emit special event for animations
              if (room.gameState.lastRoundResult && room.gameState.lastRoundResult !== prevRoundResult) {
                io.to(room.code).emit('round_ended', room.gameState.lastRoundResult);
                
                // Sleep brief seconds on server to let animations play, then start next round
                setTimeout(() => {
                  if (room.gameState.status === 'completed') {
                    handleGameEnd(room);
                  } else {
                    startTurnTimer(room);
                  }
                }, 4000);
              } else {
                startTurnTimer(room);
              }
            }
          } catch (err) {
            console.error('Auto play error:', err.message);
            startTurnTimer(room); // Restart timer on error to avoid game lock
          }
        } else {
          // Send simple tick event to make UI updates super efficient
          io.to(room.code).emit('timer_tick', { remaining: room.timerRemaining });
        }
      }, 1000);
    };

    // Helper: Handle Game Completion and DB updates
    const handleGameEnd = async (room) => {
      if (room.timer) clearInterval(room.timer);
      room.status = 'completed';

      const donkeyId = room.gameState.donkeyId;
      const donkeyName = room.gameState.donkeyName;

      console.log(`Game over in room ${room.code}. Donkey: ${donkeyName}`);

      // Re-enable lobby structure so they can play again
      room.players.forEach(p => {
        p.isReady = false;
      });

      broadcastRoomUpdate(room);

      // Save match to database
      try {
        const matchData = {
          roomCode: room.code,
          players: room.gameState.players.map(p => ({
            userId: p.id.match(/^[0-9a-fA-F]{24}$/) ? p.id : null, // Only store true Mongo IDs
            username: p.name,
            avatar: p.avatar,
            isSafe: p.isSafe,
            exitOrder: p.exitOrder
          })),
          donkey: {
            userId: donkeyId.match(/^[0-9a-fA-F]{24}$/) ? donkeyId : null,
            username: donkeyName
          },
          roundsPlayed: 10 // Approximate or track rounds
        };

        // Save Match
        const match = new Match(matchData);
        await match.save();

        // Update statistics for all players
        for (const p of room.gameState.players) {
          const isDonkey = p.id === donkeyId;
          const isWinner = p.exitOrder === 1;

          // Award coins/XP
          let xpAwarded = 50; // Participation XP
          let coinsAwarded = 20;

          if (isWinner) {
            xpAwarded = 200; // Winner gets 200 XP
            coinsAwarded = 150;
          } else if (p.isSafe) {
            xpAwarded = 100;
            coinsAwarded = 50;
          } else if (isDonkey) {
            xpAwarded = 10; // Donkey gets 10 XP
            coinsAwarded = 0;
          }

          if (p.id.match(/^[0-9a-fA-F]{24}$/)) {
            // MongoDB user update
            await User.findByIdAndUpdate(p.id, {
              $inc: {
                xp: xpAwarded,
                coins: coinsAwarded,
                matchesPlayed: 1,
                matchesWon: isWinner ? 1 : 0,
                kazhuthaiCount: isDonkey ? 1 : 0
              }
            });
          } else if (global.inMemoryUsers && global.inMemoryUsers[p.id]) {
            // Local in-memory update
            const localUser = global.inMemoryUsers[p.id];
            localUser.xp += xpAwarded;
            localUser.coins += coinsAwarded;
            localUser.matchesPlayed += 1;
            if (isWinner) localUser.matchesWon += 1;
            if (isDonkey) localUser.kazhuthaiCount += 1;
          }
        }
        
        io.to(room.code).emit('game_over', {
          donkeyId,
          donkeyName,
          matchId: match._id
        });
      } catch (err) {
        console.error('Error saving match results:', err.message);
        // Fallback emit if DB failed so front-end still celebrates
        io.to(room.code).emit('game_over', {
          donkeyId,
          donkeyName
        });
      }
    };

    // EVENT: Auth and Reconnect check
    socket.on('register_socket', async ({ userId, username, avatar }) => {
      if (!userId) return;

      socketUser = { id: userId, name: username, avatar };
      console.log(`Socket ${socket.id} registered to user ${username} (${userId})`);

      // Check if user is already in a room (Reconnect or dynamic profile update)
      for (const code of Object.keys(global.rooms)) {
        const room = global.rooms[code];
        const existingPlayer = room.players.find(p => p.id === userId);
        
        if (existingPlayer) {
          console.log(`Updating/Reconnecting user ${username} in room ${code}`);
          
          // Dynamically sync updated profile details
          existingPlayer.name = username;
          existingPlayer.avatar = avatar;
          existingPlayer.socketId = socket.id;
          existingPlayer.isConnected = true;
          activeRoomCode = code;

          // Join actual socket room
          socket.join(code);

          // Broadcast the name/avatar changes immediately to everyone in the room
          broadcastRoomUpdate(room);

          socket.emit('reconnect_success', {
            roomCode: code,
            status: room.status
          });
          return;
        }
      }
    });

    // EVENT: Create Room
    socket.on('create_room', ({ isPrivate }) => {
      if (!socketUser) {
        return socket.emit('error', 'Authentication required to create rooms.');
      }

      // Generate a unique 6 letter room code
      let code;
      do {
        code = Math.random().toString(36).substring(2, 8).toUpperCase();
      } while (global.rooms[code]);

      const newRoom = {
        code,
        creatorId: socketUser.id,
        status: 'lobby',
        players: [{
          id: socketUser.id,
          name: socketUser.name,
          avatar: socketUser.avatar,
          socketId: socket.id,
          isReady: false,
          isHost: true,
          isConnected: true
        }],
        isPrivate: !!isPrivate,
        chatMessages: [{
          sender: 'System',
          text: `Room created by ${socketUser.name}. Code: ${code}`,
          timestamp: Date.now()
        }],
        gameState: null,
        timer: null,
        timerRemaining: 0
      };

      global.rooms[code] = newRoom;
      activeRoomCode = code;
      socket.join(code);

      console.log(`Room created: ${code} by player ${socketUser.name}`);
      broadcastRoomUpdate(newRoom);
    });

    // EVENT: Join Room
    socket.on('join_room', ({ roomCode }) => {
      if (!socketUser) {
        return socket.emit('error', 'Authentication required to join rooms.');
      }

      const room = getRoom(roomCode);
      if (!room) {
        return socket.emit('error_notification', 'Room not found. Check the code.');
      }

      if (room.status === 'playing') {
        // Check if reconnecting
        const playerIndex = room.players.findIndex(p => p.id === socketUser.id);
        if (playerIndex !== -1) {
          room.players[playerIndex].socketId = socket.id;
          room.players[playerIndex].isConnected = true;
          activeRoomCode = room.code;
          socket.join(room.code);
          broadcastRoomUpdate(room);
          socket.emit('reconnect_success', { roomCode: room.code, status: room.status });
          return;
        } else {
          return socket.emit('error_notification', 'Game is already in progress. Cannot spectate currently.');
        }
      }

      // Check if room is full
      if (room.players.length >= 6) {
        return socket.emit('error_notification', 'Room is full! Maximum 6 players allowed.');
      }

      // Check if player already in room
      if (!room.players.some(p => p.id === socketUser.id)) {
        room.players.push({
          id: socketUser.id,
          name: socketUser.name,
          avatar: socketUser.avatar,
          socketId: socket.id,
          isReady: false,
          isHost: false,
          isConnected: true
        });
      } else {
        // Update socket ID and status
        const p = room.players.find(p => p.id === socketUser.id);
        p.socketId = socket.id;
        p.isConnected = true;
      }

      activeRoomCode = room.code;
      socket.join(room.code);

      room.chatMessages.push({
        sender: 'System',
        text: `${socketUser.name} joined the lobby.`,
        timestamp: Date.now()
      });

      console.log(`Player ${socketUser.name} joined room ${roomCode}`);
      broadcastRoomUpdate(room);
    });

    // EVENT: Player Ready
    socket.on('toggle_ready', () => {
      const room = getRoom(activeRoomCode);
      if (!room) return;

      const player = room.players.find(p => p.id === socketUser?.id);
      if (player) {
        player.isReady = !player.isReady;
        broadcastRoomUpdate(room);
      }
    });

    // EVENT: Start Game
    socket.on('start_game', () => {
      const room = getRoom(activeRoomCode);
      if (!room) return;

      // Verify host starts
      const player = room.players.find(p => p.id === socketUser?.id);
      if (!player || !player.isHost) {
        return socket.emit('error', 'Only the host can start the game.');
      }

      // Support 3 to 6 players
      if (room.players.length < 3 || room.players.length > 6) {
        return socket.emit('error_notification', 'Game requires 3 to 6 players to start.');
      }

      // Check if everyone (except host) is ready
      const allReady = room.players.filter(p => !p.isHost).every(p => p.isReady);
      if (!allReady) {
        return socket.emit('error_notification', 'Waiting for all players to be ready.');
      }

      // Initialize game using game engine
      room.gameState = initGame(room.players);
      room.status = 'playing';

      room.chatMessages.push({
        sender: 'System',
        text: 'The game has started! Card dealing in progress...',
        timestamp: Date.now()
      });

      console.log(`Game started in room ${room.code}!`);
      broadcastRoomUpdate(room);
      
      // Start the turn timer!
      startTurnTimer(room);
    });

    // EVENT: Play Card
    socket.on('play_card', ({ cardId }) => {
      const room = getRoom(activeRoomCode);
      if (!room || room.status !== 'playing') return;

      if (!socketUser) return;

      try {
        const prevRoundResult = room.gameState.lastRoundResult;
        
        // Execute card play in authoritative engine
        playCard(room.gameState, socketUser.id, cardId);

        // If turn resolved, broadcast round_ended animation trigger
        if (room.gameState.lastRoundResult && room.gameState.lastRoundResult !== prevRoundResult) {
          // Clear active turn timer during animation pauses
          if (room.timer) clearInterval(room.timer);

          io.to(room.code).emit('round_ended', room.gameState.lastRoundResult);
          broadcastRoomUpdate(room);

          // Sleep brief seconds on server to let client animations play out fully, then start next round
          setTimeout(() => {
            if (room.gameState.status === 'completed') {
              handleGameEnd(room);
            } else {
              startTurnTimer(room);
            }
          }, 4000);
        } else {
          // Just normal turn rotation
          startTurnTimer(room);
        }
      } catch (err) {
        console.error('Play card error:', err.message);
        socket.emit('error_notification', err.message);
      }
    });

    // EVENT: In-game Chat Message
    socket.on('send_message', ({ text }) => {
      const room = getRoom(activeRoomCode);
      if (!room || !socketUser) return;

      const newMsg = {
        sender: socketUser.name,
        text: text.substring(0, 100), // Enforce size limit
        timestamp: Date.now()
      };

      room.chatMessages.push(newMsg);
      // Keep only last 50 chat messages in-memory
      if (room.chatMessages.length > 50) room.chatMessages.shift();

      io.to(room.code).emit('chat_received', newMsg);
    });

    // EVENT: Emoji Reactions
    socket.on('emoji_reaction', ({ emoji }) => {
      const room = getRoom(activeRoomCode);
      if (!room || !socketUser) return;

      io.to(room.code).emit('emoji_received', {
        playerId: socketUser.id,
        playerName: socketUser.name,
        emoji
      });
    });

    // EVENT: Leave Room
    socket.on('leave_room', () => {
      const room = getRoom(activeRoomCode);
      if (!room || !socketUser) return;

      console.log(`Player ${socketUser.name} left room ${room.code}`);

      if (room.status === 'playing') {
        // Player forfeited by leaving active game!
        // Mark them as safe? No, they disconnected/left. We keep them but flag as disconnected.
        const p = room.players.find(p => p.id === socketUser.id);
        if (p) p.isConnected = false;
        
        room.chatMessages.push({
          sender: 'System',
          text: `${socketUser.name} abandoned the game. They will be auto-played.`,
          timestamp: Date.now()
        });

        broadcastRoomUpdate(room);
      } else {
        // Remove from players array in lobby mode
        room.players = room.players.filter(p => p.id !== socketUser.id);

        if (room.players.length === 0) {
          if (room.timer) clearInterval(room.timer);
          delete global.rooms[room.code];
          console.log(`Room ${room.code} destroyed as it is empty.`);
        } else {
          // If the host left, assign new host
          if (room.creatorId === socketUser.id) {
            room.players[0].isHost = true;
            room.creatorId = room.players[0].id;
          }

          room.chatMessages.push({
            sender: 'System',
            text: `${socketUser.name} left the lobby.`,
            timestamp: Date.now()
          });

          broadcastRoomUpdate(room);
        }
      }

      socket.leave(room.code);
      activeRoomCode = null;
    });

    // EVENT: Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      const room = getRoom(activeRoomCode);
      if (room && socketUser) {
        const p = room.players.find(p => p.id === socketUser.id);
        if (p) {
          if (room.status === 'playing') {
            // Keep them inside the game so they can RECONNECT. Just flag connection.
            p.isConnected = false;
            
            room.chatMessages.push({
              sender: 'System',
              text: `${socketUser.name} lost connection. Waiting for reconnect...`,
              timestamp: Date.now()
            });

            broadcastRoomUpdate(room);
          } else {
            // Remove completely from lobby
            room.players = room.players.filter(p => p.id !== socketUser.id);
            if (room.players.length === 0) {
              if (room.timer) clearInterval(room.timer);
              delete global.rooms[room.code];
              console.log(`Room ${room.code} destroyed on disconnect.`);
            } else {
              if (room.creatorId === socketUser.id) {
                room.players[0].isHost = true;
                room.creatorId = room.players[0].id;
              }
              broadcastRoomUpdate(room);
            }
          }
        }
      }
    });
  });
};
