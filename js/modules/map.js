// --- Map Module ---
// This module contains all logic directly related to the Mapbox GL JS library.
// It handles map initialization, layers, markers, user location, and POI interactions.

import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import * as state from './state.js';
import { mapStyles, ZOOM_THRESHOLD } from './config.js';
import { createPinPopup, openMeetupModal, openViewMeetupsModal } from './ui.js';
import { convertRouteFromFirestore, convertPinsFromFirestore } from './data.js';

const db = getFirestore();
let currentStyleIndex = 0;

/**
 * Initializes the main Mapbox map object and adds the geocoder search bar.
 * @param {string} containerId The ID of the HTML element where the map should be rendered.
 */
export function initializeMap(containerId) {
    mapboxgl.accessToken = 'pk.eyJ1IjoicDFjcmVhdGlvbnMiLCJhIjoiY2p6ajZvejJmMDZhaTNkcWpiN294dm12eCJ9.8ckNT6kfuJry7K7GAeIuxw';
    const mapInstance = new mapboxgl.Map({
        container: containerId,
        style: mapStyles[currentStyleIndex].url,
        center: [-87.6298, 41.8781],
        zoom: 10
    });
    state.setMap(mapInstance);

    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false,
        placeholder: 'Search for a place'
    });
    document.getElementById('geocoder-container').appendChild(geocoder.onAdd(mapInstance));

    mapInstance.on('load', () => {
        initializeMapLayers();
        setupPoiClickListeners();
    });
    
    mapInstance.on('zoom', () => {
        toggleMarkerVisibility();
    });
}

/**
 * Sets up the initial sources and layers for the map (user route, location dot, pin dots).
 */
export function initializeMapLayers() {
    const map = state.map;
    if (!map) return;
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
export function changeMapStyle() {
    currentStyleIndex = (currentStyleIndex + 1) % mapStyles.length;
    state.map.setStyle(mapStyles[currentStyleIndex].url);
    state.map.once('style.load', () => {
        initializeMapLayers();
        state.userMarkers.forEach(marker => marker.addTo(state.map));
        state.communityMarkers.forEach(marker => marker.addTo(state.map));
        toggleMarkerVisibility();
        if (state.isCommunityViewOn) fetchAndDisplayCommunityRoutes();
        updateUserPinsSource();
    });
}

/**
 * Shows or hides the HTML photo markers based on the map's zoom level.
 */
export function toggleMarkerVisibility() {
    const display = state.map.getZoom() >= ZOOM_THRESHOLD ? 'block' : 'none';
    state.userMarkers.forEach(marker => marker.getElement().style.display = display);
    state.communityMarkers.forEach(marker => marker.getElement().style.display = display);
}

/**
 * Uses the browser's geolocation API to find the user's current location and center the map there.
 */
export function findMe() {
    if (state.findMeMarker) state.findMeMarker.remove();
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const newMarker = new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(state.map);
        state.setFindMeMarker(newMarker);
        state.map.flyTo({ center: [longitude, latitude], zoom: 15 });
    }, () => alert("Could not get your location."), { enableHighAccuracy: true });
}

/**
 * Toggles the GPS tracking on and off.
 */
export function toggleTracking() {
    const trackBtn = document.getElementById('trackBtn');
    if (state.trackingWatcher) {
        navigator.geolocation.clearWatch(state.trackingWatcher);
        state.setTrackingWatcher(null);
        trackBtn.textContent = '🛰️ Start Tracking';
        trackBtn.classList.remove('tracking');
        if (state.map.getSource('user-location-point')) state.map.getSource('user-location-point').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: [] } });
        ui.showCleanupSummary();
    } else { document.getElementById('safetyModal').style.display = 'flex'; }
}

/**
 * Starts a new tracking session.
 */
export function startTracking() {
    state.clearCurrentSession();
    const trackBtn = document.getElementById('trackBtn');
    state.setTrackingStartTime(new Date());
    navigator.geolocation.getCurrentPosition(pos => state.map.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 }));
    const watcher = navigator.geolocation.watchPosition(pos => {
        const newCoord = [pos.coords.longitude, pos.coords.latitude];
        state.routeCoordinates.push(newCoord);
        if (state.map.getSource('user-route')) state.map.getSource('user-route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: state.routeCoordinates } });
        if (state.map.getSource('user-location-point')) state.map.getSource('user-location-point').setData({ type: 'Feature', geometry: { type: 'Point', coordinates: newCoord } });
    }, () => alert("Error watching position."), { enableHighAccuracy: true });
    state.setTrackingWatcher(watcher);
    trackBtn.textContent = '🛑 Stop Tracking';
    trackBtn.classList.add('tracking');
}

/**
 * Zooms the map to fit the currently loaded route and its pins.
 */
export function centerOnRoute() {
    if (state.routeCoordinates.length < 1 && state.photoPins.length < 1) {
        alert("No route is currently loaded to center on.");
        return;
    }
    const bounds = new mapboxgl.LngLatBounds();
    state.routeCoordinates.forEach(coord => bounds.extend(coord));
    state.photoPins.forEach(pin => bounds.extend(pin.coords));
    state.map.fitBounds(bounds, {
        padding: {top: 150, bottom: 150, left: 60, right: 60},
        maxZoom: 16
    });
}

/**
 * Sets up click listeners for Mapbox's default Points of Interest layers.
 */
export function setupPoiClickListeners() {
    const poiLayers = [ 'poi-label', 'transit-label', 'airport-label', 'natural-point-label', 'natural-line-label', 'water-point-label', 'water-line-label', 'waterway-label' ];
    poiLayers.forEach(layerId => {
        if (state.map.getLayer(layerId)) {
            state.map.on('click', layerId, (e) => {
                if (e.features.length > 0) {
                    const feature = e.features[0];
                    const coordinates = e.lngLat;
                    const name = feature.properties.name;
                    const popupHTML = `
                        <div>
                            <strong>${name}</strong>
                            <div class="poi-popup-buttons">
                                <button class="schedule-btn">Schedule Meetup</button>
                                <button class="view-btn">View Meetups</button>
                            </div>
                        </div>
                    `;
                    const popup = new mapboxgl.Popup().setLngLat(coordinates).setHTML(popupHTML).addTo(state.map);
                    popup.getElement().querySelector('.schedule-btn').addEventListener('click', () => {
                        openMeetupModal(name);
                        popup.remove();
                    });
                    popup.getElement().querySelector('.view-btn').addEventListener('click', () => {
                        openViewMeetupsModal(name);
                        popup.remove();
                    });
                }
            });
            state.map.on('mouseenter', layerId, () => { state.map.getCanvas().style.cursor = 'pointer'; });
            state.map.on('mouseleave', layerId, () => { state.map.getCanvas().style.cursor = ''; });
        }
    });
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
            state.map.addSource(`community-route-${routeId}`, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: mapboxCoords } } });
            state.map.addLayer({ id: `community-route-${routeId}`, type: 'line', source: `community-route-${routeId}`, paint: { 'line-color': '#28a745', 'line-width': 4, 'line-opacity': 0.7 } });
            state.communityLayers.push({ id: `community-route-${routeId}`, type: 'layer' });
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
        if (state.map.getSource('community-pins-source')) state.map.getSource('community-pins-source').setData({ type: 'FeatureCollection', features: allCommunityPinFeatures });
    } catch (error) { console.error("Error fetching community routes:", error); alert("Could not load community data."); }
}

/**
 * Removes all community-related layers and markers from the map.
 */
function clearCommunityRoutes() {
    state.communityMarkers.forEach(marker => marker.remove());
    state.setCommunityMarkers([]);
    state.communityLayers.forEach(layer => {
        if (state.map.getLayer(layer.id)) state.map.removeLayer(layer.id);
        if (state.map.getSource(layer.id)) state.map.removeSource(layer.id);
    });
    if (state.map.getSource('community-pins-source')) state.map.getSource('community-pins-source').setData({ type: 'FeatureCollection', features: [] });
    state.setCommunityLayers([]);
}

