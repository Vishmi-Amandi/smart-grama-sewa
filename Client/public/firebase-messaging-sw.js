// Firebase Messaging Service Worker
// This runs in the background and handles push notifications
// even when the app is not in focus.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyButih1J37kBHMe-45_wMpzN25C-LL-b_s",
  authDomain: "smart-grama-sewa.firebaseapp.com",
  projectId: "smart-grama-sewa",
  storageBucket: "smart-grama-sewa.firebasestorage.app",
  messagingSenderId: "828882218916",
  appId: "1:828882218916:web:d627cb6a2e399ea01e9b31",
  measurementId: "G-VDFH1DD377"
});

const messaging = firebase.messaging();

// Handle background messages (when the app is not in focus)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Smart Grama Sewa';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification.',
    icon: '/logo.png',
    badge: '/favicon.svg',
    tag: payload.data?.announcementId || 'default',
    data: {
      url: payload.data?.url || '/announcements',
      type: payload.data?.type || 'announcement',
      announcementId: payload.data?.announcementId || '',
    },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    requireInteraction: payload.data?.priority === 'Urgent',
    vibrate: [200, 100, 200],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click — navigate to the announcements page
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click:', event);
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/announcements';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it and navigate
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Otherwise, open a new window
      return clients.openWindow(targetUrl);
    })
  );
});
