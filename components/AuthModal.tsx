import React, { useState } from 'react';
import { X, ShieldCheck, User as UserIcon, Mail, Lock, Loader2, ArrowRight, Key } from 'lucide-react';
import { User } from '../types';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { INITIAL_GAME_STATE } from '../constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        // --- SIGN UP FLOW ---
        if (!username.trim()) throw new Error("Username is required");
        if (!apiKey.trim()) throw new Error("Gemini API Key is required for System Access");
        
        // 1. Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;

        // 2. Update Display Name
        await updateProfile(firebaseUser, { displayName: username });

        // 3. Create Initial Database Document with API KEY
        const initialUserData: User = {
            uid: firebaseUser.uid,
            displayName: username,
            email: firebaseUser.email || '',
            apiKey: apiKey.trim() // SAVE API KEY
        };

        const initialDbState = {
            ...INITIAL_GAME_STATE,
            user: initialUserData,
            lastResetTime: Date.now()
        };

        await setDoc(doc(db, "users", firebaseUser.uid), initialDbState);
        
        console.log("User created and DB initialized with API Key");

      } else {
        // --- LOGIN FLOW ---
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in");
      }
      
      onClose();

    } catch (error: any) {
      console.error("Auth Error:", error);
      let msg = error.message;
      if (error.code === 'auth/email-already-in-use') msg = "That email is already registered.";
      if (error.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (error.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (error.code === 'auth/weak-password') msg = "Password must be at least 6 characters.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-pop-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 font-mono">
            <ShieldCheck className="text-emerald-500" />
            {isSignUp ? 'INIT_NEW_USER' : 'SYSTEM_LOGIN'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleAuth} className="space-y-4">
            
            {/* Username (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono uppercase">Display Name</label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3 top-3 text-slate-500" />
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                    placeholder="CyberNinja"
                    required
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-mono uppercase">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* API Key (Sign Up Only) */}
            {isSignUp && (
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-mono uppercase flex justify-between">
                  <span>Gemini API Key</span>
                  <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-emerald-500 hover:underline text-[10px]">Get Key</a>
                </label>
                <div className="relative">
                  <Key size={16} className="absolute left-3 top-3 text-emerald-500" />
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:border-emerald-500 focus:outline-none transition-colors placeholder-emerald-900/50"
                    placeholder="AIzaSy..."
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500">Required for AI Task Analysis. Stored securely.</p>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {isSignUp ? 'Initialize Profile' : 'Access System'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              {isSignUp ? "Already have an identity?" : "First time user?"}
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(null); }}
                className="ml-2 text-emerald-400 hover:text-emerald-300 font-bold underline decoration-emerald-500/30 underline-offset-4"
              >
                {isSignUp ? "Log In" : "Create Account"}
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;