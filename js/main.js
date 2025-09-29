import { initializeUI } from './ui.js';
import { checkAndClearOldData } from './utils.js';

// This is the main entry point of the application.
document.addEventListener('DOMContentLoaded', () => {
    checkAndClearOldData();
    initializeUI();
});
