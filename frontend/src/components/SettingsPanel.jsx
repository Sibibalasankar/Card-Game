import React, { useState } from 'react';
import { sounds } from '../utils/soundManager';
import { Volume2, VolumeX, BookOpen, X, Info, ShieldAlert } from 'lucide-react';

export const SettingsPanel = ({ isOpen, onClose }) => {
  const [soundOn, setSoundOn] = useState(sounds.isEnabled);
  const [activeTab, setActiveTab] = useState('audio'); // 'audio' | 'rules'

  if (!isOpen) return null;

  const handleSoundToggle = () => {
    const newState = !soundOn;
    setSoundOn(newState);
    sounds.toggle(newState);
    sounds.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg overflow-hidden glass-card rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-black text-white font-outfit tracking-wide flex items-center gap-2">
            ⚙️ Settings & Rules
          </h2>
          <button 
            onClick={() => { sounds.playClick(); onClose(); }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5">
          <button
            onClick={() => { sounds.playClick(); setActiveTab('audio'); }}
            className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'audio' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Audio & Config
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab('rules'); }}
            className={`flex-1 py-3 text-sm font-bold tracking-wider uppercase border-b-2 transition-all ${
              activeTab === 'rules' 
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' 
                : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            How to Play (Rules)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'audio' ? (
            <div className="space-y-6">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div>
                  <h3 className="font-bold text-white text-lg">Sound Synthesizer</h3>
                  <p className="text-xs text-gray-400">Play real-time synthesized cards play, shuffles, warnings, and victory sounds</p>
                </div>
                <button
                  onClick={handleSoundToggle}
                  className={`p-3 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    soundOn 
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                      : 'bg-white/10 hover:bg-white/15 text-gray-400'
                  }`}
                >
                  {soundOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
                </button>
              </div>

              {/* Dev Info */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-indigo-400 font-bold">
                  <Info size={16} />
                  <span className="text-sm">Technical Specifications</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                  <div>Engine: Authoritative State</div>
                  <div>Sync: Socket.IO Realtime</div>
                  <div>Client: React + Framer Motion</div>
                  <div>Aesthetics: Glass Felt Green</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 text-gray-300 text-sm leading-relaxed">
              <div className="p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20 flex gap-3">
                <ShieldAlert className="text-yellow-500 shrink-0" size={20} />
                <div>
                  <h4 className="font-bold text-yellow-500 text-xs uppercase tracking-wider mb-1">Strict First Round Rule</h4>
                  <p className="text-xs text-gray-400">The game locates the player holding the <strong>Ace of Spades (♠A)</strong>. That player MUST start the entire game, and their first card played MUST be ♠A.</p>
                </div>
              </div>

              <div>
                <h4 className="font-black text-white text-base font-outfit mb-2">1. The Objective</h4>
                <p className="text-xs text-gray-400">Avoid collecting cards! The main objective is to discard all cards from your hand. When you have 0 cards, you are marked SAFE and exit. The last player left with cards becomes <strong>KAZHUTHAI (Donkey)</strong> and loses!</p>
              </div>

              <div>
                <h4 className="font-black text-white text-base font-outfit mb-2">2. Follow Suit Rule</h4>
                <p className="text-xs text-gray-400">Every round, the starting player opens a suit (e.g. Clubs ♣). All subsequent players in turn order MUST follow suit by playing a card of the same suit (♣) IF they possess it. If they have the suit but play a different suit, the game engine will reject it.</p>
              </div>

              <div>
                <h4 className="font-black text-white text-base font-outfit mb-2">3. Normal Rounds (Clear Cards)</h4>
                <p className="text-xs text-gray-400">If ALL active players followed the active suit, it is a normal clear. All played cards are permanently discarded (no one collects them!). The player who played the highest-ranked card of the active suit gets to start the next round.</p>
              </div>

              <div>
                <h4 className="font-black text-white text-base font-outfit mb-2">4. Break Rounds (Collection)</h4>
                <p className="text-xs text-gray-400">If a player has NO cards of the active suit, they may play ANY card of another suit. This is a <strong>BREAK</strong>. The round terminates instantly! The player who played the <strong>highest card of the active suit</strong> must collect all the cards played in this round, adding them back into their hand. That player then starts the next round.</p>
              </div>

              <div className="border-t border-white/5 pt-4 text-xs text-gray-500 text-center">
                Kazhuthai - Traditional South Indian Card Game. Pure skill and memory.
              </div>
            </div>
          )}
        </div>

        {/* Footer Close */}
        <div className="p-6 border-t border-white/10 flex">
          <button
            onClick={() => { sounds.playClick(); onClose(); }}
            className="btn-primary w-full"
          >
            Done & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
