// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBhXAxeQSG82C3815AdbsI6jZZqV6ohIw0",
  authDomain: "calendar030-b2037.firebaseapp.com",
  projectId: "calendar030-b2037",
  storageBucket: "calendar030-b2037.firebasestorage.app",
  messagingSenderId: "1025342358133",
  appId: "1:1025342358133:web:e7300b3fbbdde76c0c2e3c",
  measurementId: "G-5CGW8224Z8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);