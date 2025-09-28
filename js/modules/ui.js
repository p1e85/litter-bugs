// --- UI Module ---
// This module handles all direct manipulation of the DOM (showing/hiding modals,
// updating text, building lists, etc.). It is the bridge between the application's
// data and what the user sees on the screen.

import { getFirestore, doc, getDoc, collection, query, orderBy, limit, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as state from './state.js';
import { allBadges, profanityList } from './config.js';
import { calculateRouteDistance, updateUserPinsSource } from './map.js';
import { showPublicProfile } from './ui.js';

const db = getFirestore();

/**
 * Updates the UI of the authentication modal to switch between "Log In" and "Sign Up" modes.
 */
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

/**
 * Fetches and displays another user's public profile in a modal.
 * @param {string} userId The ID of the user whose profile to show.
 */
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

/**
 * Displays the "Achievement Unlocked!" modal for a newly earned badge.
 * @param {string} badgeKey The key of the badge from the `allBadges` object.
 */
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

/**
 * Opens the "Schedule a Meetup" modal and pre-fills the location name.
 * @param {string} poiName The name of the Point of Interest.
 */
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

/**
 * Opens the "View Meetups" modal and fetches the list of meetups for that location.
 * @param {string} poiName The name of the Point of Interest.
 */
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

/**
 * Validates the meetup form to enable/disable the "Create" button.
 */
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

/**
 * Calculates and displays the post-cleanup summary modal with stats.
 */
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

/**
 * Gathers stats from the summary modal and uses the Web Share API.
 */
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

/**
 * Fetches the top 10 users from Firestore and displays them in the leaderboard modal.
 */
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

/**
 * Fetches and displays the current user's personal lifetime stats in the leaderboard modal.
 */
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

