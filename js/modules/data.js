// --- Firestore Data Module ---
// This module handles all interactions with the Firebase Firestore database.
// It contains functions for creating, reading, updating, and deleting data,
// as well as helper functions for converting data formats.

import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, where, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import * as state from './state.js';
import * as ui from './ui.js';
import * as map from './map.js';

const db = getFirestore();

// --- Data Conversion Helper Functions ---
export function convertRouteForFirestore(coordsArray) { if (!coordsArray) return []; return coordsArray.map(coord => ({ lng: coord[0], lat: coord[1] })); }
export function convertRouteFromFirestore(coordsData) { if (!coordsData || coordsData.length === 0) return []; if (Array.isArray(coordsData[0])) { return coordsData; } return coordsData.map(coord => [coord.lng, coord.lat]); }
export function convertPinsForFirestore(pinsArray) { if (!pinsArray) return []; return pinsArray.map(pin => { const newPin = { ...pin }; if (Array.isArray(newPin.coords)) { newPin.coords = { lng: newPin.coords[0], lat: newPin.coords[1] }; } return newPin; }); }
export function convertPinsFromFirestore(pinsData) { if (!pinsData || pinsData.length === 0) return []; return pinsData.map(pin => { const newPin = { ...pin }; if (newPin.coords && typeof newPin.coords === 'object' && !Array.isArray(newPin.coords)) { newPin.coords = [newPin.coords.lng, newPin.coords.lat]; } return newPin; }); }

export async function publishRoute() {
    if (!state.currentUser) return;
    if (state.routeCoordinates.length < 2 || state.photoPins.length === 0) {
        alert("You need a tracked route and at least one photo pin to publish.");
        return;
    }
    
    document.getElementById('menuModal').style.display = 'none';

    try {
        const publicProfileRef = doc(db, "publicProfiles", state.currentUser.uid);
        
        const beforeSnap = await getDoc(publicProfileRef);
        const badgesBefore = beforeSnap.exists() ? Object.keys(beforeSnap.data().badges || {}) : [];
        const username = beforeSnap.exists() ? beforeSnap.data().username : "Anonymous";

        await addDoc(collection(db, "publishedRoutes"), { 
            userId: state.currentUser.uid, 
            username, 
            timestamp: new Date(), 
            route: convertRouteForFirestore(state.routeCoordinates), 
            pins: convertPinsForFirestore(state.photoPins) 
        });
        
        let newBadgeFound = null;
        for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const afterSnap = await getDoc(publicProfileRef);
            const badgesAfter = afterSnap.exists() ? Object.keys(afterSnap.data().badges || {}) : [];
            const newBadges = badgesAfter.filter(badge => !badgesBefore.includes(badge));

            if (newBadges.length > 0) {
                newBadgeFound = newBadges[0];
                break;
            }
        }

        if (newBadgeFound) {
            ui.showAchievementPopup(newBadgeFound);
        } else {
            alert("Success! Your route has been published.");
        }
        map.clearCurrentSession();
    } catch (error) { 
        console.error("Error publishing route:", error); 
        alert("There was an error publishing your route."); 
    }
}

export async function saveSession() {
    const dataModal = document.getElementById('dataModal');
    if (!state.currentUser) {
        const sessionName = prompt("Name this Litter Bugs session:", `Cleanup on ${new Date().toLocaleDateString()}`);
        if (sessionName) {
            const guestSessions = JSON.parse(localStorage.getItem('guestSessions')) || [];
            guestSessions.push({ sessionName, timestamp: new Date().toISOString(), pins: convertPinsForFirestore(state.photoPins), route: convertRouteForFirestore(state.routeCoordinates) });
            localStorage.setItem('guestSessions', JSON.stringify(guestSessions));
            alert(`Session "${sessionName}" saved locally.`);
            dataModal.style.display = 'none';
        }
        return;
    }
    const sessionName = prompt("Name this Litter Bugs session:", `Cleanup on ${new Date().toLocaleDateString()}`);
    if (sessionName) {
        try {
            await addDoc(collection(db, "users", state.currentUser.uid, "privateSessions"), { sessionName, timestamp: new Date(), pins: convertPinsForFirestore(state.photoPins), route: convertRouteForFirestore(state.routeCoordinates) });
            alert(`Session "${sessionName}" saved to your account!`);
            dataModal.style.display = 'none';
        } catch (error) { console.error("Error saving session:", error); alert("Could not save session."); }
    }
}

export async function loadSession() {
    if (!state.currentUser) {
        populateLocalSessionList();
        document.getElementById('localSessionsModal').style.display = 'flex';
        return;
    }
    await populateSessionList();
    document.getElementById('sessionsModal').style.display = 'flex';
}

export function populateLocalSessionList() {
    const localSessionList = document.getElementById('localSessionList');
    const guestSessions = JSON.parse(localStorage.getItem('guestSessions')) || [];
    localSessionList.innerHTML = '';
    if (guestSessions.length === 0) { localSessionList.innerHTML = '<li>No locally saved sessions found.</li>'; return; }
    guestSessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).forEach((sessionData, index) => {
        const li = document.createElement('li');
        li.innerHTML = `<div><span>${sessionData.sessionName}</span><br><small class="session-date">${new Date(sessionData.timestamp).toLocaleDateString()}</small></div><button class="delete-session-btn">Delete</button>`;
        li.querySelector('div').addEventListener('click', () => loadSpecificLocalSession(index));
        li.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); deleteLocalSession(index, sessionData.sessionName); });
        localSessionList.appendChild(li);
    });
}

export function deleteLocalSession(sessionIndex, sessionName) {
    if (confirm(`Are you sure you want to delete "${sessionName}"?`)) {
        let guestSessions = JSON.parse(localStorage.getItem('guestSessions')) || [];
        guestSessions.splice(sessionIndex, 1);
        localStorage.setItem('guestSessions', JSON.stringify(guestSessions));
        alert("Session deleted.");
        populateLocalSessionList();
    }
}

export function loadSpecificLocalSession(sessionIndex) {
    const guestSessions = JSON.parse(localStorage.getItem('guestSessions')) || [];
    const sessionData = guestSessions[sessionIndex];
    if (sessionData) {
        map.clearCurrentSession();
        const convertedData = { ...sessionData, pins: convertPinsFromFirestore(sessionData.pins), route: convertRouteFromFirestore(sessionData.route) };
        map.displaySessionData(convertedData);
        alert(`Session "${sessionData.sessionName}" loaded!`);
        document.getElementById('localSessionsModal').style.display = 'none';
        document.getElementById('centerOnRouteBtn').classList.remove('disabled');
    }
}

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
            li.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); deletePrivateSession(doc.id, sessionData.sessionName); });
            sessionList.appendChild(li);
        });
    } catch (error) { console.error("Error fetching sessions:", error); sessionList.innerHTML = '<li>Could not load sessions.</li>'; }
}

export async function deletePrivateSession(sessionId, sessionName) {
    if (confirm(`Are you sure you want to delete "${sessionName}"?`)) {
        try {
            await deleteDoc(doc(db, "users", state.currentUser.uid, "privateSessions", sessionId));
            alert("Session deleted.");
            populateSessionList();
        } catch (error) { console.error("Error deleting session:", error); alert("Failed to delete session."); }
    }
}

export async function loadSpecificSession(sessionId) {
    try {
        const docSnap = await getDoc(doc(db, "users", state.currentUser.uid, "privateSessions", sessionId));
        if (docSnap.exists()) {
            map.clearCurrentSession();
            const sessionData = docSnap.data();
            map.displaySessionData({ ...sessionData, pins: convertPinsFromFirestore(sessionData.pins), route: convertRouteFromFirestore(sessionData.route) });
            alert(`Session "${sessionData.sessionName}" loaded!`);
            document.getElementById('sessionsModal').style.display = 'none';
            document.getElementById('centerOnRouteBtn').classList.remove('disabled');
        }
    } catch (error) { console.error("Error loading specific session:", error); alert("Failed to load session."); }
}

export function exportGeoJSON() {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `litter_bugs_data_${timestamp}.geojson`;
    const pinFeatures = state.photoPins.map(pin => ({ type: 'Feature', geometry: { type: 'Point', coordinates: pin.coords }, properties: { title: pin.title, image_url: pin.imageURL || 'local_data', category: pin.category } }));
    const routeFeature = { type: 'Feature', geometry: { type: 'LineString', coordinates: state.routeCoordinates }, properties: {} };
    const geojson = { type: 'FeatureCollection', features: [...pinFeatures, routeFeature] };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geojson, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    document.getElementById('dataModal').style.display = 'none';
}

export async function populatePublishedRoutesList() {
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

export async function deletePublishedRoute(routeId) {
    if (confirm("Are you sure you want to permanently delete this published route?")) {
        try {
            await deleteDoc(doc(db, "publishedRoutes", routeId));
            alert("Route deleted from the community map.");
            populatePublishedRoutesList();
            if (state.isCommunityViewOn) {
                map.clearCommunityRoutes();
                map.fetchAndDisplayCommunityRoutes();
            }
        } catch (error) { console.error("Error deleting published route:", error); alert("Failed to delete route."); }
    }
}

export async function loadProfileForEditing() {
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

export async function saveProfile() {
    if (!state.currentUser) return;
    const bio = document.getElementById('bioInput').value, location = document.getElementById('locationInput').value, coffeeLink = document.getElementById('coffeeLinkInput').value;
    try {
        const publicProfileRef = doc(db, "publicProfiles", state.currentUser.uid);
        await updateDoc(publicProfileRef, { bio, location, buyMeACoffeeLink: coffeeLink });
        alert("Profile updated successfully!");
        document.getElementById('profileModal').style.display = 'none';
    } catch (error) { console.error("Error saving profile:", error); alert("Error saving profile."); }
}

export async function handleAccountDeletion() {
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

export async function handleMeetupSubmit() {
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

