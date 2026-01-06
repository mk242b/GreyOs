import React from 'react';
import { Task } from '../types';
import { Play, CheckCircle2 } from 'lucide-react';

interface Props {
  activeTask: Task | undefined;
  progressPercentage: number; // 0 to 100
  isDevMode: boolean;
  onComplete: (task: Task) => void;
}

const ActivePlant: React.FC<Props> = ({ activeTask, progressPercentage, isDevMode, onComplete }) => {
  // Determine plant stage based on progress
  // 0-33: Sprout, 33-66: Small Plant, 66-100: Flower
  const stage = progressPercentage < 33 ? 1 : progressPercentage < 66 ? 2 : 3;

  const panelClass = isDevMode ? 'bg-cyber-panel border-cyber-border' : 'bg-white border-uni-border';
  const textClass = isDevMode ? 'text-slate-200' : 'text-slate-800';
  const highlightClass = isDevMode ? 'text-emerald-400' : 'text-blue-600';

  return (
    <div className={`p-6 rounded-xl border ${panelClass} ${textClass} flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden transition-colors`}>
      
      {/* Text Section */}
      <div className="flex-1 z-10 w-full">
        <h3 className={`text-sm font-bold uppercase tracking-widest opacity-70 mb-2 ${isDevMode ? 'font-mono' : 'font-sans'}`}>
          CURRENT FOCUS
        </h3>
        
        {activeTask ? (
          <div className="space-y-4">
            <div className="text-2xl md:text-3xl font-bold leading-tight">
              {activeTask.title}
            </div>
            <div className="flex items-center gap-2 text-sm opacity-80">
              <span className="animate-pulse inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              Currently doing...
            </div>
            <button
              onClick={() => onComplete(activeTask)}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${isDevMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg'}`}
            >
              <CheckCircle2 size={18} />
              Complete Task
            </button>
          </div>
        ) : (
          <div className="opacity-50 italic">
            No active task. Select "Focus" on a task to start watering!
          </div>
        )}
      </div>

      {/* Animation Section */}
      <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
        {/* Pot */}
        <div className={`absolute bottom-0 w-16 h-12 rounded-b-lg border-2 z-10 ${isDevMode ? 'bg-slate-800 border-slate-600' : 'bg-amber-700 border-amber-800'}`}></div>
        
        {/* Plant Stages */}
        <div className={`absolute bottom-12 transition-all duration-1000 ease-out origin-bottom ${
            activeTask ? 'animate-[sway_3s_ease-in-out_infinite]' : ''
        }`} style={{ transform: `scale(${0.5 + (progressPercentage / 200)})` }}>
            {/* Stem */}
            <div className={`w-2 h-16 mx-auto ${isDevMode ? 'bg-emerald-500' : 'bg-green-600'}`}></div>
            
            {/* Leaves */}
            {progressPercentage > 10 && (
                <>
                <div className={`absolute bottom-4 -left-4 w-4 h-4 rounded-tr-full rounded-bl-full ${isDevMode ? 'bg-emerald-500' : 'bg-green-600'}`}></div>
                <div className={`absolute bottom-8 -right-4 w-4 h-4 rounded-tl-full rounded-br-full ${isDevMode ? 'bg-emerald-500' : 'bg-green-600'}`}></div>
                </>
            )}
             {progressPercentage > 40 && (
                <>
                <div className={`absolute bottom-12 -left-3 w-3 h-3 rounded-tr-full rounded-bl-full ${isDevMode ? 'bg-emerald-400' : 'bg-green-500'}`}></div>
                <div className={`absolute bottom-14 -right-3 w-3 h-3 rounded-tl-full rounded-br-full ${isDevMode ? 'bg-emerald-400' : 'bg-green-500'}`}></div>
                </>
            )}

            {/* Flower Head */}
            {progressPercentage > 75 && (
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 animate-[spin_10s_linear_infinite]">
                    <div className={`absolute inset-0 rounded-full ${isDevMode ? 'bg-rose-500' : 'bg-pink-500'}`}></div>
                    <div className={`absolute inset-2 rounded-full ${isDevMode ? 'bg-yellow-400' : 'bg-yellow-300'}`}></div>
                 </div>
            )}
        </div>

        {/* Watering Can Animation (Only visible if activeTask) */}
        {activeTask && (
            <div className="absolute -top-4 -right-8 animate-[pour_2s_ease-in-out_infinite]">
                 {/* Can Body */}
                 <div className={`relative w-12 h-10 rounded-lg -rotate-12 ${isDevMode ? 'bg-slate-500' : 'bg-zinc-400'}`}>
                    <div className="absolute top-2 -left-4 w-4 h-1 bg-inherit origin-right rotate-45"></div> {/* Spout */}
                    <div className="absolute top-0 right-0 w-4 h-8 border-2 border-inherit rounded-r-lg"></div> {/* Handle */}
                 </div>
                 
                 {/* Water Drops */}
                 <div className="absolute top-8 -left-4 flex flex-col items-center gap-1 opacity-0 animate-[drops_2s_linear_infinite]">
                    <div className="w-1 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-1 h-2 bg-blue-400 rounded-full"></div>
                    <div className="w-1 h-2 bg-blue-400 rounded-full"></div>
                 </div>
            </div>
        )}

      </div>
      
      {/* Background decoration */}
      {isDevMode && <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none"></div>}

      <style>{`
        @keyframes sway {
            0%, 100% { transform: rotate(-2deg) scale(${0.5 + (progressPercentage / 200)}); }
            50% { transform: rotate(2deg) scale(${0.5 + (progressPercentage / 200)}); }
        }
        @keyframes pour {
            0%, 100% { transform: translateY(0) rotate(0); }
            50% { transform: translateY(-5px) rotate(-5deg); }
        }
        @keyframes drops {
            0% { transform: translateY(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(20px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default ActivePlant;