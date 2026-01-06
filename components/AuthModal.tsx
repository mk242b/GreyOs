import React, { useState } from 'react';
import { X, LogIn, Cloud, ShieldCheck } from 'lucide-react';
import { User } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<Props> = ({ isOpen, onClose, onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // The observer in App.tsx will handle the state update, 
      // but we can close the modal here.
      onClose();
    } catch (error: any) {
      console.error("Login failed", error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        setErrorMsg(`Domain not authorized (${currentDomain}). Please add this domain to your Firebase Console > Authentication > Settings > Authorized Domains.`);
      } else if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg("Sign-in cancelled.");
      } else {
        setErrorMsg(error.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-pop-in">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" />
            Identity Verification
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Cloud size={32} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Sync with Cloud</h3>
            <p className="text-sm text-slate-400">
              Sign in to backup your tasks, XP, and gold across devices using Firebase.
            </p>
          </div>

          <div className="space-y-3">
            {errorMsg && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-xs text-center break-words">
                {errorMsg}
              </div>
            )}

            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 font-bold rounded-lg flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full"></span>
              ) : (
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              )}
              {isLoading ? 'Authenticating...' : 'Sign in with Google'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthModal;