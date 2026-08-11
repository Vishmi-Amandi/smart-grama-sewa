const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK using the service account key
const serviceAccountPath = path.join(__dirname, '../graphite-post-476714-i0-8fdf924bc187.json');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

const db = admin.firestore();

/**
 * Registers or updates a user in the 'users' collection.
 * @param {string} userId - The unique identifier for the user.
 * @param {object} userData - Optional data to store for the user.
 */
async function registerUser(userId, userData = {}) {
  try {
    const userRef = db.collection('users').doc(userId);
    // Use merge: true to avoid overwriting existing data if updating
    await userRef.set({
      ...userData,
      lastActive: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.log(`User ${userId} registered/updated in Firestore.`);
  } catch (error) {
    console.error("Error registering user:", error);
  }
}

/**
 * Saves a chat interaction to the user's 'chats' subcollection.
 * @param {string} userId - The unique identifier for the user.
 * @param {string} question - The user's question.
 * @param {object} botResponse - The bot's response object.
 */
async function saveChatInteraction(userId, question, botResponse) {
  try {
    const chatRef = db.collection('users').doc(userId).collection('chats').doc();
    await chatRef.set({
      question: question,
      botResponse: botResponse,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`Chat interaction saved for user ${userId}.`);
  } catch (error) {
    console.error("Error saving chat interaction:", error);
  }
}

/**
 * Retrieves the chat history for a given user from their 'chats' subcollection.
 * @param {string} userId - The unique identifier for the user.
 * @returns {Promise<Array>} - Array of chat interaction objects.
 */
async function getChatHistory(userId) {
  try {
    const chatsSnapshot = await db.collection('users').doc(userId).collection('chats')
      .orderBy('timestamp', 'asc')
      .get();
    
    const chats = [];
    chatsSnapshot.forEach(doc => {
      chats.push({ id: doc.id, ...doc.data() });
    });
    return chats;
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
}

/**
 * Saves an announcement to the 'announcements' collection.
 * @param {object} data - The announcement data matching proposal schema.
 * @returns {Promise<string>} - The document ID of the saved announcement.
 */
async function saveAnnouncement(data) {
  try {
    const docRef = await db.collection('announcements').add({
      title: data.title,
      description: data.description,
      gnDiv: data.gnDiv || '',
      language: data.language || 'en',
      priority: data.priority || 'Normal',
      category: data.category || 'General',
      status: data.status || 'Active',
      createdBy: data.createdBy || '',
      createdByUid: data.createdByUid || '',
      attachments: data.attachments || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Announcement saved with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error("Error saving announcement:", error);
    throw error;
  }
}

/**
 * Subscribe a device token to an FCM topic.
 * @param {string} token - The FCM device token.
 * @param {string} topic - The topic name (e.g., 'gn_division_XYZ').
 */
async function subscribeToTopic(token, topic) {
  try {
    const response = await admin.messaging().subscribeToTopic([token], topic);
    console.log(`Successfully subscribed to topic "${topic}":`, response);
    return response;
  } catch (error) {
    console.error(`Error subscribing to topic "${topic}":`, error);
    throw error;
  }
}

/**
 * Unsubscribe a device token from an FCM topic.
 * @param {string} token - The FCM device token.
 * @param {string} topic - The topic name.
 */
async function unsubscribeFromTopic(token, topic) {
  try {
    const response = await admin.messaging().unsubscribeFromTopic([token], topic);
    console.log(`Successfully unsubscribed from topic "${topic}":`, response);
    return response;
  } catch (error) {
    console.error(`Error unsubscribing from topic "${topic}":`, error);
    throw error;
  }
}

/**
 * Send a push notification to all subscribers of a GN division topic.
 * @param {string} gnDiv - The GN division ID (used as the topic name).
 * @param {object} announcement - The announcement data (title, description).
 */
async function sendAnnouncementNotification(gnDiv, announcement) {
  const topic = `gn_division_${gnDiv.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
  const message = {
    topic: topic,
    notification: {
      title: announcement.title || 'New Announcement',
      body: announcement.description
        ? announcement.description.substring(0, 200)
        : 'You have a new announcement from your Grama Niladhari office.',
    },
    data: {
      type: 'announcement',
      announcementId: announcement.id || '',
      gnDiv: gnDiv,
      priority: announcement.priority || 'Normal',
      url: '/announcements',
    },
    webpush: {
      fcmOptions: {
        link: '/announcements',
      },
      notification: {
        icon: '/logo.png',
        badge: '/favicon.svg',
        requireInteraction: announcement.priority === 'Urgent',
      },
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log(`FCM notification sent to topic "${topic}":`, response);
    return response;
  } catch (error) {
    // If no subscribers yet, this will throw — that's ok
    if (error.code === 'messaging/registration-token-not-registered' ||
        error.message?.includes('not found')) {
      console.log(`No subscribers for topic "${topic}" yet — skipping FCM send.`);
      return null;
    }
    console.error(`Error sending FCM to topic "${topic}":`, error);
    throw error;
  }
}

/**
 * Write an in-app notification document to a sub-collection.
 * @param {'users'|'gn_officers'} parentCollection - Parent Firestore collection.
 * @param {string} docId - The parent document ID (uid).
 * @param {object} notification - Notification payload.
 */
async function createNotification(parentCollection, docId, notification) {
  try {
    const ref = db.collection(parentCollection).doc(docId).collection('notifications').doc();
    await ref.set({
      ...notification,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`Notification written to ${parentCollection}/${docId}/notifications`);
  } catch (error) {
    console.error(`Error writing notification to ${parentCollection}/${docId}:`, error);
    throw error;
  }
}

/**
 * Fetch GN officer document by their division name.
 * Returns the officer's uid (doc ID) or null.
 * @param {string} gnDivisionName
 */
async function getGNOfficerByDivision(gnDivisionName) {
  try {
    const snap = await db.collection('gn_officers')
      .where('gnDivisionName', '==', gnDivisionName)
      .limit(1)
      .get();
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    return { uid: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Error fetching GN officer by division:', error);
    return null;
  }
}

/**
 * Get all Confirmed appointments that are upcoming (within 49 hours from now)
 * and have not yet had all reminders sent.
 */
async function getUpcomingConfirmedAppointments() {
  try {
    const now = new Date();
    // Look at appointments from now up to 49 hours ahead
    const windowEnd = new Date(now.getTime() + 49 * 60 * 60 * 1000);
    // Format as YYYY-MM-DD for comparison
    const todayStr = now.toISOString().split('T')[0];
    const endStr = windowEnd.toISOString().split('T')[0];

    const snap = await db.collection('appointments')
      .where('status', '==', 'Confirmed')
      .where('date', '>=', todayStr)
      .where('date', '<=', endStr)
      .get();

    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    return [];
  }
}

/**
 * Mark a reminder as sent on an appointment document.
 * @param {string} appointmentId
 * @param {'48h'|'24h'|'6h'} reminderType
 */
async function markReminderSent(appointmentId, reminderType) {
  try {
    const field = `reminderSent${reminderType}`;
    await db.collection('appointments').doc(appointmentId).update({
      [field]: true,
    });
  } catch (error) {
    console.error(`Error marking reminder ${reminderType} for appointment ${appointmentId}:`, error);
  }
}

module.exports = {
  db,
  registerUser,
  saveChatInteraction,
  getChatHistory,
  saveAnnouncement,
  subscribeToTopic,
  unsubscribeFromTopic,
  sendAnnouncementNotification,
  createNotification,
  getGNOfficerByDivision,
  getUpcomingConfirmedAppointments,
  markReminderSent,
};
