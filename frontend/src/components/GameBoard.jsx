import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, Reorder, useMotionValue, animate } from 'framer-motion';
import { useGameSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { Card } from './Card';
import { sounds } from '../utils/soundManager';
import { 
  Users, MessageSquare, Send, Award, Clock, ArrowRight,
  Smile, Settings, Info, ShieldAlert, Sparkles, LogOut
} from 'lucide-react';
import { AVATARS } from '../utils/constants';

const QUICK_EMOJIS = ['😂', '😎', '😡', '😭', '😮', '👍', '🐴', '👑'];

// Render a miniature fanned card-back deck for other players
const renderCardBackFan = (cardCount, seatLeft, seatTop) => {
  if (cardCount <= 0) return null;
  
  // Cap cards at 8 for the fan visual so it doesn't get cluttered
  const visualCount = Math.min(cardCount, 8);
  const cardsArray = Array.from({ length: visualCount });
  
  // Determine rotation direction based on seat position
  let baseAngle = 0; // Degrees
  let spread = 12; // Degrees of spread between cards
  let offsetDir = { x: 0, y: -45 }; // Offset of fan center relative to avatar
  
  const leftVal = parseFloat(seatLeft);
  const topVal = parseFloat(seatTop);
  
  if (leftVal < 35) {
    // Left side seat: pointing inwards (right)
    baseAngle = 90;
    offsetDir = { x: -45, y: 0 };
  } else if (leftVal > 65) {
    // Right side seat: pointing inwards (left)
    baseAngle = -90;
    offsetDir = { x: 45, y: 0 };
  } else if (topVal < 30) {
    // Top seat: pointing downwards
    baseAngle = 180;
    offsetDir = { x: 0, y: -45 };
  } else {
    // Bottom/default: pointing upwards
    baseAngle = 0;
    offsetDir = { x: 0, y: 45 };
  }

  return (
    <div 
      className="absolute pointer-events-none z-0 flex items-center justify-center"
      style={{
        transform: `translate(${offsetDir.x}px, ${offsetDir.y}px)`,
        width: '60px',
        height: '60px'
      }}
    >
      {cardsArray.map((_, i) => {
        const offset = i - (visualCount - 1) / 2;
        const rotation = baseAngle + (offset * spread);
        
        return (
          <div
            key={i}
            className="absolute w-6 h-9 rounded bg-gradient-to-br from-blue-700 to-indigo-900 border border-blue-400/30 shadow-md origin-bottom transition-all duration-300"
            style={{
              transform: `rotate(${rotation}deg) translateY(-14px)`,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '4px 4px'
            }}
          />
        );
      })}
      
      {/* Miniature card count bubble inside the fan! */}
      <span className="absolute z-20 bg-slate-900/90 text-white font-black text-[9px] rounded-full px-1.5 py-0.5 border border-white/10 shadow-lg font-outfit">
        {cardCount}
      </span>
    </div>
  );
};

// Coordinates for Circular Player Arrangement
// Coordinates represent percentage positions [left, top] centered on the velvet table
// Index 0 represents the active user at the bottom center.
const POSITION_SCHEMAS = {
  3: [
    { left: '50%', top: '80%' },  // Player 0 (Bottom Center)
    { left: '18%', top: '25%' },  // Player 1 (Top Left)
    { left: '82%', top: '25%' }   // Player 2 (Top Right)
  ],
  4: [
    { left: '50%', top: '80%' },  // Player 0 (Bottom Center)
    { left: '15%', top: '45%' },  // Player 1 (Middle Left)
    { left: '50%', top: '15%' },  // Player 2 (Top Center)
    { left: '85%', top: '45%' }   // Player 3 (Middle Right)
  ],
  5: [
    { left: '50%', top: '80%' },  // Player 0 (Bottom Center)
    { left: '15%', top: '55%' },  // Player 1 (Left)
    { left: '28%', top: '20%' },  // Player 2 (Top Left)
    { left: '72%', top: '20%' },  // Player 3 (Top Right)
    { left: '85%', top: '55%' }   // Player 4 (Right)
  ],
  6: [
    { left: '50%', top: '80%' },  // Player 0 (Bottom Center)
    { left: '15%', top: '55%' },  // Player 1 (Bottom Left)
    { left: '25%', top: '20%' },  // Player 2 (Top Left)
    { left: '50%', top: '15%' },  // Player 3 (Top Center)
    { left: '75%', top: '20%' },  // Player 4 (Top Right)
    { left: '85%', top: '55%' }   // Player 5 (Bottom Right)
  ]
};
const SortableCard = ({ card, playable, isSelected, getDynamicOverlap, idx, handleDragPlayCard, handleCardClick }) => {
  const y = useMotionValue(0);

  return (
    <Reorder.Item 
      value={card}
      layout
      drag="x" // Safe 1D horizontal sorting so the list doesn't get violently confused
      dragSnapToOrigin={true}
      dragElastic={0.4}
      whileDrag={{ scale: 1.1, zIndex: 100, rotate: 5 }}
      onDrag={(e, info) => {
        // If dragged upwards, instantly pipe the exact raw pointer pixel offset into our inner proxy div
        if (info.offset.y < 0) {
          y.set(info.offset.y);
        }
      }}
      onDragEnd={(e, info) => {
        if (playable && info.offset.y < -50) {
          handleDragPlayCard(card);
        }
        // Snap back magnetically down to 0 if we let go and didn't throw it!
        animate(y, 0, { type: "spring", stiffness: 300, damping: 20 });
      }}
      className="relative origin-bottom hover:z-50 shrink-0 cursor-grab active:cursor-grabbing"
      style={{
        ...getDynamicOverlap(),
        zIndex: isSelected ? 40 : idx + 5
      }}
    >
      {/* 
        This inner proxy div handles the vertical visual displacement! 
        Because it's inner, it escapes the Reorder.Item's layout projection math lock on the X axis, 
        giving the illusion of free 2D drag! 
      */}
      <motion.div 
        style={{ y }} 
        className="w-full h-full drop-shadow-2xl"
      >
        <Card
          card={card}
          disabled={!playable}
          isSelected={isSelected}
          onClick={handleCardClick}
        />
      </motion.div>
    </Reorder.Item>
  );
};

export const GameBoard = ({ onOpenSettings }) => {
  const { 
    room, hand, timerRemaining, roundResultAlert, errorNotification, 
    floatingEmojis, gameOverData, playCard, sendMessage, sendEmoji, leaveRoom, resetGameData
  } = useGameSocket();
  const { user } = useAuth();

  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [sortBy, setSortBy] = useState('suit'); // 'suit' | 'rank'

  const [displayHand, setDisplayHand] = useState([]);

  useEffect(() => {
    if (sortBy !== 'custom') {
      const suitOrder = { 'Spades': 0, 'Hearts': 1, 'Diamonds': 2, 'Clubs': 3 };
      const rankValue = { 
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14 
      };

      const sorted = [...hand].sort((a, b) => {
        if (sortBy === 'suit') {
          if (suitOrder[a.suit] !== suitOrder[b.suit]) {
            return suitOrder[a.suit] - suitOrder[b.suit];
          }
          return rankValue[b.rank] - rankValue[a.rank];
        } else {
          if (rankValue[a.rank] !== rankValue[b.rank]) {
            return rankValue[b.rank] - rankValue[a.rank];
          }
          return suitOrder[a.suit] - suitOrder[b.suit];
        }
      });
      setDisplayHand(sorted);
    } else {
      // Custom reorder logic: preserve order, but remove played cards & append new ones
      const handIds = new Set(hand.map(c => c.id));
      const filteredDisplay = displayHand.filter(c => handIds.has(c.id));
      const displayIds = new Set(filteredDisplay.map(c => c.id));
      const missingCards = hand.filter(c => !displayIds.has(c.id));
      setDisplayHand([...filteredDisplay, ...missingCards]);
    }
  }, [hand, sortBy]);



  const isMobile = typeof window !== 'undefined' && 
    (/Mobi|Android|iPhone|iPad|Macintosh/i.test(navigator.userAgent) || window.innerWidth < 768);
  
  const chatEndRef = useRef(null);

  // Play flip/shuffle sounds on round start
  useEffect(() => {
    if (room?.gameState && room.gameState.playedCards.length === 0 && !roundResultAlert) {
      sounds.playShuffle();
    }
  }, [room?.gameState?.roundStarterId, roundResultAlert]);

  // Warning Sound on low time
  useEffect(() => {
    if (timerRemaining === 5 || timerRemaining === 3) {
      sounds.playTurnWarning();
    }
  }, [timerRemaining]);

  // Play Victory/Lose Sounds on game completion
  useEffect(() => {
    if (gameOverData) {
      if (gameOverData.donkeyId === user?.id) {
        sounds.playLose();
      } else {
        sounds.playVictory();
      }
    }
  }, [gameOverData]);

  // Scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.chatMessages]);

  if (!room || !room.gameState) return null;

  const gameState = room.gameState;
  const isMyTurn = gameState.turnOrder[gameState.activePlayerIndex] === user?.id;

  // Rotate players array clockwise so that the active user is at bottom center (index 0)
  const getRotatedPlayers = () => {
    const playersCopy = [...room.players];
    const userIndex = playersCopy.findIndex(p => p.id === user?.id);
    if (userIndex !== -1) {
      const userPlayer = playersCopy.splice(userIndex, 1)[0];
      playersCopy.unshift(userPlayer); // Insert at index 0
    }
    return playersCopy;
  };

  const rotatedPlayers = getRotatedPlayers();
  const positionSchema = POSITION_SCHEMAS[room.players.length] || POSITION_SCHEMAS[3];

  const getPlayedCardPosition = (playedCardPlayerId) => {
    const playerIdx = rotatedPlayers.findIndex(p => p.id === playedCardPlayerId);
    if (playerIdx === -1) return { left: '50%', top: '50%', transform: 'translate(-50%, -50%) scale(0.55)' };

    const coords = positionSchema[playerIdx] || { left: '50%', top: '80%' };
    const leftVal = parseFloat(coords.left);
    const topVal = parseFloat(coords.top);

    if (playerIdx === 0) {
      return {
        bottom: '22%',
        left: '50%',
        transform: 'translateX(-50%) scale(0.55)'
      };
    }

    if (leftVal < 35) {
      return {
        left: '26%',
        top: '50%',
        transform: 'translateY(-50%) scale(0.55)'
      };
    } else if (leftVal > 65) {
      return {
        right: '26%',
        top: '50%',
        transform: 'translateY(-50%) scale(0.55)'
      };
    } else if (topVal < 30) {
      return {
        top: '22%',
        left: '50%',
        transform: 'translateX(-50%) scale(0.55)'
      };
    }

    return {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) scale(0.55)'
    };
  };

  const handleCardClick = (card) => {
    if (!isMyTurn) return;
    sounds.playClick();
    setSelectedCard(card);
  };

  const handlePlaySelected = () => {
    if (selectedCard) {
      sounds.playCardPlay();
      playCard(selectedCard.id);
      setSelectedCard(null);
    }
  };

  const handleDragPlayCard = (card) => {
    if (!isMyTurn) return;
    if (isCardPlayable(card)) {
      sounds.playCardPlay();
      playCard(card.id);
      setSelectedCard(null);
    }
  };

  const handleReorder = (newOrder) => {
    sounds.playClick();
    setSortBy('custom');
    setDisplayHand(newOrder);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sounds.playCardPlay();
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const triggerEmoji = (emoji) => {
    sounds.playClick();
    sendEmoji(emoji);
    setShowEmojiPicker(false);
  };

  // Card play validation helper
  const isCardPlayable = (card) => {
    if (!isMyTurn) return false;
    
    // STRICT RULE: Very First Card played in the game MUST be Ace of Spades (Spades-A) by the holder
    if (gameState.isFirstRound && gameState.playedCards.length === 0) {
      return card.id === 'Spades-A';
    }

    // Follow Suit Rule: If suit is opened, check if user has active suit.
    // If they do, only allow playing cards of the active suit.
    if (gameState.playedCards.length > 0) {
      const openedSuit = gameState.openedSuit;
      const hasSuit = hand.some(c => c.suit === openedSuit);
      if (hasSuit) {
        return card.suit === openedSuit;
      }
    }

    return true;
  };

  const getAvatarColor = (avatarId) => {
    return AVATARS.find(a => a.id === avatarId)?.color || 'from-amber-500 to-yellow-600';
  };

  // Animated floating celebration/failure particles
  const FloatingGameOverParticles = ({ isVictory }) => {
    const emojis = isVictory 
      ? ['🏆', '👑', '🎉', '💰', '✨', '🤩', '💎']
      : ['🐴', '💩', '😭', '🤡', '🪰', '🥕'];
    
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 20 }).map((_, i) => {
          const emoji = emojis[i % emojis.length];
          const randomX = `${Math.random() * 100}%`;
          const randomDelay = Math.random() * 6;
          const randomDuration = 5 + Math.random() * 6;
          const randomScale = 0.5 + Math.random() * 1.2;

          return (
            <motion.div
              key={i}
              className="absolute text-2xl sm:text-3xl select-none"
              style={{ left: randomX, bottom: '-10%' }}
              initial={{ y: 0, opacity: 0, scale: randomScale }}
              animate={{ 
                y: '-120vh', 
                opacity: [0, 0.8, 0.8, 0],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
              }}
              transition={{
                duration: randomDuration,
                delay: randomDelay,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              {emoji}
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Braying comic donkey speech bubbles for loss screen
  const DonkeySpeechBubbles = () => {
    const bubbles = [
      { text: "HEE-HAW! 🐴", top: "12%", left: "10%", delay: 0 },
      { text: "WHO'S THE KAZHUTHAI? 🤡", top: "25%", right: "8%", delay: 1.5 },
      { text: "GIVE ME CARROTS! 🥕", bottom: "15%", left: "12%", delay: 3 },
      { text: "I LOVE HEE-HAW! 🐴", bottom: "28%", right: "10%", delay: 4.5 }
    ];

    return (
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {bubbles.map((b, i) => (
          <motion.div
            key={i}
            className="absolute bg-white text-slate-900 border border-slate-300 font-extrabold text-[9px] sm:text-xs uppercase tracking-wider rounded-2xl px-3 py-1.5 shadow-md flex items-center justify-center"
            style={{
              top: b.top,
              left: b.left,
              right: b.right,
              bottom: b.bottom
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [0, 1.1, 1, 1, 0],
              opacity: [0, 1, 1, 1, 0]
            }}
            transition={{
              duration: 4,
              delay: b.delay,
              repeat: Infinity,
              repeatDelay: 2
            }}
          >
            {b.text}
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <>


      <div className="w-full min-h-[90vh] flex flex-col gap-6 p-4 animate-fade-in select-none max-w-7xl mx-auto overflow-y-auto">
      
      {/* UPPER ZONE: Table + Sidebar */}
      <div className="w-full flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* MAIN GAME ZONE */}
        <div className="flex-1 flex flex-col relative w-full aspect-[4/3] md:aspect-[16/10] max-h-[60vh] min-h-[380px] md:min-h-[460px] rounded-3xl border border-poker-border shadow-2xl poker-table-bg overflow-visible">
          
          {/* Pulsing screen border glow when active turn */}
          {isMyTurn && !roundResultAlert && (
            <div className="active-turn-screen-glow rounded-3xl" />
          )}
          
          {/* FLOATING HEADER ACTIONS PANEL */}
          <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-auto">
            {/* Left: Settings rules & Surrender */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { sounds.playClick(); leaveRoom(); }}
                className="p-2 bg-black/60 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-red-400 font-bold rounded-full shadow-lg transition-all flex items-center gap-1 text-[9px]"
                title="Surrender & Exit"
              >
                <LogOut size={12} />
                <span className="hidden sm:inline">Surrender</span>
              </button>
              <button
                onClick={() => { sounds.playClick(); onOpenSettings(); }}
                className="p-2 bg-black/60 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-full shadow-lg transition-all flex items-center justify-center"
                title="Table Rules & Info"
              >
                <Settings size={12} />
              </button>
            </div>

            {/* Right: Expandable Social Chat */}
            <button
              onClick={() => { sounds.playClick(); setIsChatOpen(!isChatOpen); }}
              className={`p-2 rounded-full border shadow-lg transition-all flex items-center gap-1 text-[9px] font-black
                ${isChatOpen 
                  ? 'bg-indigo-600 border-indigo-400 text-white animate-pulse' 
                  : 'bg-black/60 border-white/10 text-indigo-400 hover:text-white'
                }`}
            >
              <MessageSquare size={12} />
              <span>Social Hub ({room.chatMessages.length})</span>
            </button>
          </div>

          {/* Table Felt Green Radial Background */}
          <div className="absolute inset-0 rounded-3xl poker-table-bg overflow-hidden flex items-center justify-center pointer-events-none">
          {/* Subtle Card Suits watermark layout on table felt */}
          <div className="absolute inset-0 opacity-[0.02] flex items-center justify-between p-24 text-[120px] pointer-events-none select-none">
            <span>♠</span>
            <span>♥</span>
            <span>♦</span>
          </div>
        </div> {/* CLOSES THE GREEN RADIAL BACKGROUND felt */}

          {/* TABLE CENTER PILE / DROP ZONE (Clean borderless centered container) */}
          <div className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 flex flex-col items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 sm:p-6 z-10 overflow-visible pointer-events-none">
            
            {/* Opened Suit banner */}
            {gameState.openedSuit ? (
              <div className="absolute top-2 sm:top-4 px-3 py-0.5 sm:py-1 bg-black/60 rounded-full border border-white/5 text-[8px] sm:text-[10px] font-black tracking-widest text-indigo-300 flex items-center gap-1 uppercase">
                <span>Opened Suit:</span>
                <span className="text-xs sm:text-sm">{gameState.openedSuit === 'Spades' ? '♠' : gameState.openedSuit === 'Hearts' ? '♥' : gameState.openedSuit === 'Diamonds' ? '♦' : '♣'}</span>
                <span className="hidden sm:inline">({gameState.openedSuit})</span>
              </div>
            ) : (
              <div className="text-[8px] sm:text-[10px] font-bold text-gray-500/80 uppercase tracking-widest text-center">
                Waiting for Lead Play
              </div>
            )}

            {/* Played Cards Pile in Center */}
            <div className="relative w-full h-full flex items-center justify-center overflow-visible">
              {gameState.playedCards.map((pCard, idx) => {
                const cardPosStyle = getPlayedCardPosition(pCard.playerId);
                return (
                  <div 
                    key={pCard.card.id}
                    className="absolute shadow-2xl transition-all duration-300 z-10 animate-fade-in"
                    style={cardPosStyle}
                  >
                    <Card card={pCard.card} playable={false} />
                    {/* Small name bubble on played card */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-950 border border-indigo-500/30 text-white font-bold text-[7px] sm:text-[8px] tracking-wide rounded-full px-1.5 sm:px-2 py-0.5 shadow-md whitespace-nowrap">
                      {pCard.playerName}
                    </div>
                  </div>
                );
              })}

              {gameState.playedCards.length === 0 && (
                <div className="text-center text-gray-600 font-outfit text-[9px] sm:text-xs font-bold leading-relaxed px-4 opacity-50">
                  {gameState.isFirstRound ? 'Play Ace of Spades (♠A) to Start Game' : 'Lead card determines the suit for this trick'}
                </div>
              )}
            </div>

            {/* Turn countdown display (Stacked elegantly under the Opened Suit banner) */}
            {timerRemaining !== null && !roundResultAlert && (
              <div className="absolute top-10 sm:top-14 flex items-center gap-1 bg-black/60 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[10px] font-bold text-yellow-400 border border-white/5 shadow-md">
                <Clock size={10} className={timerRemaining <= 5 ? 'text-red-500 animate-pulse' : ''} />
                <span>Timer: {timerRemaining}s</span>
              </div>
            )}
          </div>

          {/* CIRCULAR ARRANGEMENT OF PLAYERS */}
          {rotatedPlayers.map((player, idx) => {
            const coords = positionSchema[idx] || { left: '50%', top: '50%' };
            const isActive = gameState.turnOrder[gameState.activePlayerIndex] === player.id;
            const isSafe = player.isSafe || false;
            const cardCount = player.cardCount || 0;
            const isSelf = player.id === user?.id;

            // Float emojis over this player
            const emojiObj = floatingEmojis[player.id];

            return (
              <div
                key={player.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group"
                style={{ left: coords.left, top: coords.top }}
              >
                {/* Floating Emoji bubble */}
                {emojiObj && (
                  <div className="absolute -top-12 z-40 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5 text-2xl animate-bounce-slow shadow-xl">
                    {emojiObj.emoji}
                  </div>
                )}

                <div className="relative">
                  {/* Active turn halo glow ring */}
                  {isActive && !isSafe && (
                    <div className="absolute inset-0 -m-1.5 rounded-2xl bg-indigo-500/25 active-glow-ring border-2 border-indigo-500 z-0" />
                  )}

                  {/* Visual Card Back Fan for other players */}
                  {!isSelf && !isSafe && renderCardBackFan(cardCount, coords.left, coords.top)}

                  {/* Player Avatar Box with Emoji inside! */}
                  <div className={`
                    w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr ${getAvatarColor(player.avatar)} flex items-center justify-center text-3xl shadow-lg border border-white/5 relative z-10
                    ${isSafe ? 'opacity-50 grayscale contrast-75' : ''}
                    ${isActive ? 'scale-105 border-indigo-400' : ''}
                    ${player.isConnected === false ? 'opacity-40 grayscale contrast-75' : ''}
                  `}>
                    {AVATARS.find(a => a.id === player.avatar)?.emoji || '🐴'}
                    {player.isConnected === false && (
                      <span className="absolute text-[7px] font-extrabold text-rose-400 bg-black/90 border border-rose-500/30 px-1 py-0.5 rounded bottom-1 left-1/2 -translate-x-1/2 select-none tracking-widest uppercase shadow">
                        Offline
                      </span>
                    )}
                  </div>

                  {/* Host crown icon */}
                  {player.isHost && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-md z-20">
                      👑
                    </div>
                  )}
                </div>

                {/* Name Label banner */}
                <div className="bg-black/60 backdrop-blur-sm border border-white/5 rounded-full px-3 py-0.5 mt-2 text-[9px] font-black text-white text-center max-w-[80px] truncate relative z-10 leading-none">
                  {player.name}
                  {isSelf && ' (You)'}
                </div>

                {/* Safe Status banner */}
                {isSafe && (
                  <div className="absolute -top-3 z-30 bg-emerald-500 text-slate-900 font-extrabold text-[8px] tracking-wider uppercase rounded-full px-2 py-0.5 shadow-md flex items-center gap-0.5 border border-emerald-300">
                    <Award size={8} /> SAFE #{player.exitOrder}
                  </div>
                )}
              </div>
            );
          })}
        
        {/* ERROR ALERTS NOTIFICATION (floating bottom) */}
        {errorNotification && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white font-extrabold text-xs tracking-wide px-6 py-3 rounded-full shadow-2xl animate-shake border border-red-400">
            {errorNotification}
          </div>
        )}

        {/* ROUND RESOLUTION OVERLAY ALERT */}
        {roundResultAlert && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-40 rounded-3xl flex items-center justify-center p-6 animate-fade-in">
            <div className="text-center space-y-6 max-w-md">
              <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest border border-yellow-500/30 rounded-full px-4 py-1.5 bg-yellow-500/5">
                {roundResultAlert.type === 'break' ? '⚡ BREAK RESOLUTION ⚡' : '✨ NORMAL RESOLUTION ✨'}
              </span>

              <h2 className="text-3xl font-black text-white font-outfit mt-4 leading-tight">
                {roundResultAlert.type === 'break' 
                  ? `${roundResultAlert.collectorName} collects cards!`
                  : `Round Cleared!`
                }
              </h2>

              <p className="text-sm text-gray-400">
                {roundResultAlert.type === 'break'
                  ? `${roundResultAlert.collectorName} played the highest card (${roundResultAlert.highestCard}) of the active suit and absorbs all played cards.`
                  : `${roundResultAlert.highestPlayerName} played the highest card (${roundResultAlert.highestCard}) and gets the starting lead!`
                }
              </p>

              {/* Show Played Cards Summary inside overlay */}
              <div className="flex justify-center gap-3 py-4 flex-wrap">
                {roundResultAlert.playedCards.map((pc, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="scale-75 origin-center">
                      <Card card={pc.card} playable={false} />
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 mt-1">{pc.playerName}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-center items-center gap-1.5 text-xs text-gray-500">
                <span>Next round starts in 3 seconds</span>
                <ArrowRight size={14} className="animate-pulse" />
              </div>
            </div>
          </div>
        )}

      </div> {/* CLOSES THE MAIN GAME ZONE */}
    </div> {/* CLOSES THE UPPER ZONE */}

    {/* ------------------------------------------------------------------ */}
    {/* FLOATING SOCIAL SLIDE-OUT DRAWER */}
    {/* ------------------------------------------------------------------ */}
    <div 
      className={`fixed top-0 right-0 h-full w-80 bg-slate-950/95 backdrop-blur-md border-l border-white/10 z-50 p-6 flex flex-col gap-4 shadow-2xl transition-transform duration-300 pointer-events-auto
        ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <span className="flex items-center gap-1.5 text-white font-outfit text-xs font-black tracking-wide uppercase">
          <MessageSquare size={14} className="text-indigo-400" />
          Social Hub
        </span>
        <button 
          onClick={() => { sounds.playClick(); setIsChatOpen(false); }}
          className="p-1 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase"
        >
          ✕ Close
        </button>
      </div>

      {/* Engine Status log (Miniaturized inside Drawer) */}
      <div className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-1">
        <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest block">Engine Status</span>
        <p className="text-[10px] text-gray-300 leading-relaxed font-semibold italic">
          📣 {gameState.lastAction}
        </p>
      </div>

      {/* Emoji Reaction wheel */}
      <div className="space-y-2">
        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block">Express Reactions</span>
        <div className="grid grid-cols-4 gap-1.5">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => triggerEmoji(emoji)}
              className="py-2 text-lg bg-white/5 hover:bg-white/10 rounded-lg transition-all active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Chat stream area */}
      <div className="flex-1 flex flex-col border border-white/5 rounded-xl overflow-hidden min-h-0 bg-white/[0.02]">
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {room.chatMessages.map((msg, idx) => {
            const isSys = msg.sender === 'System';
            return (
              <div 
                key={idx} 
                className={`text-[10px] p-2 rounded-lg border leading-relaxed ${
                  isSys 
                    ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-300 italic text-center font-semibold' 
                    : msg.sender === user?.username 
                      ? 'bg-white/10 border-white/10 self-end ml-4 text-gray-200' 
                      : 'bg-white/5 border-white/5 mr-4 text-gray-300'
                }`}
              >
                {!isSys && <span className="font-black text-indigo-400 block mb-0.5">{msg.sender}</span>}
                <span>{msg.text}</span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={handleSendChat} className="p-2 border-t border-white/5 bg-white/5 flex gap-2">
          <input
            type="text"
            maxLength={100}
            placeholder="Chat..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    </div>
 
      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM AREA: ACTIVE HAND & TURN OPERATIONS */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-4 md:p-6 flex flex-col items-center justify-center mt-2 relative z-30 pointer-events-auto">
        
        {/* Play card execution deck */}
        {selectedCard && isMyTurn && (
          <button
            onClick={handlePlaySelected}
            className="mb-4 btn-gold px-8 py-3 rounded-full flex items-center gap-1.5 shadow-2xl animate-bounce-slow pointer-events-auto font-black text-sm"
          >
            <span>Play {selectedCard.rank} of {selectedCard.suit}</span>
            <ArrowRight size={16} />
          </button>
        )}

        {/* Active Hand Utility Bar */}
        <div className="w-full max-w-lg px-4 flex justify-between items-center mb-4 pointer-events-auto z-20">
          {/* Turn Alert */}
          {isMyTurn && !roundResultAlert ? (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] uppercase tracking-widest rounded-full px-3 py-1 shadow-md animate-pulse">
              <Sparkles size={10} /> YOUR TURN TO PLAY!
            </div>
          ) : (
            <div className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
              Your Cards ({hand.length})
            </div>
          )}

          {/* Sorting Toggles */}
          {hand.length > 0 && (
            <div className="flex items-center gap-2 bg-black/40 border border-white/5 rounded-full p-0.5">
              <button
                onClick={() => { sounds.playClick(); setSortBy('suit'); }}
                className={`px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest transition-all ${
                  sortBy === 'suit'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white font-bold'
                }`}
              >
                Sort by Suit
              </button>
              <button
                onClick={() => { sounds.playClick(); setSortBy('rank'); }}
                className={`px-3 py-1 rounded-full font-black text-[8px] uppercase tracking-widest transition-all ${
                  sortBy === 'rank'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-gray-400 hover:text-white font-bold'
                }`}
              >
                Sort by Rank
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Overlapping Player Hand list (Scroll-Free Fluid Margins) */}
        <div className="w-full flex justify-center items-end relative h-36 sm:h-44 md:h-48 pointer-events-auto mt-2 overflow-visible">
          <Reorder.Group axis="x" values={displayHand} onReorder={handleReorder} className="flex flex-row justify-center items-end px-4 pt-12 pb-4 max-w-full overflow-visible select-none">
            {displayHand.map((card, idx) => {
              const playable = isCardPlayable(card);
              const isSelected = selectedCard?.id === card.id;

              const cardCount = hand.length;
              // Mathematically calculate fluid overlap margin based on screen width and card counts
              // This completely eliminates scrollbars, keeping the cards perfectly fitted to any display size!
              const getDynamicOverlap = () => {
                if (idx === 0) return {};
                const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 640;
                
                // Gentler overlap values so cards are evenly spread and playable!
                let overlap = 0;
                if (cardCount > 12) overlap = isSmallScreen ? -38 : -45;
                else if (cardCount > 8) overlap = isSmallScreen ? -28 : -32;
                else if (cardCount > 5) overlap = isSmallScreen ? -16 : -20;
                else overlap = isSmallScreen ? -8 : -10;

                return { marginLeft: `${overlap}px` };
              };

              return (
                <Reorder.Item 
                  key={card.id} 
                  value={card}
                  layout
                  drag={true}
                  dragSnapToOrigin={true}
                  dragElastic={1}
                  whileDrag={{ scale: 1.1, zIndex: 100, rotate: 5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
                  onDragEnd={(e, info) => {
                    // Check if the user tossed the card upwards to the table (play action)
                    if (playable && info.offset.y < -50) {
                      handleDragPlayCard(card);
                    }
                  }}
                  className="relative transition-all duration-300 origin-bottom hover:z-50 shrink-0 cursor-grab active:cursor-grabbing"
                  style={{
                    ...getDynamicOverlap(),
                    zIndex: isSelected ? 40 : idx + 5
                  }}
                >
                  <Card
                    card={card}
                    disabled={!playable}
                    isSelected={isSelected}
                    onClick={handleCardClick}
                    onDragPlay={handleDragPlayCard}
                  />
                </Reorder.Item>
              );
            })}

            {hand.length === 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg">
                🎉 YOU ARE SAFE! WAITING FOR MATCH OUTCOME...
              </div>
            )}
          </Reorder.Group>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* HILARIOUS KAZHUTHAI (DONKEY) GAME OVER OVERLAY */}
      {/* ------------------------------------------------------------------ */}
      {gameOverData && (() => {
        const isPlayerDonkey = gameOverData.donkeyId === user?.id;
        
        return (
          <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-xl z-50 flex items-center justify-center p-4 overflow-y-auto select-none">
            
            {/* Custom Interactive Floating Particle Canvas */}
            <FloatingGameOverParticles isVictory={!isPlayerDonkey} />
            
            {/* Funny Braying Speach Bubbles only if Loss */}
            {isPlayerDonkey && <DonkeySpeechBubbles />}

            <motion.div 
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="text-center space-y-6 max-w-md w-full p-6 sm:p-8 glass-card rounded-[32px] border border-white/10 shadow-2xl relative z-20 overflow-visible"
            >
              {/* Tilted Funny Rubber Stamp Overlay */}
              <div className="absolute -top-6 -right-6 z-30 select-none animate-bounce-slow">
                {isPlayerDonkey ? (
                  <span className="rubber-stamp stamp-red -rotate-12 font-black text-[10px] tracking-widest">
                    Certified Kazhuthai 🐴
                  </span>
                ) : (
                  <span className="rubber-stamp stamp-green rotate-12 font-black text-[10px] tracking-widest">
                    Donkey Escapist 👑
                  </span>
                )}
              </div>

              {/* Status Header Badge */}
              <div className="flex justify-center">
                <span className={`text-[9px] font-black uppercase tracking-widest rounded-full px-4 py-1.5 border ${
                  isPlayerDonkey 
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  {isPlayerDonkey ? '🐴 ASS HEE-HAW PENALTY 🐴' : '🏆 HUMAN DIGNITY INTACT 🏆'}
                </span>
              </div>

              {/* Central Cartoon Illustration Block */}
              <div className="flex flex-col items-center justify-center py-2 space-y-3 relative">
                
                {isPlayerDonkey ? (
                  // LOSS ILLUSTRATION: Avatar with Donkey Ears & Crying
                  <div className="relative flex items-center justify-center">
                    {/* Animated Donkey ears sitting on avatar */}
                    <motion.span 
                      animate={{ rotate: [-5, 5, -5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-12 -left-12 text-6xl transform origin-bottom-right pointer-events-none select-none"
                    >
                      👂🐴
                    </motion.span>
                    <motion.span 
                      animate={{ rotate: [5, -5, 5] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-12 -right-12 text-6xl transform scale-x-[-1] origin-bottom-left pointer-events-none select-none"
                    >
                      👂🐴
                    </motion.span>
                    
                    <div className="w-24 h-24 rounded-full border-4 border-rose-500/40 p-1 bg-rose-950/20 shadow-xl overflow-hidden active-glow-ring flex items-center justify-center">
                      <span className="text-6xl filter drop-shadow-md animate-pulse">😭</span>
                    </div>
                  </div>
                ) : (
                  // VICTORY ILLUSTRATION: Avatar with Bobbing Floating Crown
                  <div className="relative flex items-center justify-center">
                    {/* Bobbing floating crown above avatar */}
                    <motion.span 
                      animate={{ y: [-15, -8, -15] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute -top-12 text-5xl pointer-events-none select-none filter drop-shadow-[0_4px_8px_rgba(251,191,36,0.5)]"
                    >
                      👑
                    </motion.span>
                    
                    <div className="w-24 h-24 rounded-full border-4 border-emerald-500/40 p-1 bg-emerald-950/20 shadow-xl overflow-hidden active-glow-ring flex items-center justify-center">
                      <span className="text-6xl filter drop-shadow-md">😎</span>
                    </div>
                  </div>
                )}

                {/* Goofy Big Title Banner */}
                <h3 className={`font-outfit text-base sm:text-lg font-black tracking-wide leading-tight ${
                  isPlayerDonkey ? 'text-rose-400' : 'text-yellow-400'
                }`}>
                  {isPlayerDonkey 
                    ? 'YOU ARE THE DESIGNATED DONKEY!' 
                    : 'CONGRATULATIONS, ESCAPIST!'
                  }
                </h3>
              </div>

              {/* Goofy South Indian Donkey Humor Text */}
              <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed px-4">
                {isPlayerDonkey ? (
                  <>
                    Oh, the absolute embarrassment! You held onto your cards like they were valuable family heirlooms. 
                    Now, you've officially been crowned the <strong className="text-rose-400">Kazhuthai (Donkey)</strong> of this lobby! 
                    Please wear your virtual long ears and fluffy tail with pride! HEE-HAW! 🐴
                  </>
                ) : (
                  <>
                    Incredible! You successfully tricked, dumped, and discarded all your cards onto the other fools. 
                    You walk away from this table with your human ears and dignity fully intact. Go celebrate in style! 🍻
                  </>
                )}
              </p>

              {/* Pulsing Coins Transaction Indicator */}
              <div className="flex justify-center py-1">
                <motion.span 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={`text-xs font-black tracking-widest px-6 py-2 rounded-2xl shadow-md border ${
                    isPlayerDonkey 
                      ? 'text-rose-400 bg-rose-500/5 border-rose-500/20 shadow-rose-950/20' 
                      : 'text-yellow-400 bg-yellow-500/5 border-yellow-500/20 shadow-yellow-950/20'
                  }`}
                >
                  {isPlayerDonkey ? '💸 LOSS PENALTY: -50 COINS 💸' : '💰 ESCAPIST REWARD: +150 COINS 💰'}
                </motion.span>
              </div>

              {/* Match Details Stats */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-left space-y-2 text-[10px] sm:text-xs">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-500 font-bold">Winner (1st Escape)</span>
                  <span className="text-emerald-400 font-black">
                    {room.players.find(gp => gp.exitOrder === 1)?.name || 'Unknown'} 🎉
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-500 font-bold">Lobby Size</span>
                  <span className="text-white font-bold">{room.players.length} Active Players</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-bold">Designated Donkey</span>
                  <span className="text-rose-400 font-black">{gameOverData.donkeyName} 🐴</span>
                </div>
              </div>

              {/* Game Over Actions Buttons */}
              <div className="flex gap-4 pt-2">
                <button
                  onClick={() => { sounds.playClick(); leaveRoom(); }}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-black tracking-wider transition-all"
                >
                  Lobby Exit
                </button>
                <button
                  onClick={() => { sounds.playClick(); resetGameData(); }}
                  className={`flex-1 text-xs py-3 px-4 rounded-xl font-black tracking-wider shadow-lg active:scale-95 transition-all ${
                    isPlayerDonkey 
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-red-500/20' 
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-emerald-500/20'
                  }`}
                >
                  Replay Lobby
                </button>
              </div>

            </motion.div>
          </div>
        );
      })()}

    </div>
    </>
  );
};
