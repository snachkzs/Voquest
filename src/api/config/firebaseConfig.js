import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBtniUEeeYkmAzE7p_hQeubA-RKvwzLWDU",
  authDomain: "voquest-7ef97.firebaseapp.com",
  projectId: "voquest-7ef97",
  storageBucket: "voquest-7ef97.firebasestorage.app",
  messagingSenderId: "518215867323",
  appId: "1:518215867323:web:2b45ffa03c13e76864c29e",
  measurementId: "G-CEZZJ9YLTE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Firestore with settings to prevent CORS errors
// Use persistent cache to minimize network requests
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }),
  experimentalForceLongPolling: false,
  experimentalAutoDetectLongPolling: true
});

export { app, auth, db };