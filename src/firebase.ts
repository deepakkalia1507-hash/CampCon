import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase configuration from your project "campcon-52c5e"
const firebaseConfig = {
    apiKey: "AIzaSyD-86ttAInNx-ZjPwj0sIP158B07Zh558I",
    authDomain: "campcon-52c5e.firebaseapp.com",
    projectId: "campcon-52c5e",
    storageBucket: "campcon-52c5e.firebasestorage.app",
    messagingSenderId: "201227171933",
    appId: "1:201227171933:web:b224e6fbf4696d001435b4",
    measurementId: "G-XRJEHG4385"
};

// Initialize Firebase
console.log('Firebase Config Loaded:', firebaseConfig); // Debugging
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();