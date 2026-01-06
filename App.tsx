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
import { Settings, Plus, X as CloseIcon, Terminal, GraduationCap, Monitor, LayoutDashboard, Play, User as UserIcon, LogOut, Cloud, RefreshCw } from 'lucide-react';
import { auth, db } from './firebase'; // Import Firebase
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

const App: React.FC = () => {
  // --- State ---
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'level-up' | 'error' | 'info'} | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [successOverlay, setSuccessOverlay] = useState<{xp: number} | null>(null);
  
  // New State for UI Updates
  const [levelUpLevel, setLevelUpLevel] = useState<number | null>(null); // Stores the specific level reached
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // Visual loading state for cloud ops

  // Force Dark Mode
  const isDevMode = true;

  // --- Persistence & Morning Reset ---
  
  // 1. Load from LocalStorage first (for instant offline load)
  useEffect(() => {
    const saved = localStorage.getItem('devquest_state');
    if (saved) {
      try {
        const parsed: GameState = JSON.parse(saved);
        parsed.devMode = true; 
        handleMorningReset(parsed);
      } catch (e) {
        console.error("Failed to parse save data", e);
        setGameState({ ...INITIAL_GAME_STATE, devMode: true });
      }
    } else {
        setGameState({ ...INITIAL_GAME_STATE, devMode: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Firebase Auth Listener & Cloud Sync (Real-time)
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsSyncing(true);
        
        // Optimistic basic load
        let userProfile: User = {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'DevQuest User',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || undefined,
          apiKey: '' 
        };

        setGameState(prev => ({
            ...prev,
            user: userProfile,
            devMode: true
        }));

        // Real-time listener for User Data
        const userRef = doc(db, "users", currentUser.uid);
        
        unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const cloudData = docSnap.data() as GameState;
                console.log("Cloud update received");

                // Merge Logic
                if (cloudData.user) {
                   userProfile = { ...userProfile, ...cloudData.user };
                }

                setGameState(prev => {
                    const newState = {
                        ...INITIAL_GAME_STATE,
                        ...cloudData, // Cloud is source of truth
                        user: userProfile, 
                        devMode: true,
                    };
                    return handleMorningResetLogic(newState);
                });
                setIsSyncing(false);
            } else {
                console.log("No cloud data yet (or new user creating doc)");
                // If the user exists but has no doc, we treat them as a new user with default state
                // The doc will be created when they save something (profile or task)
                setIsSyncing(false);
            }
        }, (error) => {
            console.error("Snapshot error:", error);
            setIsSyncing(false);
        });
        
      } else {
        // User logged out
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setGameState(prev => ({ ...prev, user: undefined, devMode: true }));
        setIsSyncing(false);
      }
    });

    return () => {
        unsubscribeAuth();
        if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  // 3. Save to LocalStorage (and Firestore if logged in)
  useEffect(() => {
    localStorage.setItem('devquest_state', JSON.stringify(gameState));
    
    // Cloud Save (Debounced)
    const saveToCloud = async () => {
        if (gameState.user) {
            try {
                const userRef = doc(db, 'users', gameState.user.uid);
                // We use setDoc with merge to ensure we don't overwrite if multiple devices connect,
                // though strictly this is a "last write wins" simplified model.
                await setDoc(userRef, gameState, { merge: true });
            } catch (e) {
                console.error("Cloud Auto-save failed", e);
            }
        }
    };

    const timeoutId = setTimeout(saveToCloud, 2000); 
    return () => clearTimeout(timeoutId);
  }, [gameState]);

  // --- Logic Helpers ---

  const handleMorningResetLogic = (state: GameState): GameState => {
    const now = new Date();
    const lastReset = new Date(state.lastResetTime);
    
    const sixAMToday = new Date();
    sixAMToday.setHours(6, 0, 0, 0);

    const resetBoundary = now.getHours() >= 6 ? sixAMToday : new Date(sixAMToday.getTime() - 86400000);

    if (lastReset.getTime() < resetBoundary.getTime()) {
      return {
        ...state,
        hp: state.maxHP, // Heal up
        activeTaskId: null, // Reset active task
        lastResetTime: Date.now(),
      };
    }
    return state;
  };

  const handleMorningReset = (loadedState: GameState) => {
     const newState = handleMorningResetLogic(loadedState);
     if (newState.lastResetTime !== loadedState.lastResetTime) {
         showNotification("Morning Routine Initialized. Energy Restored.", 'info');
     }
     setGameState(newState);
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

  // --- Calculations ---
  const calculateTaskXP = (task: Task) => BASE_XP * QUADRANT_DATA[task.quadrant].xpMultiplier;
  
  const dailyPotentialXP = gameState.tasks.reduce((acc, t) => acc + calculateTaskXP(t), 0);
  const dailyEarnedXP = gameState.tasks.filter(t => t.completed).reduce((acc, t) => acc + calculateTaskXP(t), 0);
  
  const dailyProgressPercentage = dailyPotentialXP === 0 ? 0 : Math.round((dailyEarnedXP / dailyPotentialXP) * 100);
  
  const activeTask = gameState.tasks.find(t => t.id === gameState.activeTaskId);

  // --- Actions ---

  const handleUpdateUserProfile = async (updates: Partial<User>) => {
    if (!gameState.user) return;
    
    const updatedUser = { ...gameState.user, ...updates };

    // Optimistic Update
    setGameState(prev => ({
        ...prev,
        user: updatedUser
    }));

    try {
        const userRef = doc(db, 'users', updatedUser.uid);
        
        // Critical Fix: Use setDoc with merge: true instead of updateDoc.
        // updateDoc fails if the document doesn't exist (e.g. initial creation failed or data was cleared).
        // setDoc with merge handles both creation and update robustly.
        await setDoc(userRef, {
            user: updatedUser
        }, { merge: true });

        showNotification("Profile & Settings Saved", 'success');
    } catch (e: any) {
        console.error("Failed to update profile", e);
        showNotification(`Failed to save profile: ${e.message}`, 'error');
    }
  };

  const handleAddTasks = (newTasksInput: { title: string, quadrant: QuadrantType }[]) => {
    const timestamp = Date.now();
    
    const newTasks: Task[] = newTasksInput.map((input, index) => ({
      id: `${timestamp}-${index}-${Math.random().toString(36).substr(2, 5)}`,
      title: input.title,
      quadrant: input.quadrant,
      completed: false,
      createdAt: timestamp,
    }));

    setGameState(prev => {
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
    const multiplier = QUADRANT_DATA[task.quadrant].xpMultiplier;
    const gainedXP = Math.floor(BASE_XP * multiplier);

    setShowConfetti(true);
    setSuccessOverlay({ xp: gainedXP });
    setTimeout(() => {
        setShowConfetti(false);
        setSuccessOverlay(null);
    }, 2000);

    setGameState(prev => {
      const rawXP = prev.currentXP + gainedXP;
      const { xp, level, maxXP, leveledUp } = checkLevelUp(rawXP, prev.level, prev.maxXP);
      
      if (leveledUp) {
        setLevelUpLevel(level);
      }

      const updatedTasks = prev.tasks.map(t => t.id === task.id ? { ...t, completed: true } : t);
      const isWasActive = prev.activeTaskId === task.id;

      return {
        ...prev,
        currentXP: xp,
        level,
        maxXP,
        gold: prev.gold + gainedXP, 
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
        hp: Math.min(prev.maxHP, prev.hp + 10) 
      };
    });
  };

  const handleManualLoginPlaceholder = (user: User) => {
  };

  const handleLogout = async () => {
    try {
        await signOut(auth);
        showNotification("Logged out", 'info');
        setGameState({ ...INITIAL_GAME_STATE, devMode: true }); 
    } catch (error) {
        console.error("Logout failed", error);
    }
  };

  // --- Render Props ---
  const bgClass = 'bg-cyber-dark';
  const textClass = 'text-slate-200';

  return (
    <div className={`min-h-screen ${bgClass} ${textClass} transition-colors duration-500 font-sans pb-24 md:pb-8`}>
      
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

      {/* Header */}
      <header className={`p-4 border-b border-cyber-border bg-slate-950/80 backdrop-blur sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-2">
            <LayoutDashboard className='text-emerald-500' />
            <h1 className={`text-xl font-bold tracking-tight hidden md:block font-mono`}>
              Grey's<span className="text-emerald-500">_OS</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {gameState.user && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/10 border border-white/5">
                    {isSyncing ? (
                        <>
                            <RefreshCw size={12} className="animate-spin text-emerald-500" />
                            <span className="text-[10px] font-mono opacity-70">SYNCING</span>
                        </>
                    ) : (
                        <>
                            <Cloud size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-mono opacity-70">SAVED</span>
                        </>
                    )}
                </div>
            )}

            {gameState.user ? (
               <div className="flex items-center gap-2 mr-2">
                  <div className="text-right hidden sm:block">
                     <div className={`text-xs font-bold text-emerald-400`}>{gameState.user.displayName}</div>
                     <div className="text-[10px] opacity-60">Level {gameState.level}</div>
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
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all bg-slate-800 text-slate-300 hover:bg-slate-700`}
                >
                  <UserIcon size={14} />
                  <span className="hidden sm:inline">LOGIN</span>
                </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 space-y-6">
        
        <section>
          <CharacterSheet 
            state={gameState} 
            isDevMode={isDevMode} 
            dailyProgressPercentage={dailyProgressPercentage}
            onUpdateUser={handleUpdateUserProfile}
          />
        </section>

        <section>
            <ActivePlant 
                activeTask={activeTask} 
                progressPercentage={dailyProgressPercentage} 
                isDevMode={isDevMode}
                onComplete={completeTask}
            />
        </section>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          <section className="flex-1 w-full lg:w-2/3">
             <SmartTaskInput 
                isDevMode={isDevMode} 
                onAdd={handleAddTasks} 
                apiKey={gameState.user?.apiKey || ''}
                onSaveApiKey={(key) => handleUpdateUserProfile({ apiKey: key })}
             />
             
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

          <section className="w-full lg:w-1/3 space-y-6 sticky top-24">
            <RewardShop state={gameState} isDevMode={isDevMode} onBuy={buyReward} />
            
            <div className={`p-4 rounded-xl border border-cyber-border bg-slate-900/50`}>
              <h3 className={`font-bold mb-2 text-emerald-500 font-mono`}>DASHBOARD INFO</h3>
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

      <button
        onClick={() => {
            document.querySelector('input')?.focus();
            window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
        className={`fixed bottom-6 right-6 p-4 z-40 rounded-full shadow-lg hover:scale-110 transition-transform bg-emerald-600 text-white shadow-emerald-500/20`}
      >
        <Plus size={32} />
      </button>

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