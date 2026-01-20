import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TarotCard } from '../types';

interface TarotRevealProps {
  card: TarotCard;
  onComplete: () => void;
}

export const TarotReveal: React.FC<TarotRevealProps> = ({ card, onComplete }) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = (idx: number) => {
    if (selectedIdx !== null) return;
    setSelectedIdx(idx);
    setTimeout(() => setIsFlipped(true), 500);
    setTimeout(() => onComplete(), 3500);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] py-12 px-6">
      <motion.h2 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-serif text-stone-800 mb-2 text-center"
      >
        The Relationship Tarot
      </motion.h2>
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-stone-500 text-sm mb-12 text-center italic"
      >
        Choose a card to reveal your relationship prototype...
      </motion.p>

      <div className="flex gap-4 sm:gap-8 justify-center items-center perspective-1000">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="relative w-28 h-44 sm:w-36 sm:h-56 cursor-pointer">
            <AnimatePresence>
              {selectedIdx === null || selectedIdx === idx ? (
                <motion.div
                  initial={{ opacity: 0, y: 50, rotateY: 0 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    rotateY: (selectedIdx === idx && isFlipped) ? 180 : 0,
                    scale: selectedIdx === idx ? 1.1 : 1,
                    x: selectedIdx === idx && idx === 0 ? 100 : selectedIdx === idx && idx === 2 ? -100 : 0
                  }}
                  transition={{ 
                    duration: 0.8, 
                    ease: [0.4, 0, 0.2, 1],
                    rotateY: { duration: 1.2 }
                  }}
                  onClick={() => handleCardClick(idx)}
                  className="w-full h-full relative preserve-3d"
                >
                  {/* Card Back */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl bg-stone-100 border-4 border-white shadow-xl overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-2 border border-stone-200 rounded-xl flex items-center justify-center">
                      <div className="w-full h-full opacity-10 bg-[radial-gradient(circle,currentColor_1px,transparent_1px)] [background-size:10px_10px]" />
                      <div className="absolute text-stone-300 text-4xl">✧</div>
                    </div>
                  </div>

                  {/* Card Front */}
                  <div className="absolute inset-0 backface-hidden rounded-2xl bg-white border-4 border-white shadow-xl overflow-hidden flex flex-col items-center justify-center rotate-y-180">
                     <div className="absolute inset-2 border-2 border-stone-100 rounded-xl p-4 flex flex-col items-center text-center">
                        <div className="text-4xl mb-4 grayscale opacity-80">{card.image || '🔮'}</div>
                        <h3 className="text-stone-800 font-serif font-bold text-sm uppercase tracking-widest mb-2">
                          {card.name}
                        </h3>
                        <div className="h-px w-8 bg-stone-200 mb-3" />
                        <p className="text-[10px] text-stone-500 leading-relaxed italic">
                          {card.meaning}
                        </p>
                     </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  className="absolute inset-0 rounded-2xl bg-stone-100/50 border-4 border-white/50 shadow-sm"
                />
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};
