import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth,GoogleAuthProvider } from "firebase/auth";

// ✅ Ensure you have the correct Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAzeL95aROrUTRbfeJ-jcRNC66Nri0NDaM",
  authDomain: "madadgaar-1122.firebaseapp.com",
  projectId: "madadgaar-1122",
  storageBucket: "madadgaar-1122.appspot.com", // 🔹 FIXED: ".app" nahi hota
  messagingSenderId: "811323347917",
  appId: "1:811323347917:web:d99c28d85dfe8257416a84",
  measurementId: "G-QQSM62371F"
};

// ✅ Initialize Firebase first
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export const Provider=new GoogleAuthProvider();

export { app, db, auth };
