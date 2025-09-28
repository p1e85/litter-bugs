// This file acts as a centralized store for the application's shared state.
// Other modules will import these variables to read or modify them.

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

// Functions to update state
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

