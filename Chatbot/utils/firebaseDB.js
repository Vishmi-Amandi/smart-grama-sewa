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

module.exports = {
  db,
  registerUser,
  saveChatInteraction,
  getChatHistory
};
