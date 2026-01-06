import React, { useState, useEffect, useCallback } from 'react';
import { 
  GameState, Task, QuadrantType, Reward, User 
} from './types';
import { 
  INITIAL_GAME_STATE, 
  BASE_XP, 
  XP_PER_LEVEL_MULTIPLIER, 
  POSTPONE_PENALTY, 
  QUADRANT_DATA,
  MAX_HP_DEFAULT
} from './constants';
import CharacterSheet from './components/CharacterSheet';
import TaskMatrix from './components/TaskMatrix';
import RewardShop from './components/RewardShop';
import ActivePlant from './components/ActivePlant';
import Confetti from './components/Confetti';
import SuccessOverlay from './components/SuccessOverlay';
import SmartTaskInput from './components/SmartTaskInput';
import LevelUpOverlay from './components/LevelUpOverlay';
import AuthModal from './components/AuthModal';
import { Settings, Plus, X as CloseIcon, Terminal, GraduationCap, Sun, Monitor, LayoutDashboard, Play, User as UserIcon, LogOut } from 'lucide-react';
import { auth, db } from './firebase'; // Import Firebase
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'level-up' | 'error' | 'info'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{xp: number} | null>(null);
  
  // New State for UI Updates
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null); // Stores the specific level reached
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // --- Persistence & Morning Reset ---
  
  // 1. Load from LocalStorage first (for offline speed)
  useEffect(() => {
    const saved = localStorage.getItem('devquest_state');
    if (saved) {
      try {
        const parsed: GameState = JSON.parse(saved);
        handleMorningReset(parsed);
      } catch (e) {
        console.error("Failed to parse save data", e);
        setGameState(INITIAL_GAME_STATE);
      }
    } else {
        setGameState(INITIAL_GAME_STATE);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // User logged in
        const userProfile: User = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'DevQuest User',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || undefined
        };
        
        // Update state with user info
        setGameState(prev => ({ ...prev, user: userProfile }));
        showNotification(`Synced as ${userProfile.displayName}`, 'success');

        // Optional: Load data from Firestore here in the future
        // const docRef = doc(db, "users", currentUser.uid);
        // ...
      } else {
        // User logged out
        setGameState(prev => ({ ...prev, user: undefined }));
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Save to LocalStorage (and Firestore if logged in)
  useEffect(() => {
    localStorage.setItem('devquest_state', JSON.stringify(gameState));
    
    // Simple Firestore Sync (Debounced ideally, but direct for now)
    if (gameState.user) {
        // We aren't implementing full sync logic yet to avoid overwriting data 
        // without conflict resolution, but the 'db' is ready in firebase.ts
        // const userRef = doc(db, 'users', gameState.user.uid);
        // setDoc(userRef, { ...gameState }, { merge: true });
    }
  }, [gameState]);

  // --- Logic Helpers ---

  const handleMorningReset = (loadedState: GameState) => {
    const now = new Date();
    const lastReset = new Date(loadedState.lastResetTime);
    
    // Check if it's past 6 AM today and last reset was before 6 AM today
    const sixAMToday = new Date();
    sixAMToday.setHours(6, 0, 0, 0);

    // If now is before 6AM, the "reset boundary" was yesterday's 6AM.
    // If now is after 6AM, the boundary is today's 6AM.
    const resetBoundary = now.getHours() >= 6 ? sixAMToday : new Date(sixAMToday.getTime() - 86400000);

    if (lastReset.getTime() < resetBoundary.getTime()) {
      // Trigger Reset
      setGameState(prev => ({
        ...prev, // Use passed state in real implementation, but here we merge with loaded
        ...loadedState,
        hp: loadedState.maxHP, // Heal up
        activeTaskId: null, // Reset active task
        lastResetTime: Date.now(),
        // Optional: Archive completed tasks here, but for now we keep them until deleted
      }));
      showNotification("Morning Routine Initialized. Energy Restored.", 'info');
    } else {
      setGameState(loadedState);
    }
  };

  const checkLevelUp = (currentXP: number, currentLevel: number, currentMaxXP: number) => {
    let xp = currentXP;
    let level = currentLevel;
    let maxXP = currentMaxXP;
    let leveledUp = false;

    while (xp >= maxXP) {
      xp -= maxXP;
      level++;
      maxXP = level * XP_PER_LEVEL_MULTIPLIER;
      leveledUp = true;
    }

    return { xp, level, maxXP, leveledUp };
  };

  const showNotification = (msg: string, type: 'success' | 'level-up' | 'error' | 'info') => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- Calculations for Daily XP Progress ---
  // Calculate total XP potential for the day (completed + pending tasks)
  const calculateTaskXP = (task: Task) => BASE_XP * QUADRANT_DATA[task.quadrant].xpMultiplier;
  
  const dailyPotentialXP = gameState.tasks.reduce((acc, t) => acc + calculateTaskXP(t), 0);
  const dailyEarnedXP = gameState.tasks.filter(t => t.completed).reduce((acc, t) => acc + calculateTaskXP(t), 0);
  
  const dailyProgressPercentage = dailyPotentialXP === 0 ? 0 : Math.round((dailyEarnedXP / dailyPotentialXP) * 100);
  
  const activeTask = gameState.tasks.find(t => t.id === gameState.activeTaskId);

  // --- Actions ---

  const handleAddTasks = (newTasksInput: { title: string, quadrant: QuadrantType }[]) => {
    const timestamp = Date.now();
    
    // Create Task objects
    const newTasks: Task[] = newTasksInput.map((input, index) => ({
      id: `${timestamp}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      title: input.title,
      quadrant: input.quadrant,
      completed: false,
      createdAt: timestamp,
    }));

    setGameState(prev => {
        // If there's no active task, automatically focus the first Q1 task added
        let nextActiveId = prev.activeTaskId;
        if (!nextActiveId) {
            const firstQ1 = newTasks.find(t => t.quadrant === QuadrantType.Q1);
            if (firstQ1) nextActiveId = firstQ1.id;
        }

        return {
            ...prev,
            tasks: [...prev.tasks, ...newTasks],
            activeTaskId: nextActiveId
        };
    });

    if (newTasks.length === 1) {
        showNotification("Task Added", 'success');
    } else {
        showNotification(`${newTasks.length} Tasks Organized!`, 'success');
    }
  };

  const completeTask = (task: Task) => {
    // 1. Calculate XP
    const multiplier = QUADRANT_DATA[task.quadrant].xpMultiplier;
    const gainedXP = Math.floor(BASE_XP * multiplier);

    // 2. Trigger Dopamine Effects
    setShowConfetti(true);
    setSuccessOverlay({ xp: gainedXP });
    setTimeout(() => {
        setShowConfetti(false);
        setSuccessOverlay(null);
    }, 2000);

    setGameState(prev => {
      // Update XP & Gold
      const rawXP = prev.currentXP + gainedXP;
      const { xp, level, maxXP, leveledUp } = checkLevelUp(rawXP, prev.level, prev.maxXP);
      
      if (leveledUp) {
        // Trigger the Full Screen Level Up Overlay
        setLevelUpLevel(level);
      }

      const updatedTasks = prev.tasks.map(t => t.id === task.id ? { ...t, completed: true } : t);
      const isWasActive = prev.activeTaskId === task.id;

      return {
        ...prev,
        currentXP: xp,
        level,
        maxXP,
        gold: prev.gold + gainedXP, // 1:1 Gold ratio
        tasks: updatedTasks,
        activeTaskId: isWasActive ? null : prev.activeTaskId
      };
    });
  };

  const toggleActiveTask = (task: Task) => {
      setGameState(prev => ({
          ...prev,
          activeTaskId: prev.activeTaskId === task.id ? null : task.id
      }));
  };

  const postponeTask = (task: Task) => {
    setGameState(prev => {
      const newXP = Math.max(0, prev.currentXP - POSTPONE_PENALTY);
      showNotification(`Task Postponed. -${POSTPONE_PENALTY} XP`, 'error');
      return {
        ...prev,
        currentXP: newXP
      };
    });
  };

  const deleteTask = (task: Task) => {
    if(!window.confirm("Delete this task?")) return;
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== task.id),
      activeTaskId: prev.activeTaskId === task.id ? null : prev.activeTaskId
    }));
  };

  const buyReward = (reward: Reward) => {
    setGameState(prev => {
      if (prev.gold < reward.cost) return prev;
      showNotification(`Redeemed: ${reward.title}`, 'success');
      return {
        ...prev,
        gold: prev.gold - reward.cost,
        hp: Math.min(prev.maxHP, prev.hp + 10) // Small heal on reward buy? Why not.
      };
    });
  };

  const toggleDevMode = () => {
    setGameState(prev => ({ ...prev, devMode: !prev.devMode }));
  };

  // We no longer need the manual handleLogin because firebase listener handles it
  const handleManualLoginPlaceholder = (user: User) => {
     // This is just to satisfy the Prop type if we kept the old manual logic, 
     // but in the new flow, the AuthModal calls Firebase directly.
     console.log("Legacy login called");
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        showNotification("Logged out", 'info');
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  // --- Render Props ---
  const isDevMode = gameState.devMode;
  const bgClass = isDevMode ? 'bg-cyber-dark' : 'bg-uni-bg';
  const textClass = isDevMode ? 'text-slate-200' : 'text-slate-800';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-500 font-sans pb-24 md:pb-8`}>
      
      {/* Visual Effects */}
      {showConfetti && <Confetti />}
      {successOverlay && <SuccessOverlay xpGained={successOverlay.xp} isDevMode={isDevMode} />}
      {levelUpLevel !== null && (
        <LevelUpOverlay 
          level={levelUpLevel} 
          onClose={() => setLevelUpLevel(null)} 
        />
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onLogin={handleManualLoginPlaceholder}
      />

      {/* Top Navigation / Header */}
      <header className={`p-4 border-b ${isDevMode ? 'border-cyber-border bg-slate-950/80' : 'border-uni-border bg-white/80'} backdrop-blur sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2">
            <LayoutDashboard className={isDevMode ? 'text-emerald-500' : 'text-slate-800'} />
            <h1 className={`text-xl font-bold tracking-tight hidden md:block ${isDevMode ? 'font-mono' : 'font-sans'}`}>
              Grey's<span className="text-emerald-500">_OS</span>
            </h1>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* User Profile / Auth */}
            {gameState.user ? (
               <div className="flex items-center gap-2 mr-2">
                  <div className="text-right hidden sm:block">
                     <div className={`text-xs font-bold ${isDevMode ? 'text-emerald-400' : 'text-slate-700'}`}>{gameState.user.displayName}</div>
                     <div className="text-[10px] opacity-60">Synced</div>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-500 hover:opacity-80 transition-opacity"
                    title="Sign Out"
                  >
                    {gameState.user.photoURL ? (
                         <img src={gameState.user.photoURL} alt="User" className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-emerald-700 flex items-center justify-center text-xs text-white">
                            {gameState.user.displayName.charAt(0)}
                        </div>
                    )}
                  </button>
               </div>
            ) : (
                <button 
                  onClick={() => setIsAuthModalOpen(true)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isDevMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                  <UserIcon size={14} />
                  <span className="hidden sm:inline">LOGIN</span>
                </button>
            )}

            {/* Theme Toggle */}
            <button 
              onClick={toggleDevMode}
              className={`p-2 rounded-full transition-all ${isDevMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
            >
              {isDevMode ? <Monitor size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        
        {/* Character Sheet */}
        <section>
          <CharacterSheet 
            state={gameState} 
            isDevMode={isDevMode} 
            dailyProgressPercentage={dailyProgressPercentage}
          />
        </section>

        {/* Active Task / Plant Animation (Directly above Matrix) */}
        <section>
            <ActivePlant 
                activeTask={activeTask} 
                progressPercentage={dailyProgressPercentage} 
                isDevMode={isDevMode}
                onComplete={completeTask}
            />
        </section>

        {/* Dashboard Grid - Matrix takes priority */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Task Matrix - Directly below active task */}
          <section className="flex-1 w-full lg:w-2/3">
             <SmartTaskInput isDevMode={isDevMode} onAdd={handleAddTasks} />
             
             <TaskMatrix 
                tasks={gameState.tasks}
                activeTaskId={gameState.activeTaskId}
                isDevMode={isDevMode}
                onComplete={completeTask}
                onPostpone={postponeTask}
                onDelete={deleteTask}
                onToggleActive={toggleActiveTask}
             />
          </section>

          {/* Sidebar (Shop & Meta) */}
          <section className="w-full lg:w-1/3 space-y-6 sticky top-24">
            <RewardShop state={gameState} isDevMode={isDevMode} onBuy={buyReward} />
            
            {/* Quick Tips / Lore */}
            <div className={`p-4 rounded-xl border ${isDevMode ? 'border-cyber-border bg-slate-900/50' : 'border-uni-border bg-white'}`}>
              <h3 className={`font-bold mb-2 ${isDevMode ? 'text-emerald-500 font-mono' : 'text-blue-600'}`}>DASHBOARD INFO</h3>
              <ul className="text-sm space-y-2 opacity-80 list-disc list-inside">
                <li>System reset: 06:00 Daily</li>
                <li>Press <Play size={10} className="inline"/> to focus on a task.</li>
                <li>Your plant grows as you earn XP.</li>
                <li>"Do First" tasks yield 1.5x XP.</li>
              </ul>
            </div>
          </section>

        </div>
      </main>

      {/* Floating Action Button (Focus Input) */}
      <button
        onClick={() => {
            document.querySelector('input')?.focus();
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        className={`fixed bottom-6 right-6 p-4 z-40 rounded-full shadow-lg hover:scale-110 transition-transform ${isDevMode ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white shadow-blue-500/30'}`}
      >
        <Plus size={32} />
      </button>

      {/* Standard Notifications (Small) */}
      {notification && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-bounce whitespace-nowrap ${
          notification.type === 'level-up' 
            ? 'hidden' // We use the overlay now
            : notification.type === 'error'
              ? 'bg-red-500 text-white'
              : notification.type === 'success'
                ? 'bg-emerald-500 text-white'
                : 'bg-blue-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}

    </div>
  );
};

export default App;