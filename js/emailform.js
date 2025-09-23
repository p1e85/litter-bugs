// --- Firebase SDK Setup ---
// These imports are needed to interact with Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// --- IMPORTANT: Use the same Firebase config from your map app ---
const firebaseConfig = {
  apiKey: "AIzaSyCE1b6VtJjUs0O5YvyLjeslxuHC8UlgJUM",
  authDomain: "garbagepathv2.firebaseapp.com",
  projectId: "garbagepathv2",
  storageBucket: "garbagepathv2.firebasestorage.app",
  messagingSenderId: "505856089619",
  appId: "1:505856089619:web:682f58d02be4295be4a9e6",
  measurementId: "G-SM46WXV0CN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Get references to the HTML elements ---
const signupForm = document.getElementById('signupForm');
const firstNameInput = document.getElementById('firstName');
const emailInput = document.getElementById('email');
const submitButton = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');

// --- Listen for the form submission event ---
signupForm.addEventListener('submit', async (event) => {
    // Prevent the default browser action of reloading the page
    event.preventDefault();

    // Get the values from the form and trim any whitespace
    const firstName = firstNameInput.value.trim();
    const email = emailInput.value.trim();

    // --- Provide user feedback ---
    // Disable the button to prevent multiple submissions
    submitButton.disabled = true;
    submitButton.textContent = 'Submitting...';
    formMessage.textContent = ''; // Clear any previous messages

    try {
        // --- Save the data to Firestore ---
        // Add a new document to a collection named "mailingList"
        await addDoc(collection(db, "mailingList"), {
            firstName: firstName,
            email: email,
            timestamp: new Date() // Add a timestamp to know when they signed up
        });

        // --- Success! ---
        // Display a success message
        formMessage.textContent = "Thanks for signing up! We'll be in touch.";
        formMessage.style.color = '#28a745'; // Green color for success

        // Clear the form fields
        signupForm.reset();

    } catch (error) {
        // --- Handle errors ---
        // Log the detailed error to the console for debugging
        console.error("Error adding document to mailing list: ", error);

        // Display a generic error message to the user
        formMessage.textContent = "Something went wrong. Please try again later.";
        formMessage.style.color = '#dc3545'; // Red color for error

    } finally {
        // --- Re-enable the button ---
        // This block runs whether the submission succeeded or failed
        submitButton.disabled = false;
        submitButton.textContent = 'Notify Me';
    }
});
