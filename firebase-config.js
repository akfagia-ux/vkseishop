// Конфигурация Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCod7fdpg39a6a4yl35d5e30jAGXrrA7R8",
  authDomain: "vkseishop.firebaseapp.com",
  projectId: "vkseishop",
  storageBucket: "vkseishop.firebasestorage.app",
  messagingSenderId: "920882217983",
  appId: "1:920882217983:web:c78ada6cc325dd6a099dca",
  measurementId: "G-DRFM7FXM21"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);

// Инициализация Firestore
const db = firebase.firestore();
