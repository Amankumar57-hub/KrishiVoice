/**
 * Krishi Saathi – AI Service
 *
 * PRIMARY:  Pollinations.ai  — 100% FREE, unlimited, no API key required.
 *           Tries multiple models automatically if one fails.
 * FALLBACK: Google Gemini API — used if VITE_GEMINI_API_KEY is set AND Pollinations fails.
 *
 * Supports all KrishiVoice languages:
 *   Hindi (hi-IN), Hinglish (hi-IN), English (en-IN),
 *   Bhojpuri (hi-IN), Tamil (ta-IN), Marathi (mr-IN), Punjabi (pa-IN)
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Pollinations models to try in order (fallback chain)
const POLLINATIONS_MODELS = ['openai', 'openai-fast', 'mistral'];

// Strings that indicate the API returned a notice instead of an answer
const BAD_RESPONSE_PATTERNS = [
  /deprecated/i,
  /pollinations\.ai/i,
  /Please migrate/i,
  /legacy text API/i,
  /being deprecated/i,
  /enter\.pollinations/i,
  /⚠️/,
  /NOTE:/i,
];

// ─── Language reply instruction map ──────────────────────────────────────────
const LANG_INSTRUCTION = {
  'hi-IN':  'CRITICAL: Detect the exact language used in the prompt. If they speak English, reply in English. If Bhojpuri, reply in pure Bhojpuri. If Hindi, reply in Hindi. Match their language perfectly.',
  'en-IN':  'Please reply entirely in English. Be warm and respectful.',
  'ta-IN':  'தயவுசெய்து முழுமையாக தமிழில் பதில் அளிக்கவும். மரியாதையான வார்த்தைகளை பயன்படுத்தவும்।',
  'mr-IN':  'कृपया संपूर्णपणे मराठीत उत्तर द्या. आदरपूर्वक शब्द वापरा जसे की जी, आपण.',
  'pa-IN':  'ਕਿਰਪਾ ਕਰਕੇ ਪੂਰੀ ਤਰ੍ਹਾਂ ਪੰਜਾਬੀ ਵਿੱਚ ਜਵਾਬ ਦਿਓ। ਸਤਿਕਾਰਯੋਗ ਸ਼ਬਦ ਵਰਤੋ।',
  'bh':     'कृपया पूरा जवाब भोजपुरी में दीं। मीठा और आदरपूर्ण ढंग से बात करीं।',
};

const SYSTEM_CONTEXT = `CRITICAL MANDATORY RULE: YOU MUST SPEAK IN THE EXACT SAME LANGUAGE THE USER SPOKE TO YOU IN. 
If the user speaks English, you MUST reply entirely in English.
If the user speaks Bhojpuri, you MUST reply entirely in pure Bhojpuri.
If the user speaks Tamil, reply in Tamil. 
If the user asks you to "speak in English", you MUST instantly switch to English.
THIS IS YOUR HIGHEST PRIORITY.

You are "Krishi Saathi", an expert female AI agricultural assistant integrated into the KrishiVoice platform for Indian farmers.
Personality: Extremely sweet, calm, polite, positive, well-mannered, and distinctly feminine.

ABOUT YOU:
- Your name is Krishi Saathi.
- When asked your name, say: "My name is Krishi Saathi, I am your AI assistant" (translated to the user's language).

KNOWLEDGE BASE (KrishiVoice Website):
1. Login/Profile: Top right avatar icon.
2. List an Item: Tap the microphone on the homepage to voice-list, or go to Dashboard -> "Add Listing" button.
3. Settings: Bottom menu, has a "Mandi Alert" toggle.
4. Features: Live Mandi prices, voice listings, transport booking.

AGRICULTURAL ADVICE:
1. Recommend modern platforms (KrishiVoice), organic farming, and direct selling.
2. Be genuinely helpful with all crop queries.

FORMATTING:
- Keep answers brief (2-4 sentences max) for voice TTS.
- No markdown formatting at all.
- NEVER leave sentences unfinished.`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildUserMessage(prompt, voiceLocale, uiLang) {
  const langKey = uiLang === 'bh' ? 'bh' : (voiceLocale || 'hi-IN');
  const langInstruction = LANG_INSTRUCTION[langKey] || LANG_INSTRUCTION['hi-IN'];
  const hinglishNote = uiLang === 'hi-en'
    ? ' (The user prefers Hinglish — a natural mix of Hindi and English is acceptable.)'
    : '';
  return `[Language instruction: ${langInstruction}${hinglishNote}]\n\n${prompt}`;
}

/**
 * Cleans and validates the response text from Pollinations.
 * Returns the cleaned string, or throws if the response is a notice/error.
 */
function validatePollinationsResponse(raw) {
  const trimmed = (raw || '').trim();

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.error) {
        throw new Error(String(parsed.error?.message || parsed.error).slice(0, 200));
      }
      
      // Extract content from different possible JSON structures Pollinations might return
      if (parsed.content) {
        return parsed.content.trim();
      }
      if (parsed.message?.content) {
        return parsed.message.content.trim();
      }
      if (parsed.choices?.[0]?.message?.content) {
        return parsed.choices[0].message.content.trim();
      }
      
      // If we couldn't find content, it might be an unhandled JSON format or actual error
      throw new Error(String(parsed.message || 'Unexpected JSON response format').slice(0, 200));
    } catch (parseErr) {
      if (parseErr.message !== 'Unexpected JSON response format' && !parseErr.message.includes('Unexpected JSON')) throw parseErr;
      // Not valid JSON — let it through
    }
  }

  // Check for deprecation/notice text in the response
  for (const pattern of BAD_RESPONSE_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw new Error('Pollinations returned a notice/warning instead of an AI answer.');
    }
  }

  // Clean markdown and return
  const cleaned = trimmed
    .replace(/\*/g, '')
    .replace(/#+\s/g, '')
    .trim();

  if (!cleaned || cleaned.length < 5) {
    throw new Error('Pollinations returned an empty response.');
  }

  return cleaned;
}

// ─── PRIMARY: Pollinations.ai (single model attempt) ─────────────────────────

async function askPollinationsModel(prompt, voiceLocale, uiLang, model) {
  const userMessage = buildUserMessage(prompt, voiceLocale, uiLang);

  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_CONTEXT },
        { role: 'user', content: userMessage }
      ],
      model,
      seed: Math.floor(Math.random() * 9999), // Vary seed to avoid cached bad responses
      private: true,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new Error(`Pollinations [${model}] HTTP ${response.status}: ${errBody.slice(0, 100)}`);
  }

  const raw = await response.text();
  return validatePollinationsResponse(raw);
}

/**
 * PRIMARY AI: Tries each Pollinations model in order until one succeeds.
 */
async function askPollinations(prompt, voiceLocale, uiLang) {
  const errors = [];
  for (const model of POLLINATIONS_MODELS) {
    try {
      const reply = await askPollinationsModel(prompt, voiceLocale, uiLang, model);
      if (reply) {
        console.log(`✅ Krishi Saathi powered by Pollinations [${model}]`);
        return reply;
      }
    } catch (err) {
      console.warn(`Pollinations [${model}] failed:`, err.message);
      errors.push(`${model}: ${err.message}`);
    }
  }
  throw new Error(`All Pollinations models failed. Errors: ${errors.join(' | ')}`);
}

// ─── FALLBACK: Google Gemini ──────────────────────────────────────────────────

async function askGeminiFallback(prompt, voiceLocale, uiLang) {
  if (!GEMINI_API_KEY) return null;

  const userMessage = buildUserMessage(prompt, voiceLocale, uiLang);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_CONTEXT }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: { temperature: 0.7, topK: 40, topP: 0.95, maxOutputTokens: 800 },
      }),
    }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.replace(/\*/g, '').trim() || null;
}

// ─── EXPORTED MAIN FUNCTION ───────────────────────────────────────────────────

/**
 * @param {string} prompt        - User's spoken/typed message
 * @param {boolean} isHindi      - Legacy flag, kept for backward compat
 * @param {string} voiceLocale   - BCP-47 locale e.g. 'hi-IN', 'ta-IN', 'mr-IN', 'pa-IN', 'en-IN'
 * @param {string} uiLang        - Short UI lang id: 'hi', 'en', 'bh', 'ta', 'mr', 'pa', 'hi-en'
 */
export async function askGemini(prompt, isHindi = false, voiceLocale = 'hi-IN', uiLang = 'hi') {
  // ── Attempt 1: Google Gemini (fastest and most reliable if API key is set)
  try {
    const reply = await askGeminiFallback(prompt, voiceLocale, uiLang);
    if (reply) return reply;
  } catch (err) {
    console.warn('Gemini failed or not configured, trying Pollinations:', err.message);
  }

  // ── Attempt 2: Pollinations.ai with multi-model fallback (Always free, no quota)
  try {
    const reply = await askPollinations(prompt, voiceLocale, uiLang);
    if (reply) return reply;
  } catch (err) {
    console.warn('All Pollinations models also failed:', err.message);
  }

  // ── Attempt 3: Graceful offline message in the user's language
  const offlineMessages = {
    'hi-IN': 'जी, इस समय सेवा उपलब्ध नहीं है। कृपया थोड़ी देर बाद दोबारा पूछें।',
    'en-IN': 'I am unable to respond right now. Please try again in a moment.',
    'ta-IN': 'இப்போது சேவை கிடைக்கவில்லை. சிறிது நேரம் கழித்து மீண்டும் கேட்கவும்.',
    'mr-IN': 'जी, सध्या सेवा उपलब्ध नाही. कृपया थोड्या वेळाने पुन्हा विचारा.',
    'pa-IN': 'ਹੁਣੇ ਸੇਵਾ ਉਪਲਬਧ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਥੋੜੀ ਦੇਰ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।',
    'bh':    'जी, अभी सेवा उपलब्ध नइखे। थोड़ा देर बाद कोशिश करीं।',
  };

  const langKey = uiLang === 'bh' ? 'bh' : (voiceLocale || 'hi-IN');
  return offlineMessages[langKey] || offlineMessages['hi-IN'];
}
