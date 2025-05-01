// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAxWx3NGhZQRVmXDJ6ZhUX7-C90FkiNoJU",
  authDomain: "paymanni.firebaseapp.com",
  projectId: "paymanni",
  storageBucket: "paymanni.appspot.com", // corrected `.firebasestorage.app` → `.appspot.com`
  messagingSenderId: "316780867025",
  appId: "1:316780867025:web:bdd7a2be3c41f7056244f0",
  measurementId: "G-SN2WVLXGWM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
