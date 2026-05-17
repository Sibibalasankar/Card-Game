import React from 'react';
import { motion } from 'framer-motion';

const SUIT_GLYPHS = {
  Spades: '♠',
  Hearts: '♥',
  Diamonds: '♦',
  Clubs: '♣'
};

const SUIT_COLORS = {
  Spades: 'text-slate-900',
  Hearts: 'text-rose-600',
  Diamonds: 'text-amber-500',
  Clubs: 'text-emerald-700'
};

const SUIT_MINI_COLORS = {
  Spades: 'text-slate-400',
  Hearts: 'text-rose-500',
  Diamonds: 'text-amber-500',
  Clubs: 'text-emerald-500'
};

export const Card = ({ card, onClick, disabled, isSelected, playable = true, customStyles = '' }) => {
  const { suit, rank } = card;
  const glyph = SUIT_GLYPHS[suit];
  const isRed = suit === 'Hearts' || suit === 'Diamonds';
  
  // Custom rank typography adjustment
  const displayRank = rank === '10' ? '10' : rank;

  return (
    <motion.div
      onClick={() => playable && !disabled && onClick && onClick(card)}
      layoutId={`card-${card.id}`}
      whileHover={playable && !disabled ? { 
        y: -24, 
        scale: 1.08, 
        rotate: 0,
        boxShadow: isRed 
          ? '0 10px 25px -5px rgba(239, 68, 68, 0.4), 0 0 15px rgba(239, 68, 68, 0.2)' 
          : '0 10px 25px -5px rgba(99, 102, 241, 0.4), 0 0 15px rgba(99, 102, 241, 0.2)'
      } : {}}
      whileTap={playable && !disabled ? { scale: 0.95 } : {}}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative w-24 h-36 md:w-28 md:h-40 rounded-2xl bg-white text-slate-800 shadow-xl select-none cursor-pointer flex flex-col justify-between p-3 border border-slate-200/50 card-container
        ${disabled ? 'opacity-40 cursor-not-allowed contrast-75' : ''}
        ${!playable ? 'cursor-default pointer-events-none' : ''}
        ${isSelected ? 'border-2 border-indigo-500 ring-4 ring-indigo-500/20 -translate-y-6' : ''}
        ${customStyles}
      `}
      style={{
        boxShadow: isSelected ? '0 0 20px rgba(99, 102, 241, 0.6)' : undefined
      }}
    >
      {/* Top Left Indicator */}
      <div className="flex flex-col items-center justify-start leading-none">
        <span className="text-xl md:text-2xl font-black font-outfit">{displayRank}</span>
        <span className={`text-base md:text-lg ${SUIT_COLORS[suit]}`}>{glyph}</span>
      </div>

      {/* Center Big Suit Graphic */}
      <div className="flex-1 flex items-center justify-center pointer-events-none select-none my-1">
        <span className={`text-5xl md:text-6xl filter drop-shadow-[0_3px_5px_rgba(0,0,0,0.12)] ${SUIT_COLORS[suit]}`}>
          {glyph}
        </span>
      </div>

      {/* Bottom Right Indicator */}
      <div className="flex flex-col items-center justify-end leading-none self-end rotate-180">
        <span className="text-xl md:text-2xl font-black font-outfit">{displayRank}</span>
        <span className={`text-base md:text-lg ${SUIT_COLORS[suit]}`}>{glyph}</span>
      </div>

      {/* Highlight glow ring for special first card Ace of Spades */}
      {card.id === 'Spades-A' && !disabled && playable && (
        <div className="absolute inset-0 rounded-2xl border border-yellow-400/60 pointer-events-none active-glow-ring" />
      )}
    </motion.div>
  );
};
