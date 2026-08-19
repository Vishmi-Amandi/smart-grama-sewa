const express = require('express');
const cors = require('cors');
const translate = require('google-translate-api-x');
const cron = require('node-cron');
const { getChatbotResponse } = require('./utils/chatbotLogic');
const {
  registerUser, saveChatInteraction, getChatHistory, saveAnnouncement,
  subscribeToTopic, unsubscribeFromTopic, sendAnnouncementNotification,
  createNotification, getGNOfficerByDivision,
  getUpcomingConfirmedAppointments, markReminderSent
} = require('./utils/firebaseDB');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
const path = require('path');
app.use(express.static(path.join(__dirname, 'public')));

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Chatbot backend is running' });
});

// Dedicated download endpoint to force correct file format and headers
app.get('/api/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'public', 'forms', filename);
  res.download(filePath, filename, (err) => {
    if (err) {
      res.status(404).send('File not found.');
    }
  });
});

// Chatbot endpoint
app.post('/api/chat', async (req, res) => {
  // Extract userId, question, and preferredLanguage from the request body. Fallback to 'anonymous' and 'en'.
  const { question, userId = 'anonymous', preferredLanguage = 'en' } = req.body;

  if (!question) {
    return res.status(400).json({ error: 'Please provide a "question" in the request body.' });
  }

  try {
    let questionInEnglish = question;

    // 1. Translate user's question to English if they are using another language
    if (preferredLanguage !== 'en') {
      try {
        const transRes = await translate(question, { to: 'en' });
        questionInEnglish = transRes.text;
      } catch (err) {
        console.error("Translation to English failed:", err);
      }
    }

    // 2. Get the bot's response based on the logic
    const response = getChatbotResponse(questionInEnglish);

    // 3. Translate the bot's response back to the preferred language
    if (preferredLanguage !== 'en' && response.answer) {
      try {
        const transRes = await translate(response.answer, { to: preferredLanguage });
        response.answer = transRes.text;
      } catch (err) {
        console.error("Translation to preferred language failed:", err);
      }
    }

    // 4. Register/update the user in Firestore (asynchronously in the background)
    registerUser(userId, { source: 'api' }).catch(console.error);

    // 5. Save the chat interaction to Firestore (asynchronously in the background)
    saveChatInteraction(userId, question, response).catch(console.error);

    // 6. Return the response to the client immediately
    res.status(200).json(response);
  } catch (error) {
    console.error("Error processing chat request:", error);
    res.status(500).json({ error: 'Internal server error while processing the request.' });
  }
});

// Get chat history for a specific user
app.get('/api/chat/history/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const history = await getChatHistory(userId);
    res.status(200).json(history);
  } catch (error) {
    console.error("Error retrieving chat history:", error);
    res.status(500).json({ error: 'Internal server error while retrieving history.' });
  }
});

// =============================================
// NOTIFICATION MODULE ENDPOINTS
// =============================================

// Trigger FCM push notification for a published announcement
app.post('/api/announcements/notify', async (req, res) => {
  const { gnDiv, title, description, priority, announcementId } = req.body;

  if (!gnDiv || !title) {
    return res.status(400).json({ error: 'gnDiv and title are required.' });
  }

  try {
    const result = await sendAnnouncementNotification(gnDiv, {
      id: announcementId || '',
      title,
      description: description || '',
      priority: priority || 'Normal',
    });
    res.status(200).json({ success: true, result: result || 'No subscribers yet' });
  } catch (error) {
    console.error('Error sending announcement notification:', error);
    res.status(500).json({ error: 'Failed to send notification.' });
  }
});

// Subscribe a device token to a GN division topic
app.post('/api/notifications/subscribe', async (req, res) => {
  const { token, gnDiv } = req.body;

  if (!token || !gnDiv) {
    return res.status(400).json({ error: 'token and gnDiv are required.' });
  }

  const topic = `gn_division_${gnDiv.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  try {
    const result = await subscribeToTopic(token, topic);
    res.status(200).json({ success: true, topic, result });
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    res.status(500).json({ error: 'Failed to subscribe to topic.' });
  }
});

// Unsubscribe a device token from a GN division topic
app.post('/api/notifications/unsubscribe', async (req, res) => {
  const { token, gnDiv } = req.body;

  if (!token || !gnDiv) {
    return res.status(400).json({ error: 'token and gnDiv are required.' });
  }

  const topic = `gn_division_${gnDiv.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

  try {
    const result = await unsubscribeFromTopic(token, topic);
    res.status(200).json({ success: true, topic, result });
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    res.status(500).json({ error: 'Failed to unsubscribe from topic.' });
  }
});

// =============================================
// APPOINTMENT NOTIFICATION ENDPOINTS
// =============================================

/**
 * POST /api/appointments/notify-new
 * Called when a citizen books a new appointment.
 * Writes in-app notifications to both the citizen and the GN officer.
 */
app.post('/api/appointments/notify-new', async (req, res) => {
  const { userId, gnDiv = '', service, date, slot, fullName, appointmentId } = req.body;

  if (!userId || !service) {
    return res.status(400).json({ error: 'userId and service are required.' });
  }

  try {
    // 1. Notify the citizen that their request was received
    await createNotification('users', userId, {
      type: 'appointment_new',
      title: '📋 Appointment Requested',
      body: `Your appointment request for "${service}" on ${date} at ${slot} has been submitted. Awaiting GN Officer approval.`,
      appointmentId: appointmentId || '',
      gnDiv: gnDiv || '',
    });

    // 2. Find the GN officer for this division and notify them (if division provided)
    if (gnDiv) {
      const officer = await getGNOfficerByDivision(gnDiv);
      if (officer) {
        await createNotification('gn_officers', officer.uid, {
          type: 'new_appointment',
          title: '🔔 New Appointment Request',
          body: `${fullName || 'A citizen'} has requested an appointment for "${service}" on ${date} at ${slot}. Please review and confirm.`,
          appointmentId: appointmentId || '',
          citizenId: userId,
        });
      } else {
        console.warn(`No GN officer found for division: ${gnDiv}`);
      }
    }

    res.status(200).json({ success: true, message: 'Appointment notifications sent.' });
  } catch (error) {
    console.error('Error sending appointment-new notifications:', error);
    res.status(500).json({ error: 'Failed to send appointment notifications.' });
  }
});

/**
 * POST /api/appointments/notify-confirmed
 * Called when a GN officer confirms an appointment.
 * Writes a confirmation notification to the citizen.
 */
app.post('/api/appointments/notify-confirmed', async (req, res) => {
  const { userId, service, date, slot, appointmentId, gnDiv } = req.body;

  if (!userId || !service) {
    return res.status(400).json({ error: 'userId and service are required.' });
  }

  try {
    await createNotification('users', userId, {
      type: 'appointment_confirmed',
      title: '✅ Appointment Confirmed!',
      body: `Your appointment for "${service}" has been confirmed by the GN Officer. Date: ${date}, Time: ${slot}. Please arrive on time.`,
      appointmentId: appointmentId || '',
      gnDiv: gnDiv || '',
    });

    res.status(200).json({ success: true, message: 'Confirmation notification sent.' });
  } catch (error) {
    console.error('Error sending appointment-confirmed notification:', error);
    res.status(500).json({ error: 'Failed to send confirmation notification.' });
  }
});

/**
 * POST /api/appointments/notify-cancelled
 * Called when an appointment is cancelled.
 * Writes a cancellation notification to the citizen.
 */
app.post('/api/appointments/notify-cancelled', async (req, res) => {
  const { userId, service, date, slot, appointmentId, gnDiv, cancelledBy } = req.body;

  if (!userId || !service) {
    return res.status(400).json({ error: 'userId and service are required.' });
  }

  try {
    const byText = cancelledBy ? ` by ${cancelledBy}` : '';
    await createNotification('users', userId, {
      type: 'appointment_cancelled',
      title: '❌ Appointment Cancelled',
      body: `Your appointment for "${service}" on ${date || ''} at ${slot || ''} has been cancelled${byText}.`,
      appointmentId: appointmentId || '',
      gnDiv: gnDiv || '',
    });

    res.status(200).json({ success: true, message: 'Cancellation notification sent.' });
  } catch (error) {
    console.error('Error sending appointment-cancelled notification:', error);
    res.status(500).json({ error: 'Failed to send cancellation notification.' });
  }
});

// =============================================
// REMINDER CRON JOB — runs every 15 minutes
// =============================================

/**
 * Parses an appointment slot string like "9:00 AM" or "2:30 PM"
 * combined with a date string "YYYY-MM-DD" into a JS Date object.
 */
function parseAppointmentDateTime(dateStr, slotStr) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const slotMatch = slotStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!slotMatch) return null;
    let hours = parseInt(slotMatch[1]);
    const minutes = parseInt(slotMatch[2]);
    const period = slotMatch[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return new Date(year, month - 1, day, hours, minutes, 0);
  } catch {
    return null;
  }
}

async function sendReminders() {
  console.log('[Cron] Running appointment reminder check...');
  const now = new Date();

  try {
    const appointments = await getUpcomingConfirmedAppointments();
    console.log(`[Cron] Found ${appointments.length} upcoming confirmed appointment(s).`);

    for (const appt of appointments) {
      const apptTime = parseAppointmentDateTime(appt.date, appt.slot);
      if (!apptTime) continue;

      const msUntil = apptTime.getTime() - now.getTime();
      const hoursUntil = msUntil / (1000 * 60 * 60);

      // 48-hour reminder: send when 47h < hoursUntil <= 49h
      if (hoursUntil > 47 && hoursUntil <= 49 && !appt.reminderSent48h) {
        await createNotification('users', appt.uid, {
          type: 'appointment_reminder',
          title: '⏰ Appointment Reminder — 48 Hours',
          body: `Reminder: Your appointment for "${appt.service}" is in 48 hours on ${appt.date} at ${appt.slot}. Please be prepared.`,
          appointmentId: appt.id,
          gnDiv: appt.gnDiv || '',
        });
        await markReminderSent(appt.id, '48h');
        console.log(`[Cron] Sent 48h reminder for appointment ${appt.id}`);
      }

      // 24-hour reminder: send when 23h < hoursUntil <= 25h
      if (hoursUntil > 23 && hoursUntil <= 25 && !appt.reminderSent24h) {
        await createNotification('users', appt.uid, {
          type: 'appointment_reminder',
          title: '⏰ Appointment Reminder — 24 Hours',
          body: `Reminder: Your appointment for "${appt.service}" is tomorrow on ${appt.date} at ${appt.slot}. Don't forget to bring your documents.`,
          appointmentId: appt.id,
          gnDiv: appt.gnDiv || '',
        });
        await markReminderSent(appt.id, '24h');
        console.log(`[Cron] Sent 24h reminder for appointment ${appt.id}`);
      }

      // 6-hour reminder: send when 5.75h < hoursUntil <= 6.25h
      if (hoursUntil > 5.75 && hoursUntil <= 6.25 && !appt.reminderSent6h) {
        await createNotification('users', appt.uid, {
          type: 'appointment_reminder',
          title: '⏰ Appointment Reminder — 6 Hours',
          body: `Reminder: Your appointment for "${appt.service}" is in 6 hours at ${appt.slot} today. Please head to the GN Office on time.`,
          appointmentId: appt.id,
          gnDiv: appt.gnDiv || '',
        });
        await markReminderSent(appt.id, '6h');
        console.log(`[Cron] Sent 6h reminder for appointment ${appt.id}`);
      }
    }
  } catch (error) {
    console.error('[Cron] Error in reminder job:', error);
  }
}


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);

  // Schedule reminder check every 15 minutes
  cron.schedule('*/15 * * * *', sendReminders);
  console.log('[Cron] Appointment reminder scheduler started (every 15 minutes).');
});
