// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCod7fdpg39a6a4yl35d5e30jAGXrrA7R8",
    authDomain: "vkseishop.firebaseapp.com",
    projectId: "vkseishop",
    storageBucket: "vkseishop.firebasestorage.app",
    messagingSenderId: "920882217983",
    appId: "1:920882217983:web:c78ada6cc325dd6a099dca"
};

// Инициализация Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
