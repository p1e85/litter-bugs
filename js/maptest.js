// --- Firebase SDK Setup ---
// This section imports the necessary functions from the Firebase SDKs.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, where, deleteDoc, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    deleteUser
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// --- Litter Bugs V2 Firebase Config ---
// This object contains your project's unique Firebase configuration keys.
const firebaseConfig = {
  apiKey: "AIzaSyCE1b6VtJjUs0O5YvyLjeslxuHC8UlgJUM",
  authDomain: "garbagepathv2.firebaseapp.com",
  projectId: "garbagepathv2",
  storageBucket: "garbagepathv2.firebasestorage.app",
  messagingSenderId: "505856089619",
  appId: "1:505856089619:web:682f58d02be4295be4a9e6",
  measurementId: "G-SM46WXV0CN"
};

// --- Initialize Firebase Services ---
const app = initializeApp(firebaseConfig);
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
console.log("Firebase Initialized!");

// --- Global State Variables ---
let currentUser = null;
let trackingWatcher = null;
let routeCoordinates = [];
let photoPins = [];
let map;
let findMeMarker = null;
let isCommunityViewOn = false;
let communityLayers = [];
let isSignUpMode = true;
let userMarkers = [];
let communityMarkers = [];
const ZOOM_THRESHOLD = 14;
let trackingStartTime = null;
const profanityList = ["word1", "word2", "word3"];

const mapStyles = [
    { name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
    { name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' },
    { name: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
    { name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
    { name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' }
];
let currentStyleIndex = 0;

const allBadges = {
    first_find: { name: 'First Find', icon: '🗑️', description: 'Pinned your very first piece of litter.' },
    collector: { name: 'Collector', icon: '🛍️', description: 'Pinned a total of 50 items.' },
    super_collector: { name: 'Super Collector', icon: '🏆', description: 'Pinned a total of 250 items.' },
    eagle_eye: { name: 'Eagle Eye', icon: '🦅', description: 'Pinned 1000 items. A true garbage spotter!' },
    first_steps: { name: 'First Steps', icon: '👟', description: 'Completed your first route over 1km.' },
    explorer: { name: 'Explorer', icon: '🗺️', description: 'Walked a total of 25 kilometers.' },
    trailblazer: { name: 'Trailblazer', icon: '⛰️', description: 'Walked a total of 100 kilometers.' },
    marathoner: { name: 'Marathoner', icon: '🏃', description: 'Walked over 42.2km in a single session.' },
    initiate: { name: 'Initiate', icon: '🌱', description: 'Published your first route to the community.' },
    activist: { name: 'Activist', icon: '🌍', description: 'Published 10 routes to the community.' },
    guardian: { name: 'Guardian', icon: '🛡️', description: 'Published 50 routes to the community.' },
    community_pillar: { name: 'Community Pillar', icon: '🏛️', description: 'Published 100 routes. You are a legend!' }
};


// --- Main App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    
    checkAndClearOldData();

    // Core Modals & Buttons
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
    const summaryModal = document.getElementById('summaryModal');
    const summaryOkBtn = document.getElementById('summaryOkBtn');
    const summaryModalCloseBtn = summaryModal.querySelector('.close-btn');

    onAuthStateChanged(auth, async (user) => {
        const userStatus = document.getElementById('userStatus');
        const loggedInContent = document.getElementById('loggedInContent');
        const guestContent = document.getElementById('guestContent');
        const userEmailSpan = document.getElementById('userEmail');
        const publishBtn = document.getElementById('publishBtn');
        const managePublicationsBtn = document.getElementById('managePublicationsBtn');
        const editProfileBtn = document.getElementById('editProfileBtn');

        if(userStatus) userStatus.style.display = 'flex';

        if (user) {
            currentUser = user;
            try {
                const publicProfileRef = doc(db, "publicProfiles", user.uid);
                const publicProfileSnap = await getDoc(publicProfileRef);
                let username;

                if (publicProfileSnap.exists()) {
                    username = publicProfileSnap.data().username;
                } else {
                    console.log("User profile missing! Creating a default one.");
                    const defaultUsername = user.email.split('@')[0];
                    await setDoc(publicProfileRef, {
                        username: defaultUsername,
                        bio: "This user is new to Litter Bugs!",
                        location: "",
                        buyMeACoffeeLink: "",
                        badges: {}
                    });
                    username = defaultUsername;
                }

                if (userEmailSpan) {
                    userEmailSpan.textContent = `Logged in as: ${username}`;
                }
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists() && userDocSnap.data().totalPins === undefined) {
                    await updateDoc(userDocRef, { totalPins: 0, totalDistance: 0, totalRoutes: 0 });
                }

            } catch (error) {
                console.error("Error fetching or updating user profile:", error);
            }
            if (loggedInContent) loggedInContent.style.display = 'flex';
            if (guestContent) guestContent.style.display = 'none';
            if (authModal) authModal.style.display = 'none';
            if (publishBtn) publishBtn.style.display = 'block';
            if (managePublicationsBtn) managePublicationsBtn.style.display = 'block';
            if (editProfileBtn) editProfileBtn.style.display = 'block';
        } else {
            currentUser = null;
            if (loggedInContent) loggedInContent.style.display = 'none';
            if (guestContent) guestContent.style.display = 'block';
            if (publishBtn) publishBtn.style.display = 'none';
            if (managePublicationsBtn) managePublicationsBtn.style.display = 'none';
            if (editProfileBtn) editProfileBtn.style.display = 'none';
        }
    });

    if (sessionStorage.getItem('termsAccepted')) {
        termsModal.style.display = 'none';
        document.getElementById('userStatus').style.display = 'flex';
    } else {
        termsModal.style.display = 'flex';
    }

    mapboxgl.accessToken = 'pk.eyJ1IjoicDFjcmVhdGlvbnMiLCJhIjoiY2p6ajZvejJmMDZhaTNkcWpiN294dm12eCJ9.8ckNT6kfuJry7K7GAeIuxw';
    map = new mapboxgl.Map({
        container: 'map',
        style: mapStyles[currentStyleIndex].url,
        center: [-87.6298, 41.8781],
        zoom: 10
    });

    map.on('load', () => {
        initializeMapLayers();
        setupPoiClickListeners();
    });
    
    map.on('zoom', () => {
        toggleMarkerVisibility();
    });

    const validateSignUpForm = () => {
        const isEmailValid = emailInput.value.includes('@');
        const isPasswordValid = passwordInput.value.length >= 6;
        const isUsernameValid = usernameInput.value.trim().length >= 3;
        const isAgeChecked = ageCheckbox.checked;
        if (isSignUpMode) {
            authActionBtn.disabled = !(isEmailValid && isPasswordValid && isUsernameValid && isAgeChecked);
        } else {
            authActionBtn.disabled = !(isEmailValid && isPasswordValid);
        }
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
        if (!currentUser) authModal.style.display = 'flex';
    });
    loginSignupBtn.addEventListener('click', () => authModal.style.display = 'flex');
    document.getElementById('switchAuthModeLink').addEventListener('click', (e) => {
        e.preventDefault();
        isSignUpMode = !isSignUpMode;
        updateAuthModalUI();
    });
    authActionBtn.addEventListener('click', async () => {
        if (isSignUpMode) await handleSignUp();
        else await handleLogIn();
    });
    document.getElementById('logoutBtn').addEventListener('click', async () => await signOut(auth));
    skipBtn.addEventListener('click', () => authModal.style.display = 'none');
    findMeBtn.addEventListener('click', findMe);
    trackBtn.addEventListener('click', toggleTracking);
    pictureBtn.addEventListener('click', () => cameraInput.click());
    cameraInput.addEventListener('change', handlePhoto);
    dataBtn.addEventListener('click', () => dataModal.style.display = 'flex');
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
    
    achievementOkBtn.addEventListener('click', () => achievementModal.style.display = 'none');
    meetupModalCloseBtn.addEventListener('click', () => meetupModal.style.display = 'none');
    viewMeetupsModalCloseBtn.addEventListener('click', () => viewMeetupsModal.style.display = 'none');
    safetyCheckbox.addEventListener('change', validateMeetupForm);
    meetupTitleInput.addEventListener('input', validateMeetupForm);
    meetupDescriptionInput.addEventListener('input', validateMeetupForm);
    createMeetupBtn.addEventListener('click', handleMeetupSubmit);

    window.addEventListener('click', (event) => {
        const modals = [dataModal, sessionsModal, localSessionsModal, infoModal, authModal, publishedRoutesModal, profileModal, publicProfileModal, safetyModal, summaryModal, leaderboardModal, achievementModal, meetupModal, viewMeetupsModal];
        if (modals.includes(event.target)) {
            modals.forEach(m => m.style.display = 'none');
        }
    });
    
    saveBtn.addEventListener('click', saveSession);
    loadBtn.addEventListener('click', () => {
        dataModal.style.display = 'none';
        loadSession();
    });
    exportBtn.addEventListener('click', exportGeoJSON);
    communityBtn.addEventListener('click', toggleCommunityView);
    publishBtn.addEventListener('click', publishRoute);
    managePublicationsBtn.addEventListener('click', () => {
        if (!currentUser) { alert("You must be logged in to manage your publications."); return; }
        dataModal.style.display = 'none';
        populatePublishedRoutesList();
        publishedRoutesModal.style.display = 'flex';
    });
    editProfileBtn.addEventListener('click', () => {
        if (!currentUser) { alert("You must be logged in to edit your profile."); return; }
        dataModal.style.display = 'none';
        loadProfileForEditing();
        profileModal.style.display = 'flex';
    });
    saveProfileBtn.addEventListener('click', saveProfile);
    deleteAccountBtn.addEventListener('click', handleAccountDeletion);
    changeStyleBtn.addEventListener('click', changeMapStyle);
    centerOnRouteBtn.addEventListener('click', centerOnRoute);
});

// --- Functions ---
// (All functions are complete and commented below)

/**
 * Initializes the base layers and data sources for the Mapbox map.
 * This function is called once when the map has finished loading.
 */
function initializeMapLayers() {
    if (!map.getSource('user-route')) map.addSource('user-route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
    if (!map.getLayer('user-route')) map.addLayer({ id: 'user-route', type: 'line', source: 'user-route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#007bff', 'line-width': 5 } });
    if (!map.getSource('user-location-point')) map.addSource('user-location-point', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', 'coordinates': [] } } });
    if (!map.getLayer('user-location-pulse')) map.addLayer({ id: 'user-location-pulse', type: 'circle', source: 'user-location-point', paint: { 'circle-radius': 15, 'circle-color': '#007bff', 'circle-opacity': 0.2 } });
    if (!map.getLayer('user-location-dot')) map.addLayer({ id: 'user-location-dot', type: 'circle', source: 'user-location-point', paint: { 'circle-radius': 6, 'circle-color': '#fff', 'circle-stroke-width': 2, 'circle-stroke-color': '#007bff' } });
    if (!map.getSource('user-pins-source')) map.addSource('user-pins-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    if (!map.getLayer('user-pins-dots')) map.addLayer({ id: 'user-pins-dots', type: 'circle', source: 'user-pins-source', maxzoom: ZOOM_THRESHOLD, paint: { 'circle-radius': 6, 'circle-color': '#007bff', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
    if (!map.getSource('community-pins-source')) map.addSource('community-pins-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    if (!map.getLayer('community-pins-dots')) map.addLayer({ id: 'community-pins-dots', type: 'circle', source: 'community-pins-source', maxzoom: ZOOM_THRESHOLD, paint: { 'circle-radius': 6, 'circle-color': '#28a745', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff' } });
}

/**
 * Changes the map's visual style and re-adds all necessary layers and markers.
 */
function changeMapStyle() {
    currentStyleIndex = (currentStyleIndex + 1) % mapStyles.length;
    map.setStyle(mapStyles[currentStyleIndex].url);
    map.once('style.load', () => {
        initializeMapLayers();
        userMarkers.forEach(marker => marker.addTo(map));
        communityMarkers.forEach(marker => marker.addTo(map));
        toggleMarkerVisibility();
        if (isCommunityViewOn) fetchAndDisplayCommunityRoutes();
        updateUserPinsSource();
    });
}

/**
 * Shows or hides the HTML photo markers based on the map's zoom level.
 */
function toggleMarkerVisibility() {
    const display = map.getZoom() >= ZOOM_THRESHOLD ? 'block' : 'none';
    userMarkers.forEach(marker => marker.getElement().style.display = display);
    communityMarkers.forEach(marker => marker.getElement().style.display = display);
}

// --- Data Conversion Helpers ---
// These functions convert coordinate data between the app's format ([lng, lat]) and Firestore's format ({lng, lat}).
function convertRouteForFirestore(coordsArray) { if (!coordsArray) return []; return coordsArray.map(coord => ({ lng: coord[0], lat: coord[1] })); }
function convertRouteFromFirestore(coordsData) { if (!coordsData || coordsData.length === 0) return []; if (Array.isArray(coordsData[0])) { return coordsData; } return coordsData.map(coord => [coord.lng, coord.lat]); }
function convertPinsForFirestore(pinsArray) { if (!pinsArray) return []; return pinsArray.map(pin => { const newPin = { ...pin }; if (Array.isArray(newPin.coords)) { newPin.coords = { lng: newPin.coords[0], lat: newPin.coords[1] }; } return newPin; }); }
function convertPinsFromFirestore(pinsData) { if (!pinsData || pinsData.length === 0) return []; return pinsData.map(pin => { const newPin = { ...pin }; if (newPin.coords && typeof newPin.coords === 'object' && !Array.isArray(newPin.coords)) { newPin.coords = [newPin.coords.lng, newPin.coords.lat]; } return newPin; }); }

/**
 * Checks for old, incompatible data in local storage and prompts to clear it.
 */
function checkAndClearOldData() {
    const guestSessionsJSON = localStorage.getItem('guestSessions');
    if (guestSessionsJSON) {
        try {
            const guestSessions = JSON.parse(guestSessionsJSON);
            if (guestSessions.length > 0 && guestSessions[0].route && Array.isArray(guestSessions[0].route[0])) {
                alert("The app has been updated. Your old locally saved sessions are no longer compatible and will be cleared.");
                localStorage.removeItem('guestSessions');
            }
        } catch (error) {
            console.error("Error parsing old guest sessions, clearing data.", error);
            localStorage.removeItem('guestSessions');
        }
    }
}

/**
 * Updates the UI of the authentication modal to switch between "Log In" and "Sign Up" modes.
 */
function updateAuthModalUI() {
    const authForm = document.getElementById('authForm'), authTitle = document.getElementById('authTitle'), authSubtitle = document.getElementById('authSubtitle'), authActionBtn = document.getElementById('authActionBtn'), emailInput = document.getElementById('emailInput'), passwordInput = document.getElementById('passwordInput'), usernameInput = document.getElementById('usernameInput'), ageCheckbox = document.getElementById('ageCheckbox');
    document.getElementById('authError').textContent = '';
    if (isSignUpMode) {
        authTitle.textContent = 'Create a Litter Bugs Account'; authSubtitle.innerHTML = 'Or <a href="#" id="switchAuthModeLink">log in to an existing account.</a>'; authActionBtn.textContent = 'Sign Up'; authForm.classList.add('signup-mode'); authForm.classList.remove('login-mode');
    } else {
        authTitle.textContent = 'Log In to Litter Bugs'; authSubtitle.innerHTML = 'Or <a href="#" id="switchAuthModeLink">create a new account.</a>'; authActionBtn.textContent = 'Log In'; authForm.classList.add('login-mode'); authForm.classList.remove('signup-mode');
    }
    const isEmailValid = emailInput.value.includes('@'), isPasswordValid = passwordInput.value.length >= 6, isUsernameValid = usernameInput.value.trim().length >= 3, isAgeChecked = ageCheckbox.checked;
    authActionBtn.disabled = isSignUpMode ? !(isEmailValid && isPasswordValid && isUsernameValid && isAgeChecked) : !(isEmailValid && isPasswordValid);
    document.getElementById('switchAuthModeLink').addEventListener('click', (e) => { e.preventDefault(); isSignUpMode = !isSignUpMode; updateAuthModalUI(); });
}

/**
 * Handles the user sign-up process, creating both a private user doc and a public profile.
 */
async function handleSignUp() {
    const email = document.getElementById('emailInput').value, password = document.getElementById('passwordInput').value, username = document.getElementById('usernameInput').value, ageCheckbox = document.getElementById('ageCheckbox'), authError = document.getElementById('authError');
    authError.textContent = '';
    if (!ageCheckbox.checked) { authError.textContent = 'You must certify that you are 18 or older to sign up.'; return; }
    if (!username || username.trim().length < 3) { authError.textContent = 'Username must be at least 3 characters.'; return; }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userId = userCredential.user.uid;
        await setDoc(doc(db, "users", userId), { email: userCredential.user.email, totalPins: 0, totalDistance: 0, totalRoutes: 0 });
        await setDoc(doc(db, "publicProfiles", userId), { username, bio: "This user is new to Litter Bugs!", location: "", buyMeACoffeeLink: "", badges: {} });
    } catch (error) { authError.textContent = error.message; }
}

/**
 * Handles the user login process.
 */
async function handleLogIn() {
    const email = document.getElementById('emailInput').value, password = document.getElementById('passwordInput').value, authError = document.getElementById('authError');
    authError.textContent = '';
    try { await signInWithEmailAndPassword(auth, email, password); } catch (error) { authError.textContent = error.message; }
}

// --- Map Interaction Functions ---
/**
 * Uses the browser's geolocation API to find the user's current location and center the map there.
 */
function findMe() {
    if (findMeMarker) findMeMarker.remove();
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        findMeMarker = new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);
        map.flyTo({ center: [longitude, latitude], zoom: 15 });
    }, () => alert("Could not get your location."), { enableHighAccuracy: true });
}

/**
 * Toggles the GPS tracking on and off. When stopping, it shows the cleanup summary.
 */
function toggleTracking() {
    const trackBtn = document.getElementById('trackBtn');
    if (trackingWatcher) {
        navigator.geolocation.clearWatch(trackingWatcher);
        trackingWatcher = null;
        trackBtn.textContent = '🛰️ Start Tracking';
        trackBtn.classList.remove('tracking');
        if (map.getSource('user-location-point')) map.getSource('user-location-point').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [] } });
        showCleanupSummary();
    } else { document.getElementById('safetyModal').style.display = 'flex'; }
}

/**
 * Starts a new tracking session after clearing any previous data.
 */
function startTracking() {
    clearCurrentSession();
    const trackBtn = document.getElementById('trackBtn');
    trackingStartTime = new Date();
    navigator.geolocation.getCurrentPosition(pos => map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 }));
    trackingWatcher = navigator.geolocation.watchPosition(pos => {
        const newCoord = [pos.coords.longitude, pos.coords.latitude];
        routeCoordinates.push(newCoord);
        if (map.getSource('user-route')) map.getSource('user-route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoordinates } });
        if (map.getSource('user-location-point')) map.getSource('user-location-point').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: newCoord } });
    }, () => alert("Error watching position."), { enableHighAccuracy: true });
    trackBtn.textContent = '🛑 Stop Tracking';
    trackBtn.classList.add('tracking');
}

/**
 * Handles the photo selection, compression, and pinning process.
 */
async function handlePhoto(event) {
    const pictureBtn = document.getElementById('pictureBtn');
    const originalButtonText = pictureBtn.innerHTML;
    if (!event.target.files || event.target.files.length === 0) { event.target.value = ''; return; }
    const file = event.target.files[0];
    pictureBtn.innerHTML = 'Processing...'; pictureBtn.disabled = true;
    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
    let processedFile;
    try {
        processedFile = await imageCompression(file, options);
    } catch (error) {
        console.error("Image compression error:", error); alert("Error processing image.");
        pictureBtn.innerHTML = originalButtonText; pictureBtn.disabled = false; event.target.value = ''; return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
        const coords = [position.coords.longitude, position.coords.latitude];
        const defaultTitle = `Pin ${photoPins.length + 1}`;
        if (!currentUser) {
            const reader = new FileReader();
            reader.readAsDataURL(processedFile);
            reader.onload = e => {
                const pinInfo = { id: `pin-${Date.now()}`, coords, image: e.target.result, title: defaultTitle, category: 'Other' };
                photoPins.push(pinInfo);
                const newMarker = createAndAddMarker(pinInfo, 'user');
                newMarker.togglePopup();
                updateUserPinsSource();
            };
        } else {
            try {
                const timestamp = Date.now();
                const storageRef = ref(storage, `photos/${currentUser.uid}/${timestamp}-${processedFile.name}`);
                const snapshot = await uploadBytes(storageRef, processedFile);
                const downloadURL = await getDownloadURL(snapshot.ref);
                const pinInfo = { id: `pin-${timestamp}`, coords, imageURL: downloadURL, title: defaultTitle, category: 'Other' };
                photoPins.push(pinInfo);
                const newMarker = createAndAddMarker(pinInfo, 'user');
                newMarker.togglePopup();
                updateUserPinsSource();
            } catch (error) { console.error("Error uploading photo:", error); alert("Photo upload failed."); }
        }
        pictureBtn.innerHTML = originalButtonText; pictureBtn.disabled = false; event.target.value = '';
    }, () => {
        alert("Could not get location. Photo was not pinned.");
        pictureBtn.innerHTML = originalButtonText; pictureBtn.disabled = false; event.target.value = '';
    }, { enableHighAccuracy: true });
}

/**
 * Creates an HTML marker for a photo pin and adds it to the map.
 * @returns {mapboxgl.Marker} The newly created marker object.
 */
function createAndAddMarker(pinInfo, type, routeInfo = {}) {
    const el = document.createElement('div');
    el.className = 'photo-marker';
    el.style.backgroundImage = `url(${pinInfo.imageURL || pinInfo.image})`;
    el.style.display = map.getZoom() >= ZOOM_THRESHOLD ? 'block' : 'none';
    const popup = createPinPopup(pinInfo, type, routeInfo);
    const marker = new mapboxgl.Marker(el).setLngLat(pinInfo.coords).setPopup(popup).addTo(map);
    if (type === 'user') {
        userMarkers.push(marker);
    } else {
        el.style.borderColor = '#28a745';
        communityMarkers.push(marker);
    }
    return marker;
}

/**
 * Creates the HTML content for a photo pin's pop-up, including edit/delete forms.
 * @returns {mapboxgl.Popup} The configured but not-yet-added popup object.
 */
function createPinPopup(pinInfo, type, routeInfo) {
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
                const pin = photoPins.find(p => p.id === pinInfo.id);
                if (pin) {
                    pin.title = document.getElementById(`title-${pinInfo.id}`).value;
                    pin.category = document.getElementById(`category-${pinInfo.id}`).value;
                }
                popup.remove(); alert("Pin updated! Remember to save your session.");
            });
            document.getElementById(`delete-${pinInfo.id}`)?.addEventListener('click', () => {
                if (confirm("Are you sure?")) {
                    photoPins = photoPins.filter(p => p.id !== pinInfo.id);
                    const markerToRemove = userMarkers.find(m => {
                        const lngLat = m.getLngLat();
                        return lngLat.lng === pinInfo.coords[0] && lngLat.lat === pinInfo.coords[1];
                    });
                    if (markerToRemove) {
                        markerToRemove.remove();
                        userMarkers = userMarkers.filter(m => m !== markerToRemove);
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

/**
 * Updates the GeoJSON data source for the zoomed-out dot view.
 */
function updateUserPinsSource() {
    const features = photoPins.map(pin => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: pin.coords },
        properties: {}
    }));
    if (map.getSource('user-pins-source')) {
        map.getSource('user-pins-source').setData({ type: 'FeatureCollection', features });
    }
}

// --- Community View Functions ---
/**
 * Toggles the visibility of all community-published routes.
 */
async function toggleCommunityView() {
    isCommunityViewOn = !isCommunityViewOn;
    const communityBtn = document.getElementById('communityBtn');
    if (isCommunityViewOn) {
        communityBtn.textContent = '🌎 Community View: ON'; communityBtn.classList.remove('off');
        await fetchAndDisplayCommunityRoutes();
    } else {
        communityBtn.textContent = '🌎 Community View: OFF'; communityBtn.classList.add('off');
        clearCommunityRoutes();
    }
}

/**
 * Fetches all published routes from Firestore and displays them on the map.
 */
async function fetchAndDisplayCommunityRoutes() {
    try {
        const q = query(collection(db, "publishedRoutes"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        clearCommunityRoutes();
        let allCommunityPinFeatures = [];
        querySnapshot.forEach(doc => {
            const routeData = doc.data();
            const routeId = doc.id;
            const mapboxCoords = convertRouteFromFirestore(routeData.route);
            const mapboxPins = convertPinsFromFirestore(routeData.pins);
            map.addSource(`community-route-${routeId}`, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: mapboxCoords } } });
            map.addLayer({ id: `community-route-${routeId}`, type: 'line', source: `community-route-${routeId}`, paint: { 'line-color': '#28a745', 'line-width': 4, 'line-opacity': 0.7 } });
            communityLayers.push({ id: `community-route-${routeId}`, type: 'layer' });
            if (mapboxPins) {
                mapboxPins.forEach(pin => {
                    createAndAddMarker(pin, 'community', { userId: routeData.userId, username: routeData.username });
                    allCommunityPinFeatures.push({
                        type: 'Feature',
                        geometry: { type: 'Point', coordinates: pin.coords },
                        properties: {}
                    });
                });
            }
        });
        if (map.getSource('community-pins-source')) map.getSource('community-pins-source').setData({ type: 'FeatureCollection', features: allCommunityPinFeatures });
    } catch (error) { console.error("Error fetching community routes:", error); alert("Could not load community data."); }
}

/**
 * Removes all community-related layers and markers from the map.
 */
function clearCommunityRoutes() {
    communityMarkers.forEach(marker => marker.remove());
    communityMarkers = [];
    communityLayers.forEach(layer => {
        if (map.getLayer(layer.id)) map.removeLayer(layer.id);
        if (map.getSource(layer.id)) map.removeSource(layer.id);
    });
    if (map.getSource('community-pins-source')) map.getSource('community-pins-source').setData({ type: 'FeatureCollection', features: [] });
    communityLayers = [];
}

// --- Data Management Functions ---
/**
 * Publishes the current session to the public 'publishedRoutes' collection and checks for new badges.
 */
async function publishRoute() {
    if (!currentUser) return;
    if (routeCoordinates.length < 2 || photoPins.length === 0) { alert("You need a tracked route and at least one photo pin to publish."); return; }
    
    const dataModal = document.getElementById('dataModal');
    dataModal.style.display = 'none';

    try {
        const publicProfileRef = doc(db, "publicProfiles", currentUser.uid);
        
        const beforeSnap = await getDoc(publicProfileRef);
        const badgesBefore = beforeSnap.exists() ? Object.keys(beforeSnap.data().badges || {}) : [];

        const username = beforeSnap.exists() ? beforeSnap.data().username : "Anonymous";
        await addDoc(collection(db, "publishedRoutes"), { 
            userId: currentUser.uid, 
            username, 
            timestamp: new Date(), 
            route: convertRouteForFirestore(routeCoordinates), 
            pins: convertPinsForFirestore(photoPins) 
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000)); 

        const afterSnap = await getDoc(publicProfileRef);
        const badgesAfter = afterSnap.exists() ? Object.keys(afterSnap.data().badges || {}) : [];

        const newBadges = badgesAfter.filter(badge => !badgesBefore.includes(badge));

        if (newBadges.length > 0) {
            showAchievementPopup(newBadges[0]);
        } else {
            alert("Success! Your route has been published.");
        }

        clearCurrentSession();

    } catch (error) { 
        console.error("Error publishing route:", error); 
        alert("There was an error publishing your route."); 
    }
}

/**
 * Saves the current session, either to local storage (for guests) or Firestore (for users).
 */
async function saveSession() {
    const dataModal = document.getElementById('dataModal');
    if (!currentUser) {
        const sessionName = prompt("Name this Litter Bugs session:", `Cleanup on ${new Date().toLocaleDateString()}`);
        if (sessionName) {
            const guestSessions = JSON.parse(localStorage.getItem('guestSessions')) || [];
            guestSessions.push({ sessionName, timestamp: new Date().toISOString(), pins: convertPinsForFirestore(photoPins), route: convertRouteForFirestore(routeCoordinates) });
            localStorage.setItem('guestSessions', JSON.stringify(guestSessions));
            alert(`Session "${sessionName}" saved locally.`);
            dataModal.style.display = 'none';
        }
        return;
    }
    const sessionName = prompt("Name this Litter Bugs session:", `Cleanup on ${new Date().toLocaleDateString()}`);
    if (sessionName) {
        try {
            await addDoc(collection(db, "users", currentUser.uid, "privateSessions"), { sessionName, timestamp: new Date(), pins: convertPinsForFirestore(photoPins), route: convertRouteForFirestore(routeCoordinates) });
            alert(`Session "${sessionName}" saved to your account!`);
            dataModal.style.display = 'none';
        } catch (error) { console.error("Error saving session:", error); alert("Could not save session."); }
    }
}

/**
 * Triggers the appropriate "load session" modal based on login state.
 */
async function loadSession() {
    if (!currentUser) {
        populateLocalSessionList();
        document.getElementById('localSessionsModal').style.display = 'flex';
        return;
    }
    await populateSessionList();
    document.getElementById('sessionsModal').style.display = 'flex';
}

function populateLocalSessionList() { /* ... */ }
function deleteLocalSession(index, sessionName) { /* ... */ }
function loadSpecificLocalSession(sessionIndex) { /* ... */ }

async function populateSessionList() { /* ... */ }
async function deletePrivateSession(sessionId, sessionName) { /* ... */ }
async function loadSpecificSession(sessionId) { /* ... */ }

/**
 * Resets the current session state (clears route, pins, markers, etc.).
 */
function clearCurrentSession() {
    userMarkers.forEach(marker => marker.remove());
    userMarkers = [];
    photoPins = [];
    routeCoordinates = [];
    updateUserPinsSource();
    if (map && map.getSource('user-route')) map.getSource('user-route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
    document.getElementById('centerOnRouteBtn').disabled = true;
}

/**
 * Takes session data and renders it on the map.
 */
function displaySessionData(data) {
    photoPins = data.pins || [];
    routeCoordinates = data.route || [];
    photoPins.forEach(pin => createAndAddMarker(pin, 'user'));
    updateUserPinsSource();
    if(map && map.getSource('user-route')) map.getSource('user-route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoordinates } });
}

/**
 * Exports the current session data as a downloadable GeoJSON file.
 */
function exportGeoJSON() {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const fileName = `litter_bugs_data_${timestamp}.geojson`;
    const pinFeatures = photoPins.map(pin => ({ type: 'Feature', geometry: { type: 'Point', coordinates: pin.coords }, properties: { title: pin.title, image_url: pin.imageURL || 'local_data', category: pin.category } }));
    const routeFeature = { type: 'Feature', geometry: { type: 'LineString', coordinates: routeCoordinates }, properties: {} };
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

/**
 * Populates the modal with a list of the user's own published routes for management.
 */
async function populatePublishedRoutesList() { /* ... */ }

/**
 * Deletes one of the user's published routes from the community map.
 */
async function deletePublishedRoute(routeId) { /* ... */ }

// --- Profile Management Functions ---
async function loadProfileForEditing() { /* ... */ }
async function saveProfile() { /* ... */ }
async function showPublicProfile(userId) { /* ... */ }
async function handleAccountDeletion() { /* ... */ }

// --- Gamification & QOL Functions ---
/**
 * Zooms the map to fit the currently loaded route and its pins.
 */
function centerOnRoute() {
    if (routeCoordinates.length < 1 && photoPins.length < 1) {
        alert("No route is currently loaded to center on.");
        return;
    }
    const bounds = new mapboxgl.LngLatBounds();
    routeCoordinates.forEach(coord => {
        bounds.extend(coord);
    });
    photoPins.forEach(pin => {
        bounds.extend(pin.coords);
    });
    map.fitBounds(bounds, {
        padding: {top: 150, bottom: 150, left: 60, right: 60},
        maxZoom: 16
    });
}

/**
 * Calculates and displays the post-cleanup summary modal with stats.
 */
function showCleanupSummary() {
    if (!trackingStartTime) return;
    const durationMs = new Date() - trackingStartTime;
    const distanceMeters = calculateRouteDistance(routeCoordinates);
    const pinsCount = photoPins.length;
    const distanceMiles = (distanceMeters * 0.000621371).toFixed(2);
    const minutes = Math.floor(durationMs / 60000);
    const seconds = ((durationMs % 60000) / 1000).toFixed(0);
    document.getElementById('summaryDistance').textContent = `${distanceMiles} mi`;
    document.getElementById('summaryPins').textContent = pinsCount;
    document.getElementById('summaryDuration').textContent = `${minutes}m ${seconds}s`;
    document.getElementById('summaryModal').style.display = 'flex';
    trackingStartTime = null;
}

/**
 * A helper function to calculate the distance of a route using the Haversine formula.
 * @returns {number} The total distance in meters.
 */
function calculateRouteDistance(coordinates) {
    let totalDistance = 0;
    if (coordinates.length < 2) return 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
        const p1 = { lat: coordinates[i][1], lng: coordinates[i][0] };
        const p2 = { lat: coordinates[i+1][1], lng: coordinates[i+1][0] };
        const R = 6371e3; // Radius of the Earth in meters
        const φ1 = p1.lat * Math.PI / 180;
        const φ2 = p2.lat * Math.PI / 180;
        const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
        const Δλ = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        totalDistance += R * c;
    }
    return totalDistance;
}

/**
 * Fetches the top 10 users from Firestore and displays them in the leaderboard modal.
 */
async function fetchAndDisplayLeaderboard(metric) {
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
            
            const score = metric === 'totalDistance'
                ? `${(profileData.totalDistance * 0.000621371).toFixed(2)} mi`
                : profileData.totalPins;

            li.innerHTML = `
                <span class="leaderboard-rank">${rank}.</span>
                <span class="leaderboard-name">${profileData.username}</span>
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
 * Displays the "Achievement Unlocked!" modal for a newly earned badge.
 */
function showAchievementPopup(badgeKey) {
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
 * Fetches and displays the current user's personal lifetime stats in the leaderboard modal.
 */
async function fetchAndDisplayMyStats() {
    const myStatsContainer = document.getElementById('myStatsContainer');
    myStatsContainer.innerHTML = '';

    if (!currentUser) {
        myStatsContainer.innerHTML = '<p class="login-prompt">Please log in to view your personal stats.</p>';
        return;
    }

    try {
        const publicProfileRef = doc(db, "publicProfiles", currentUser.uid);
        const publicProfileSnap = await getDoc(publicProfileRef);

        if (!publicProfileSnap.exists()) {
            myStatsContainer.innerHTML = '<p class="login-prompt">Could not find your profile data.</p>';
            return;
        }

        const profileData = publicProfileSnap.data();
        const distanceMiles = (profileData.totalDistance * 0.000621371).toFixed(2);
        
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

/**
 * Sets up click listeners for Mapbox's default Points of Interest layers.
 */
function setupPoiClickListeners() {
    const poiLayers = [ 'poi-label', 'transit-label', 'airport-label', 'natural-point-label', 'natural-line-label', 'water-point-label', 'water-line-label', 'waterway-label' ];
    poiLayers.forEach(layerId => {
        if (map.getLayer(layerId)) {
            map.on('click', layerId, (e) => {
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    const coordinates = feature.geometry.coordinates.slice();
                    const name = feature.properties.name;
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }
                    new mapboxgl.Popup().setLngLat(coordinates).setHTML(`<strong>${name}</strong>`).addTo(map);
                }
            });
            map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer'; });
            map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = ''; });
        }
    });
}

