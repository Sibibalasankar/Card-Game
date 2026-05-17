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

export const Card = ({ card, onClick, onDragPlay, disabled, isSelected, playable = true, customStyles = '' }) => {
  const { suit, rank } = card;
  const glyph = SUIT_GLYPHS[suit];
  const isRed = suit === 'Hearts' || suit === 'Diamonds';
  
  // Custom rank typography adjustment
  const displayRank = rank === '10' ? '10' : rank;

  return (
    <motion.div
      onClick={() => playable && !disabled && onClick && onClick(card)}
      layoutId={`card-${card.id}`}
      drag={playable && !disabled && onDragPlay ? true : false}
      dragSnapToOrigin={true}
      dragElastic={0.6}
      whileDrag={{ scale: 1.1, zIndex: 100, rotate: 5, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
      onDragEnd={(e, info) => {
        if (playable && !disabled && onDragPlay) {
          // If the card is dragged upwards significantly (tossed towards table)
          if (info.offset.y < -50) {
            onDragPlay(card);
          }
        }
      }}
      whileHover={playable && !disabled ? { 
        y: isSelected ? -36 : -24, 
        rotate: 1.5,
        boxShadow: isRed 
          ? '0 15px 30px -5px rgba(239, 68, 68, 0.45), 0 0 20px rgba(239, 68, 68, 0.25)' 
          : '0 15px 30px -5px rgba(99, 102, 241, 0.45), 0 0 20px rgba(99, 102, 241, 0.25)'
      } : {}}
      whileTap={playable && !disabled ? { scale: 0.98 } : {}}
      initial={{ scale: 0.8, opacity: 0, y: 50 }}
      animate={{ 
        scale: 1, 
        opacity: 1, 
        y: isSelected ? -28 : 0 
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative w-16 h-24 sm:w-20 sm:h-30 md:w-24 md:h-36 lg:w-28 lg:h-40 rounded-xl sm:rounded-2xl bg-white text-slate-800 shadow-xl select-none cursor-pointer border border-slate-200/50 card-container overflow-hidden
        ${disabled ? 'opacity-40 cursor-not-allowed contrast-75' : ''}
        ${!playable ? 'cursor-default pointer-events-none' : ''}
        ${isSelected ? 'border-2 border-indigo-500 ring-4 ring-indigo-500/20' : ''}
        ${customStyles}
      `}
      style={{
        boxShadow: isSelected ? '0 0 25px rgba(99, 102, 241, 0.65)' : undefined
      }}
    >
      {/* Top Left Indicator */}
      <div className="absolute top-1 sm:top-2 left-1.5 sm:left-2.5 flex flex-col items-center leading-none">
        <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-black font-outfit text-slate-900">{displayRank}</span>
        <span className={`text-[9px] sm:text-xs md:text-sm ${SUIT_COLORS[suit]} mt-0.2 sm:mt-0.5`}>{glyph}</span>
      </div>

      {/* Center Big Suit Graphic */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] ${SUIT_COLORS[suit]}`}>
          {glyph}
        </span>
      </div>

      {/* Bottom Right Indicator */}
      <div className="absolute bottom-1 sm:bottom-2 right-1.5 sm:right-2.5 flex flex-col items-center leading-none rotate-180">
        <span className="text-xs sm:text-sm md:text-lg lg:text-xl font-black font-outfit text-slate-900">{displayRank}</span>
        <span className={`text-[9px] sm:text-xs md:text-sm ${SUIT_COLORS[suit]} mt-0.2 sm:mt-0.5`}>{glyph}</span>
      </div>

      {/* Highlight glow ring for special first card Ace of Spades */}
      {card.id === 'Spades-A' && !disabled && playable && (
        <div className="absolute inset-0 rounded-2xl border border-yellow-400/60 pointer-events-none active-glow-ring" />
      )}
    </motion.div>
  );
};
