import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { QuadrantType } from '../types';
import { QUADRANT_DATA } from '../constants';
import { Sparkles, Send, Bot, ChevronDown, Loader2 } from 'lucide-react';

interface TaskInputData {
  title: string;
  quadrant: QuadrantType;
}

interface Props {
  isDevMode: boolean;
  onAdd: (tasks: TaskInputData[]) => void;
}

const SmartTaskInput: React.FC<Props> = ({ isDevMode, onAdd }) => {
  const [text, setText] = useState('');
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantType>(QuadrantType.Q1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Safe API Key retrieval
  const getApiKey = () => {
    try {
      // Direct access in a try-catch to handle environments where process is undefined
      return process.env.API_KEY;
    } catch (e) {
      return '';
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    // Manual Mode: Add single task
    if (!isAIEnabled) {
      onAdd([{ title: text, quadrant: selectedQuadrant }]);
      setText('');
      return;
    }

    // AI Mode: Analyze paragraph/list
    setIsAnalyzing(true);
    
    const apiKey = getApiKey();
    
    // Safety check: If no API key, fallback immediately to avoid crashes
    if (!apiKey) {
      console.warn("No API Key found. Falling back to manual entry.");
      onAdd([{ title: text, quadrant: QuadrantType.Q1 }]);
      setIsAnalyzing(false);
      setText('');
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const now = new Date().toLocaleString();
      
      const prompt = `
      You are an elite productivity assistant.
      The user has provided a raw stream of tasks (paragraph, list, or single sentence).
      Your goal is to parse this into distinct actionable tasks and classify them into the Eisenhower Matrix.

      Context: The current time is ${now}. Use this to determine urgency (e.g., "submit by tonight" is Q1).

      Definitions:
      - Q1 (Urgent & Important): Crises, Deadlines for today/tomorrow.
      - Q2 (Not Urgent & Important): Planning, Skill building, Long-term projects.
      - Q3 (Urgent & Not Important): Interruptions, minor emails, chores that can be delegated.
      - Q4 (Not Urgent & Not Important): Time wasters, pure leisure.

      Input: "${text}"

      Return strictly valid JSON in this format:
      {
        "tasks": [
          { "title": "Brief actionable task name", "quadrant": "Q1" }
        ]
      }
      `;

      const result = await ai.models.generateContent({ 
          model: 'gemini-3-flash-preview', 
          contents: prompt,
          config: { responseMimeType: 'application/json' }
      });
      
      const responseText = result.text || "{}";
      const parsed = JSON.parse(responseText);

      if (parsed.tasks && Array.isArray(parsed.tasks)) {
        // Validate and map to ensure types are correct
        const validTasks: TaskInputData[] = parsed.tasks.map((t: any) => ({
          title: t.title,
          quadrant: ['Q1', 'Q2', 'Q3', 'Q4'].includes(t.quadrant) ? t.quadrant : 'Q1'
        }));
        
        if (validTasks.length > 0) {
            onAdd(validTasks);
        }
      } else {
        // Fallback if AI returns valid JSON but weird structure
        onAdd([{ title: text, quadrant: QuadrantType.Q1 }]);
      }
    } catch (error) {
      console.error("AI Parsing failed", error);
      // Fallback: add as single Q1 task if parsing fails
      onAdd([{ title: text, quadrant: QuadrantType.Q1 }]);
    } finally {
      setIsAnalyzing(false);
      setText('');
    }
  };

  const inputBg = isDevMode ? 'bg-slate-900 border-emerald-500/50' : 'bg-white border-blue-200';
  const textColor = isDevMode ? 'text-white' : 'text-slate-800';
  const placeholderColor = isDevMode ? 'placeholder-slate-500' : 'placeholder-slate-400';

  return (
    <div className={`relative z-30 p-1 rounded-xl border-2 transition-all ${inputBg} shadow-lg mb-6`}>
      <form onSubmit={handleAdd} className="flex items-center gap-2">
        
        {/* Magic / AI Toggle */}
        <button
          type="button"
          onClick={() => setIsAIEnabled(!isAIEnabled)}
          className={`p-3 rounded-lg transition-all flex-shrink-0 ${
            isAIEnabled 
              ? isDevMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-100 text-blue-600'
              : 'text-slate-400 hover:text-slate-500'
          }`}
          title={isAIEnabled ? "AI Auto-Sort: ON" : "AI Auto-Sort: OFF"}
        >
          {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} />}
        </button>

        {/* Input Field */}
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={isAnalyzing ? "AI is organizing your life..." : (isAIEnabled ? "Paste a list or describe your tasks..." : "What needs to be done?")}
          disabled={isAnalyzing}
          className={`flex-1 bg-transparent border-none outline-none p-2 ${textColor} ${placeholderColor} font-medium`}
        />

        {/* Manual Selector (Only if AI is OFF) */}
        {!isAIEnabled && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                isDevMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {QUADRANT_DATA[selectedQuadrant].gameLabel}
              <ChevronDown size={14} />
            </button>

            {isDropdownOpen && (
              <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-xl border overflow-hidden py-1 z-40 ${isDevMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                {Object.values(QUADRANT_DATA).map(q => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => { setSelectedQuadrant(q.id); setIsDropdownOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-opacity-10 ${
                        isDevMode ? 'hover:bg-emerald-500 text-slate-300' : 'hover:bg-blue-500 hover:text-white text-slate-600'
                    }`}
                  >
                     <span className={`w-2 h-2 rounded-full ${q.color.split(' ')[0].replace('text-', 'bg-')}`} />
                     {q.gameLabel}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!text.trim() || isAnalyzing}
          className={`p-3 rounded-lg font-bold transition-all ${
            !text.trim() || isAnalyzing
                ? 'opacity-50 cursor-not-allowed text-slate-500' 
                : isDevMode 
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-md'
          }`}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default SmartTaskInput;