import React from 'react';
import { CheckCircle2, Zap } from 'lucide-react';

interface Props {
  xpGained: number;
  isDevMode: boolean;
}

const SuccessOverlay: React.FC<Props> = ({ xpGained, isDevMode }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-pop-in">
      <div className={`transform scale-110 p-8 rounded-2xl shadow-2xl flex flex-col items-center text-center border-4 ${isDevMode ? 'bg-slate-900 border-emerald-500 text-white' : 'bg-white border-blue-500 text-slate-800'}`}>
        <div className={`mb-4 p-4 rounded-full ${isDevMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-100 text-blue-600'}`}>
          <CheckCircle2 size={64} strokeWidth={3} />
        </div>
        
        <h2 className="text-3xl font-black uppercase tracking-wider mb-2">
          COMPLETED!
        </h2>
        
        <div className={`text-xl font-bold flex items-center gap-2 ${isDevMode ? 'text-yellow-400' : 'text-blue-600'}`}>
          <Zap size={24} fill="currentColor" />
          +{xpGained} XP
        </div>
      </div>
    </div>
  );
};

export default SuccessOverlay;