import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

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

// Initialize Firebase Cloud Messaging (only in supported browsers)
let messaging = null;

/**
 * Initialize FCM messaging if the browser supports it.
 * Must be called after the page is loaded.
 */
export const initializeMessaging = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      messaging = getMessaging(app);
      console.log('Firebase Cloud Messaging initialized.');
    } else {
      console.log('FCM is not supported in this browser.');
    }
  } catch (error) {
    console.warn('Error initializing FCM:', error);
  }
  return messaging;
};

/**
 * Request notification permission and get FCM token.
 * Subscribes the token to the user's GN division topic via backend API.
 * @param {string} gnDiv - The user's GN division ID.
 * @returns {string|null} - The FCM token, or null if denied/unsupported.
 */
export const requestNotificationPermission = async (gnDiv) => {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications.');
      return null;
    }

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied.');
      return null;
    }

    // Ensure messaging is initialized
    if (!messaging) {
      await initializeMessaging();
    }
    if (!messaging) return null;

    // Register the service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Get FCM token
    // NOTE: Replace this VAPID key with your actual key from Firebase Console
    // Project Settings > Cloud Messaging > Web Push certificates
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY_HERE',
      serviceWorkerRegistration: registration,
    });

    if (token) {
      console.log('FCM Token:', token);

      // Subscribe to the GN division topic via backend
      if (gnDiv) {
        try {
          await fetch('/api/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, gnDiv }),
          });
          console.log(`Subscribed to GN division topic: ${gnDiv}`);
        } catch (err) {
          console.warn('Failed to subscribe to topic:', err);
        }
      }

      return token;
    }

    console.log('No FCM token available.');
    return null;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
};

/**
 * Listen for foreground FCM messages.
 * @param {function} callback - Called with the message payload when a message arrives.
 * @returns {function|null} - Unsubscribe function, or null if messaging is not available.
 */
export const onForegroundMessage = (callback) => {
  if (!messaging) {
    console.warn('Messaging not initialized. Call initializeMessaging() first.');
    return null;
  }
  return onMessage(messaging, (payload) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
};