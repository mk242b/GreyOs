import React from 'react';
import { QuadrantType, Task } from '../types';
import { QUADRANT_DATA } from '../constants';
import { Check, Clock, Trash2, Zap, Calendar, List, Archive, Play, Pause } from 'lucide-react';

interface Props {
  tasks: Task[];
  activeTaskId: string | null;
  isDevMode: boolean;
  onComplete: (task: Task) => void;
  onPostpone: (task: Task) => void;
  onDelete: (task: Task) => void;
  onToggleActive: (task: Task) => void;
}

const TaskMatrix: React.FC<Props> = ({ tasks, activeTaskId, isDevMode, onComplete, onPostpone, onDelete, onToggleActive }) => {
  
  const getIcon = (q: QuadrantType) => {
    switch (q) {
      case QuadrantType.Q1: return <Zap size={18} />;
      case QuadrantType.Q2: return <Calendar size={18} />;
      case QuadrantType.Q3: return <List size={18} />;
      case QuadrantType.Q4: return <Archive size={18} />;
    }
  };

  const renderQuadrant = (quadrantType: QuadrantType) => {
    const config = QUADRANT_DATA[quadrantType];
    const qTasks = tasks.filter(t => t.quadrant === quadrantType && !t.completed);
    
    // Style switching
    const cardBg = isDevMode ? 'bg-slate-900/80' : 'bg-white';
    const borderColor = isDevMode ? 'border-slate-700' : 'border-slate-200';
    const titleColor = isDevMode ? config.color.split(' ')[0] : 'text-slate-700';
    
    return (
      <div 
        key={quadrantType} 
        className={`relative flex flex-col min-h-[250px] p-4 rounded-xl border-2 ${isDevMode ? 'border-cyber-border bg-cyber-panel/50' : 'border-uni-border bg-white'} transition-all`}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`font-bold flex items-center gap-2 ${titleColor} ${isDevMode ? 'font-mono uppercase tracking-widest' : 'font-sans'}`}>
              {getIcon(quadrantType)}
              {isDevMode ? config.gameLabel : config.label}
            </h3>
            <p className="text-xs opacity-60 mt-1">{config.description}</p>
          </div>
          <div className={`text-xs font-mono px-2 py-1 rounded border ${config.color}`}>
            x{config.xpMultiplier} XP
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 space-y-2 pr-1 custom-scrollbar">
          {qTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 text-center py-8">
              <span className="text-4xl mb-2">{isDevMode ? '∅' : 'Empty'}</span>
              <span className="text-xs">No pending tasks</span>
            </div>
          ) : (
            qTasks.map(task => {
                const isActive = activeTaskId === task.id;
                return (
                  <div key={task.id} className={`group relative p-3 rounded-lg border transition-all ${
                    isActive 
                        ? isDevMode ? 'border-emerald-500 bg-emerald-900/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-blue-500 bg-blue-50 shadow-md'
                        : `${borderColor} ${cardBg} hover:shadow-lg`
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                        <div className={`font-medium mb-2 ${isActive ? (isDevMode ? 'text-emerald-400' : 'text-blue-700') : ''}`}>
                             {task.title}
                        </div>
                        {isActive && <div className="animate-pulse text-xs font-bold uppercase tracking-wider text-emerald-500">Active</div>}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 mt-2">
                      <button 
                        onClick={() => onToggleActive(task)}
                        title={isActive ? "Stop Focus" : "Focus"}
                        className={`p-1.5 rounded transition-colors ${
                            isActive
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-slate-500/10 text-slate-500 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        {isActive ? <Pause size={14} /> : <Play size={14} />}
                      </button>

                      {quadrantType !== QuadrantType.Q4 && (
                        <button 
                          onClick={() => onPostpone(task)}
                          title="Postpone"
                          className="p-1.5 rounded bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors"
                        >
                          <Clock size={14} />
                        </button>
                      )}
                      
                      <button 
                        onClick={() => onDelete(task)}
                        title="Delete"
                        className="p-1.5 rounded bg-slate-500/10 text-slate-500 hover:bg-slate-500 hover:text-white transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                      
                      <button 
                        onClick={() => onComplete(task)}
                        title="Complete"
                        className="p-1.5 rounded bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {renderQuadrant(QuadrantType.Q1)}
      {renderQuadrant(QuadrantType.Q2)}
      {renderQuadrant(QuadrantType.Q3)}
      {renderQuadrant(QuadrantType.Q4)}
    </div>
  );
};

export default TaskMatrix;