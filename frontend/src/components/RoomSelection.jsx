import React, { useState, useEffect } from 'react';
import { useGameSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/soundManager';
import { Search, Plus, Radio, Key, RefreshCw, LogIn, Users, Sparkles } from 'lucide-react';

export const RoomSelection = () => {
  const { createRoom, joinRoom } = useGameSocket();
  const { API_URL } = useAuth();
  
  const [roomCode, setRoomCode] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('join'); // 'join' | 'create' | 'browse'

  const fetchPublicRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/rooms`);
      const data = await res.json();
      if (data.success) {
        setPublicRooms(data.rooms);
      }
    } catch (err) {
      console.error("Error loading public rooms", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'browse') {
      fetchPublicRooms();
    }
  }, [activeTab]);

  const handleCreate = (isPrivate) => {
    sounds.playClick();
    createRoom(isPrivate);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    sounds.playClick();
    if (roomCode.length === 6) {
      joinRoom(roomCode);
    }
  };

  return (
    <div className="w-full max-w-lg p-8 glass-card rounded-3xl shadow-2xl relative border border-white/10 animate-fade-in flex flex-col min-h-[500px]">
      {/* Decorative center icon */}
      <div className="flex justify-center mb-6">
        <div className="bg-indigo-500/10 rounded-2xl p-4 border border-indigo-500/20">
          <Radio size={36} className="text-indigo-400 animate-pulse-slow" />
        </div>
      </div>

      <h2 className="text-3xl font-black text-center text-white mb-2 font-outfit">
        Play Multiplayer
      </h2>
      <p className="text-sm text-gray-400 text-center mb-8">
        Create a custom lobby, join a public room, or invite friends by room code.
      </p>

      {/* Tabs */}
      <div className="flex bg-white/5 rounded-2xl p-1 mb-8 border border-white/5">
        <button
          onClick={() => { sounds.playClick(); setActiveTab('join'); }}
          className={`flex-1 py-3 text-xs font-black tracking-wider uppercase rounded-xl transition-all duration-300 ${
            activeTab === 'join' 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Join Room
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('create'); }}
          className={`flex-1 py-3 text-xs font-black tracking-wider uppercase rounded-xl transition-all duration-300 ${
            activeTab === 'create' 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Create Room
        </button>
        <button
          onClick={() => { sounds.playClick(); setActiveTab('browse'); }}
          className={`flex-1 py-3 text-xs font-black tracking-wider uppercase rounded-xl transition-all duration-300 ${
            activeTab === 'browse' 
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Browse
        </button>
      </div>

      {/* Content panes */}
      <div className="flex-1 flex flex-col justify-center">
        {activeTab === 'join' && (
          <form onSubmit={handleJoin} className="space-y-5 animate-fade-in">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Room Access Code</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Key size={18} /></span>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="ENTER 6-DIGIT CODE (E.G. AB35EF)"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full pl-12 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-outfit text-center font-black tracking-widest text-lg"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={roomCode.length !== 6}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2"
            >
              <LogIn size={18} />
              <span>Connect to Room</span>
            </button>
          </form>
        )}

        {activeTab === 'create' && (
          <div className="space-y-4 animate-fade-in">
            <button
              onClick={() => handleCreate(false)}
              className="w-full p-5 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 rounded-2xl flex items-center justify-between transition-all group text-left"
            >
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-1.5 leading-tight">
                  Public Room <Sparkles size={14} className="text-yellow-400" />
                </h3>
                <p className="text-xs text-gray-400 mt-1">Allows any player from the browser search to find and join.</p>
              </div>
              <Plus size={20} className="text-gray-400 group-hover:text-white transition-all" />
            </button>

            <button
              onClick={() => handleCreate(true)}
              className="w-full p-5 bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 rounded-2xl flex items-center justify-between transition-all group text-left"
            >
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-1.5 leading-tight">
                  Private Room <Key size={14} className="text-gray-400" />
                </h3>
                <p className="text-xs text-gray-400 mt-1">Joinable only by sending the secret 6-digit access code.</p>
              </div>
              <Plus size={20} className="text-gray-400 group-hover:text-white transition-all" />
            </button>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="flex-1 flex flex-col space-y-4 animate-fade-in">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              <span>Available Public Lobbies</span>
              <button 
                onClick={() => { sounds.playClick(); fetchPublicRooms(); }}
                disabled={loading}
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
              >
                <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
              </button>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[250px] space-y-2 pr-1">
              {publicRooms.map((r) => (
                <div 
                  key={r.code}
                  className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <Users size={18} />
                    </div>
                    <div>
                      <h4 className="font-black text-white text-sm font-outfit leading-tight">Host: {r.creatorName}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Code: {r.code} | {r.playerCount}/6 Players</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { sounds.playClick(); joinRoom(r.code); }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-95"
                  >
                    Join
                  </button>
                </div>
              ))}

              {publicRooms.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-500 text-xs">
                  No public lobbies found. Create one to get started!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
