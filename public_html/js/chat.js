// BizBox AI Chat Module

let sessionId = null;
let chatHistory = [];

/**
 * Open chat modal
 */
function openChat() {
  const modal = document.getElementById('chat-modal');
  modal.style.display = 'flex';

  // Initialize session if needed
  if (!sessionId) {
    sessionId = 'session-' + Date.now();
    chatHistory = [];
    document.getElementById('chat-box').innerHTML = '';
    sendInitialMessage();
  }

  logEvent('chat_opened');
}

/**
 * Close chat modal
 */
function closeChat() {
  const modal = document.getElementById('chat-modal');
  modal.style.display = 'none';
  logEvent('chat_closed');
}

/**
 * Close modal when clicking overlay
 */
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('chat-modal');
  if (modal) {
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
      overlay.addEventListener('click', closeChat);
    }
  }
});

/**
 * Send initial greeting message
 */
async function sendInitialMessage() {
  const greetings = {
    ru: '👋 Привет! Я AI Советник BizBox. Помогу выбрать нужный бизнес. Расскажите: у вас уже есть бизнес?',
    uk: '👋 Привіт! Я AI Радник BizBox. Допоможу обрати потрібний бізнес. Розкажіть: у вас вже є бізнес?',
    en: '👋 Hi! I\'m BizBox AI Advisor. Let\'s find the right business for you. Do you have a business already?',
    es: '👋 ¡Hola! Soy el Asesor AI de BizBox. Encontremos el negocio adecuado. ¿Ya tienes un negocio?'
  };

  const greeting = greetings[currentLang] || greetings.en;
  addMessage('ai', greeting);
}

/**
 * Add message to chat
 */
function addMessage(sender, text) {
  const box = document.getElementById('chat-box');
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  const contentDiv = document.createElement('div');
  contentDiv.textContent = text;

  messageDiv.appendChild(contentDiv);
  box.appendChild(messageDiv);
  box.scrollTop = box.scrollHeight;

  // Track in history for non-UI messages
  if (sender !== 'loading') {
    chatHistory.push({
      role: sender === 'user' ? 'user' : 'assistant',
      content: text
    });
  }
}

/**
 * Send message to AI
 */
async function sendMessage() {
  const input = document.getElementById('chat-input');
  const message = input.value.trim();

  if (!message) return;

  // Show user message
  addMessage('user', message);
  input.value = '';
  input.focus();

  // Show typing indicator
  showTypingIndicator();

  try {
    const response = await fetch(`${API_BASE}/chat/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        sessionId,
        language: currentLang
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.success) {
      removeTypingIndicator();
      addMessage('ai', data.response);
      logEvent('chat_message_sent', { language: currentLang });
    } else {
      removeTypingIndicator();
      addMessage('ai', '❌ ' + (data.error || 'Error occurred'));
    }
  } catch (err) {
    removeTypingIndicator();
    console.error('❌ Chat Error:', err);
    addMessage('ai', '❌ Connection error. Please try again.');
    logEvent('chat_error', { error: err.message });
  }
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
  const box = document.getElementById('chat-box');
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message ai';
  loadingDiv.id = 'typing-indicator';
  loadingDiv.innerHTML = '<div>⏳ Typing...</div>';
  box.appendChild(loadingDiv);
  box.scrollTop = box.scrollHeight;
}

/**
 * Remove typing indicator
 */
function removeTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Qualify lead
 */
async function qualifyLead(email, name, phone, country) {
  try {
    const response = await fetch(`${API_BASE}/chat/qualify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId,
        email,
        name,
        phone,
        country
      })
    });

    const data = await response.json();

    if (data.success) {
      logEvent('lead_qualified', {
        email,
        readiness_score: data.analysis?.readiness_score,
        stage: data.analysis?.stage,
        recommended_product: data.analysis?.recommended_product
      });
      return data.analysis;
    }
  } catch (err) {
    console.error('❌ Qualify Error:', err);
  }

  return null;
}

/**
 * Create checkout session
 */
async function createCheckout(productId, email, name) {
  try {
    const response = await fetch(`${API_BASE}/checkout/create-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productId,
        email,
        name,
        language: currentLang
      })
    });

    const data = await response.json();

    if (data.success) {
      logEvent('checkout_session_created', {
        productId,
        email
      });
      return data.url;
    }
  } catch (err) {
    console.error('❌ Checkout Error:', err);
  }

  return null;
}

/**
 * Handle Enter key in chat input
 */
document.addEventListener('DOMContentLoaded', () => {
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
});

/**
 * Populate lead form and create checkout
 */
async function proceedToCheckout() {
  const email = prompt(t('chat_email') || 'Enter your email:');
  if (!email) return;

  const name = prompt(t('chat_name') || 'Enter your name:');
  if (!name) return;

  const productId = sessionStorage.getItem('selectedProduct')
    ? JSON.parse(sessionStorage.getItem('selectedProduct')).id
    : 1;

  // Qualify lead
  await qualifyLead(email, name, '', '');

  // Create checkout session
  const checkoutUrl = await createCheckout(productId, email, name);

  if (checkoutUrl) {
    window.location.href = checkoutUrl;
  } else {
    alert('Error creating checkout session');
  }
}

// Clean up session on page close
window.addEventListener('beforeunload', () => {
  if (sessionId) {
    // Send session end event
    logEvent('chat_session_ended', {
      sessionId,
      messagesCount: chatHistory.length
    });
  }
});
