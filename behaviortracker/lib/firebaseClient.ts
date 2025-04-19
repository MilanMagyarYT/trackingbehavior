'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'         // 👈 NEW
import { store } from '@/app/store'
import { setUser, clearUser, setLoading } from '@/app/store/authSlice'

/* ---------- config ---------- */
const firebaseConfig = {
  apiKey: 'AIzaSyAzjguAJxLxrM9kzdncZwDQYWlC4u8VK28',
  authDomain: 'bachelorthesys.firebaseapp.com',
  projectId: 'bachelorthesys',
  storageBucket: 'bachelorthesys.appspot.com',            // typo fixed
  messagingSenderId: '461703288059',
  appId: '1:461703288059:web:0da3fe9eff6b11b5dc4c5e',
  measurementId: 'G-D2H06ESSG4',
}

/* ---------- init singleton ---------- */
let firebaseApp: FirebaseApp
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApps()[0]
}

/* ---------- exports ---------- */
export { firebaseApp }                       // optional
export const auth = getAuth(firebaseApp)
export const db   = getFirestore(firebaseApp)   // 👈 NEW

/* ---------- Redux‑linked auth listener ---------- */
export const listenToAuth = () => {
  store.dispatch(setLoading())
  onAuthStateChanged(auth, (user) => {
    if (user) {
      store.dispatch(setUser({ uid: user.uid, email: user.email ?? '' }))
    } else {
      store.dispatch(clearUser())
    }
  })
}
