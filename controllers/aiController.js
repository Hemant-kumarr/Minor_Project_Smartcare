const { GoogleGenerativeAI } = require('@google/generative-ai');

const getGemini = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'your_gemini_api_key_here' || key.trim().length < 10) {
    return null;
  }
  return new GoogleGenerativeAI(key.trim());
};

// @desc    AI Symptom Checker
// @route   POST /api/ai/symptom-check
// @access  Private (patient)
const symptomCheck = async (req, res) => {
  try {
    const { symptoms, duration, age, additionalInfo } = req.body;

    if (!symptoms || symptoms.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms in more detail.' });
    }

    const genAI = getGemini();
    if (!genAI) {
      // Return a demo response if no API key
      return res.status(200).json({
        success: true,
        demo: true,
        result: {
          symptomSummary: `You reported: ${symptoms}. Duration: ${duration || 'not specified'}. Age: ${age || 'not specified'}.`,
          generalInfo: 'Based on the symptoms described, this could relate to several common conditions. However, this is general information only and not a medical diagnosis.',
          recommendedSpecialist: 'General Physician',
          urgencyLevel: 'Moderate',
          urgencyColor: 'warning',
          suggestedNextStep: 'Consider booking an appointment with a General Physician for a proper evaluation.',
          disclaimer: 'This AI tool provides general health information only. It is NOT a medical diagnosis. Always consult a qualified healthcare professional.'
        }
      });
    }

    const prompt = `You are a helpful health information assistant. A user has described their symptoms. Provide general health information ONLY. Do NOT diagnose, prescribe medicines, or replace a doctor.

User Information:
- Symptoms: ${symptoms}
- Duration: ${duration || 'Not specified'}
- Age: ${age || 'Not specified'}
- Additional Info: ${additionalInfo || 'None'}

Respond ONLY in the following JSON format (no markdown, no extra text):
{
  "symptomSummary": "Brief summary of what the user reported",
  "generalInfo": "2-3 sentences of general educational health information. Do NOT diagnose.",
  "recommendedSpecialist": "One of: General Physician, Cardiologist, Dermatologist, Pediatrician, Orthopedic, Neurologist, Psychiatrist, Gynecologist, ENT Specialist, Ophthalmologist",
  "urgencyLevel": "One of: Low, Moderate, High, Emergency",
  "suggestedNextStep": "A helpful suggestion about when to see a doctor",
  "warningFlag": true or false (true only if symptoms suggest possible emergency)
}

IMPORTANT: If the user mentions chest pain with left arm pain, difficulty breathing, stroke symptoms, severe bleeding, or any life-threatening signs, set urgencyLevel to "Emergency" and warningFlag to true.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
    } catch (e) {
      parsed = {
        symptomSummary: symptoms,
        generalInfo: text,
        recommendedSpecialist: 'General Physician',
        urgencyLevel: 'Moderate',
        suggestedNextStep: 'Please consult a General Physician for a proper evaluation.',
        warningFlag: false
      };
    }

    // Set color based on urgency
    const urgencyColors = { Low: 'success', Moderate: 'warning', High: 'danger', Emergency: 'danger' };
    parsed.urgencyColor = urgencyColors[parsed.urgencyLevel] || 'warning';
    parsed.disclaimer = 'This AI tool provides general health information only. It is NOT a medical diagnosis. Always consult a qualified healthcare professional. For emergencies, call 112 or visit the nearest hospital immediately.';

    res.status(200).json({ success: true, result: parsed });
  } catch (error) {
    console.error('Symptom check error:', error);
    res.status(500).json({ success: false, message: 'Unable to connect to the AI assistant. Please try again.' });
  }
};

// @desc    AI Health Assistant Chat
// @route   POST /api/ai/chat
// @access  Private (any authenticated user)
const healthChat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || message.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Please enter a message.' });
    }

    const genAI = getGemini();
    if (!genAI) {
      return res.status(200).json({
        success: true,
        demo: true,
        reply: `Thank you for your question about "${message}". This is a demo response. To enable the AI Health Assistant, please add your Gemini API key to the .env file. The assistant can help with general health information, lifestyle advice, and guidance on which type of doctor to consult.`
      });
    }

    const systemPrompt = `You are SmartCare AI Health Assistant, a helpful and friendly general health information assistant. 

Your role:
- Provide general health information and wellness advice
- Help users understand which type of doctor/specialist they should consult
- Answer questions about common health conditions in simple language
- Promote healthy lifestyle habits

You MUST NOT:
- Provide a definitive medical diagnosis
- Prescribe or recommend specific prescription medications or dosages  
- Replace the advice of a qualified healthcare professional
- Provide specific dosage instructions for any medicine

If the user asks about something that could be a medical emergency, always advise them to seek immediate professional help or call emergency services.

Always be warm, clear, and helpful. Keep responses concise (2-4 sentences typically). If the question is clearly not health-related, politely redirect to health topics.`;

    // Build conversation history for context
    const conversationHistory = (history || []).slice(-10).map((h) => ({
      role: h.role,
      parts: [{ text: h.text }]
    }));

    const model = genAI.getGenerativeModel({ model: 'gemini-3.8-flash' });
    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: "Hello! I'm SmartCare AI Health Assistant. I'm here to provide general health information and help you understand which healthcare professional to consult. How can I assist you today?" }] },
        ...conversationHistory
      ]
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.status(200).json({ success: true, reply });
  } catch (error) {
    console.error('Health chat error:', error);
    res.status(500).json({ success: false, message: 'Unable to connect to the AI assistant. Please try again.' });
  }
};

module.exports = { symptomCheck, healthChat };
