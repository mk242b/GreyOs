
export enum QuadrantType {
  Q1 = 'Q1', // Urgent & Important (Boss)
  Q2 = 'Q2', // Not Urgent & Important (Skill)
  Q3 = 'Q3', // Urgent & Not Important (Minion)
  Q4 = 'Q4', // Neither (Trash)
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  quadrant: QuadrantType;
  completed: boolean;
  createdAt: number;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  icon: string;
}

export interface User {
  uid: string;
  displayName: string;
  photoURL?: string;
  email: string;
}

export interface GameState {
  level: number;
  currentXP: number;
  maxXP: number;
  gold: number;
  hp: number;
  maxHP: number;
  tasks: Task[];
  rewards: Reward[];
  lastResetTime: number; // For the 6AM reset logic
  devMode: boolean; // UI Toggle
  activeTaskId: string | null; // Currently doing task
  user?: User; // Auth User
}

export interface QuadrantConfig {
  id: QuadrantType;
  label: string;
  gameLabel: string;
  xpMultiplier: number;
  color: string;
  description: string;
}
