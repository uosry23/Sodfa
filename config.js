// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyBGOtCj1JbIFGn5o_XZlV_DM7-DuP8_DIw",
    authDomain: "sodfa-539c6.firebaseapp.com",
    projectId: "sodfa-539c6",
    storageBucket: "sodfa-539c6.firebasestorage.app",
    messagingSenderId: "687052749759",
    appId: "1:687052749759:web:7cf8dfbdc4cfe5ef737f0a",
    measurementId: "G-9K12K88HF5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);