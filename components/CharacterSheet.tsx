import React, { useState } from 'react';
import { Shield, Zap, Coins, ListChecks, Pencil, Check, X } from 'lucide-react';
import { GameState, User } from '../types';

interface Props {
  state: GameState;
  isDevMode: boolean;
  dailyProgressPercentage: number;
  onUpdateUser: (user: Partial<User>) => void;
}

const CharacterSheet: React.FC<Props> = ({ state, isDevMode, dailyProgressPercentage, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(state.user?.displayName || 'Guest');
  
  const xpPercentage = Math.min((state.currentXP / state.maxXP) * 100, 100);
  const hpPercentage = (state.hp / state.maxHP) * 100;
  
  const containerClass = isDevMode
    ? 'bg-cyber-panel border-cyber-border text-slate-200'
    : 'bg-white border-gray-200 text-slate-800 shadow-sm';

  const barBg = isDevMode ? 'bg-slate-800' : 'bg-gray-200';

  const handleSaveName = () => {
      if(editName.trim()) {
          onUpdateUser({ displayName: editName });
      }
      setIsEditing(false);
  };

  return (
    <div className={`p-4 rounded-xl border ${containerClass} transition-colors duration-300`}>
      <div className="flex flex-col gap-6">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`relative flex items-center justify-center w-16 h-16 rounded-full border-4 ${isDevMode ? 'border-cyber-secondary text-cyber-secondary' : 'border-uni-primary text-uni-primary'} font-bold text-2xl shrink-0`}>
                {state.level}
                <div className="absolute -bottom-2 bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded-full border border-slate-700">
                LVL
                </div>
            </div>
            
            {/* Name / Edit Section */}
            <div>
                {isEditing ? (
                    <div className="flex items-center gap-2">
                        <input 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={`bg-transparent border-b ${isDevMode ? 'border-emerald-500 text-white' : 'border-blue-500 text-black'} focus:outline-none w-32`}
                            autoFocus
                        />
                        <button onClick={handleSaveName} className="text-emerald-500 hover:text-emerald-400"><Check size={16} /></button>
                        <button onClick={() => setIsEditing(false)} className="text-red-500 hover:text-red-400"><X size={16} /></button>
                    </div>
                ) : (
                    <h2 className={`text-xl font-bold flex items-center gap-2 group ${isDevMode ? 'font-mono' : 'font-sans'}`}>
                        {state.user ? state.user.displayName : 'GUEST'}
                        {state.user && (
                            <button 
                                onClick={() => { setEditName(state.user!.displayName); setIsEditing(true); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-emerald-500"
                            >
                                <Pencil size={12} />
                            </button>
                        )}
                    </h2>
                )}
                <div className="text-xs opacity-70">
                {isDevMode ? 'PRODUCTIVITY MODE' : 'CASUAL MODE'}
                </div>
            </div>
            </div>

            {/* Gold Display */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border w-full md:w-auto justify-center ${isDevMode ? 'bg-slate-900/50 border-yellow-500/30 text-yellow-400' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                <Coins size={20} />
                <span className="font-mono text-xl font-bold">{state.gold}</span>
                <span className="text-xs uppercase opacity-75">Credits</span>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* HP Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Shield size={12} /> Energy</span>
                    <span>{state.hp} / {state.maxHP}</span>
                </div>
                <div className={`h-2 w-full rounded-full ${barBg} overflow-hidden`}>
                    <div 
                        className="h-full bg-rose-500 transition-all duration-500 ease-out"
                        style={{ width: `${hpPercentage}%` }}
                    />
                </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Zap size={12} /> XP</span>
                    <span>{Math.floor(state.currentXP)} / {state.maxXP}</span>
                </div>
                <div className={`h-2 w-full rounded-full ${barBg} overflow-hidden`}>
                    <div 
                        className={`h-full transition-all duration-500 ease-out ${isDevMode ? 'bg-cyber-primary shadow-[0_0_10px_#10b981]' : 'bg-uni-primary'}`}
                        style={{ width: `${xpPercentage}%` }}
                    />
                </div>
            </div>
            
            {/* Daily Task Progress Bar (Weighted by XP) */}
             <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1"><ListChecks size={12} /> Daily Progress</span>
                    <span>{dailyProgressPercentage}%</span>
                </div>
                <div className={`h-2 w-full rounded-full ${barBg} overflow-hidden`}>
                    <div 
                        className={`h-full transition-all duration-500 ease-out bg-gradient-to-r from-blue-400 to-emerald-400`}
                        style={{ width: `${dailyProgressPercentage}%` }}
                    />
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default CharacterSheet;