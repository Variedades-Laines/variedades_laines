import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDG5ut-Rc6bZZTYulq3Ak3w2fU0TXcejDo",
  authDomain: "variedades-laines-15301.firebaseapp.com",
  projectId: "variedades-laines-15301",
  storageBucket: "variedades-laines-15301.firebasestorage.app",
  messagingSenderId: "586654095904",
  appId: "1:586654095904:web:edad5b0aeedc689b85fa45"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { db, storage, auth };
