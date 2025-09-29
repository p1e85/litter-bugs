// --- APPLICATION STATE ---
// Centralized state object to be shared across modules.
export const state = {
    currentUser: null,
    trackingWatcher: null,
    routeCoordinates: [],
    photoPins: [],
    map: null,
    findMeMarker: null,
    isCommunityViewOn: false,
    communityLayers: [],
    isSignUpMode: true,
    userMarkers: [],
    communityMarkers: [],
    trackingStartTime: null,
    currentStyleIndex: 0,
};

// --- CONSTANTS ---
export const ZOOM_THRESHOLD = 14;
export const profanityList = ["word1", "word2", "word3"];

export const mapStyles = [
    { name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
    { name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' },
    { name: 'Light', url: 'mapbox://styles/mapbox/light-v11' },
    { name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
    { name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-streets-v12' }
];

export const allBadges = {
    first_find: { name: 'First Find', icon: '🗑️', description: 'Pinned your very first piece of litter.' },
    collector: { name: 'Collector', icon: '🛍️', description: 'Pinned a total of 50 items.' },
    // ... (include all your other badge definitions)
    community_pillar: { name: 'Community Pillar', icon: '🏛️', description: 'Published 100 routes. You are a legend!' }
};
