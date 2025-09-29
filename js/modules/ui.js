// --- UI Module ---
// This module handles all direct manipulation of the DOM.

import { getFirestore, doc, getDoc, collection, query, orderBy, limit, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as state from './state.js';
import { allBadges, profanityList } from './config.js';
import { calculateRouteDistance, updateUserPinsSource, createAndAddMarker } from './map.js';
import { db } from './firebase.js';
// CRITICAL FIX: Import session functions from data.js
import { loadSpecificSession, deletePrivateSession, populateLocalSessionList, loadSpecificLocalSession, deleteLocalSession } from './data.js'; 

// ... (updateAuthModalUI, showPublicProfile, and other functions are unchanged) ...

export async function populateSessionList() {
    const sessionList = document.getElementById('sessionList');
    sessionList.innerHTML = '<li>Loading...</li>';
    try {
        const q = query(collection(db, "users", state.currentUser.uid, "privateSessions"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        sessionList.innerHTML = '';
        if (querySnapshot.empty) { sessionList.innerHTML = '<li>No saved cloud sessions found.</li>'; return; }
        querySnapshot.forEach(doc => {
            const sessionData = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<div><span>${sessionData.sessionName}</span><br><small class="session-date">${new Date(sessionData.timestamp.seconds * 1000).toLocaleDateString()}</small></div><button class="delete-session-btn">Delete</button>`;
            li.querySelector('div').addEventListener('click', () => loadSpecificSession(doc.id));
            // CRITICAL FIX: The event listener now calls the imported function and refreshes the list itself.
            li.querySelector('button').addEventListener('click', async (e) => { 
                e.stopPropagation(); 
                if (confirm(`Are you sure you want to delete "${sessionData.sessionName}"?`)) {
                    const success = await deletePrivateSession(doc.id);
                    if (success) {
                        populateSessionList(); // Refresh the list
                    }
                }
            });
            sessionList.appendChild(li);
        });
    } catch (error) { console.error("Error fetching sessions:", error); sessionList.innerHTML = '<li>Could not load sessions.</li>'; }
}

// ... (The rest of the ui.js file is correct)

