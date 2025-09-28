// --- Authentication Module ---
// This module handles all Firebase Authentication logic, such as creating new users and signing them in.

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Get handles to the Firebase services.
const auth = getAuth();
const db = getFirestore();

/**
 * Handles the user sign-up process. It creates a new user in Firebase Authentication
 * and then creates their corresponding private 'user' and public 'publicProfile' documents in Firestore.
 */
async function handleSignUp() {
    // Get user inputs from the form.
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const username = document.getElementById('usernameInput').value;
    const ageCheckbox = document.getElementById('ageCheckbox');
    const authError = document.getElementById('authError');
    authError.textContent = '';

    // Validate the inputs.
    if (!ageCheckbox.checked) {
        authError.textContent = 'You must certify that you are 18 or older to sign up.';
        return;
    }
    if (!username || username.trim().length < 3) {
        authError.textContent = 'Username must be at least 3 characters.';
        return;
    }

    try {
        // Create the user with Firebase Auth.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;

        // Create the private user document with stats.
        await setDoc(doc(db, "users", userId), { 
            email: userCredential.user.email, 
            totalPins: 0, 
            totalDistance: 0, 
            totalRoutes: 0 
        });

        // Create the public-facing profile document with public info.
        await setDoc(doc(db, "publicProfiles", userId), { 
            username: username, 
            bio: "This user is new to Litter Bugs!", 
            location: "", 
            buyMeACoffeeLink: "", 
            badges: {},
            totalPins: 0,
            totalDistance: 0,
            totalRoutes: 0
        });
    } catch (error) { 
        // Display any errors to the user.
        authError.textContent = error.message; 
    }
}

/**
 * Handles the user login process.
 */
async function handleLogIn() {
    // Get user inputs from the form.
    const email = document.getElementById('emailInput').value;
    const password = document.getElementById('passwordInput').value;
    const authError = document.getElementById('authError');
    authError.textContent = '';

    try {
        // Sign the user in with Firebase Auth.
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        // Display any errors to the user.
        authError.textContent = error.message;
    }
}

// Export the functions so they can be imported and used by main.js.
export { auth, handleSignUp, handleLogIn };

