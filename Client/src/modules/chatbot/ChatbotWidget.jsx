import React, { useState, useEffect, useRef } from 'react';
import './ChatbotWidget.css';

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
  const [language, setLanguage] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      sender: 'bot', 
      text: 'Welcome to Smart Grama Sewa! Please select your preferred language. / ස්මාර්ට් ග්‍රාම සේවා වෙත සාදරයෙන් පිළිගනිමු! කරුණාකර ඔබගේ භාෂාව තෝරන්න. / ஸ்மார்ட் கிராம சேவாவிற்கு வரவேற்கிறோம்! உங்கள் மொழியை தேர்ந்தெடுக்கவும்.',
      options: [
        { label: 'English', value: 'en' },
        { label: 'සිංහල', value: 'si' },
        { label: 'தமிழ்', value: 'ta' }
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBoxRef = useRef(null);

  useEffect(() => {
    // Generate a random user ID for the session if not exists
    let userId = localStorage.getItem('chatbotUserId');
    if (!userId) {
      userId = 'user_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatbotUserId', userId);
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages, isTyping, isOpen]);

  // Update initial message when language changes, if it's the only message
  // (Removed since we now handle it in handleLanguageSelect)

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleLanguageSelect = (langValue) => {
    setLanguage(langValue);
    
    // Remove the options from the first message so they can't be clicked again,
    // and append the user's choice and bot's initial translated greeting.
    setMessages(prev => {
      const updatedMessages = [...prev];
      if (updatedMessages[0].options) {
        delete updatedMessages[0].options;
      }
      
      const langLabel = langValue === 'en' ? 'English' : langValue === 'si' ? 'සිංහල' : 'தமிழ்';
      
      return [
        ...updatedMessages,
        { sender: 'user', text: langLabel },
        { sender: 'bot', text: UI_TEXT[langValue].initial }
      ];
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const question = inputValue.trim();
    if (!question) return;

    // Add user message
    setMessages(prev => [...prev, { sender: 'user', text: question }]);
    setInputValue('');
    setIsTyping(true);

    const userId = localStorage.getItem('chatbotUserId') || 'anonymous';

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
      {/* Floating Widget Button */}
      <div className="chatbot-widget-btn" onClick={toggleChat}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 8V4H8"></path>
          <rect x="4" y="8" width="16" height="12" rx="2" ry="2"></rect>
          <path d="M2 14h2"></path>
          <path d="M20 14h2"></path>
          <path d="M15 13v2"></path>
          <path d="M9 13v2"></path>
        </svg>
      </div>

      <div className={`chat-container ${isOpen ? '' : 'chat-hidden'}`}>
        <header className="chat-header">
          <div className="chat-avatar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8"></path>
              <rect x="4" y="8" width="16" height="12" rx="2" ry="2"></rect>
              <path d="M2 14h2"></path>
              <path d="M20 14h2"></path>
              <path d="M15 13v2"></path>
              <path d="M9 13v2"></path>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <h1>{language ? UI_TEXT[language].header : "Smart Grama Sewa"}</h1>
            <p className="chat-status">{language ? UI_TEXT[language].online : "Online"}</p>
          </div>
          <button className="chat-close-btn" onClick={toggleChat}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>
        
        <main className="chat-box" ref={chatBoxRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message chat-${msg.sender}-message`}>
              <div className="chat-message-content">
                {msg.text}
                {msg.formLink && (
                  <>
                    <br />
                    <a href={`/api/download/${msg.formLink}`} className="chat-form-link" download={msg.formLink}>
                      📄 Download: {msg.formLink}
                    </a>
                  </>
                )}
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
