import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/soundManager';
import { X, LogOut, Award, Coins, Flame, Percent, User, Sparkles, ShieldAlert, CheckCircle } from 'lucide-react';
import { AVATARS } from '../utils/constants';

export const ProfilePanel = ({ isOpen, onClose }) => {
  const { user, logout, updateProfile } = useAuth();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(user.username || '');
      setSelectedAvatar(user.avatar || 'avatar_1');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleAvatarChange = (avatarId) => {
    sounds.playClick();
    setSelectedAvatar(avatarId);
  };

  const handleSave = async () => {
    sounds.playClick();
    setError('');
    setSuccess('');

    if (!nickname.trim() || nickname.trim().length < 3) {
      setError('Display name must be at least 3 characters long.');
      return;
    }

    setSaving(true);
    try {
      const res = await updateProfile(nickname.trim(), selectedAvatar);
      if (res.success) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 1000);
      } else {
        setError(res.message || 'Failed to save changes.');
      }
    } catch (err) {
      setError('Connection to server failed.');
    } finally {
      setSaving(false);
    }
  };

  const getAvatarColor = (avatarId) => {
    return AVATARS.find(a => a.id === avatarId)?.color || 'from-amber-500 to-yellow-600';
  };

  const winRate = user.matchesPlayed > 0 
    ? Math.round((user.matchesWon / user.matchesPlayed) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden glass-card rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white font-outfit tracking-wide flex items-center gap-2">
            👤 Customize Profile
          </h2>
          <button 
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status notices */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 text-center flex items-center justify-center gap-2 animate-shake">
              <ShieldAlert size={16} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-400 text-center flex items-center justify-center gap-2 animate-bounce-slow">
              <CheckCircle size={16} />
              <span>{success}</span>
            </div>
          )}

          {/* Quick Display and Rename fields */}
          <div className="p-5 bg-white/5 border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-xl bg-gradient-to-tr ${getAvatarColor(selectedAvatar)} flex items-center justify-center text-4xl shadow-lg border border-white/10 shrink-0`} />
              <div className="flex-1 flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <User size={10} /> Edit Player Nickname
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-6 pt-2 border-t border-white/5">
              <span className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold">
                <Coins size={14} /> {user.coins || 1000} Gold
              </span>
              <span className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold">
                <Flame size={14} /> {user.xp || 0} XP
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between h-20">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Award size={12} className="text-indigo-400" /> Matches Played
              </span>
              <span className="text-xl font-black text-white leading-none">{user.matchesPlayed || 0}</span>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between h-20">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                🏆 Victories (1st Safe)
              </span>
              <span className="text-xl font-black text-emerald-400 leading-none">{user.matchesWon || 0}</span>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between h-20">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                🐴 Became Donkey
              </span>
              <span className="text-xl font-black text-rose-400 leading-none">{user.kazhuthaiCount || 0}</span>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col justify-between h-20">
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                ⚡ Safe Escapes
              </span>
              <span className="text-xl font-black text-yellow-400 leading-none">{winRate}%</span>
            </div>
          </div>

          {/* Customize Avatar Selection */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Role Character</h4>
            <div className="grid grid-cols-3 gap-3">
              {AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarChange(avatar.id)}
                    className={`p-3 rounded-2xl flex flex-col items-center justify-center border transition-all duration-300 ${
                      isSelected 
                        ? 'bg-indigo-600/20 border-indigo-500 scale-105 shadow-md shadow-indigo-500/10' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                    }`}
                  >
                    <span className="text-3xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{avatar.emoji}</span>
                    <span className="text-[10px] text-gray-400 text-center truncate w-full font-bold">{avatar.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex gap-4">
          <button
            onClick={() => { sounds.playClick(); logout(); }}
            className="flex-1 py-3.5 px-6 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold text-xs transition-all flex items-center justify-center gap-2"
          >
            <LogOut size={14} />
            <span>Abandon Session</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 btn-primary text-xs py-3.5 flex items-center justify-center gap-1.5"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={14} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
