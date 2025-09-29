// --- UI Module ---
// This module handles all direct manipulation of the DOM (showing/hiding modals,
// updating text, building lists, etc.). It is the bridge between the application's
// data and what the user sees on the screen.

import { doc, getDoc, collection, query, orderBy, limit, where, onSnapshot, getDocs } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { state } from './config.js';
import { allBadges, profanityList } from './config.js';
import { checkAndClearOldData, calculateRouteDistance } from './utils.js';
import { db } from './firebase.js';
import { saveSession, loadSession, exportGeoJSON } from './data.js'; // This is correct
import { initializeMap, changeMapStyle, centerOnRoute } from './map.js';
import { initializeAuthListener } from './auth.js';

export function updateAuthModalUI() {
    const authForm = document.getElementById('authForm');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    const authActionBtn = document.getElementById('authActionBtn');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    
    document.getElementById('authError').textContent = '';

    if (state.isSignUpMode) {
        authTitle.textContent = 'Create a Litter Bugs Account';
        authSubtitle.innerHTML = 'Or <a href="#" id="switchAuthModeLink">log in to an existing account.</a>';
        authActionBtn.textContent = 'Sign Up';
        authForm.classList.add('signup-mode');
        authForm.classList.remove('login-mode');
    } else {
        authTitle.textContent = 'Log In to Litter Bugs';
        authSubtitle.innerHTML = 'Or <a href="#" id="switchAuthModeLink">create a new account.</a>';
        authActionBtn.textContent = 'Log In';
        authForm.classList.add('login-mode');
        authForm.classList.remove('signup-mode');
    }

    const isEmailValid = emailInput.value.includes('@');
    const isPasswordValid = passwordInput.value.length >= 6;
    const isUsernameValid = document.getElementById('usernameInput').value.trim().length >= 3;
    const isAgeChecked = document.getElementById('ageCheckbox').checked;

    authActionBtn.disabled = state.isSignUpMode ? 
        !(isEmailValid && isPasswordValid && isUsernameValid && isAgeChecked) : 
        !(isEmailValid && isPasswordValid);
}

export async function showPublicProfile(userId) {
    if (!userId) return;
    try {
        const publicProfileRef = doc(db, "publicProfiles", userId);
        const docSnap = await getDoc(publicProfileRef);

        if (docSnap.exists()) {
            const profileData = docSnap.data();
            const publicProfileModal = document.getElementById('publicProfileModal');
            const profileSupportBtn = document.getElementById('profileSupportBtn');
            const profileAchievementsContainer = document.getElementById('profileAchievements');
            const profileStatsContainer = document.getElementById('profileStats');

            document.getElementById('profileUsername').textContent = profileData.username || 'Anonymous User';
            document.getElementById('profileLocation').textContent = profileData.location || '';
            document.getElementById('profileBio').textContent = profileData.bio || 'This user has not written a bio yet.';
            
            const distanceMiles = ((profileData.totalDistance || 0) * 0.000621371).toFixed(2);
            profileStatsContainer.innerHTML = `
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${profileData.totalPins || 0}</div>
                    <div class="profile-stat-label">Items Pinned</div>
                </div>
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${distanceMiles}</div>
                    <div class="profile-stat-label">Miles Cleaned</div>
                </div>
                <div class="profile-stat-card">
                    <div class="profile-stat-value">${profileData.totalRoutes || 0}</div>
                    <div class="profile-stat-label">Routes Completed</div>
                </div>
            `;

            profileAchievementsContainer.innerHTML = '';
            const userBadges = profileData.badges || {};
            let earnedBadgesCount = 0;
            for (const badgeKey in allBadges) {
                if (userBadges[badgeKey] === true) {
                    earnedBadgesCount++;
                    const badgeInfo = allBadges[badgeKey];
                    const badgeElement = document.createElement('div');
                    badgeElement.className = 'badge-item';
                    badgeElement.textContent = badgeInfo.icon;
                    badgeElement.title = `${badgeInfo.name}: ${badgeInfo.description}`;
                    profileAchievementsContainer.appendChild(badgeElement);
                }
            }
            if (earnedBadgesCount === 0) {
                profileAchievementsContainer.innerHTML = '<p class="no-badges-message">This user hasn\'t earned any badges yet.</p>';
            }

            if (profileData.buyMeACoffeeLink) {
                profileSupportBtn.style.display = 'block';
                profileSupportBtn.onclick = () => window.open(profileData.buyMeACoffeeLink, '_blank');
            } else {
                profileSupportBtn.style.display = 'none';
            }
            publicProfileModal.style.display = 'flex';
        } else {
            alert("Could not find this user's profile.");
        }
    } catch (error) {
        console.error("Error fetching public profile:", error);
        alert("Error loading profile.");
    }
}

export function createPinPopup(pinInfo, type, routeInfo = {}) {
    let popupHTML;
    if (type === 'user') {
        const categories = ['Plastic', 'Glass', 'Metal', 'Paper', 'Other'];
        const optionsHTML = categories.map(cat => `<option value="${cat}" ${pinInfo.category === cat ? 'selected' : ''}>${cat}</option>`).join('');
        popupHTML = `<div><img src="${pinInfo.imageURL || pinInfo.image}" alt="User photo" style="width:100%; height:auto; border-radius: 4px;"/><div class="pin-popup-form"><input type="text" id="title-${pinInfo.id}" value="${pinInfo.title}" placeholder="Enter a title"><select id="category-${pinInfo.id}">${optionsHTML}</select><div style="display: flex; justify-content: space-between; gap: 10px;"><button id="update-${pinInfo.id}" style="flex-grow: 1;">Update</button><button id="delete-${pinInfo.id}" style="background-color: #dc3545;">Delete</button></div></div></div>`;
    } else {
        popupHTML = `<div><img src="${pinInfo.imageURL}" alt="Community photo" style="width:100%; border-radius: 4px;"/><p style="margin: 5px 0 0;"><strong>${pinInfo.title}</strong></p><p style="margin: 5px 0 0; font-style: italic; color: #555;">Category: ${pinInfo.category || 'Other'}</p><small>By: <a href="#" class="profile-link" data-userid="${routeInfo.userId}">${routeInfo.username || 'A user'}</a></small></div>`;
    }
    const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(popupHTML);
    popup.on('open', () => {
        if (type === 'user') {
            document.getElementById(`update-${pinInfo.id}`)?.addEventListener('click', () => {
                const pin = state.photoPins.find(p => p.id === pinInfo.id);
                if (pin) {
                    pin.title = document.getElementById(`title-${pinInfo.id}`).value;
                    pin.category = document.getElementById(`category-${pinInfo.id}`).value;
                }
                popup.remove(); alert("Pin updated! Remember to save your session.");
            });
            document.getElementById(`delete-${pinInfo.id}`)?.addEventListener('click', () => {
                if (confirm("Are you sure?")) {
                    state.setPhotoPins(state.photoPins.filter(p => p.id !== pinInfo.id));
                    const markerToRemove = state.userMarkers.find(m => {
                        const lngLat = m.getLngLat();
                        return lngLat.lng === pinInfo.coords[0] && lngLat.lat === pinInfo.coords[1];
                    });
                    if (markerToRemove) {
                        markerToRemove.remove();
                        state.setUserMarkers(state.userMarkers.filter(m => m !== markerToRemove));
                    }
                    updateUserPinsSource();
                    popup.remove();
                }
            });
        } else {
            document.querySelector(`.profile-link[data-userid="${routeInfo.userId}"]`)?.addEventListener('click', (e) => {
                e.preventDefault();
                showPublicProfile(routeInfo.userId);
            });
        }
    });
    return popup;
}

export function showAchievementPopup(badgeKey) {
    const badge = allBadges[badgeKey];
    if (!badge) return;
    const achievementModal = document.getElementById('achievementModal');
    const iconEl = achievementModal.querySelector('.achievement-icon');
    const nameEl = document.getElementById('achievementName');
    const descEl = document.getElementById('achievementDescription');
    iconEl.textContent = badge.icon;
    nameEl.textContent = badge.name;
    descEl.textContent = badge.description;
    achievementModal.style.display = 'flex';
}

export function openMeetupModal(poiName) {
    if (!state.currentUser) {
        alert("Please log in to schedule a meetup.");
        return;
    }
    document.getElementById('meetupLocationName').textContent = poiName;
    document.getElementById('poiNameInput').value = poiName;
    document.getElementById('meetupModal').style.display = 'flex';
    validateMeetupForm();
}

export function openViewMeetupsModal(poiName) {
    document.getElementById('viewMeetupsLocationName').textContent = poiName;
    const meetupsList = document.getElementById('meetupsList');
    meetupsList.innerHTML = '<li>Loading meetups...</li>';
    document.getElementById('viewMeetupsModal').style.display = 'flex';
    const q = query(collection(db, "meetups"), where("poiName", "==", poiName), orderBy("createdAt", "desc"));
    onSnapshot(q, (querySnapshot) => {
        if (querySnapshot.empty) {
            meetupsList.innerHTML = '<li>No meetups scheduled for this location yet. Be the first!</li>';
            return;
        }
        meetupsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const meetup = doc.data();
            const li = document.createElement('li');
            const date = meetup.createdAt.toDate().toLocaleDateString();
            li.innerHTML = `
                <div>
                    <span>${meetup.title}</span><br>
                    <small class="session-date">Organized by: ${meetup.organizerName} on ${date}</small>
                    <p style="margin-top: 5px; white-space: pre-wrap;">${meetup.description}</p>
                </div>
            `;
            meetupsList.appendChild(li);
        });
    });
}

export function validateMeetupForm() {
    const title = document.getElementById('meetupTitleInput').value.trim();
    const description = document.getElementById('meetupDescriptionInput').value.trim();
    const safetyChecked = document.getElementById('safetyCheckbox').checked;
    const createBtn = document.getElementById('createMeetupBtn');
    const profanityWarning = document.getElementById('profanityWarning');
    const hasProfanity = profanityList.some(word => title.toLowerCase().includes(word) || description.toLowerCase().includes(word));
    if (hasProfanity) {
        profanityWarning.style.display = 'block';
    } else {
        profanityWarning.style.display = 'none';
    }
    createBtn.disabled = !(title && description && safetyChecked && !hasProfanity);
}

export function showCleanupSummary() {
    if (!state.trackingStartTime) return;
    const durationMs = new Date() - state.trackingStartTime;
    const distanceMeters = calculateRouteDistance(state.routeCoordinates);
    const pinsCount = state.photoPins.length;
    const distanceMiles = (distanceMeters * 0.000621371).toFixed(2);
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    document.getElementById('summaryDistance').textContent = `${distanceMiles} mi`;
    document.getElementById('summaryPins').textContent = pinsCount;
    document.getElementById('summaryDuration').textContent = `${minutes}m ${seconds}s`;
    document.getElementById('summaryModal').style.display = 'flex';
    state.setTrackingStartTime(null);
}

export async function shareCleanupResults() {
    const distance = document.getElementById('summaryDistance').textContent;
    const pins = document.getElementById('summaryPins').textContent;
    const shareText = `I just cleaned up ${distance} and pinned ${pins} items with the Litter Bugs app! Join the movement and help clean our planet. #LitterBugs #Cleanup`;
    const shareData = {
        title: 'My Litter Bugs Cleanup!',
        text: shareText,
        url: 'https://www.litter-bugs.com/'
    };
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            console.log('Cleanup shared successfully!');
        } catch (err) {
            console.error('Error sharing:', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(shareText + " " + shareData.url);
            alert('Cleanup stats copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy: ', err);
            alert('Sharing is not supported on this browser.');
        }
    }
}

export async function fetchAndDisplayLeaderboard(metric) {
    const leaderboardList = document.getElementById('leaderboardList');
    if (!leaderboardList) return;
    leaderboardList.innerHTML = '<li>Loading...</li>';
    try {
        const profilesRef = collection(db, "publicProfiles");
        const q = query(profilesRef, orderBy(metric, "desc"), limit(10));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            leaderboardList.innerHTML = '<li>No user data yet. Be the first!</li>';
            return;
        }
        leaderboardList.innerHTML = '';
        let rank = 1;
        querySnapshot.forEach(doc => {
            const profileData = doc.data();
            const li = document.createElement('li');
            li.dataset.userid = doc.id;
            const score = metric === 'totalDistance'
                ? `${((profileData.totalDistance || 0) * 0.000621371).toFixed(2)} mi`
                : (profileData.totalPins || 0);
            li.innerHTML = `
                <span class="leaderboard-rank">${rank}.</span>
                <span class="leaderboard-name"><a href="#" class="leaderboard-profile-link">${profileData.username}</a></span>
                <span class="leaderboard-score">${score}</span>
            `;
            leaderboardList.appendChild(li);
            rank++;
        });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        leaderboardList.innerHTML = '<li>Could not load leaderboard data.</li>';
        if (error.code === 'failed-precondition') {
            alert("Leaderboard data requires a new database index. Please check the browser console for a link to create it automatically.");
        }
    }
}

export async function fetchAndDisplayMyStats() {
    const myStatsContainer = document.getElementById('myStatsContainer');
    myStatsContainer.innerHTML = '';
    if (!state.currentUser) {
        myStatsContainer.innerHTML = '<p class="login-prompt">Please log in to view your personal stats.</p>';
        return;
    }
    try {
        const publicProfileRef = doc(db, "publicProfiles", state.currentUser.uid);
        const publicProfileSnap = await getDoc(publicProfileRef);

        if (!publicProfileSnap.exists()) {
            myStatsContainer.innerHTML = '<p class="login-prompt">Could not find your profile data.</p>';
            return;
        }
        const profileData = publicProfileSnap.data();
        const distanceMiles = ((profileData.totalDistance || 0) * 0.000621371).toFixed(2);
        let statsHTML = `
            <div class="my-stats-grid">
                <div class="stat-card">
                    <div class="my-stats-value">${profileData.totalPins || 0}</div>
                    <div class="my-stats-label">Items Pinned</div>
                </div>
                <div class="stat-card">
                    <div class="my-stats-value">${distanceMiles}</div>
                    <div class="my-stats-label">Miles Cleaned</div>
                </div>
                <div class="stat-card">
                    <div class="my-stats-value">${profileData.totalRoutes || 0}</div>
                    <div class="my-stats-label">Routes Completed</div>
                </div>
            </div>
            <h4>My Achievements</h4>
            <div class="my-stats-badges">
                <div class="badge-container">
        `;
        const userBadges = profileData.badges || {};
        let earnedBadgesCount = 0;
        for (const badgeKey in allBadges) {
            if (userBadges[badgeKey] === true) {
                earnedBadgesCount++;
                const badgeInfo = allBadges[badgeKey];
                statsHTML += `
                    <div class="badge-item" title="${badgeInfo.name}: ${badgeInfo.description}">
                        ${badgeInfo.icon}
                    </div>
                `;
            }
        }
        if (earnedBadgesCount === 0) {
            statsHTML += '<p class="no-badges-message">You haven\'t earned any badges yet. Keep cleaning!</p>';
        }
        statsHTML += `</div></div>`;
        myStatsContainer.innerHTML = statsHTML;
    } catch (error) {
        console.error("Error fetching your stats:", error);
        myStatsContainer.innerHTML = '<p class="login-prompt">Could not load your stats.</p>';
    }
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
        li.querySelector('button').addEventListener('click', (e) => { 
            e.stopPropagation(); 
            if (confirm(`Are you sure you want to delete "${sessionData.sessionName}"?`)) {
                deleteLocalSession(index);
                populateLocalSessionList();
            }
        });
        localSessionList.appendChild(li);
    });
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
            li.querySelector('button').addEventListener('click', async (e) => { 
                e.stopPropagation(); 
                if (confirm(`Are you sure you want to delete "${sessionData.sessionName}"?`)) {
                    const success = await deletePrivateSession(doc.id);
                    if (success) {
                        populateSessionList();
                    }
                }
            });
            sessionList.appendChild(li);
        });
    } catch (error) { console.error("Error fetching sessions:", error); sessionList.innerHTML = '<li>Could not load sessions.</li>'; }
}

/**
 * Main initializer for the entire UI. This function should be exported.
 */
export function initializeUI() {
    // 1. Create the map
    initializeMap();

    // 2. Start listening for user login/logout changes
    initializeAuthListener();

    // 3. Attach all the button click listeners
    attachEventListeners();

    // 4. Check if the user has already accepted the terms
    if (sessionStorage.getItem('termsAccepted')) {
        elements.termsModal.style.display = 'none';
        document.getElementById('userStatus').style.display = 'flex';
    } else {
        elements.termsModal.style.display = 'flex';
    }
}

/**
 * Updates the UI to reflect the user's login status.
 * This function must be exported so it can be called from auth.js.
 * @param {boolean} isLoggedIn - Whether the user is logged in.
 * @param {string} [username] - The user's name to display.
 */
export function updateLoggedInStatusUI(isLoggedIn, username = '') {
    // Get references to all the UI elements that change
    const userStatus = document.getElementById('userStatus');
    const loggedInContent = document.getElementById('loggedInContent');
    const guestContent = document.getElementById('guestContent');
    const userEmailSpan = document.getElementById('userEmail');
    const authModal = document.getElementById('authModal');
    const publishBtn = document.getElementById('publishBtn');
    const managePublicationsBtn = document.getElementById('managePublicationsBtn');
    const editProfileBtn = document.getElementById('editProfileBtn');

    // This container is always visible once the terms are accepted
    if (userStatus) userStatus.style.display = 'flex';

    if (isLoggedIn) {
        // --- UI State for a Logged-In User ---
        if (userEmailSpan) userEmailSpan.textContent = `Logged in as: ${username}`;
        if (loggedInContent) loggedInContent.style.display = 'flex';
        if (guestContent) guestContent.style.display = 'none';
        if (authModal) authModal.style.display = 'none'; // Close the login modal if it's open
        if (publishBtn) publishBtn.style.display = 'block';
        if (managePublicationsBtn) managePublicationsBtn.style.display = 'block';
        if (editProfileBtn) editProfileBtn.style.display = 'block';
    } else {
        // --- UI State for a Guest User ---
        if (loggedInContent) loggedInContent.style.display = 'none';
        if (guestContent) guestContent.style.display = 'block';
        if (publishBtn) publishBtn.style.display = 'none';
        if (managePublicationsBtn) managePublicationsBtn.style.display = 'none';
        if (editProfileBtn) editProfileBtn.style.display = 'none';
    }
}
