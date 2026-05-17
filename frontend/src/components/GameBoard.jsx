import React, { useState, useEffect, useRef } from 'react';
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

// Coordinates for Circular Player Arrangement
// Coordinates represent percentage positions [left, top] centered on the velvet table
// Index 0 represents the active user at the bottom center.
const POSITION_SCHEMAS = {
  3: [
    { left: '50%', top: '85%' },  // Player 0 (Bottom Center)
    { left: '15%', top: '25%' },  // Player 1 (Top Left)
    { left: '85%', top: '25%' }   // Player 2 (Top Right)
  ],
  4: [
    { left: '50%', top: '85%' },  // Player 0 (Bottom Center)
    { left: '10%', top: '45%' },  // Player 1 (Middle Left)
    { left: '50%', top: '10%' },  // Player 2 (Top Center)
    { left: '90%', top: '45%' }   // Player 3 (Middle Right)
  ],
  5: [
    { left: '50%', top: '85%' },  // Player 0 (Bottom Center)
    { left: '10%', top: '55%' },  // Player 1 (Left)
    { left: '25%', top: '15%' },  // Player 2 (Top Left)
    { left: '75%', top: '15%' },  // Player 3 (Top Right)
    { left: '90%', top: '55%' }   // Player 4 (Right)
  ],
  6: [
    { left: '50%', top: '85%' },  // Player 0 (Bottom Center)
    { left: '10%', top: '55%' },  // Player 1 (Bottom Left)
    { left: '15%', top: '20%' },  // Player 2 (Top Left)
    { left: '50%', top: '10%' },  // Player 3 (Top Center)
    { left: '85%', top: '20%' },  // Player 4 (Top Right)
    { left: '90%', top: '55%' }   // Player 5 (Bottom Right)
  ]
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

  return (
    <div className="w-full min-h-[92vh] flex flex-col lg:flex-row gap-6 p-4 animate-fade-in select-none relative overflow-x-hidden">
      
      {/* ------------------------------------------------------------------ */}
      {/* MAIN GAME ZONE */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col relative min-h-[500px] lg:min-h-0">
        
        {/* Table Felt Green Radial Background */}
        <div className="absolute inset-0 rounded-3xl border border-poker-border shadow-2xl poker-table-bg overflow-hidden flex items-center justify-center">
          {/* Subtle Card Suits watermark layout on table felt */}
          <div className="absolute inset-0 opacity-[0.02] flex items-center justify-between p-24 text-[120px] pointer-events-none select-none">
            <span>♠</span>
            <span>♥</span>
            <span>♦</span>
            <span>♣</span>
          </div>

          {/* TABLE CENTER PILE / DROP ZONE */}
          <div className="w-60 h-60 md:w-72 md:h-72 rounded-full border border-dashed border-emerald-500/30 flex flex-col items-center justify-center relative p-6 bg-emerald-950/40 shadow-inner">
            
            {/* Opened Suit banner */}
            {gameState.openedSuit ? (
              <div className="absolute top-4 px-3 py-1 bg-black/60 rounded-full border border-white/5 text-[10px] font-black tracking-widest text-indigo-300 flex items-center gap-1 uppercase">
                <span>Opened Suit:</span>
                <span className="text-sm">{gameState.openedSuit === 'Spades' ? '♠' : gameState.openedSuit === 'Hearts' ? '♥' : gameState.openedSuit === 'Diamonds' ? '♦' : '♣'}</span>
                <span>({gameState.openedSuit})</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-gray-500/80 uppercase tracking-widest text-center">
                Waiting for Lead Play
              </div>
            )}

            {/* Played Cards Pile in Center */}
            <div className="relative w-full h-full flex items-center justify-center">
              {gameState.playedCards.map((pCard, idx) => {
                const rotation = (idx * 20) - 20; // Fan out in pile slightly
                return (
                  <div 
                    key={pCard.card.id}
                    className="absolute shadow-2xl transition-all duration-300 scale-90"
                    style={{
                      transform: `rotate(${rotation}deg) translate(${idx * 10}px, ${idx * 5}px)`,
                      zIndex: idx + 5
                    }}
                  >
                    <Card card={pCard.card} playable={false} />
                    {/* Small avatar circle on played card */}
                    <div className="absolute -bottom-2 -right-2 bg-indigo-600 text-white font-bold text-[8px] tracking-wide rounded-full px-2 py-0.5 border border-white/20 shadow">
                      {pCard.playerName}
                    </div>
                  </div>
                );
              })}

              {gameState.playedCards.length === 0 && (
                <div className="text-center text-gray-600 font-outfit text-xs font-bold leading-relaxed px-4 opacity-50">
                  {gameState.isFirstRound ? 'Play Ace of Spades (♠A) to Start Game' : 'Lead card determines the suit for this trick'}
                </div>
              )}
            </div>

            {/* Turn countdown display */}
            {timerRemaining !== null && !roundResultAlert && (
              <div className="absolute bottom-4 flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full text-[10px] font-bold text-yellow-400">
                <Clock size={12} className={timerRemaining <= 5 ? 'text-red-500 animate-pulse' : ''} />
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

                  {/* Player Avatar Box */}
                  <div className={`
                    w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-tr ${getAvatarColor(player.avatar)} flex items-center justify-center text-3xl shadow-lg border border-white/5 relative z-10
                    ${isSafe ? 'opacity-50 grayscale contrast-75' : ''}
                    ${isActive ? 'scale-105 border-indigo-400' : ''}
                  `} />

                  {/* Card count bubble */}
                  {!isSafe && (
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white font-black text-[9px] w-5 h-5 flex items-center justify-center rounded-full border border-white/20 shadow z-20 font-outfit">
                      {cardCount}
                    </div>
                  )}

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
                    <Award size={8} /> SAFE #{gameStatePlayer?.exitOrder}
                  </div>
                )}
              </div>
            );
          })}
        </div>

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

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR ZONE: CHAT + ACTIONS + SOCIAL CONTROLS */}
      {/* ------------------------------------------------------------------ */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        
        {/* Game Log Info panel */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-400 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1"><Info size={12} /> ENGINE STATUS</span>
            <button 
              onClick={() => { sounds.playClick(); onOpenSettings(); }}
              className="p-1 hover:bg-white/5 rounded text-gray-400 hover:text-white"
            >
              <Settings size={14} />
            </button>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed font-semibold italic">
            📣 {gameState.lastAction}
          </p>
        </div>

        {/* EMOJI REACTION QUICK WHEEL */}
        <div className="glass-card rounded-2xl p-4 border border-white/5 space-y-3">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Express Reactions</span>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => triggerEmoji(emoji)}
                className="py-2.5 text-xl bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* IN-GAME SOCIAL CHAT WINDOW */}
        <div className="glass-card rounded-2xl border border-white/5 flex flex-col h-[280px] overflow-hidden">
          <div className="p-3 border-b border-white/5 flex items-center gap-1.5 text-white font-outfit text-xs font-black tracking-wide bg-white/5">
            <MessageSquare size={14} className="text-indigo-400" />
            <span>Table Chat Stream</span>
          </div>

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

          <form onSubmit={handleSendChat} className="p-2.5 border-t border-white/5 bg-white/5 flex gap-2">
            <input
              type="text"
              maxLength={100}
              placeholder="Chat..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-[10px] text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
            >
              <Send size={12} />
            </button>
          </form>
        </div>

        {/* Leave Table Button */}
        <button
          onClick={() => { sounds.playClick(); leaveRoom(); }}
          className="w-full py-3.5 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 text-red-400 font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-1.5"
        >
          <LogOut size={14} />
          <span>Surrender & Exit</span>
        </button>

      </div>

      {/* ------------------------------------------------------------------ */}
      {/* BOTTOM AREA: ACTIVE HAND & TURN OPERATIONS */}
      {/* ------------------------------------------------------------------ */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-30 pointer-events-none flex flex-col items-center">
        
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

        {/* Turn alerts */}
        {isMyTurn && !selectedCard && !roundResultAlert && (
          <div className="mb-4 bg-indigo-600 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-full px-4 py-1.5 border border-indigo-400 shadow-lg pointer-events-auto animate-pulse">
            ⚡ IT IS YOUR TURN! CHOOSE A VALID CARD ⚡
          </div>
        )}

        {/* Fanned Player hand area */}
        <div className="w-full max-w-4xl flex justify-center items-end relative h-36 md:h-40 pointer-events-auto mt-6">
          <div className="flex gap-1.5 items-end justify-center px-4 max-w-full overflow-x-auto pb-4 overflow-y-visible pr-6">
            {hand.map((card, idx) => {
              const playable = isCardPlayable(card);
              const isSelected = selectedCard?.id === card.id;

              return (
                <div 
                  key={card.id} 
                  className="shrink-0 transition-transform origin-bottom"
                >
                  <Card
                    card={card}
                    disabled={!playable}
                    isSelected={isSelected}
                    onClick={handleCardClick}
                    customStyles="-mt-8"
                  />
                </div>
              );
            })}

            {hand.length === 0 && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-center shadow-lg">
                🎉 YOU ARE SAFE! WAITING FOR MATCH OUTCOME...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* KAZHUTHAI DONKEY PUNISHMENT GAME OVER OVERLAY */}
      {/* ------------------------------------------------------------------ */}
      {gameOverData && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
          <div className="text-center space-y-6 max-w-md p-8 glass-card rounded-3xl border border-white/10 shadow-2xl relative">
            <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest border border-rose-500/30 rounded-full px-4 py-1.5 bg-rose-500/5">
              🐴 MATCH OVER 🐴
            </span>

            {/* Donkey cartoon animation placeholder */}
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <span className="text-8xl filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] animate-bounce-slow">🐴</span>
              <div className="font-outfit text-xs text-rose-400 font-extrabold tracking-widest uppercase border border-dashed border-rose-500/20 rounded-xl px-6 py-2.5 bg-rose-950/20">
                {gameOverData.donkeyName === user?.username ? 'YOU LOST! YOU ARE THE KAZHUTHAI!' : `${gameOverData.donkeyName} IS THE KAZHUTHAI!`}
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed px-2">
              {gameOverData.donkeyName === user?.username 
                ? "Oh no! You ended up holding cards when everyone else got safe. You are the legendary South Indian Donkey for this match! You've lost 50 Coins."
                : `Awesome! You escaped successfully. ${gameOverData.donkeyName} got cornered with cards and became the Donkey. You've earned XP and Coin rewards!`
              }
            </p>

            {/* Final Match Stats */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-500 font-bold">Winner (1st Safe)</span>
                <span className="text-emerald-400 font-black">
                  {room.players.find(gp => gp.exitOrder === 1)?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1">
                <span className="text-gray-500 font-bold">Lobby Size</span>
                <span className="text-white font-bold">{room.players.length} Players</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold">Match Donkey</span>
                <span className="text-rose-400 font-black">{gameOverData.donkeyName} 🐴</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={() => { sounds.playClick(); leaveRoom(); }}
                className="flex-1 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold transition-all"
              >
                Return to Menu
              </button>
              <button
                onClick={() => { sounds.playClick(); resetGameData(); }}
                className="flex-1 btn-primary text-xs py-3.5"
              >
                Replay Lobby
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
