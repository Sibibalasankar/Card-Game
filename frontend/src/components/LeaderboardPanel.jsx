import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/soundManager';
import { Trophy, RefreshCw, X, ShieldAlert, Sparkles } from 'lucide-react';
import { AVATARS } from '../utils/constants';

export const LeaderboardPanel = ({ isOpen, onClose }) => {
  const { API_URL } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/leaderboard`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard);
      } else {
        setError('Failed to load leaderboard data.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection to server failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLeaderboard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getAvatarEmoji = (avatarId) => {
    return AVATARS.find(a => a.id === avatarId)?.emoji || '🐴';
  };

  const getAvatarColor = (avatarId) => {
    return AVATARS.find(a => a.id === avatarId)?.color || 'from-amber-500 to-yellow-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl overflow-hidden glass-card rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white font-outfit tracking-wide flex items-center gap-2">
            🏆 Hall of Fame
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { sounds.playClick(); fetchLeaderboard(); }}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => { sounds.playClick(); onClose(); }}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-400 text-center flex items-center justify-center gap-2">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading ranking records...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Podium for top 3 */}
              {leaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-4 py-4 mb-4">
                  {/* 2nd Place */}
                  <div className="flex flex-col items-center text-center w-24">
                    <div className="relative mb-2">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${getAvatarColor(leaderboard[1].avatar)} flex items-center justify-center text-2xl shadow-lg border-2 border-slate-300`} />
                      <div className="absolute -bottom-2 -right-1 bg-slate-300 text-slate-800 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow">2</div>
                    </div>
                    <span className="text-xs font-bold text-gray-300 truncate w-full">{leaderboard[1].username}</span>
                    <span className="text-[10px] text-gray-500">{leaderboard[1].xp} XP</span>
                  </div>

                  {/* 1st Place */}
                  <div className="flex flex-col items-center text-center w-28 -translate-y-2">
                    <div className="relative mb-2">
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 animate-bounce-slow">
                        <Trophy size={20} />
                      </div>
                      <div className={`w-18 h-18 rounded-full bg-gradient-to-tr ${getAvatarColor(leaderboard[0].avatar)} flex items-center justify-center text-3xl shadow-xl border-2 border-yellow-400`} />
                      <div className="absolute -bottom-2 -right-1 bg-yellow-400 text-slate-900 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow">1</div>
                    </div>
                    <span className="text-sm font-black text-white truncate w-full flex items-center justify-center gap-0.5">
                      {leaderboard[0].username} <Sparkles size={10} className="text-yellow-400" />
                    </span>
                    <span className="text-xs text-yellow-400 font-bold">{leaderboard[0].xp} XP</span>
                  </div>

                  {/* 3rd Place */}
                  <div className="flex flex-col items-center text-center w-24">
                    <div className="relative mb-2">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-tr ${getAvatarColor(leaderboard[2].avatar)} flex items-center justify-center text-2xl shadow-lg border-2 border-amber-600`} />
                      <div className="absolute -bottom-2 -right-1 bg-amber-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow">3</div>
                    </div>
                    <span className="text-xs font-bold text-gray-300 truncate w-full">{leaderboard[2].username}</span>
                    <span className="text-[10px] text-gray-500">{leaderboard[2].xp} XP</span>
                  </div>
                </div>
              )}

              {/* Table List */}
              <div className="space-y-2.5">
                {leaderboard.map((player, idx) => {
                  const winRate = player.matchesPlayed > 0 
                    ? Math.round((player.matchesWon / player.matchesPlayed) * 100) 
                    : 0;

                  return (
                    <div 
                      key={player._id}
                      className={`flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all ${
                        idx < 3 ? 'bg-indigo-500/5 border-indigo-500/10' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-gray-500 w-5 text-center">#{idx + 1}</span>
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${getAvatarColor(player.avatar)} flex items-center justify-center text-xl`} />
                        <div>
                          <h3 className="font-black text-white text-sm leading-tight flex items-center gap-1">
                            {player.username}
                          </h3>
                          <p className="text-[10px] text-gray-400">Wins: {player.matchesWon} | Donkey: {player.kazhuthaiCount || 0}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-indigo-400 font-outfit">{player.xp} XP</span>
                        <div className="w-16 bg-white/10 h-1 rounded-full mt-1.5 overflow-hidden">
                          <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${winRate}%` }} />
                        </div>
                        <p className="text-[8px] text-gray-500 mt-0.5">{winRate}% WR</p>
                      </div>
                    </div>
                  );
                })}

                {leaderboard.length === 0 && (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No player records found. Start playing to rank up!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
