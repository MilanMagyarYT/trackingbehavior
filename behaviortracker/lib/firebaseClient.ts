'use client'

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { onIdTokenChanged }   from "firebase/auth";

import { getFirestore } from 'firebase/firestore'
import { store } from '@/app/store'
import { setUser, clearUser, setLoading } from '@/app/store/authSlice'

const firebaseConfig = {
  apiKey: 'AIzaSyAzjguAJxLxrM9kzdncZwDQYWlC4u8VK28',
  authDomain: 'bachelorthesys.firebaseapp.com',
  projectId: 'bachelorthesys',
  storageBucket: 'bachelorthesys.appspot.com',
  messagingSenderId: '461703288059',
  appId: '1:461703288059:web:0da3fe9eff6b11b5dc4c5e',
  measurementId: 'G-D2H06ESSG4',
}

let firebaseApp: FirebaseApp
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig)
} else {
  firebaseApp = getApps()[0]
}

export { firebaseApp }                      
export const auth = getAuth(firebaseApp)
export const db   = getFirestore(firebaseApp)   

export const listenToAuth = () => {
  store.dispatch(setLoading())
  onIdTokenChanged(auth, (user) => {
    if (user) {
      store.dispatch(setUser({
        uid:         user.uid,
        email:       user.email ?? "",
        displayName: user.displayName // now will be up‑to‑date
      }));
    } else {
      store.dispatch(clearUser());
    }
  });
}
