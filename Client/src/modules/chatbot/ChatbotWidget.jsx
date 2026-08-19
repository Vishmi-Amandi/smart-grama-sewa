import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import './ChatbotWidget.css';

const formList = [
  { id: 1, title: "Residence Certificate", cat: "Certificates", desc: "Proof of residence for official use" },
  { id: 2, title: "Character Certificate", cat: "Certificates", desc: "Proof of character for various purposes" },
  { id: 3, title: "Income Certificate", cat: "Certificates", desc: "Proof of income for various purposes" },
  { id: 4, title: "Valuation Certificate", cat: "Certificates", desc: "Property valuation for legal needs" },
  { id: 5, title: "Identity Card Application", cat: "Applications", desc: "New or replacement NIC application" },
  { id: 6, title: "Living Funds for Disabled Persons", cat: "Recommendations", desc: "Financial assistance application for persons with disabilities" },
  { id: 7, title: "Voter Registration Form", cat: "Applications", desc: "Register or revise names on the local voting list" },
  { id: 8, title: "Permit for Felling Trees", cat: "Recommendations", desc: "Approval to cut down Jack or protected trees" },
  { id: 9, title: "Permit for Timber Transportation", cat: "Recommendations", desc: "Legal permit to move timber between areas" },
  { id: 10, title: "Business Registration Recommendation", cat: "Recommendations", desc: "GN approval for new business starts" },
  { id: 11, title: "Assessments for Ownership of Lands", cat: "Certificates", desc: "Verify land ownership and boundaries" },
];

const mapFormLinkToId = (formLink) => {
  if (!formLink) return null;
  const link = formLink.toLowerCase();
  if (link.includes('residence')) return 1;
  if (link.includes('character')) return 2;
  if (link.includes('income') || link.includes('verification')) return 3;
  if (link.includes('valuation')) return 4;
  if (link.includes('nic') || link.includes('identity')) return 5;
  if (link.includes('disabled') || link.includes('samurdhi')) return 6;
  if (link.includes('voter')) return 7;
  if (link.includes('felling') || link.includes('tree')) return 8;
  if (link.includes('timber')) return 9;
  if (link.includes('business')) return 10;
  if (link.includes('ownership') || link.includes('land')) return 11;
  return null;
};

const UI_TEXT = {
  en: { 
    placeholder: "Type your question...", 
    online: "Online", 
    header: "Smart Grama Sewa",
    initial: "Hello! I am your Smart Grama Sewa Assistant. How can I help you today?"
  },
  si: { 
    placeholder: "ඔබගේ ප්‍රශ්නය ටයිප් කරන්න...", 
    online: "මාර්ගගතයි", 
    header: "ස්මාර්ට් ග්‍රාම සේවා",
    initial: "ආයුබෝවන්! මම ඔබේ ස්මාර්ට් ග්‍රාම සේවා සහායකයා වෙමි. අද මට ඔබට උදව් කළ හැක්කේ කෙසේද?"
  },
  ta: { 
    placeholder: "உங்கள் கேள்வியை தட்டச்சு செய்க...", 
    online: "ஆன்லைனில்", 
    header: "ஸ்மார்ட் கிராம சேவா",
    initial: "வணக்கம்! நான் உங்கள் ஸ்மார்ட் கிராம சேவா உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?"
  }
};

const ChatbotWidget = () => {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'forms'
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Welcome to Smart Grama Sewa! Please select your preferred language. / ස්මාර්ට් ග්‍රාම සේවා වෙත සාදරයෙන් පිළිගනිමු! කරුණාකර ඔබගේ භාෂාව තෝරන්න. / ஸ்மார்ட் கிராம சேவාවிற்கு வரவேற்கிறோம்! உங்கள் மொழியை தேர்ந்தெடுக்கவும்.',
      options: [
        { label: 'English', value: 'en' },
        { label: 'සිංහල', value: 'si' },
        { label: 'தமிழ்', value: 'ta' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatBoxRef = useRef(null);
  const location = useLocation();

  const publicRoutes = ['/', '/login', '/signup-select', '/signup'];
  const isPublicPage = publicRoutes.includes(location.pathname);
  const isCustomized = currentUser && !isPublicPage;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('chatbotUserId', user.uid);
      } else {
        setCurrentUser(null);
        localStorage.removeItem('chatbotUserId');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Reset to initial state when switching between customized (logged in & private page) and common views
    setLanguage(null);
    setHistoryLoaded(false);
    setActiveTab('chat');
    setMessages([
      { 
        sender: 'bot', 
        text: 'Welcome to Smart Grama Sewa! Please select your preferred language. / ස්මාර්ට් ග්‍රාම සේවා වෙත සාදරයෙන් පිළිගනිමු! කරුණාකර ඔබගේ භාෂාව තෝරන්න. / ஸ்மார்ட் கிராம சேවාවிற்கு வரவேற்கிறோம்! உங்கள் மொழியை தேர்ந்தெடுக்கவும்.',
        options: [
          { label: 'English', value: 'en' },
          { label: 'සිංහල', value: 'si' },
          { label: 'தமிழ்', value: 'ta' }
        ]
      }
    ]);
  }, [isCustomized]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    const handleOpenChatbot = () => setIsOpen(true);
    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-chatbot', handleOpenChatbot);
  }, []);

  const loadHistory = async () => {
    if (!currentUser) return;
    setLoadingHistory(true);
    try {
      let historyData = [];

      // 1. Attempt to fetch via API
      try {
        const response = await fetch(`/api/chat/history/${currentUser.uid}`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            historyData = data;
          }
        }
      } catch (err) {
        console.warn("API load history warning:", err);
      }

      // 2. Fallback to direct client-side Firestore if API returned no data
      if (historyData.length === 0) {
        try {
          const q = query(
            collection(db, 'users', currentUser.uid, 'chats'),
            orderBy('timestamp', 'asc')
          );
          const snap = await getDocs(q);
          snap.forEach(docSnap => {
            historyData.push({ id: docSnap.id, ...docSnap.data() });
          });
        } catch (firestoreErr) {
          console.warn("Client Firestore history fetch error:", firestoreErr);
        }
      }

      const historyMessages = [];
      historyData.forEach(item => {
        if (item.question) {
          historyMessages.push({ sender: 'user', text: item.question });
        }
        if (item.botResponse) {
          historyMessages.push({ 
            sender: 'bot', 
            text: item.botResponse.answer, 
            formLink: item.botResponse.form 
          });
        }
      });
      
      if (historyMessages.length > 0) {
        setMessages(prev => [
          ...historyMessages, 
          { sender: 'bot', text: '--- End of Previous Chats ---' }, 
          ...prev
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          { sender: 'bot', text: 'No previous chat history found.' }
        ]);
      }
      setHistoryLoaded(true);
    } catch (error) {
      console.error("Failed to load history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const generateGreeting = (langValue) => {
    let greetingText = UI_TEXT[langValue].initial;
    const userName = isCustomized ? (currentUser.displayName || currentUser.email.split('@')[0]) : null;
    
    if (userName) {
      if (langValue === 'en') {
        greetingText = greetingText.replace('Hello! ', `Hello ${userName}! `);
      } else if (langValue === 'si') {
        greetingText = greetingText.replace('ආයුබෝවන්! ', `ආයුබෝවන් ${userName}! `);
      } else if (langValue === 'ta') {
        greetingText = greetingText.replace('வணக்கம்! ', `வணக்கம் ${userName}! `);
      }
    }
    return greetingText;
  };

  const handleLanguageSelect = (langValue) => {
    setLanguage(langValue);
    
    setMessages(prev => {
      const updatedMessages = [...prev];
      if (updatedMessages[0].options) {
        delete updatedMessages[0].options;
      }
      
      const langLabel = langValue === 'en' ? 'English' : langValue === 'si' ? 'සිංහල' : 'தமிழ்';
      
      return [
        ...updatedMessages,
        { sender: 'user', text: langLabel },
        { sender: 'bot', text: generateGreeting(langValue) }
      ];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question) return;

    // Check for language change commands
    const lowerQuestion = question.toLowerCase();
    let newLang = null;
    
    if (lowerQuestion === 'english' || lowerQuestion === 'en') {
      newLang = 'en';
    } else if (lowerQuestion === 'sinhala' || lowerQuestion === 'සිංහල' || lowerQuestion === 'si') {
      newLang = 'si';
    } else if (lowerQuestion === 'tamil' || lowerQuestion === 'தமிழ்' || lowerQuestion === 'ta') {
      newLang = 'ta';
    }

    if (newLang) {
      setLanguage(newLang);
      setMessages(prev => [
        ...prev, 
        { sender: 'user', text: question },
        { sender: 'bot', text: newLang === 'en' ? 'Language changed to English.' : newLang === 'si' ? 'භාෂාව සිංහල වෙත වෙනස් කරන ලදී.' : 'மொழி தமிழ் ஆக மாற்றப்பட்டது.' }
      ]);
      setInputValue('');
      return;
    }

    // Check for conversational greetings
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'ayubowan', 'vanakkam', 'හායි', 'ආයුබෝවන්', 'வணக்கம்', 'ஹலோ'];
    const isGreeting = greetings.some(g => lowerQuestion === g || lowerQuestion.startsWith(g + ' '));

    if (isGreeting && language) {
      setMessages(prev => [
        ...prev,
        { sender: 'user', text: question },
        { sender: 'bot', text: generateGreeting(language) }
      ]);
      setInputValue('');
      return;
    }

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: question }]);
    setInputValue('');
    setIsTyping(true);

    const userId = isCustomized ? (localStorage.getItem('chatbotUserId') || 'anonymous') : 'anonymous';

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, userId, preferredLanguage: language })
      });

      const data = await response.json();
      setIsTyping(false);

      if (response.ok) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.answer, formLink: data.form }]);
        
        // Save chat interaction to Firestore client SDK for logged-in user
        if (currentUser) {
          addDoc(collection(db, 'users', currentUser.uid, 'chats'), {
            question: question,
            botResponse: data,
            timestamp: serverTimestamp()
          }).catch(err => console.warn("Could not save chat interaction:", err));
        }
      } else {
        setMessages(prev => [...prev, { sender: 'bot', text: "Sorry, I'm having trouble connecting to the server right now." }]);
      }
    } catch (error) {
      console.error("Error calling API:", error);
      setIsTyping(false);
      setMessages(prev => [...prev, { sender: 'bot', text: "Network error. Please try again later." }]);
    }
  };

  return (
    <>
      {/* Floating Widget Button — Pill Badge */}
      <div className="chatbot-widget-btn" onClick={toggleChat} role="button" aria-label="Open AI Assistant">
        {/* Notification dot */}
        <span className="chatbot-notif-dot" />
        {/* Icon */}
        <div className="chatbot-btn-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
            <path d="M12 3C8.7 3 6 5.4 6 8.4c0 1.6.7 3 1.8 4L7 15l3.2-.9c.6.2 1.2.3 1.8.3 3.3 0 6-2.4 6-5.4C18 5.7 15.3 3 12 3z"
              fill="rgba(255,255,255,0.25)" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="9.5" cy="8.5" r="0.95" fill="white"/>
            <circle cx="12" cy="8.5" r="0.95" fill="white"/>
            <circle cx="14.5" cy="8.5" r="0.95" fill="white"/>
          </svg>
        </div>
        {/* Label */}
        <span className="chatbot-btn-label">AI Assistant</span>
        {/* Pulse ring */}
        <span className="chatbot-btn-pulse" />
      </div>

      <div className={`chat-container ${isOpen ? '' : 'chat-hidden'}`}>
        <header className="chat-header">
          <div className="chat-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
              <path d="M12 3C8.7 3 6 5.4 6 8.4c0 1.6.7 3 1.8 4L7 15l3.2-.9c.6.2 1.2.3 1.8.3 3.3 0 6-2.4 6-5.4C18 5.7 15.3 3 12 3z" fill="rgba(255,255,255,0.3)" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="9.5" cy="8.5" r="0.9" fill="white"/>
              <circle cx="12" cy="8.5" r="0.9" fill="white"/>
              <circle cx="14.5" cy="8.5" r="0.9" fill="white"/>
            </svg>
          </div>
          <div className="chat-header-info">
            <h1>{language ? UI_TEXT[language].header : "Smart Grama Sewa"}</h1>
            <p className="chat-status">{language ? UI_TEXT[language].online : "Online"}</p>
          </div>
          <button className="chat-close-btn" onClick={toggleChat} aria-label="Close chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </header>
        <main className="chat-box" ref={chatBoxRef}>
          {isCustomized && !historyLoaded && (
            <div className="chat-history-btn-container">
              <button onClick={loadHistory} className="chat-history-btn" disabled={loadingHistory}>
                {loadingHistory ? "Loading..." : "Load Previous Chats"}
              </button>
            </div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message chat-${msg.sender}-message`}>
              <div className="chat-message-content">
                {msg.text}
                {msg.formLink && (() => {
                  const formId = mapFormLinkToId(msg.formLink);
                  const matchedForm = formList.find(f => f.id === formId);
                  const formTitle = matchedForm ? matchedForm.title : "Form";
                  return (
                    <>
                      <br />
                      <button 
                        onClick={() => {
                          setIsOpen(false);
                          if (formId) {
                            navigate(`/forms?select=${formId}`);
                          } else {
                            navigate('/forms');
                          }
                        }}
                        className="chat-form-redirect-btn"
                      >
                        📝 Open {formTitle}
                      </button>
                    </>
                  );
                })()}
                {msg.options && (
                  <div className="chat-options-container">
                    {msg.options.map(opt => (
                      <button 
                        key={opt.value} 
                        onClick={() => handleLanguageSelect(opt.value)}
                        className="chat-option-btn"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="chat-message chat-bot-message" id="typing-indicator">
              <div className="chat-typing-indicator">
                <div className="chat-dot"></div>
                <div className="chat-dot"></div>
                <div className="chat-dot"></div>
              </div>
            </div>
          )}
        </main>

        <footer className="chat-input-area">
          {language ? (
            <form className="chat-form" onSubmit={handleSubmit}>
              <input 
                type="text" 
                className="chat-user-input"
                placeholder={UI_TEXT[language].placeholder} 
                autoComplete="off" 
                required
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button type="submit" className="chat-send-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </form>
          ) : (
            <div className="chat-select-lang-msg">
              Please select a language above to start chatting.
            </div>
          )}
        </footer>
      </div>
    </>
  );
};

export default ChatbotWidget;
