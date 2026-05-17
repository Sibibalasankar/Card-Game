import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { sounds } from '../utils/soundManager';
import { User, Sparkles, Smile } from 'lucide-react';
import { AVATARS } from '../utils/constants';


export const AuthPanel = () => {
  const { loginAnonymous, error: authError } = useAuth();
  
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('avatar_1');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    sounds.playClick();
    setValidationError('');
    setLoading(true);

    try {
      const result = await loginAnonymous(username, selectedAvatar);
      if (!result.success) {
        setValidationError(result.message || 'Anonymous connection failed.');
      }
    } catch (err) {
      setValidationError('Server connection failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 glass-card rounded-3xl shadow-2xl relative border border-white/10 animate-fade-in">
      {/* Decorative top gold star */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 rounded-full p-2.5 shadow-lg shadow-indigo-500/50">
        <Sparkles size={20} className="text-white" />
      </div>

      <h2 className="text-3xl font-black text-center text-white mb-2 font-outfit">
        Enter Arena
      </h2>
      <p className="text-xs text-gray-400 text-center mb-8">
        Pick a nickname and select your avatar character to start playing instantly.
      </p>

      {/* Errors */}
      {(validationError || authError) && (
        <div className="p-4 mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-400 text-center animate-shake">
          {validationError || authError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Username (Optional) */}
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <User size={14} /> Screen Nickname (Optional)
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. CardShark (or auto-generate)"
              value={username}
              maxLength={15}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-5 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-semibold"
            />
          </div>
        </div>

        {/* Avatar Selection */}
        <div className="flex flex-col space-y-3 pt-1">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <Smile size={14} /> Choose Avatar Character
          </label>
          <div className="grid grid-cols-3 gap-3">
            {AVATARS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => { sounds.playClick(); setSelectedAvatar(avatar.id); }}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 mt-8 flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span className="font-black tracking-wide uppercase text-sm">Enter Game Arena</span>
              <Sparkles size={16} className="group-hover:animate-pulse" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
