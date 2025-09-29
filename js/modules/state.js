// --- State Module ---
// This file acts as a centralized store for the application's shared, mutable state.
// Other modules will import these variables to read or modify them.

// --- Firebase Service Handles ---
// These will be initialized in main.js and set here for other modules to use.
export let db = null;
export let auth = null;
export let storage = null;

// --- Application State Variables ---
export let currentUser = null;
export let trackingWatcher = null;
export let routeCoordinates = [];
export let photoPins = [];
export let map = null;
export let findMeMarker = null;
export let isCommunityViewOn = false;
export let communityLayers = [];
export let isSignUpMode = true;
export let userMarkers = [];
export let communityMarkers = [];
export let trackingStartTime = null;


// --- State Setter Functions ---
// These functions are the designated way to update the application's state from other modules.

export function setDb(dbInstance) { db = dbInstance; }
export function setAuth(authInstance) { auth = authInstance; }
export function setStorage(storageInstance) { storage = storageInstance; }

export function setCurrentUser(user) { currentUser = user; }
export function setTrackingWatcher(watcher) { trackingWatcher = watcher; }
export function setRouteCoordinates(coords) { routeCoordinates = coords; }
export function setPhotoPins(pins) { photoPins = pins; }
export function setMap(mapInstance) { map = mapInstance; }
export function setFindMeMarker(marker) { findMeMarker = marker; }
export function setIsCommunityViewOn(isOn) { isCommunityViewOn = isOn; }
export function setCommunityLayers(layers) { communityLayers = layers; }
export function setIsSignUpMode(isSignup) { isSignUpMode = isSignup; }
export function setUserMarkers(markers) { userMarkers = markers; }
export function setCommunityMarkers(markers) { communityMarkers = markers; }
export function setTrackingStartTime(time) { trackingStartTime = time; }

