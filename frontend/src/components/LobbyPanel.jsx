import React, { useState, useRef, useEffect } from 'react';
import { useGameSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/soundManager';
import { Copy, CheckCircle, Clock, Play, LogOut, Send, MessageSquare } from 'lucide-react';
import { AVATARS } from '../utils/constants';

export const LobbyPanel = () => {
  const { room, toggleReady, startGame, leaveRoom, sendMessage } = useGameSocket();
  const { user } = useAuth();
  
  const [chatInput, setChatInput] = useState('');
  const [copyToast, setCopyToast] = useState(false);
  const chatEndRef = useRef(null);

  // Scroll chat to bottom automatically
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [room?.chatMessages]);

  if (!room) return null;

  const currentLocalPlayer = room.players.find(p => p.id === user?.id);
  const isHost = currentLocalPlayer?.isHost || false;
  const isReady = currentLocalPlayer?.isReady || false;

  const handleCopyCode = () => {
    sounds.playClick();
    navigator.clipboard.writeText(room.code);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sounds.playCardPlay(); // Subtle paper flick on message send
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const getAvatarEmoji = (avatarId) => {
    return AVATARS.find(a => a.id === avatarId)?.emoji || '🐴';
  };

  const getAvatarColor = (avatarId) => {
    return AVATARS.find(a => a.id === avatarId)?.color || 'from-amber-500 to-yellow-600';
  };

  // Validation: minimum 3 players, maximum 6 players, everyone ready except host
  const playersCount = room.players.length;
  const canStart = playersCount >= 3 && playersCount <= 6 && room.players.filter(p => !p.isHost).every(p => p.isReady);

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-3 gap-6 p-4 md:p-8 animate-fade-in max-h-[92vh] overflow-y-auto lg:overflow-visible">
      
      {/* LEFT COLUMN: PLAYER ROSTER */}
      <div className="lg:col-span-2 flex flex-col space-y-6">
        {/* Room Info Header */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">MULTIPLAYER LOBBY</span>
            <h2 className="text-2xl font-black text-white font-outfit mt-1 flex items-center gap-2">
              Room Code: <span className="text-indigo-400 select-all tracking-wider">{room.code}</span>
              <button 
                onClick={handleCopyCode}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
              >
                <Copy size={16} />
              </button>
            </h2>
            {copyToast && (
              <span className="text-[10px] text-emerald-400 font-bold mt-1 block animate-bounce-slow">Copied successfully!</span>
            )}
          </div>
          
          <div className="text-right">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block leading-none">CAPACITY</span>
            <span className="text-xl font-black text-indigo-400 font-outfit">{playersCount}/6 Players</span>
          </div>
        </div>

        {/* Player Roster Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {/* Active Players */}
          {room.players.map((player) => {
            const avatar = AVATARS.find(a => a.id === player.avatar) || AVATARS[0];
            return (
              <div 
                key={player.id}
                className={`glass-card p-5 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                  player.isReady 
                    ? 'border-emerald-500/20 bg-emerald-500/5' 
                    : player.isHost 
                      ? 'border-indigo-500/20 bg-indigo-500/5' 
                      : 'border-white/5 bg-white/5'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-tr ${getAvatarColor(player.avatar)} flex items-center justify-center text-3xl shadow-lg border border-white/5`} />
                  <div>
                    <h3 className="font-black text-white text-base font-outfit leading-tight flex items-center gap-1.5">
                      {player.name}
                      {player.id === user?.id && <span className="text-[10px] text-gray-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">(You)</span>}
                    </h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">{avatar.name}</p>
                    
                    {player.isHost && (
                      <span className="inline-block text-[8px] font-bold tracking-wider text-indigo-400 border border-indigo-500/30 rounded bg-indigo-500/10 px-1.5 py-0.5 mt-1">HOST</span>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div>
                  {player.isHost ? (
                    <div className="flex items-center gap-1 text-xs text-indigo-400 font-bold">
                      👑 Active
                    </div>
                  ) : player.isReady ? (
                    <div className="flex items-center gap-1 text-xs text-emerald-400 font-bold">
                      <CheckCircle size={14} /> Ready
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-gray-500 font-bold">
                      <Clock size={14} className="animate-pulse" /> Waiting
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Placeholders for unfilled slots */}
          {Array.from({ length: 6 - playersCount }).map((_, idx) => (
            <div 
              key={`empty-${idx}`}
              className="border border-dashed border-white/10 rounded-2xl p-5 flex items-center justify-center h-[96px] text-gray-600 select-none text-xs font-bold uppercase tracking-wider"
            >
              Waiting for player...
            </div>
          ))}
        </div>

        {/* Lobby Action Controls */}
        <div className="flex gap-4">
          <button
            onClick={() => { sounds.playClick(); leaveRoom(); }}
            className="flex-1 py-4 rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 text-gray-400 hover:text-red-400 font-bold transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={16} />
            <span>Abandon Lobby</span>
          </button>

          {!isHost ? (
            <button
              onClick={() => { sounds.playClick(); toggleReady(); }}
              className={`flex-2 py-4 rounded-2xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                isReady 
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
              }`}
            >
              <CheckCircle size={16} />
              <span>{isReady ? 'Unready Lobby' : 'Ready Up!'}</span>
            </button>
          ) : (
            <button
              onClick={() => { sounds.playClick(); startGame(); }}
              disabled={!canStart}
              className={`flex-2 py-4 rounded-2xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                canStart 
                  ? 'btn-gold shadow-lg animate-gold-shine' 
                  : 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
              }`}
            >
              <Play size={16} />
              <span>Launch Match</span>
            </button>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHAT PANEL */}
      <div className="glass-card rounded-3xl border border-white/10 flex flex-col h-[400px] lg:h-[520px] overflow-hidden">
        {/* Chat Title */}
        <div className="p-4 border-b border-white/10 flex items-center gap-2 text-white font-outfit font-black tracking-wide bg-white/5">
          <MessageSquare size={16} className="text-indigo-400" />
          <span>Lobby Chat Room</span>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {room.chatMessages.map((msg, idx) => {
            const isSys = msg.sender === 'System';
            return (
              <div 
                key={idx} 
                className={`text-xs p-2.5 rounded-xl border leading-relaxed ${
                  isSys 
                    ? 'bg-indigo-500/5 border-indigo-500/10 text-indigo-300 italic text-center font-semibold' 
                    : msg.sender === user?.username 
                      ? 'bg-white/10 border-white/10 self-end ml-6 text-gray-200' 
                      : 'bg-white/5 border-white/5 mr-6 text-gray-300'
                }`}
              >
                {!isSys && <span className="font-black text-indigo-400 block mb-0.5">{msg.sender}</span>}
                <span>{msg.text}</span>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input form */}
        <form onSubmit={handleSendChat} className="p-4 border-t border-white/10 bg-white/5 flex gap-2">
          <input
            type="text"
            maxLength={100}
            placeholder="Type chat message..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all shadow hover:shadow-indigo-500/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

    </div>
  );
};
