import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { firebaseConfig } from './modules/config.js';
import * as state from './modules/state.js';
import { handleSignUp, handleLogIn } from './modules/auth.js';
import { updateAuthModalUI, showPublicProfile, fetchAndDisplayLeaderboard, fetchAndDisplayMyStats, validateMeetupForm, showCleanupSummary, shareCleanupResults } from './modules/ui.js';
import { initializeMap, changeMapStyle, findMe, toggleTracking, startTracking, centerOnRoute, handlePhoto, toggleCommunityView } from './modules/map.js';
import { checkAndClearOldData, publishRoute, saveSession, loadSession, exportGeoJSON, populatePublishedRoutesList, loadProfileForEditing, saveProfile, handleAccountDeletion, handleMeetupSubmit } from './modules/data.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
state.setDb(db);
state.setAuth(auth);
state.setStorage(storage);
console.log("Firebase Initialized!");

document.addEventListener('DOMContentLoaded', () => {
    checkAndClearOldData();
    const termsModal = document.getElementById('termsModal');
    const authModal = document.getElementById('authModal');
    const agreeBtn = document.getElementById('agreeBtn');
    const termsCheckbox = document.getElementById('termsCheckbox');
    const skipBtn = document.getElementById('skipBtn');
    const findMeBtn = document.getElementById('findMeBtn');
    const trackBtn = document.getElementById('trackBtn');
    const pictureBtn = document.getElementById('pictureBtn');
    const cameraInput = document.getElementById('cameraInput');
    const dataBtn = document.getElementById('dataBtn');
    const dataModal = document.getElementById('dataModal');
    const closeDataModalBtn = dataModal.querySelector('.close-btn');
    const saveBtn = document.getElementById('saveBtn');
    const loadBtn = document.getElementById('loadBtn');
    const exportBtn = document.getElementById('exportBtn');
    const communityBtn = document.getElementById('communityBtn');
    const publishBtn = document.getElementById('publishBtn');
    const loginSignupBtn = document.getElementById('loginSignupBtn');
    const sessionsModal = document.getElementById('sessionsModal');
    const sessionsModalCloseBtn = sessionsModal.querySelector('.close-btn');
    const localSessionsModal = document.getElementById('localSessionsModal');
    const localSessionsModalCloseBtn = localSessionsModal.querySelector('.close-btn');
    const infoBtn = document.getElementById('infoBtn');
    const infoModal = document.getElementById('infoModal');
    const infoModalCloseBtn = infoModal.querySelector('.close-btn');
    const authActionBtn = document.getElementById('authActionBtn');
    const managePublicationsBtn = document.getElementById('managePublicationsBtn');
    const publishedRoutesModal = document.getElementById('publishedRoutesModal');
    const publishedRoutesModalCloseBtn = publishedRoutesModal.querySelector('.close-btn');
    const viewTermsLink = document.getElementById('viewTermsLink');
    const editProfileBtn = document.getElementById('editProfileBtn');
    const profileModal = document.getElementById('profileModal');
    const profileModalCloseBtn = profileModal.querySelector('.close-btn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const publicProfileModal = document.getElementById('publicProfileModal');
    const publicProfileModalCloseBtn = publicProfileModal.querySelector('.close-btn');
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const ageCheckbox = document.getElementById('ageCheckbox');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const usernameInput = document.getElementById('usernameInput');
    const safetyModal = document.getElementById('safetyModal');
    const safetyModalOkBtn = document.getElementById('safetyModalOkBtn');
    const safetyModalCloseBtn = safetyModal.querySelector('.close-btn');
    const changeStyleBtn = document.getElementById('changeStyleBtn');
    const centerOnRouteBtn = document.getElementById('centerOnRouteBtn');
    const summaryModal = document.getElementById('summaryModal');
    const summaryOkBtn = document.getElementById('summaryOkBtn');
    const summaryModalCloseBtn = summaryModal.querySelector('.close-btn');
    const leaderboardBtn = document.getElementById('leaderboardBtn');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const leaderboardModalCloseBtn = leaderboardModal.querySelector('.close-btn');
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');
    const myStatsBtn = document.getElementById('myStatsBtn');
    const achievementModal = document.getElementById('achievementModal');
    const achievementOkBtn = document.getElementById('achievementOkBtn');
    const meetupModal = document.getElementById('meetupModal');
    const meetupModalCloseBtn = meetupModal.querySelector('.close-btn');
    const createMeetupBtn = document.getElementById('createMeetupBtn');
    const safetyCheckbox = document.getElementById('safetyCheckbox');
    const meetupTitleInput = document.getElementById('meetupTitleInput');
    const meetupDescriptionInput = document.getElementById('meetupDescriptionInput');
    const viewMeetupsModal = document.getElementById('viewMeetupsModal');
    const viewMeetupsModalCloseBtn = viewMeetupsModal.querySelector('.close-btn');
    const shareBtn = document.getElementById('shareBtn');
    const leaderboardList = document.getElementById('leaderboardList');
    const menuBtn = document.getElementById('menuBtn');
    const menuModal = document.getElementById('menuModal');
    const menuModalCloseBtn = menuModal.querySelector('.close-btn');

    onAuthStateChanged(auth, async (user) => {
        state.setCurrentUser(user);
        // ... (rest of auth logic)
    });

    if (sessionStorage.getItem('termsAccepted')) {
        termsModal.style.display = 'none';
        document.getElementById('userStatus').style.display = 'flex';
    } else {
        termsModal.style.display = 'flex';
    }

    initializeMap('map');

    const validateSignUpForm = () => {
        // ... (validation logic)
    };
    emailInput.addEventListener('input', validateSignUpForm);
    passwordInput.addEventListener('input', validateSignUpForm);
    usernameInput.addEventListener('input', validateSignUpForm);
    ageCheckbox.addEventListener('change', validateSignUpForm);
    infoBtn.addEventListener('click', () => infoModal.style.display = 'flex');
    infoModalCloseBtn.addEventListener('click', () => infoModal.style.display = 'none');
    viewTermsLink.addEventListener('click', (e) => {
        e.preventDefault();
        infoModal.style.display = 'none';
        termsModal.style.display = 'flex';
    });
    termsCheckbox.addEventListener('change', () => agreeBtn.disabled = !termsCheckbox.checked);
    agreeBtn.addEventListener('click', () => {
        termsModal.style.display = 'none';
        sessionStorage.setItem('termsAccepted', 'true');
        document.getElementById('userStatus').style.display = 'flex';
        if (!state.currentUser) authModal.style.display = 'flex';
    });
    loginSignupBtn.addEventListener('click', () => authModal.style.display = 'flex');
    authModal.addEventListener('click', (e) => {
        if (e.target.id === 'switchAuthModeLink') {
            e.preventDefault();
            state.setIsSignUpMode(!state.isSignUpMode);
            updateAuthModalUI();
        }
    });
    authActionBtn.addEventListener('click', async () => {
        if (state.isSignUpMode) await handleSignUp();
        else await handleLogIn();
    });
    document.getElementById('logoutBtn').addEventListener('click', async () => await signOut(auth));
    skipBtn.addEventListener('click', () => authModal.style.display = 'none');
    findMeBtn.addEventListener('click', findMe);
    trackBtn.addEventListener('click', toggleTracking);
    pictureBtn.addEventListener('click', () => cameraInput.click());
    cameraInput.addEventListener('change', (e) => handlePhoto(e));
    dataBtn.addEventListener('click', () => {
        menuModal.style.display = 'none';
        const centerOnRouteBtn = document.getElementById('centerOnRouteBtn');
        const hasRoute = state.routeCoordinates.length > 0 || state.photoPins.length > 0;
        centerOnRouteBtn.classList.toggle('disabled', !hasRoute);
        dataModal.style.display = 'flex';
    });
    closeDataModalBtn.addEventListener('click', () => dataModal.style.display = 'none');
    sessionsModalCloseBtn.addEventListener('click', () => sessionsModal.style.display = 'none');
    localSessionsModalCloseBtn.addEventListener('click', () => localSessionsModal.style.display = 'none');
    publishedRoutesModalCloseBtn.addEventListener('click', () => publishedRoutesModal.style.display = 'none');
    profileModalCloseBtn.addEventListener('click', () => profileModal.style.display = 'none');
    publicProfileModalCloseBtn.addEventListener('click', () => publicProfileModal.style.display = 'none');
    safetyModalCloseBtn.addEventListener('click', () => safetyModal.style.display = 'none');
    safetyModalOkBtn.addEventListener('click', () => {
        safetyModal.style.display = 'none';
        startTracking();
    });
    summaryModalCloseBtn.addEventListener('click', () => summaryModal.style.display = 'none');
    summaryOkBtn.addEventListener('click', () => summaryModal.style.display = 'none');
    shareBtn.addEventListener('click', shareCleanupResults);
    leaderboardBtn.addEventListener('click', () => {
        leaderboardModal.style.display = 'flex';
        document.getElementById('leaderboardList').style.display = 'block';
        document.getElementById('myStatsContainer').style.display = 'none';
        leaderboardTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.leaderboard-tab[data-metric="totalPins"]').classList.add('active');
        fetchAndDisplayLeaderboard('totalPins');
    });
    leaderboardModalCloseBtn.addEventListener('click', () => leaderboardModal.style.display = 'none');
    leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            leaderboardTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            if (tab.id === 'myStatsBtn') {
                document.getElementById('leaderboardList').style.display = 'none';
                document.getElementById('myStatsContainer').style.display = 'block';
                fetchAndDisplayMyStats();
            } else {
                document.getElementById('leaderboardList').style.display = 'block';
                document.getElementById('myStatsContainer').style.display = 'none';
                fetchAndDisplayLeaderboard(tab.dataset.metric);
            }
        });
    });
    leaderboardList.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('leaderboard-profile-link')) {
            e.preventDefault();
            const userId = e.target.closest('li').dataset.userid;
            if (userId) {
                leaderboardModal.style.display = 'none';
                showPublicProfile(userId);
            }
        }
    });
    window.addEventListener('click', (event) => {
        const modals = [dataModal, sessionsModal, localSessionsModal, infoModal, authModal, publishedRoutesModal, profileModal, publicProfileModal, safetyModal, summaryModal, leaderboardModal, achievementModal, meetupModal, viewMeetupsModal, menuModal];
        if (modals.includes(event.target)) {
            modals.forEach(m => m.style.display = 'none');
        }
    });
    achievementOkBtn.addEventListener('click', () => achievementModal.style.display = 'none');
    meetupModalCloseBtn.addEventListener('click', () => meetupModal.style.display = 'none');
    viewMeetupsModalCloseBtn.addEventListener('click', () => viewMeetupsModal.style.display = 'none');
    safetyCheckbox.addEventListener('change', validateMeetupForm);
    meetupTitleInput.addEventListener('input', validateMeetupForm);
    meetupDescriptionInput.addEventListener('input', validateMeetupForm);
    createMeetupBtn.addEventListener('click', handleMeetupSubmit);
    saveBtn.addEventListener('click', saveSession);
    loadBtn.addEventListener('click', () => {
        dataModal.style.display = 'none';
        loadSession();
    });
    exportBtn.addEventListener('click', exportGeoJSON);
    communityBtn.addEventListener('click', toggleCommunityView);
    publishBtn.addEventListener('click', publishRoute);
    managePublicationsBtn.addEventListener('click', () => {
        if (!state.currentUser) { alert("You must be logged in to manage your publications."); return; }
        dataModal.style.display = 'none';
        populatePublishedRoutesList();
        publishedRoutesModal.style.display = 'flex';
    });
    editProfileBtn.addEventListener('click', () => {
        if (!state.currentUser) { alert("You must be logged in to edit your profile."); return; }
        menuModal.style.display = 'none';
        loadProfileForEditing();
        profileModal.style.display = 'flex';
    });
    saveProfileBtn.addEventListener('click', saveProfile);
    deleteAccountBtn.addEventListener('click', handleAccountDeletion);
    changeStyleBtn.addEventListener('click', changeMapStyle);
    centerOnRouteBtn.addEventListener('click', () => {
        if (centerOnRouteBtn.classList.contains('disabled')) {
            alert("Please load a route first to use this feature.");
        } else {
            centerOnRoute();
        }
    });
    menuBtn.addEventListener('click', () => menuModal.style.display = 'flex');
    menuModalCloseBtn.addEventListener('click', () => menuModal.style.display = 'none');
});

