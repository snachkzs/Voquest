import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtniUEeeYkmAzE7p_hQeubA-RKvwzLWDU",
  authDomain: "voquest-7ef97.firebaseapp.com",
  projectId: "voquest-7ef97",
  storageBucket: "voquest-7ef97.firebasestorage.app",
  messagingSenderId: "518215867323",
  appId: "1:518215867323:web:2b45ffa03c13e76864c29e",
  measurementId: "G-CEZZJ9YLTE"
};

let app, auth, db;

if (!window.__VOQUEST_FIREBASE_INITIALIZED__) {
  console.log('[Firebase] Initializing Firebase app...');
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  window.__VOQUEST_FIREBASE_INITIALIZED__ = true;
  window.voquestAuthInstance = auth;
  window.voquestDbInstance = db;
  window.voquestAppInstance = app;
  
  console.log('[Firebase] Firebase initialized successfully');
} else {
  console.log('[Firebase] Reusing existing Firebase instances');
  app = window.voquestAppInstance;
  auth = window.voquestAuthInstance;
  db = window.voquestDbInstance;
}

export { app, auth, db };