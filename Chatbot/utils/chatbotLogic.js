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

// Comprehensive Form Specifications & Related Keywords for all 11 forms
const FORM_RULES = [
  {
    id: 1,
    title: "Residence Certificate",
    form: "residence_certificate_form.pdf",
    answer: "To get a Residence Certificate, submit the completed application form along with proof of identity (NIC) and a copy of your utility bill, deed, or lease agreement verifying your address.",
    keywords: [
      'residence', 'residency', 'reside', 'residing', 'residential',
      'address proof', 'proof of residence', 'living certificate', 'staying certificate',
      'house certificate', 'grama niladhari certificate', 'gn certificate',
      'certificate of residence', 'poddak', 'padinchi', 'vasathi', 'proof of address'
    ]
  },
  {
    id: 2,
    title: "Character Certificate",
    form: "character_certificate_form.pdf",
    answer: "For a Character Certificate, submit the application form along with your National Identity Card (NIC) and supporting documents. It certifies your good conduct within the GN division.",
    keywords: [
      'character', 'conduct', 'good character', 'character certificate',
      'police report', 'behavior', 'morality', 'character reference',
      'job character', 'charitha', 'employment certificate'
    ]
  },
  {
    id: 3,
    title: "Income Certificate",
    form: "income_verification_form.pdf",
    answer: "You can apply for an Income Certificate / Verification for Mahapola, university bursaries, or official requirements by submitting the income verification form with proof of income and your NIC.",
    keywords: [
      'income', 'salary', 'earnings', 'income certificate', 'income verification',
      'mahapola', 'bursary', 'bursery', 'scholarship', 'monthly income', 'annual income',
      'financial proof', 'income proof', 'salary proof', 'aadhayam', 'income status'
    ]
  },
  {
    id: 4,
    title: "Valuation Certificate",
    form: "valuation_certificate_form.pdf",
    answer: "To obtain a Property Valuation Certificate for your land or premises, submit the valuation application with your deed copies and survey plan for GN assessment.",
    keywords: [
      'valuation', 'property value', 'land value', 'house value', 'property valuation',
      'asset valuation', 'valuation certificate', 'tax value', 'estimate property',
      'real estate value', 'thakseru', 'land worth', 'house worth'
    ]
  },
  {
    id: 5,
    title: "Identity Card Application",
    form: "nic_application_form.pdf",
    answer: "You can apply for a new or replacement National Identity Card (NIC) by completing the NIC application form and submitting it to the GN office with your birth certificate and photos.",
    keywords: [
      'nic', 'identity card', 'national identity', 'id card', 'new nic',
      'lost nic', 'replace nic', 'renew nic', 'identity application',
      'id application', 'national id', 'handunumpatha', 'apply nic', 'apply id'
    ]
  },
  {
    id: 6,
    title: "Living Funds for Disabled Persons",
    form: "samurdhi_application.pdf",
    answer: "To apply for Living Funds / Financial Assistance for Persons with Disabilities or Samurdhi relief, complete the application form and provide medical reports, disability proof, and bank details.",
    keywords: [
      'disabled', 'disability', 'handicapped', 'special needs', 'living funds',
      'disabled allowance', 'disability funds', 'samurdhi', 'aswesuma',
      'financial assistance', 'disability allowance', 'welfare relief', 'abhaditha', 'relief fund'
    ]
  },
  {
    id: 7,
    title: "Voter Registration Form",
    form: "voter_registration_form.pdf",
    answer: "The Voter Registration Form allows you to register as a new voter or update electoral register records. Fill out the application and submit it to the Grama Niladhari.",
    keywords: [
      'voter', 'voting', 'electoral', 'election', 'voter list', 'voter registration',
      'electoral list', 'register to vote', 'polling', 'electoral register', 'vote form',
      'chanda', 'vote registration'
    ]
  },
  {
    id: 8,
    title: "Permit for Felling Trees",
    form: "tree_felling_permit_form.pdf",
    answer: "To cut down restricted or protected trees (such as Jack, Breadfruit, or female Palmyrah), submit the Tree Felling Permit Application along with land ownership deed and tree details.",
    keywords: [
      'tree', 'trees', 'felling', 'cut tree', 'cutting tree', 'cutting trees',
      'tree felling', 'tree permit', 'jack tree', 'jak tree', 'fell tree',
      'chopping tree', 'cut down tree', 'tree removal', 'gas kapeema', 'cut trees'
    ]
  },
  {
    id: 9,
    title: "Permit for Timber Transportation",
    form: "timber_transport_form.pdf",
    answer: "A Timber Transportation Permit is required to legally move logs and wood. Fill out the timber transport form with tree details, vehicle registration, and destination route.",
    keywords: [
      'timber', 'timber transport', 'wood transport', 'logs transport', 'timber permit',
      'transporting wood', 'moving timber', 'transport timber', 'timber removal',
      'lumber', 'log permit', 'dawa', 'transport wood', 'log transport'
    ]
  },
  {
    id: 10,
    title: "Business Registration Recommendation",
    form: "business_registration_form.pdf",
    answer: "To register a new business or trade enterprise, submit the Business Registration Recommendation application with your proposed business name, premises address, and deed/lease details.",
    keywords: [
      'business', 'business registration', 'trade license', 'new shop', 'commercial permit',
      'enterprise', 'business recommendation', 'company registration', 'store registration',
      'start business', 'business license', 'shop permit', 'vyapara', 'shop registration'
    ]
  },
  {
    id: 11,
    title: "Assessments for Ownership of Lands",
    form: "land_ownership_assessment_form.pdf",
    answer: "For Assessment of Land Ownership and deed verification, fill out the land ownership assessment form with deed numbers and boundary descriptions to verify legal ownership.",
    keywords: [
      'land ownership', 'ownership assessment', 'land assessment', 'land deed',
      'property ownership', 'land boundary', 'deed assessment', 'land verification',
      'proof of land', 'land title', 'ownership of land', 'idam', 'land proof'
    ]
  }
];

// General queries rules
const GENERAL_RULES = [
  {
    keywords: ['office hours', 'when is gn in office', 'working hours', 'available tomorrow', 'timing', 'open hours', 'opening hours', 'visiting hours', 'office time'],
    answer: "The Grama Niladhari is typically in the office on Tuesdays and Thursdays from 8:30 AM to 12:30 PM, and on Saturdays from 8:30 AM to 12:00 PM.",
    form: null,
    formId: null
  },
  {
    keywords: ['book appointment', 'appointment', 'meet gn', 'time to meet', 'schedule meeting', 'reserve slot', 'booking', 'meet officer'],
    answer: "You can book an appointment by using the 'Appointments' tab on our system, or by visiting the office during public hours.",
    form: null,
    formId: null
  },
  {
    keywords: ['aswesuma payment', 'payment date', 'welfare payment', 'aswesuma date', 'aswesuma'],
    answer: "Aswesuma payment dates are announced at the beginning of each month. Please check the Announcements section or your profile for updates.",
    form: null,
    formId: null
  },
  {
    keywords: ['how to use', 'how do i use', 'system guide', 'how does this work', 'navigation', 'help'],
    answer: "You can use this system to apply for certificates/forms, book appointments with the GN, view announcements, and track the status of your applications.",
    form: null,
    formId: null
  },
  {
    keywords: ['my profile', 'profile', 'where is my profile', 'account details', 'user profile'],
    answer: "You can access your profile by clicking on your name or profile avatar at the top right of the screen.",
    form: null,
    formId: null
  },
  {
    keywords: ['request status', 'my requests', 'track request', 'check status', 'application status'],
    answer: "To check your request or appointment status, visit the 'Appointments' or 'Profile' page where all your submitted applications are listed.",
    form: null,
    formId: null
  }
];

/**
 * Matches a user's question to the best FAQ or Form entry.
 * @param {string} userQuestion - The question asked by the user.
 * @returns {object} - An object containing matchedQuestion, answer, form, formId, and confidence.
 */
function getChatbotResponse(userQuestion) {
  if (!userQuestion || typeof userQuestion !== 'string') {
    return {
      answer: "I'm sorry, I couldn't understand your question. Could you please rephrase?",
      form: null,
      formId: null,
      confidence: 0
    };
  }

  const cleanQuery = userQuestion.toLowerCase().trim();
  const words = cleanQuery.replace(/[^\w\s]/gi, ' ').split(/\s+/).filter(Boolean);

  // 1. Check for specific form keyword/phrase matches (Highest Priority)
  let bestFormMatch = null;
  let highestScore = 0;

  for (const formRule of FORM_RULES) {
    let score = 0;
    for (const kw of formRule.keywords) {
      if (cleanQuery === kw) {
        score = Math.max(score, 10); // Exact keyword match
      } else if (cleanQuery.includes(kw)) {
        // Multi-word phrase or substring in query
        const wordCount = kw.split(' ').length;
        score = Math.max(score, 4 + wordCount * 2);
      } else {
        // Check individual words
        const kwWords = kw.split(' ');
        const matchingWords = kwWords.filter(w => words.includes(w));
        if (matchingWords.length > 0 && matchingWords.length === kwWords.length) {
          score = Math.max(score, 3 + matchingWords.length);
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestFormMatch = formRule;
    }
  }

  if (bestFormMatch && highestScore >= 3) {
    return {
      matchedQuestion: `Application for ${bestFormMatch.title}`,
      answer: bestFormMatch.answer,
      form: bestFormMatch.form,
      formId: bestFormMatch.id,
      confidence: Math.min(1, highestScore / 10)
    };
  }

  // 2. Check General System Rules (Appointments, Hours, etc.)
  for (const genRule of GENERAL_RULES) {
    for (const kw of genRule.keywords) {
      if (cleanQuery.includes(kw) || kw.split(' ').every(w => words.includes(w))) {
        return {
          matchedQuestion: kw,
          answer: genRule.answer,
          form: genRule.form,
          formId: genRule.formId,
          confidence: 0.9
        };
      }
    }
  }

  // 3. Fallback to String Similarity against JSON FAQ questions
  if (faqData && faqData.length > 0) {
    const questionsList = faqData.map(item => item.question);
    const match = stringSimilarity.findBestMatch(userQuestion, questionsList);
    const bestMatch = match.bestMatch;

    if (bestMatch.rating > 0.25) {
      const matchedItem = faqData.find(item => item.question === bestMatch.target);
      // Attempt to resolve formId if form is present
      let formId = null;
      if (matchedItem.form) {
        const found = FORM_RULES.find(f => f.form === matchedItem.form);
        if (found) formId = found.id;
      }
      return {
        matchedQuestion: matchedItem.question,
        answer: matchedItem.answer,
        form: matchedItem.form,
        formId: formId,
        confidence: bestMatch.rating
      };
    }
  }

  // 4. If nothing matched with high confidence, provide a helpful general response
  return {
    answer: "I can assist you with all 11 Grama Niladhari forms (Residence, Character, Income, Valuation, NIC, Disabled Funds, Voter, Tree Felling, Timber Transport, Business Registration, Land Assessment) as well as officer hours and appointment booking. What service do you need?",
    form: null,
    formId: null,
    confidence: 0
  };
}

module.exports = {
  getChatbotResponse,
  FORM_RULES
};

