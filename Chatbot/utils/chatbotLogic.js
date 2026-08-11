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

const FORMS_METADATA = [
  {
    id: 1,
    title: "Residence Certificate",
    form: "residence_certificate_form.pdf",
    answer: "To request a Residence Certificate, please click the link below to open and fill out the official digital application form.",
    keywords: ["residence", "residency", "address", "proof of stay", "stay", "house", "පදිංචි", "පදිංචිය", "වාසය", "නිවස", "வசிப்பிடம்", "குடியிருப்பு", "முகவரி"]
  },
  {
    id: 2,
    title: "Character Certificate",
    form: "character_certificate_form.pdf",
    answer: "To request a Character Certificate, please click the link below to open and fill out the official digital conduct validation form.",
    keywords: ["character", "conduct", "behavior", "police", "char", "චරිත", "චරිතය", "හැසිරීම", "நடத்தை", "நற்சான்றிதழ்"]
  },
  {
    id: 3,
    title: "Income Certificate",
    form: "income_verification_form.pdf",
    answer: "To verify your income, please click the link below to open and fill out the official digital Income Certificate application.",
    keywords: ["income", "salary", "salary sheet", "earn", "earning", "verify income", "verify salary", "verify earnings", "verify", "verified", "verification", "financial", "job", "profession", "ආදායම්", "ආදායම", "රැකියා", "පඩි", "පඩිය", "පඩිපත", "வருமானம்", "சம்பளம்"]
  },
  {
    id: 4,
    title: "Valuation Certificate",
    form: "valuation_certificate_form.pdf",
    answer: "To valuate your land or property, please click the link below to open and fill out the official digital Property Valuation form.",
    keywords: ["valuation", "property value", "land value", "house value", "worth", "valuate", "property", "value", "වටිනාකම", "තක්සේරු", "තක්සේරුව", "ඉඩම් වටිනාකම", "மதிப்பீடு", "சொத்து"]
  },
  {
    id: 5,
    title: "Identity Card Application",
    form: "nic_application_form.pdf",
    answer: "To apply for a National Identity Card (NIC), please click the link below to open and fill out the official digital application form.",
    keywords: ["nic", "identity card", "id card", "id", "new id", "card", "replacement id", "replacement card", "ජාතික හැඳුනුම්පත", "හැඳුනුම්පත", "හැදුනුම්පත", "අයිඩෙන්ටිටි", "அட்டை", "அடையாள அட்டை"]
  },
  {
    id: 6,
    title: "Living Funds for Disabled Persons",
    form: "samurdhi_application.pdf",
    answer: "To request living assistance funds for disabled persons, please click the link below to open the digital recommendation form.",
    keywords: ["disabled", "disability", "handicap", "funds", "relief", "disabled fund", "disabled person", "physically", "blind", "deaf", "living funds", "living assistance", "livinf funds", "livinf", "living", "samurdhi", "සමුර්ධි", "සහනාධාර", "සහන", "மாற்றுத்திறனாளி", "ஊனமுற்றோர்", "நிதி"]
  },
  {
    id: 7,
    title: "Voter Registration Form",
    form: "voter_registration_form.pdf",
    answer: "To register or revise your details in the voter list, please click the link below to fill out the digital Voter Registration form.",
    keywords: ["voter", "vote", "voting", "registration", "election", "enumerate", "electoral", "electoral list", "voter list", "ඡන්ද", "ඡන්දය", "ඡන්දදායක", "ලියාපදිංචිය", "வாக்காளர்", "வாக்கு"]
  },
  {
    id: 8,
    title: "Permit for Felling Trees",
    form: "permit_felling_trees.pdf",
    answer: "To obtain a permit to cut down trees (such as Jack trees), please click the link below to fill out the digital Tree Felling Permit.",
    keywords: ["tree", "felling", "cut tree", "chop tree", "jack tree", "cut", "wood", "tree cut", "ගස්", "ගස", "කැපීම", "ගස් කැපීම", "කොස් ගස", "மரம்", "வெட்டுதல்"]
  },
  {
    id: 9,
    title: "Permit for Timber Transportation",
    form: "timber_transport_form.pdf",
    answer: "To obtain a permit to transport timber legally, please click the link below to fill out the digital Timber Transport Permit.",
    keywords: ["timber", "transport", "timber transport", "log", "logs", "moving wood", "moving timber", "ලී", "දැව", "ප්‍රවාහනය", "දැව ප්‍රවාහන", "මරණ", "மர போக்குவரத்து", "மரம்"]
  },
  {
    id: 10,
    title: "Business Registration Recommendation",
    form: "business_registration_recommendation.pdf",
    answer: "To get a Grama Niladhari recommendation for business registration, please click the link below to fill out the digital form.",
    keywords: ["business", "register business", "start business", "company", "shop", "trade", "commercial", "ව්‍යාපාර", "ව්‍යාපාරය", "ලියාපදිංචිය", "ව්‍යාපාර ලියාපදිංචිය", "வணிகம்", "தொழில்"]
  },
  {
    id: 11,
    title: "Assessments for Ownership of Lands",
    form: "assessments_ownership_lands.pdf",
    answer: "To verify your land boundaries and ownership assessments, please click the link below to fill out the digital form.",
    keywords: ["ownership", "land ownership", "boundary", "land boundary", "deed", "assessments", "land", "property", "deed verification", "ඉඩම්", "ඉඩම", "අයිතිය", "ඔප්පුව", "මායිම", "காணி", "நிலம்", "உரிமை"]
  }
];

/**
 * Matches a user's question to the best FAQ entry or Form keyword.
 * @param {string} userQuestion - The question asked by the user.
 * @returns {object} - An object containing the matched question, answer, and form.
 */
function getChatbotResponse(userQuestion) {
  if (!userQuestion || typeof userQuestion !== 'string') {
    return {
      answer: "I am sorry, but that query is empty or invalid. Please ask about a service or form.",
      form: null
    };
  }

  const lowerQuery = userQuestion.toLowerCase().trim();

  // 1. Direct Form Keyword Match
  for (const item of FORMS_METADATA) {
    for (const keyword of item.keywords) {
      // Regex check to match keyword as a standalone word/phrase
      const regex = new RegExp(`(^|\\s)${keyword}(\\s|$)`, 'i');
      if (regex.test(lowerQuery) || lowerQuery === keyword) {
        return {
          matchedQuestion: `Request for ${item.title}`,
          answer: item.answer,
          form: item.form,
          confidence: 1.0
        };
      }
    }
  }

  // 2. Fall back to similarity matching with FAQ database
  if (faqData && faqData.length > 0) {
    const questionsList = faqData.map(item => item.question);
    const match = stringSimilarity.findBestMatch(userQuestion, questionsList);
    const bestMatch = match.bestMatch;

    if (bestMatch.rating > 0.35) {
      const matchedItem = faqData.find(item => item.question === bestMatch.target);
      return {
        matchedQuestion: matchedItem.question,
        answer: matchedItem.answer,
        form: matchedItem.form,
        confidence: bestMatch.rating
      };
    }
  }

  // 3. Unrelated or Low Confidence matching -> return error/unavailable service message
  return {
    answer: "I am sorry, but that service or information is currently unavailable or unrelated to Smart Grama Sewa. Currently, I can only help with certificates, forms, schedules, and official division announcements.",
    form: null,
    confidence: 0
  };
}

module.exports = {
  getChatbotResponse
};
