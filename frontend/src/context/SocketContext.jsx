import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useGameSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [hand, setHand] = useState([]);
  const [timerRemaining, setTimerRemaining] = useState(null);
  const [roundResultAlert, setRoundResultAlert] = useState(null);
  const [errorNotification, setErrorNotification] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState({}); // Keyed by player ID
  const [gameOverData, setGameOverData] = useState(null);

  // Set default Socket URL
  const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://donkey-cards.onrender.com';

  useEffect(() => {
    // Connect to Socket server
    const newSocket = io(SOCKET_URL, {
      transports: ['polling', 'websocket'],
      autoConnect: true
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Register socket session once user logs in
  useEffect(() => {
    if (socket && user) {
      socket.emit('register_socket', {
        userId: user.id,
        username: user.username,
        avatar: user.avatar
      });

      // Bind all standard listeners
      socket.on('room_updated', (updatedRoom) => {
        console.log('Room state updated:', updatedRoom);
        setRoom(updatedRoom);
        
        // Synchronize timer duration
        if (updatedRoom.gameState) {
          setTimerRemaining(updatedRoom.timerRemaining);
        }
      });

      socket.on('hand_updated', (updatedHand) => {
        console.log('Hand state updated:', updatedHand);
        setHand(updatedHand);
      });

      socket.on('timer_tick', ({ remaining }) => {
        setTimerRemaining(remaining);
      });

      socket.on('round_ended', (result) => {
        console.log('Round ended:', result);
        setRoundResultAlert(result);
        
        // Automatically hide the alert after 3.8s (just before server starts next round)
        setTimeout(() => {
          setRoundResultAlert(null);
        }, 3800);
      });

      socket.on('game_over', (data) => {
        console.log('Game over broadcast:', data);
        setGameOverData(data);
      });

      socket.on('emoji_received', ({ playerId, playerName, emoji }) => {
        console.log(`Emoji from ${playerName}: ${emoji}`);
        
        // Trigger floating emoji animation
        setFloatingEmojis(prev => ({
          ...prev,
          [playerId]: {
            id: Math.random(),
            emoji,
            timestamp: Date.now()
          }
        }));

        // Remove emoji bubble after 2.5s
        setTimeout(() => {
          setFloatingEmojis(prev => {
            const copy = { ...prev };
            delete copy[playerId];
            return copy;
          });
        }, 2500);
      });

      socket.on('error_notification', (msg) => {
        console.warn('Socket error received:', msg);
        setErrorNotification(msg);
        setTimeout(() => {
          setErrorNotification(null);
        }, 4000);
      });

      socket.on('match_suspended', (data) => {
        console.warn('Match suspended event:', data.message);
        setErrorNotification(`⚠️ ${data.message}`);
        setTimeout(() => {
          setErrorNotification(null);
        }, 6000);
      });

      socket.on('reconnect_success', ({ roomCode, status }) => {
        console.log(`Successfully reconnected to room ${roomCode}`);
      });
    }

    return () => {
      if (socket) {
        socket.off('room_updated');
        socket.off('hand_updated');
        socket.off('timer_tick');
        socket.off('round_ended');
        socket.off('game_over');
        socket.off('emoji_received');
        socket.off('error_notification');
        socket.off('match_suspended');
        socket.off('reconnect_success');
      }
    };
  }, [socket, user]);

  // EMIT ACTIONS

  const createRoom = (isPrivate = false) => {
    if (socket) {
      socket.emit('create_room', { isPrivate });
      setGameOverData(null);
    }
  };

  const joinRoom = (roomCode) => {
    if (socket) {
      socket.emit('join_room', { roomCode: roomCode.toUpperCase() });
      setGameOverData(null);
    }
  };

  const toggleReady = () => {
    if (socket) {
      socket.emit('toggle_ready');
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('start_game');
    }
  };

  const playCard = (cardId) => {
    if (socket) {
      socket.emit('play_card', { cardId });
    }
  };

  const sendMessage = (text) => {
    if (socket && text.trim()) {
      socket.emit('send_message', { text });
    }
  };

  const sendEmoji = (emoji) => {
    if (socket) {
      socket.emit('emoji_reaction', { emoji });
    }
  };

  const leaveRoom = () => {
    if (socket) {
      socket.emit('leave_room');
      setRoom(null);
      setHand([]);
      setTimerRemaining(null);
      setRoundResultAlert(null);
      setGameOverData(null);
    }
  };

  const resetGameData = () => {
    setGameOverData(null);
    setRoundResultAlert(null);
  };

  const syncRoomState = () => {
    if (socket && user) {
      console.log('Manually refreshing and synchronizing room state...');
      socket.emit('register_socket', {
        userId: user.id,
        username: user.username,
        avatar: user.avatar
      });
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      room,
      hand,
      timerRemaining,
      roundResultAlert,
      setRoundResultAlert,
      errorNotification,
      floatingEmojis,
      gameOverData,
      createRoom,
      joinRoom,
      toggleReady,
      startGame,
      playCard,
      sendMessage,
      sendEmoji,
      leaveRoom,
      resetGameData,
      syncRoomState
    }}>
      {children}
    </SocketContext.Provider>
  );
};
