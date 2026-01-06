import React, { useEffect } from 'react';
import Confetti from './Confetti';

interface Props {
  level: number;
  onClose: () => void;
}

const LevelUpOverlay: React.FC<Props> = ({ level, onClose }) => {
  useEffect(() => {
    // Auto-close sound or effect could go here
    // const timer = setTimeout(onClose, 4000);
    // return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-xl animate-in fade-in duration-300">
      <Confetti />
      
      <div className="relative flex flex-col items-center justify-center text-center p-4 w-full">
        
        {/* Animated Glow Behind */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 md:w-96 md:h-96 bg-emerald-500/20 blur-[100px] rounded-full animate-pulse"></div>

        {/* Cyberpunk Header */}
        <h2 className="text-emerald-500 font-mono text-xl md:text-3xl tracking-[0.2em] mb-4 animate-[slideDown_0.5s_ease-out] border-b border-emerald-500/50 pb-2">
          SYSTEM UPGRADE
        </h2>

        {/* The Big Level Number */}
        <div className="relative z-10">
          <div className="text-[8rem] md:text-[14rem] leading-none font-black text-white drop-shadow-[0_0_30px_rgba(16,185,129,0.6)] animate-[zoomIn_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
            {level}
          </div>
          <div className="absolute -bottom-4 md:-bottom-8 left-0 right-0 text-center text-emerald-400 font-bold tracking-widest text-lg md:text-2xl uppercase opacity-80">
            Current Level
          </div>
        </div>

        {/* Stats / Subtext */}
        <div className="mt-12 md:mt-16 space-y-2 animate-[fadeIn_0.8s_ease-out_0.3s_both]">
          <p className="text-slate-400 font-mono text-sm md:text-base">
            CAPACITY INCREASED. NEW REWARDS UNLOCKED.
          </p>
        </div>

        {/* Continue Button */}
        <button
          onClick={onClose}
          className="mt-12 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-none border border-emerald-400 transition-all hover:scale-105 shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-[fadeIn_1s_ease-out_0.6s_both]"
        >
          ACKNOWLEDGE
        </button>

      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.5); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LevelUpOverlay;