// --- Firestore Data Module ---
// This module handles all interactions with the Firebase Firestore database.
// It contains functions for creating, reading, updating, and deleting data.

import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, where, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as state from './state.js';

// Get a handle to the Firestore database service.
const db = getFirestore();

/**
 * Publishes the current session data to the 'publishedRoutes' collection in Firestore.
 * @returns {Promise<boolean>} A promise that resolves to true on success, false on failure.
 */
async function publishRoute() {
    if (!state.currentUser) return false;
    if (state.routeCoordinates.length < 2 || state.photoPins.length === 0) {
        alert("You need a tracked route and at least one photo pin to publish.");
        return false;
    }

    try {
        const publicProfileRef = doc(db, "publicProfiles", state.currentUser.uid);
        const docSnap = await getDoc(publicProfileRef);
        if (!docSnap.exists()) throw new Error("Could not find your public profile.");
        
        const username = docSnap.data().username;

        await addDoc(collection(db, "publishedRoutes"), {
            userId: state.currentUser.uid,
            username: username,
            timestamp: new Date(),
            route: state.convertRouteForFirestore(state.routeCoordinates),
            pins: state.convertPinsForFirestore(state.photoPins)
        });
        return true; // Indicate success
    } catch (error) {
        console.error("Error publishing route:", error);
        alert("There was an error publishing your route.");
        return false; // Indicate failure
    }
}

/**
 * Saves the current session, either to local storage (for guests) or Firestore (for users).
 */
async function saveSession() {
    const dataModal = document.getElementById('dataModal');
    if (!state.currentUser) {
        const sessionName = prompt("Name this Litter Bugs session:", `Cleanup on ${new Date().toLocaleDateString()}`);
        if (sessionName) {
            const guestSessions = JSON.parse(localStorage.getItem('guestSessions')) || [];
            guestSessions.push({ sessionName, timestamp: new Date().toISOString(), pins: state.convertPinsForFirestore(state.photoPins), route: state.convertRouteForFirestore(state.routeCoordinates) });
            localStorage.setItem('guestSessions', JSON.stringify(guestSessions));
            alert(`Session "${sessionName}" saved locally.`);
            dataModal.style.display = 'none';
        }
        return;
    }
    const sessionName = prompt("Name this Litter Bugs session:", `Cleanup on ${new Date().toLocaleDateString()}`);
    if (sessionName) {
        try {
            await addDoc(collection(db, "users", state.currentUser.uid, "privateSessions"), { sessionName, timestamp: new Date(), pins: state.convertPinsForFirestore(state.photoPins), route: state.convertRouteForFirestore(state.routeCoordinates) });
            alert(`Session "${sessionName}" saved to your account!`);
            dataModal.style.display = 'none';
        } catch (error) { console.error("Error saving session:", error); alert("Could not save session."); }
    }
}

/**
 * Triggers the appropriate "load session" modal based on login state.
 */
async function loadSession() {
    if (!state.currentUser) {
        populateLocalSessionList();
        document.getElementById('localSessionsModal').style.display = 'flex';
        return;
    }
    await populateSessionList();
    document.getElementById('sessionsModal').style.display = 'flex';
}

/**
 * Fetches and displays a list of the user's own published routes for management.
 */
async function populatePublishedRoutesList() {
    const publishedRoutesList = document.getElementById('publishedRoutesList');
    publishedRoutesList.innerHTML = '<li>Loading your publications...</li>';
    try {
        const q = query(collection(db, "publishedRoutes"), where("userId", "==", state.currentUser.uid), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) { publishedRoutesList.innerHTML = '<li>You have not published any routes yet.</li>'; return; }
        publishedRoutesList.innerHTML = '';
        querySnapshot.forEach(doc => {
            const routeData = doc.data();
            const li = document.createElement('li');
            li.innerHTML = `<div><span>Route published on</span><br><small class="session-date">${new Date(routeData.timestamp.seconds * 1000).toLocaleString()}</small></div><button class="delete-session-btn">Delete</button>`;
            li.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); deletePublishedRoute(doc.id); });
            publishedRoutesList.appendChild(li);
        });
    } catch (error) { console.error("Error fetching published routes:", error); publishedRoutesList.innerHTML = '<li>Could not load publications.</li>'; }
}

/**
 * Deletes one of the user's published routes from the community map.
 */
async function deletePublishedRoute(routeId) {
    if (confirm("Are you sure you want to permanently delete this published route?")) {
        try {
            await deleteDoc(doc(db, "publishedRoutes", routeId));
            alert("Route deleted from the community map.");
            populatePublishedRoutesList();
            if (state.isCommunityViewOn) {
                state.clearCommunityRoutes();
                state.fetchAndDisplayCommunityRoutes();
            }
        } catch (error) { console.error("Error deleting published route:", error); alert("Failed to delete route."); }
    }
}

/**
 * Loads the user's public profile data into the "Edit Profile" modal.
 */
async function loadProfileForEditing() {
    if (!state.currentUser) return;
    try {
        const docSnap = await getDoc(doc(db, "publicProfiles", state.currentUser.uid));
        if (docSnap.exists()) {
            const profileData = docSnap.data();
            document.getElementById('bioInput').value = profileData.bio || '';
            document.getElementById('locationInput').value = profileData.location || '';
            document.getElementById('coffeeLinkInput').value = profileData.buyMeACoffeeLink || '';
        }
    } catch (error) { console.error("Error loading profile:", error); alert("Could not load your profile for editing."); }
}

/**
 * Saves the updated profile information to the user's public profile in Firestore.
 */
async function saveProfile() {
    if (!state.currentUser) return;
    const bio = document.getElementById('bioInput').value;
    const location = document.getElementById('locationInput').value;
    const coffeeLink = document.getElementById('coffeeLinkInput').value;
    try {
        const publicProfileRef = doc(db, "publicProfiles", state.currentUser.uid);
        await updateDoc(publicProfileRef, { bio, location, buyMeACoffeeLink: coffeeLink });
        alert("Profile updated successfully!");
        document.getElementById('profileModal').style.display = 'none';
    } catch (error) { console.error("Error saving profile:", error); alert("Error saving profile."); }
}

/**
 * Handles the permanent deletion of a user's account and all their data.
 */
async function handleAccountDeletion() {
    if (!state.currentUser) return;
    if (!confirm("DANGER: Are you absolutely sure you want to permanently delete your account? This action cannot be undone.")) return;
    if (!confirm("All of your private saved sessions and public routes will be deleted forever. Are you still sure?")) return;
    try {
        const userId = state.currentUser.uid;
        console.log("Starting account deletion for user:", userId);
        const privateSessionsQuery = query(collection(db, "users", userId, "privateSessions"));
        const privateSessionsSnapshot = await getDocs(privateSessionsQuery);
        await Promise.all(privateSessionsSnapshot.docs.map(d => deleteDoc(d.ref)));
        console.log("Private sessions deleted.");
        const publishedRoutesQuery = query(collection(db, "publishedRoutes"), where("userId", "==", userId));
        const publishedRoutesSnapshot = await getDocs(publishedRoutesQuery);
        await Promise.all(publishedRoutesSnapshot.docs.map(d => deleteDoc(d.ref)));
        console.log("Published routes deleted.");
        await deleteDoc(doc(db, "users", userId));
        await deleteDoc(doc(db, "publicProfiles", userId));
        console.log("User documents deleted.");
        await deleteUser(state.currentUser);
        alert("Your account and all associated data have been permanently deleted.");
        document.getElementById('profileModal').style.display = 'none';
    } catch (error) {
        console.error("Error deleting account:", error);
        if (error.code === 'auth/requires-recent-login') {
            alert("This is a sensitive operation. Please log out and log back in to delete your account.");
        } else { alert("An error occurred while deleting your account."); }
    }
}

/**
 * Handles the submission of the "Schedule a Meetup" form.
 */
async function handleMeetupSubmit() {
    if (!state.currentUser) return;
    const title = document.getElementById('meetupTitleInput').value.trim();
    const description = document.getElementById('meetupDescriptionInput').value.trim();
    const poiName = document.getElementById('poiNameInput').value;
    try {
        const publicProfileRef = doc(db, "publicProfiles", state.currentUser.uid);
        const docSnap = await getDoc(publicProfileRef);
        if (!docSnap.exists()) throw new Error("Could not find your public profile.");
        const username = docSnap.data().username;
        await addDoc(collection(db, "meetups"), {
            organizerId: state.currentUser.uid,
            organizerName: username,
            poiName: poiName,
            title: title,
            description: description,
            createdAt: new Date()
        });
        alert("Meetup scheduled successfully!");
        document.getElementById('meetupModal').style.display = 'none';
        document.getElementById('meetupTitleInput').value = '';
        document.getElementById('meetupDescriptionInput').value = '';
        document.getElementById('safetyCheckbox').checked = false;
    } catch (error) {
        console.error("Error scheduling meetup:", error);
        alert("There was an error scheduling your meetup.");
    }
}

// Export the functions so they can be imported and used by main.js.
export {
    publishRoute,
    saveSession,
    loadSession,
    populatePublishedRoutesList,
    deletePublishedRoute,
    loadProfileForEditing,
    saveProfile,
    handleAccountDeletion,
    handleMeetupSubmit
};

