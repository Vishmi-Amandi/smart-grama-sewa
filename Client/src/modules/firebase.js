import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyButih1J37kBHMe-45_wMpzN25C-LL-b_s",
  authDomain: "smart-grama-sewa.firebaseapp.com",
  projectId: "smart-grama-sewa",
  storageBucket: "smart-grama-sewa.firebasestorage.app",
  messagingSenderId: "828882218916",
  appId: "1:828882218916:web:d627cb6a2e399ea01e9b31",
  measurementId: "G-VDFH1DD377"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);