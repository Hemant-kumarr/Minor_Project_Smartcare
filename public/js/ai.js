/* =============================================
   SmartCare AI – AI Features JS
   (Symptom Checker + Health Assistant Chat)
   ============================================= */

// ═══════════════════════════════════════════════
// SYMPTOM CHECKER
// ═══════════════════════════════════════════════
let lastRecommendedSpecialist = '';

async function runSymptomCheck() {
  const symptoms = document.getElementById('symptoms')?.value?.trim();
  const duration = document.getElementById('duration')?.value;
  const age = document.getElementById('age')?.value;
  const additionalInfo = document.getElementById('additionalInfo')?.value?.trim();
  const errorEl = document.getElementById('symptomsError');

  if (errorEl) errorEl.textContent = '';

  if (!symptoms || symptoms.length < 5) {
    if (errorEl) errorEl.textContent = 'Please describe your symptoms in at least a few words.';
    return;
  }

  // Set loading state
  const btn = document.getElementById('checkBtn');
  const btnText = document.getElementById('checkBtnText');
  const spinner = document.getElementById('checkSpinner');
  btn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline-block';

  // Show loading in result panel
  document.getElementById('resultEmpty').style.display = 'none';
  document.getElementById('resultContent').style.display = 'none';

  try {
    const res = await authFetch('/api/ai/symptom-check', {
      method: 'POST',
      body: JSON.stringify({ symptoms, duration, age, additionalInfo })
    });

    if (!res) return;
    const data = await res.json();

    if (!res.ok) {
      showToast(data.message || 'AI service unavailable. Please try again.', 'error');
      document.getElementById('resultEmpty').style.display = 'block';
      return;
    }

    renderSymptomResult(data.result);

  } catch (err) {
    showToast('Unable to connect to the AI assistant. Please try again.', 'error');
    document.getElementById('resultEmpty').style.display = 'block';
  } finally {
    btn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

function renderSymptomResult(result) {
  lastRecommendedSpecialist = result.recommendedSpecialist || '';

  // Emergency alert
  const emergAlert = document.getElementById('emergencyAlert');
  if (result.urgencyLevel === 'Emergency' || result.warningFlag) {
    emergAlert.style.display = 'flex';
  } else {
    emergAlert.style.display = 'none';
  }

  // Fill result fields
  document.getElementById('resSummary').textContent = result.symptomSummary || '—';
  document.getElementById('resInfo').textContent = result.generalInfo || '—';
  document.getElementById('resSpecialist').textContent = result.recommendedSpecialist || 'General Physician';
  document.getElementById('resNextStep').textContent = result.suggestedNextStep || '—';
  document.getElementById('resDisclaimer').textContent = result.disclaimer || '';

  // Urgency badge
  const urgEl = document.getElementById('resUrgency');
  urgEl.textContent = result.urgencyLevel || 'Moderate';
  urgEl.className = 'urgency-badge';
  const urgClass = {
    Low: 'urgency-low',
    Moderate: 'urgency-moderate',
    High: 'urgency-high',
    Emergency: 'urgency-emergency'
  };
  urgEl.classList.add(urgClass[result.urgencyLevel] || 'urgency-moderate');

  // Show results
  document.getElementById('resultContent').style.display = 'block';

  // If demo mode, note it
  if (result.demo) {
    showToast('Demo mode – Add your Gemini API key in .env for real AI responses.', 'warning', 5000);
  }

  // Smooth scroll to results on mobile
  if (window.innerWidth < 768) {
    document.getElementById('resultContent').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function goToRecommendedDoctor() {
  const spec = lastRecommendedSpecialist || 'General Physician';
  window.location.href = `/patient/doctors?specialization=${encodeURIComponent(spec)}`;
}


// ═══════════════════════════════════════════════
// HEALTH ASSISTANT CHAT
// ═══════════════════════════════════════════════
let chatHistory = [];
let isTyping = false;

function initChat() {
  const body = document.getElementById('chatBody');
  if (!body) return;

  // Welcome message
  appendMessage('ai',
    "Hello! I'm your <strong>SmartCare AI Health Assistant</strong>. 👋<br><br>" +
    "I can provide general health information and help you understand which type of healthcare professional may be appropriate for your concern.<br><br>" +
    "<em>I cannot diagnose conditions, prescribe medicines, or replace a doctor. For emergencies, please call 112.</em>"
  );
}

function appendMessage(role, html, isTypingIndicator = false) {
  const body = document.getElementById('chatBody');
  if (!body) return null;

  const wrapper = document.createElement('div');
  wrapper.className = `chat-message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'chat-avatar';
  avatar.innerHTML = role === 'ai'
    ? '<i class="fa-solid fa-robot" style="color:var(--primary);font-size:13px;"></i>'
    : '<i class="fa-solid fa-user" style="color:var(--gray-500);font-size:13px;"></i>';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble';

  if (isTypingIndicator) {
    bubble.innerHTML = `<div class="typing-indicator"><span></span><span></span><span></span></div>`;
    wrapper.id = 'typingIndicator';
  } else {
    bubble.innerHTML = html;
  }

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  body.appendChild(wrapper);

  // Scroll to bottom
  body.scrollTop = body.scrollHeight;
  return wrapper;
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
}

async function sendChatMessage() {
  if (isTyping) return;

  const input = document.getElementById('chatInput');
  const message = input?.value?.trim();
  if (!message) return;

  // Clear input
  input.value = '';
  input.style.height = 'auto';

  // Hide suggestions on first message
  const sugBar = document.getElementById('suggestionsBar');
  if (sugBar) sugBar.style.display = 'none';

  // Show user message
  appendMessage('user', escapeHtml(message));

  // Add to history
  chatHistory.push({ role: 'user', text: message });

  // Show typing indicator
  isTyping = true;
  document.getElementById('sendBtn').disabled = true;
  const statusEl = document.getElementById('chatStatus');
  if (statusEl) statusEl.textContent = 'Typing…';
  appendMessage('ai', '', true);

  try {
    const res = await authFetch('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        history: chatHistory.slice(-10) // send last 10 messages for context
      })
    });

    removeTypingIndicator();

    if (!res) {
      appendMessage('ai', 'Sorry, I lost connection. Please try again.');
      return;
    }

    const data = await res.json();

    if (!res.ok || !data.reply) {
      appendMessage('ai', data.message || 'Sorry, I encountered an error. Please try again.');
      return;
    }

    // Format reply – convert line breaks and basic markdown
    const formatted = formatAIReply(data.reply);
    appendMessage('ai', formatted);

    // Add to history
    chatHistory.push({ role: 'model', text: data.reply });

    // Demo mode notice
    if (data.demo) {
      showToast('Demo mode – Add Gemini API key in .env for real responses.', 'warning', 5000);
    }

  } catch (err) {
    removeTypingIndicator();
    appendMessage('ai', 'Unable to connect to the AI assistant. Please check your connection and try again.');
  } finally {
    isTyping = false;
    document.getElementById('sendBtn').disabled = false;
    if (statusEl) statusEl.textContent = 'Online – Ready to help';
  }
}

function formatAIReply(text) {
  // Convert **bold** to <strong>
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Convert line breaks
  formatted = formatted.replace(/\n\n/g, '<br><br>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

function escapeHtml(text) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}
