import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyAVNw2HVJB4olZwXh93KsDjWAV44_cU8FI".trim(),
  authDomain: "greyos-62d2c.firebaseapp.com".trim(),
  projectId: "greyos-62d2c".trim(),
  storageBucket: "greyos-62d2c.firebasestorage.app".trim(),
  messagingSenderId: "629645440930".trim(),
  appId: "1:629645440930:web:971a79d91b110b974e24fb".trim(),
  measurementId: "G-9C0M10BRF9".trim()
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app); // Ready for storing tasks later

export default app;