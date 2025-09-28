// --- Main Application Entry Point ---
// This file is the new "brain" of the application. It imports functionality
// from the specialized modules and connects them to the HTML elements.

import { firebaseConfig } from './modules/config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Import modules
import * as state from './modules/state.js';
import * as auth from './modules/auth.js';
import * as ui from './modules/ui.js';
import * as map from './modules/map.js';
import * as data from './modules/data.js';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(); // Make sure to import getFirestore
const storage = getStorage(); // Make sure to import getStorage
console.log("Firebase Initialized!");


// --- Main App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    // --- Get All Element References ---
    // (This section remains the same, getting all the button and modal elements)
    const infoBtn = document.getElementById('infoBtn');
    // ... etc.

    // --- Initialize the Map ---
    map.initializeMap('map'); // Pass the ID of the map container

    // --- Set up all Event Listeners ---
    // This is where we connect the HTML buttons to the functions in our modules.
    infoBtn.addEventListener('click', ui.showInfoModal);
    communityBtn.addEventListener('click', map.toggleCommunityView);
    trackBtn.addEventListener('click', map.toggleTracking);
    authActionBtn.addEventListener('click', () => {
        if (state.isSignUpMode) {
            auth.handleSignUp();
        } else {
            auth.handleLogIn();
        }
    });
    // ... and so on for all other buttons.
});
