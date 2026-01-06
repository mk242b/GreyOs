import React from 'react';
import { GameState, Reward } from '../types';
import { ShoppingBag, Coffee, Gamepad2, Cookie, Plus } from 'lucide-react';

interface Props {
  state: GameState;
  isDevMode: boolean;
  onBuy: (reward: Reward) => void;
}

const RewardShop: React.FC<Props> = ({ state, isDevMode, onBuy }) => {
  const getIcon = (iconStr: string) => {
    switch (iconStr) {
      case 'coffee': return <Coffee size={24} />;
      case 'gamepad': return <Gamepad2 size={24} />;
      case 'cookie': return <Cookie size={24} />;
      default: return <ShoppingBag size={24} />;
    }
  };

  const panelClass = isDevMode ? 'bg-cyber-panel border-cyber-border' : 'bg-white border-uni-border';
  const textClass = isDevMode ? 'text-slate-200' : 'text-slate-800';

  return (
    <div className={`p-6 rounded-xl border ${panelClass} ${textClass} h-full`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingBag className="text-yellow-500" />
        <span className={isDevMode ? 'font-mono' : 'font-sans'}>MARKETPLACE</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {state.rewards.map(reward => {
          const canAfford = state.gold >= reward.cost;
          return (
            <button
              key={reward.id}
              onClick={() => canAfford && onBuy(reward)}
              disabled={!canAfford}
              className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                canAfford 
                  ? isDevMode 
                    ? 'border-emerald-500/30 bg-emerald-900/10 hover:bg-emerald-900/20 cursor-pointer' 
                    : 'border-slate-200 hover:shadow-md cursor-pointer'
                  : 'opacity-50 cursor-not-allowed border-slate-700 bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`${isDevMode ? 'text-emerald-400' : 'text-slate-600'}`}>
                  {getIcon(reward.icon)}
                </div>
                <div className="text-left">
                  <div className="font-bold">{reward.title}</div>
                  <div className={`text-xs ${isDevMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {reward.cost} CREDITS
                  </div>
                </div>
              </div>
              
              {canAfford && (
                <div className={`text-xs px-2 py-1 rounded ${isDevMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-100 text-blue-600'}`}>
                  REDEEM
                </div>
              )}
            </button>
          );
        })}
        
        {/* Placeholder for adding custom rewards */}
        <div className={`flex items-center justify-center p-4 rounded-lg border border-dashed ${isDevMode ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'}`}>
            <span className="text-xs">More rewards coming soon...</span>
        </div>
      </div>
    </div>
  );
};

export default RewardShop;