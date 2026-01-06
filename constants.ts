import { QuadrantType, QuadrantConfig, GameState } from './types';
import { Sword, Shield, Zap, Trash2, Coffee, Gamepad2, Headphones } from 'lucide-react';

export const BASE_XP = 50;
export const XP_PER_LEVEL_MULTIPLIER = 200;
export const POSTPONE_PENALTY = 10;
export const MAX_HP_DEFAULT = 100;

export const INITIAL_GAME_STATE: GameState = {
  level: 1,
  currentXP: 0,
  maxXP: 200,
  gold: 0,
  hp: 100,
  maxHP: 100,
  tasks: [],
  rewards: [
    { id: 'r1', title: 'Coffee Break', cost: 50, icon: 'coffee' },
    { id: 'r2', title: 'Relaxing Time', cost: 100, icon: 'gamepad' },
    { id: 'r3', title: 'Treat Yourself', cost: 30, icon: 'cookie' },
  ],
  lastResetTime: Date.now(),
  devMode: true,
  activeTaskId: null,
};

export const QUADRANT_DATA: Record<QuadrantType, QuadrantConfig> = {
  [QuadrantType.Q1]: {
    id: QuadrantType.Q1,
    label: 'Urgent & Important',
    gameLabel: 'DO FIRST',
    xpMultiplier: 1.5,
    color: 'text-rose-500 border-rose-500 bg-rose-500/10',
    description: 'High priority. Tackle these immediately.',
  },
  [QuadrantType.Q2]: {
    id: QuadrantType.Q2,
    label: 'Not Urgent & Important',
    gameLabel: 'SCHEDULE',
    xpMultiplier: 2.0,
    color: 'text-emerald-500 border-emerald-500 bg-emerald-500/10',
    description: 'Long-term goals. Plan these out.',
  },
  [QuadrantType.Q3]: {
    id: QuadrantType.Q3,
    label: 'Urgent & Not Important',
    gameLabel: 'DELEGATE',
    xpMultiplier: 0.5,
    color: 'text-amber-500 border-amber-500 bg-amber-500/10',
    description: 'Minimize time spent here.',
  },
  [QuadrantType.Q4]: {
    id: QuadrantType.Q4,
    label: 'Neither',
    gameLabel: 'ELIMINATE',
    xpMultiplier: 0,
    color: 'text-slate-500 border-slate-500 bg-slate-500/10',
    description: 'Distractions. Avoid if possible.',
  },
};