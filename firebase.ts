import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyAVNw2HVJB4olZwXh93KsDjWAV44_cU8FI",
  authDomain: "greyos-62d2c.firebaseapp.com",
  projectId: "greyos-62d2c",
  storageBucket: "greyos-62d2c.firebasestorage.app",
  messagingSenderId: "629645440930",
  appId: "1:629645440930:web:971a79d91b110b974e24fb",
  measurementId: "G-9C0M10BRF9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app); // Ready for storing tasks later

export default app;