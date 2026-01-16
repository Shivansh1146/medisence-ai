import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCC1BdzVF-GgBusft-DUwjwkUgWMXKQWyg",
  authDomain: "first-hackathon-project-76ce6.firebaseapp.com",
  projectId: "first-hackathon-project-76ce6",
  storageBucket: "first-hackathon-project-76ce6.appspot.com",
  messagingSenderId: "515280098247",
  appId: "1:515280098247:web:45f9800f88f8d86628ffe2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Expose to window for non-module scripts
import {
    browserLocalPersistence,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

window.firebaseAuth = {
    auth,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    updateProfile,
    setPersistence,
    browserLocalPersistence
};

// Dispatch Event for Dependent Scripts
window.dispatchEvent(new Event("firebase-ready"));

console.log("✅ Firebase initialized & exposed to window");

// Global error handler for Firebase loading
window.addEventListener('error', function(e) {
    if (e.target && (e.target.src || '').includes('firebase')) {
        console.error("🔥 Firebase script failed to load:", e.target.src);
        alert("Critical Error: Firebase failed to load. Please checks your internet connection or ad blocker.");
    }
}, true);
