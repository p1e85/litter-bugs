// This module handles all Firebase Authentication logic.
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as state from './state.js';

const auth = getAuth();
const db = getFirestore();

// You can add more functions like handlePasswordReset here in the future.

export { auth, handleSignUp, handleLogIn };
