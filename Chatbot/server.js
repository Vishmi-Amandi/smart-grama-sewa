const express = require('express');
const cors = require('cors');
const translate = require('google-translate-api-x');
const { getChatbotResponse } = require('./utils/chatbotLogic');
const { registerUser, saveChatInteraction, getChatHistory } = require('./utils/firebaseDB');

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

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
