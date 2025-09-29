// --- APPLICATION STATE ---
// Centralized state object to be shared across modules. Exporting a single
// object makes it easy to import and modify state from anywhere in the app
// while keeping it organized.
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
// Application-wide constants that do not change during runtime.

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
