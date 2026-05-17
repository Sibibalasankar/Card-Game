import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGameSocket } from '../context/SocketContext';
import { sounds } from '../utils/soundManager';
import { AuthPanel } from './AuthPanel';
import { RoomSelection } from './RoomSelection';
import { LobbyPanel } from './LobbyPanel';
import { GameBoard } from './GameBoard';
import { LeaderboardPanel } from './LeaderboardPanel';
import { ProfilePanel } from './ProfilePanel';
import { SettingsPanel } from './SettingsPanel';
import { 
  Trophy, User, Settings, Info, Coins, Flame, LogOut,
  Play, Users, Sparkles, BookOpen, Volume2, VolumeX, ShieldAlert
} from 'lucide-react';

export const MainMenu = () => {
  const { user, logout } = useAuth();
  const { room } = useGameSocket();

  const [activeOverlay, setActiveOverlay] = useState(null); // 'leaderboard' | 'profile' | 'settings'

  const handleOpenOverlay = (overlayName) => {
    sounds.playClick();
    setActiveOverlay(overlayName);
  };

  const handleCloseOverlay = () => {
    sounds.playClick();
    setActiveOverlay(null);
  };

  const getAvatarEmoji = (avatarId) => {
    switch(avatarId) {
      case 'avatar_2': return '♠️';
      case 'avatar_3': return '♥️';
      case 'avatar_4': return '♦️';
      case 'avatar_5': return '♣️';
      case 'avatar_6': return '🦈';
      default: return '🐴';
    }
  };

  // RENDER PATH 1: GAME BOARD TABLE (ACTIVE MATCHPLAYING)
  if (room && room.status === 'playing') {
    return (
      <div className="min-h-screen w-full flex flex-col bg-poker-dark text-white virtual-landscape-lock">
        {/* Authoritative Game Header */}
        <header className="p-4 bg-black/60 border-b border-white/5 flex items-center justify-between z-40 select-none">
          <div className="flex items-center gap-3">
            <span className="text-2xl filter drop-shadow-md">🐴</span>
            <div>
              <h1 className="font-outfit font-black tracking-wide text-lg text-white">KAZHUTHAI</h1>
              <p className="text-[10px] text-gray-500 font-bold leading-none">Traditional South Indian Cards Game</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Quick stats in game */}
            <div className="hidden md:flex items-center gap-3 text-xs bg-white/5 px-4 py-1.5 rounded-full border border-white/5 font-semibold text-gray-300">
              <span className="flex items-center gap-1"><Users size={12} /> Room: {room.code}</span>
              <span className="text-gray-600">|</span>
              <span className="flex items-center gap-1 text-yellow-400"><Coins size={12} /> {user?.coins} Gold</span>
            </div>
            
            <button 
              onClick={() => handleOpenOverlay('settings')}
              className="p-2 hover:bg-white/5 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-all"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center relative">
          <GameBoard onOpenSettings={() => handleOpenOverlay('settings')} />
        </main>

        <SettingsPanel isOpen={activeOverlay === 'settings'} onClose={handleCloseOverlay} />
      </div>
    );
  }

  // RENDER PATH 2: LOBBY PANEL (WAITING ROOM)
  if (room && room.status === 'lobby') {
    return (
      <div className="min-h-screen w-full flex flex-col justify-between bg-custom-dark p-4 md:p-6 text-white">
        <header className="flex items-center justify-between max-w-5xl w-full mx-auto mb-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🐴</span>
            <div>
              <h1 className="font-outfit font-black tracking-wider text-xl text-white">KAZHUTHAI</h1>
              <p className="text-[10px] text-gray-500 font-bold">Traditional South Indian Cards Game</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenOverlay('settings')}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <Settings size={18} />
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <LobbyPanel />
        </main>

        <footer className="text-center text-[10px] text-gray-600 py-4 max-w-5xl w-full mx-auto border-t border-white/5 mt-6">
          Kazhuthai Multiplayer Server | Authoritative Engine Active.
        </footer>

        <SettingsPanel isOpen={activeOverlay === 'settings'} onClose={handleCloseOverlay} />
      </div>
    );
  }

  // RENDER PATH 3: SPLASH SCREEN (NOT AUTHENTICATED)
  if (!user) {
    return (
      <div className="min-h-screen w-full bg-radial-dark flex flex-col justify-between p-6 md:p-8 text-white relative overflow-hidden select-none">
        
        {/* Background ambient glow bubbles */}
        <div className="absolute top-24 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Header info */}
        <header className="flex items-center justify-between max-w-6xl w-full mx-auto relative z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl filter drop-shadow-md">🐴</span>
            <div>
              <h1 className="font-outfit font-black tracking-wider text-xl text-white">KAZHUTHAI</h1>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Donkey Cards Game</p>
            </div>
          </div>
          <span className="inline-block text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
            Strictly Human Multiplayer
          </span>
        </header>

        {/* Main Columns Grid */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl w-full mx-auto relative z-10 py-8 lg:py-0">
          {/* Left Text Intro Deck */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left pr-0 lg:pr-8">
            <span className="inline-block text-xs font-black uppercase text-indigo-400 tracking-widest leading-none bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              TRADITIONAL SOUTH INDIAN CLASSIC
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white font-outfit leading-tight tracking-wide">
              Eliminate Cards.<br />
              Avoid the Donkey.<br />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 bg-clip-text text-transparent">Be Safe First.</span>
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Experience the fast-paced traditional card game played by millions. Face off in live multiplayer lobbies, follow the suit strictly, trigger tactical Suit Breaks to corner your opponents, and survive empty-handed.
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-gray-400">
                <Sparkles size={16} className="text-yellow-400" />
                <span>Authoritative anti-cheat engine</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-2xl px-4 py-2.5 text-xs text-gray-400">
                <BookOpen size={16} className="text-indigo-400" />
                <span>Rich Real-time Web Audio Synthesizer</span>
              </div>
            </div>
          </div>

          {/* Right Auth Portal */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <AuthPanel />
          </div>
        </main>

        <footer className="text-center text-[10px] text-gray-600 py-4 max-w-6xl w-full mx-auto border-t border-white/5 relative z-10 flex flex-col md:flex-row justify-between items-center gap-2">
          <span>© 2026 Kazhuthai Card Arena. Pure human matchups. No AI bots allowed.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-400">Terms of Play</a>
            <a href="#" className="hover:text-gray-400">Privacy Policy</a>
          </div>
        </footer>
      </div>
    );
  }

  // RENDER PATH 4: MAIN INTERACTIVE PLAYER DASHBOARD (LOGGED IN)
  return (
    <div className="min-h-screen w-full bg-radial-dark flex flex-col justify-between p-6 md:p-8 text-white relative overflow-hidden select-none">
      
      {/* Background ambient glow bubbles */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header menu */}
      <header className="flex items-center justify-between max-w-6xl w-full mx-auto relative z-10 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl filter drop-shadow-md">🐴</span>
          <div>
            <h1 className="font-outfit font-black tracking-wider text-xl text-white">KAZHUTHAI</h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Donkey Card Arena</p>
          </div>
        </div>

        {/* Player Wallet Status header */}
        <div className="flex items-center gap-2.5">
          <div className="bg-white/5 border border-white/5 px-4 py-2 rounded-2xl hidden md:flex items-center gap-4 text-xs font-bold text-gray-300 shadow-sm">
            <span className="flex items-center gap-1.5 text-yellow-400">
              <Coins size={14} /> {user.coins || 1000} Gold
            </span>
            <span className="text-gray-700">|</span>
            <span className="flex items-center gap-1.5 text-indigo-400">
              <Flame size={14} /> {user.xp || 0} XP
            </span>
          </div>

          <button 
            onClick={() => handleOpenOverlay('settings')}
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all shadow"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Main Action Hub */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl w-full mx-auto relative z-10 py-8 lg:py-0">
        
        {/* Left Welcome panel */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          {/* Greeting */}
          <div className="space-y-2">
            <span className="inline-block text-xs font-black uppercase text-indigo-400 tracking-widest leading-none bg-indigo-500/10 px-4 py-1.5 rounded-full border border-indigo-500/20">
              WELCOME BACK, CONTENDER!
            </span>
            <h2 className="text-4xl md:text-5xl font-black text-white font-outfit tracking-wide flex flex-col md:flex-row items-center justify-center lg:justify-start gap-2.5">
              <span>Ready to Play,</span>
              <span className="text-indigo-400 font-black">{user.username}!</span>
            </h2>
          </div>

          {/* Quick stats card */}
          <div className="grid grid-cols-3 gap-3 p-5 bg-white/5 border border-white/5 rounded-2xl text-left max-w-md mx-auto lg:mx-0">
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Matches</span>
              <span className="text-lg font-black text-white font-outfit">{user.matchesPlayed || 0}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Won</span>
              <span className="text-lg font-black text-emerald-400 font-outfit">{user.matchesWon || 0}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Donkeys</span>
              <span className="text-lg font-black text-rose-400 font-outfit">{user.kazhuthaiCount || 0}</span>
            </div>
          </div>

          {/* Settings / Profile Navigation Shortcuts Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md mx-auto lg:mx-0">
            <button
              onClick={() => handleOpenOverlay('profile')}
              className="py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <User size={14} className="text-indigo-400" /> Player Profile
            </button>
            <button
              onClick={() => handleOpenOverlay('leaderboard')}
              className="py-3.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/20 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 shadow"
            >
              <Trophy size={14} className="text-yellow-400" /> Leaderboard
            </button>
          </div>
        </div>

        {/* Right Play Lobby / Room Selection */}
        <div className="lg:col-span-6 flex justify-center lg:justify-end">
          <RoomSelection />
        </div>
      </main>

      {/* Footer social logouts */}
      <footer className="text-center text-[10px] text-gray-600 py-4 max-w-6xl w-full mx-auto border-t border-white/5 relative z-10 flex flex-col md:flex-row justify-between items-center gap-2">
        <span>© 2026 Kazhuthai Card Arena. Authoritative state synchronization enabled.</span>
        <button
          onClick={() => { sounds.playClick(); logout(); }}
          className="flex items-center gap-1 text-gray-500 hover:text-red-400 font-bold transition-all text-xs"
        >
          <LogOut size={12} /> Log Out Session
        </button>
      </footer>

      {/* OVERLAY PANEL MODALS */}
      <LeaderboardPanel isOpen={activeOverlay === 'leaderboard'} onClose={handleCloseOverlay} />
      <ProfilePanel isOpen={activeOverlay === 'profile'} onClose={handleCloseOverlay} />
      <SettingsPanel isOpen={activeOverlay === 'settings'} onClose={handleCloseOverlay} />

    </div>
  );
};
