// lib/firebaseClient.ts

import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyAzjguAJxLxrM9kzdncZwDQYWlC4u8VK28",
    authDomain: "bachelorthesys.firebaseapp.com",
    projectId: "bachelorthesys",
    storageBucket: "bachelorthesys.firebasestorage.app",
    messagingSenderId: "461703288059",
    appId: "1:461703288059:web:0da3fe9eff6b11b5dc4c5e",
    measurementId: "G-D2H06ESSG4"
};

let firebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApps()[0];
}

export const auth = getAuth(firebaseApp);
