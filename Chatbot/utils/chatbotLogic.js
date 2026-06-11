const stringSimilarity = require('string-similarity');
const fs = require('fs');
const path = require('path');

// Load FAQ data
const dataPath = path.join(__dirname, '../graphite-post-476714-i0-8fdf924bc187.json');
let faqData = [];

try {
  const fileContent = fs.readFileSync(dataPath, 'utf-8');
  const jsonData = JSON.parse(fileContent);
  if (jsonData.faq_data) {
    faqData = jsonData.faq_data;
  } else {
    console.warn("faq_data not found in the JSON file.");
  }
} catch (error) {
  console.error("Error reading or parsing JSON file:", error);
}

/**
 * Matches a user's question to the best FAQ entry.
 * @param {string} userQuestion - The question asked by the user.
 * @returns {object} - An object containing the matched question, answer, and form.
 */
function getChatbotResponse(userQuestion) {
  if (!faqData || faqData.length === 0) {
    return {
      answer: "I'm sorry, I don't have any answers available right now.",
      form: null
    };
  }

  // Extract all questions from the FAQ data
  const questionsList = faqData.map(item => item.question);

  // Find the best match
  const match = stringSimilarity.findBestMatch(userQuestion, questionsList);
  const bestMatch = match.bestMatch;

  // Set a threshold for similarity (e.g., 0.3)
  if (bestMatch.rating > 0.3) {
    const matchedItem = faqData.find(item => item.question === bestMatch.target);
    return {
      matchedQuestion: matchedItem.question,
      answer: matchedItem.answer,
      form: matchedItem.form,
      confidence: bestMatch.rating
    };
  } else {
    return {
      answer: "I'm sorry, I couldn't understand your question. Could you try rephrasing it or asking something else?",
      form: null,
      confidence: bestMatch.rating
    };
  }
}

module.exports = {
  getChatbotResponse
};
