document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  
  // Generate a random user ID for the session if not exists
  let userId = localStorage.getItem('chatbotUserId');
  if (!userId) {
    userId = 'user_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('chatbotUserId', userId);
  }

  // Widget Toggle Logic
  const widgetBtn = document.getElementById('chatbot-widget-btn');
  const chatContainer = document.getElementById('chat-container');
  const closeBtn = document.getElementById('close-chat-btn');

  widgetBtn.addEventListener('click', () => {
    chatContainer.classList.toggle('chat-hidden');
  });

  closeBtn.addEventListener('click', () => {
    chatContainer.classList.add('chat-hidden');
  });

  function appendMessage(sender, text, formLink = null) {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', `${sender}-message`);
    
    let contentHtml = `<div class="message-content">${text}`;
    
    if (formLink) {
      contentHtml += `<br><a href="/api/download/${formLink}" class="form-link" download="${formLink}">📄 Download: ${formLink}</a>`;
    }
    
    contentHtml += `</div>`;
    msgDiv.innerHTML = contentHtml;
    
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function showTypingIndicator() {
    const msgDiv = document.createElement('div');
    msgDiv.classList.add('message', 'bot-message');
    msgDiv.id = 'typing-indicator';
    msgDiv.innerHTML = `
      <div class="typing-indicator">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
    `;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById('typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const question = userInput.value.trim();
    if (!question) return;

    // Add user message to UI
    appendMessage('user', question);
    userInput.value = '';

    // Show typing
    showTypingIndicator();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, userId })
      });

      const data = await response.json();
      removeTypingIndicator();

      if (response.ok) {
        appendMessage('bot', data.answer, data.form);
      } else {
        appendMessage('bot', "Sorry, I'm having trouble connecting to the server right now.");
      }
    } catch (error) {
      removeTypingIndicator();
      console.error("Error calling API:", error);
      appendMessage('bot', "Network error. Please try again later.");
    }
  });
});
