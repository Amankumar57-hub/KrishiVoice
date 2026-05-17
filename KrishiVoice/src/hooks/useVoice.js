import { useState, useRef, useCallback } from 'react';

// ─── Crop keyword dictionary (multi-language) ────────────────────────────────
// Comprehensive database of 50+ Indian agricultural products
const CROP_MAP = [
  // ── CEREALS & GRAINS ──
  { crop: 'Wheat', cropHindi: 'गेहूं', emoji: '🌾',
    keywords: ['wheat', 'gehu', 'gehun', 'gahu', 'गेहूं', 'गेहूँ', 'गेहु', 'गोदुमा', 'கோதுமை', 'ਕਣਕ', 'गहू', 'gehu ka', 'godhuma', 'godhi', 'gom', 'gau', 'गौ', 'গমের', 'kanak', 'गेहूं का', 'गेहूं की', 'गेहूं के'] },
  { crop: 'Rice', cropHindi: 'चावल / धान', emoji: '🍚',
    keywords: ['rice', 'dhan', 'chawal', 'paddy', 'चावल', 'धान', 'चाउर', 'அரிசி', 'ਚਾਵਲ', 'तांदूळ', 'dhaan', 'bhaat', 'biyyam', 'vari', 'akki', 'chal', 'chokha', 'tandul', 'பிய்யம்', 'chaval', 'chaul'] },
  { crop: 'Maize', cropHindi: 'मक्का', emoji: '🌽',
    keywords: ['maize', 'corn', 'makka', 'mka', 'maka', 'मक्का', 'मक्के', 'மக்காச்சோளம்', 'ਮੱਕੀ', 'मका', 'makke', 'bhutta', 'mokka', 'musuku', 'சோளம்', 'మొక్కజొన్న', 'makai', 'makkai', 'bhuta'] },
  { crop: 'Barley', cropHindi: 'जौ', emoji: '🌾',
    keywords: ['barley', 'jau', 'जौ', 'jawa', 'yava', 'பேரியarial', 'ਜਉ', 'जउ', 'yav'] },
  { crop: 'Sorghum', cropHindi: 'ज्वार', emoji: '🌾',
    keywords: ['sorghum', 'jowar', 'jwara', 'ज्वार', 'जवार', 'cholam', 'ਮੰਗ', 'ज fares'] },
  { crop: 'Pearl Millet', cropHindi: 'बाजरा', emoji: '🌾',
    keywords: ['bajra', 'pearl millet', 'बाजरा', 'கம்பு', 'ਬਾਜਰਾ', 'sajje'] },
  { crop: 'Finger Millet', cropHindi: 'मंडुआ / रagi', emoji: '🌾',
    keywords: ['ragi', 'mandua', 'finger millet', 'रागी', 'मंडुआ', 'கேழ்வரகு', 'ਰਾਗੀ'] },
  { crop: 'Oats', cropHindi: 'जई', emoji: '🌾',
    keywords: ['oats', 'jai', 'जई', 'दर्याइ'] },

  // ── PULSES & LEGUMES ──
  { crop: 'Chickpea', cropHindi: 'चना', emoji: '🫛',
    keywords: ['chickpea', 'chana', 'gram', 'चना', 'कonometric', 'கொண்டைக்கடலை', 'ਛੋਲੇ', 'हरभरा', 'chane', 'chhola', 'senagalu', 'kadale', 'శనగలు'] },
  { crop: 'Pigeon Pea', cropHindi: 'अरहर / तुअर', emoji: '🫛',
    keywords: ['pigeon pea', 'arhar', 'tur', 'toor', 'अरहर', 'तुअर', 'अरहर दाल', 'तूर डाल', 'துவரம் பருப்பு', 'ਤੂਰ ਦਾਲ'] },
  { crop: 'Green Gram', cropHindi: 'मूंग', emoji: '🫛',
    keywords: ['mung bean', 'moong', 'green gram', 'मूंग', 'मूंगी', 'பாசிப் பருப்பு', 'ਮूँग'] },
  { crop: 'Black Gram', cropHindi: 'उडद', emoji: '🫛',
    keywords: ['black gram', 'urad', 'udad', 'उडद', 'ഉഴുന്നு', 'ਉਦਦ'] },
  { crop: 'Red Lentil', cropHindi: 'मसूर', emoji: '🫘',
    keywords: ['lentil', 'masoor', 'red lentil', 'मसूर', 'मसूर दाल', 'மஞ்சள் பருப்பு', 'ਮਸੂਰ'] },
  { crop: ' Horse Gram', cropHindi: 'kulthi', emoji: '🫛',
    keywords: ['horse gram', 'kulthi', 'kulthi bean', 'कुल्थी', 'கொத்தิว⟩'] },
  { crop: 'Moth Bean', cropHindi: 'मोठ बीन', emoji: '🫛',
    keywords: ['moth bean', 'moth', 'मोठ', 'మత్తి'] },

  // ── OILSEEDS ──
  { crop: 'Soybean', cropHindi: 'सोयाबीन', emoji: '🫘',
    keywords: ['soybean', 'soyabean', 'soya', 'सोयाबीन', 'சோயா', 'ਸੋਇਆਬੀਨ'] },
  { crop: 'Groundnut', cropHindi: 'मूंगफली', emoji: '🥜',
    keywords: ['groundnut', 'peanut', 'मूंगफली', 'வெள்ளை நίலகிழங்கு', 'ਮੂੰਗਫਲੀ'] },
  { crop: 'Mustard', cropHindi: 'सरसों', emoji: '🟡',
    keywords: ['mustard', 'sarson', 'सरसों', 'கடுகு', 'ਸਰ੍ਹੋਂ'] },
  { crop: 'Sesame', cropHindi: 'तिल', emoji: '🟤',
    keywords: ['sesame', 'til', 'तिल', 'எள்', 'ਤਿਲ'] },
  { crop: 'Sunflower', cropHindi: 'सूरजमुखी', emoji: '🌻',
    keywords: ['sunflower', 'surajmukhi', 'सूरजमुखी', 'சூரியகாந்தி'] },
  { crop: 'Castor', cropHindi: 'अरंडा', emoji: '🌱',
    keywords: ['castor', 'aranda', 'अरंडा'] },
  { crop: 'Linseed', cropHindi: 'अलसी', emoji: '🌱',
    keywords: ['linseed', 'flaxseed', 'alsi', 'अलसी'] },

  // ── VEGETABLES ──
  { crop: 'Potato', cropHindi: 'आलू', emoji: '🥔',
    keywords: ['potato', 'aloo', 'aalu', 'आलू', 'உருளைக்கிழங்கு', 'allu', 'alu', 'अल्लू'] },
  { crop: 'Onion', cropHindi: 'प्याज', emoji: '🧅',
    keywords: ['onion', 'pyaj', 'pyaz', 'प्याज', 'வெங்காயம்'] },
  { crop: 'Tomato', cropHindi: 'टमाटर', emoji: '🍅',
    keywords: ['tomato', 'tamatar', 'टमाटर', 'தக்காளி'] },
  { crop: 'Brinjal', cropHindi: 'बैंगन', emoji: '🍆',
    keywords: ['brinjal', 'eggplant', 'baingan', 'वांगी', 'कमлаरrique'] },
  { crop: 'Okra', cropHindi: 'भिंडी', emoji: '🥬',
    keywords: ['okra', 'bhindi', 'भिंडी', 'ப징்'] },
  { crop: 'Cauliflower', cropHindi: 'फूलगोभी', emoji: '🥦',
    keywords: ['cauliflower', 'phool gobhi', 'फूलगोभी', 'கோats'] },
  { crop: 'Cabbage', cropHindi: 'गोभी', emoji: '🥬',
    keywords: ['cabbage', 'gobhi', 'गोभी', 'கோ周岁'] },
  { crop: 'Green Peas', cropHindi: 'मटर', emoji: '🫛',
    keywords: ['pea', 'peas', 'matar', 'मटर', 'பச்சை பீன்ஸ்'] },
  { crop: 'Spinach', cropHindi: 'पालक', emoji: '🥬',
    keywords: ['spinach', 'palak', 'पालक', 'பசலிக்கей்ஸ்'] },
  { crop: 'Bitter Gourd', cropHindi: 'करेला', emoji: '🥒',
    keywords: ['bitter gourd', 'karela', 'करेला', 'பாகல்'] },
  { crop: 'Bottle Gourd', cropHindi: 'लौकी', emoji: '🥒',
    keywords: ['bottle gourd', 'lauki', 'लौकी', 'சுரைக்க curator'] },
  { crop: 'Ridge Gourd', cropHindi: 'तोरी', emoji: '🥒',
    keywords: ['ridge gourd', 'tori', 'तोरी', 'பீர்க்கங்கேész'] },
  { crop: 'Pumpkin', cropHindi: 'कद्दू', emoji: '🎃',
    keywords: ['pumpkin', 'kaddu', 'कद्दू', 'சியன்'] },
  { crop: 'Carrot', cropHindi: 'गाजर', emoji: '🥕',
    keywords: ['carrot', 'gajar', 'गाजर', 'கсут'] },
  { crop: 'Radish', cropHindi: 'मूली', emoji: '🥬',
    keywords: ['radish', 'mooli', 'मूली', 'முலล์'] },
  { crop: 'Beetroot', cropHindi: 'चुकंदर', emoji: '🥬',
    keywords: ['beetroot', 'beet', 'chukandar', 'चुकंदर', 'பீட்ட்ரسyms'] },
  { crop: 'Cucumber', cropHindi: 'खीरा', emoji: '🥒',
    keywords: ['cucumber', 'kheera', 'खीरा', 'வெள்ளரி'] },
  { crop: 'Green Chilli', cropHindi: 'हरी मिर्च', emoji: '🌶️',
    keywords: ['green chilli', 'hari mirch', 'हरी मिर्च', 'பக这点'] },

  // ── FRUITS ──
  { crop: 'Banana', cropHindi: 'केला', emoji: '🍌',
    keywords: ['banana', 'kela', 'केला', 'வாழைப்பழம்'] },
  { crop: 'Mango', cropHindi: 'आम', emoji: '🥭',
    keywords: ['mango', 'aam', 'आम', 'மாம்பழம்'] },
  { crop: 'Apple', cropHindi: 'सेब', emoji: '🍎',
    keywords: ['apple', 'seb', 'सेब', 'ஆப்பிள்'] },
  { crop: 'Orange', cropHindi: 'संतरा', emoji: '🍊',
    keywords: ['orange', 'santra', 'संतरा', 'ஆரஞ்சு'] },
  { crop: 'Grapes', cropHindi: 'अंगूर', emoji: '🍇',
    keywords: ['grape', 'grapes', 'angura', 'अंगूर', 'திராட்சை'] },
  { crop: 'Watermelon', cropHindi: 'तरबूज', emoji: '🍉',
    keywords: ['watermelon', 'tarbuj', 'तरबूज', 'தர்பூசனி'] },
  { crop: 'Pomegranate', cropHindi: 'अनार', emoji: '🍎',
    keywords: ['pomegranate', 'anar', 'अनार', 'மாதுளை'] },

  // ── CASH CROPS & OTHERS ──
  { crop: 'Sugarcane', cropHindi: 'गन्ना', emoji: '🌿',
    keywords: ['sugarcane', 'ganna', 'गन्ना', 'கரும்பு'] },
  { crop: 'Cotton', cropHindi: 'कपास', emoji: '🌸',
    keywords: ['cotton', 'kapas', 'कपास', 'க Parter'] },
  { crop: 'Turmeric', cropHindi: 'हल्दी', emoji: '🟡',
    keywords: ['turmeric', 'haldi', 'हल्दी', 'மஞ்சள்'] },
  { crop: 'Ginger', cropHindi: 'अदरक', emoji: '🫚',
    keywords: ['ginger', 'adrak', 'अदरक', 'இஞ்சி'] },
  { crop: 'Garlic', cropHindi: 'लहसुन', emoji: '🧄',
    keywords: ['garlic', 'lahsun', 'लहसुन', 'பூண்டு'] },
  { crop: 'Black Pepper', cropHindi: 'काली मिर्च', emoji: '🫚',
    keywords: ['pepper', 'black pepper', 'kali mirch', 'काली मिर्च', 'மிளகு'] },
  { crop: 'Cardamom', cropHindi: 'इलायची', emoji: '🌿',
    keywords: ['cardamom', 'elaichi', 'इलायची', 'ஏல.columns'] },
  { crop: 'Cinnamon', cropHindi: 'दालचीनी', emoji: '🪵',
    keywords: ['cinnamon', 'dalchini', 'दालचीनी', 'இ_lavanga'] },
  { crop: 'Clove', cropHindi: 'लौंग', emoji: '🌸',
    keywords: ['clove', 'laung', 'लौंग', 'கરாம்பு'] },
  { crop: 'Tea', cropHindi: 'चाय', emoji: '🍵',
    keywords: ['tea', 'chai', 'चाय', 'தேநீர்'] },
  { crop: 'Coffee', cropHindi: 'कॉफी', emoji: '☕',
    keywords: ['coffee', 'coffee', 'कॉफी', 'காப்பி'] },
  { crop: 'Jute', cropHindi: 'पटसSon', emoji: '🌾',
    keywords: ['jute', 'patson', 'पटसन', 'ச��చ'] },
  { crop: 'Tobacco', cropHindi: 'तंबाकू', emoji: '🚬',
    keywords: ['tobacco', 'tambaku', 'तंबाकू', 'புகி'] },
];

// ─── Unit keywords ───────────────────────────────────────────────────────────
const QUINTAL_KEYS = ['quintal', 'kuintal', 'क्विंटल', 'kwital', 'क्विंट', 'குவிண்டல்', 'ਕੁਇੰਟਲ', 'kwintaal', 'quintel', 'kwintal'];
const KG_KEYS = ['kg', 'kilogram', 'kilo', 'किलो', 'किलोग्राम', 'கிலோ', 'ਕਿਲੋ', 'ki', 'की'];


// ─── Price query keywords ─────────────────────────────────────────────────────
const PRICE_QUERY_KEYWORDS = [
  'bhav', 'bhau', 'bhaw', 'भाव', 'दाम', 'मूल्य', 'price', 'rate', 'कीमत',
  'kya hai', 'क्या है', 'kitna', 'कितना', 'kitne', 'कितने', 'batao', 'बताओ',
  'bta do', 'बता दो', 'aaj ka', 'आज का', 'today', 'mandi', 'मंडी',
  'kya chal', 'क्या चल', 'chal raha', 'चल रहा',
];

// ─── Navigation command keywords ─────────────────────────────────────────────
const NAV_KEYWORDS = {
  settings: ['setting', 'settings', 'सेटिंग', 'सेटिंग्स', 'setting kholo', 'settings kholo', 'खोलो सेटिंग'],
  profile: ['profile', 'प्रोफाइल', 'profile kholo', 'प्रोफाइल खोलो', 'profile photo', 'प्रोफाइल फोटो'],
  listing: ['list', 'listing', 'list karo', 'लिस्ट करो', 'listing page', 'लिस्टिंग पेज', 'item list', 'आइटम लिस्ट'],
  login: ['login', 'लॉगिन', 'login karo', 'लॉगिन करो', 'login kahan', 'लॉगिन कहाँ'],
  logout: ['logout', 'लॉगआउट', 'logout karo', 'लॉगआउट करो'],
  dashboard: ['dashboard', 'डैशबोर्ड', 'dashboard kholo', 'डैशबोर्ड खोलो'],
  home: ['home', 'घर', 'home page', 'होम पेज'],
  search: ['search', 'खोज', 'search karo', 'खोज करो'],
};

// ─── Control command keywords ───────────────────────────────────────────────
const CONTROL_KEYWORDS = {
  enable: ['on karo', 'ऑन करो', 'enable karo', 'सक्षम करो', 'chalu karo', 'चालू करो', 'on', 'ऑन'],
  disable: ['off karo', 'ऑफ करो', 'disable karo', 'अक्षम करो', 'band karo', 'बंद करो', 'off', 'ऑफ'],
  toggle: ['toggle', 'टॉगल', 'badlo', 'बदलो'],
};

// ─── Help/guidance keywords ────────────────────────────────────────────────
const HELP_KEYWORDS = [
  'kahan se', 'कहाँ से', 'kaise karun', 'कैसे करूँ', 'how to', 'कैसे',
  'kya karun', 'क्या करूँ', 'guide', 'गाइड', 'batayein', 'बताइये',
  'help', 'मदद', 'step', 'स्टेप', 'kya karna hai', 'क्या करना है',
];

// ─── Normalize compound number words first (e.g. "do hazaar" → 2000) ──────────
function normalizeNumberWords(text) {
  let t = text.toLowerCase();

  // Compound: "X hazaar" → X*1000
  t = t.replace(/(\d+)\s+hazaar/g, (_, n) => String(parseInt(n) * 1000));
  t = t.replace(/(\d+)\s+हजार/g,   (_, n) => String(parseInt(n) * 1000));
  t = t.replace(/(\d+)\s+thousand/g,(_, n) => String(parseInt(n) * 1000));
  // "ek hazaar" etc handled after word→digit below
  t = t.replace(/\bdo\s+hazaar\b/g,   '2000');
  t = t.replace(/\bteen\s+hazaar\b/g, '3000');
  t = t.replace(/\bchar\s+hazaar\b/g, '4000');
  t = t.replace(/\bpaanch\s+hazaar\b/g,'5000');
  t = t.replace(/\bek\s+hazaar\b/g,   '1000');
  t = t.replace(/\bek\s+sau\b/g,      '100');
  t = t.replace(/\bdo\s+sau\b/g,      '200');
  t = t.replace(/\bpaanch\s+sau\b/g,  '500');
  t = t.replace(/\bsaat\s+sau\b/g,    '700');
  t = t.replace(/\baath\s+sau\b/g,    '800');

  // Single number words → digits
  const wordMap = [
    ['एक','ek',1],['दो','do',2],['तीन','teen',3],['tin',null,3],
    ['चार','char',4],['पांच','paanch',5],['paach',null,5],['panch',null,5],['पाँच',null,5],
    ['छह','chhah',6],['chhe',null,6],['chha',null,6],
    ['सात','saat',7],['sat',null,7],
    ['आठ','aath',8],['ath',null,8],
    ['नौ','nau',9],['nao',null,9],
    ['दस','das',10],['dus',null,10],['dah',null,10],
    ['ग्यारह','gyarah',11],['बारह','barah',12],['byarah',null,12],
    ['तेरह','terah',13],['चौदह','chaudah',14],['पंद्रह','pandrah',15],
    ['सोलह','solah',16],['सत्रह','satrah',17],['अठारह','atharah',18],['उन्नीस','unnis',19],
    ['बीस','bees',20],['biis',null,20],['bis',null,20],['बीस','बीसा',20],
    ['इककीस','ikkees',21],['इक्कीस','ikkiis',21],['बाइस','baees',22],['पच्चीस','pachees',25],
    ['तीस','tees',30],['तिस','tis',30],['इकतीस','iktees',31],['बत्तीस','battis',32],
    ['पैंतीस','paintis',35],['चालीस','chalis',40],['पचास','pachas',50],['साठ','saath',60],['sath',null,60],
    ['सत्तर','sattar',70],['अस्सी','assi',80],['नब्बे','nabbe',90],
    ['सौ','sau',100],['हजार','hazaar',1000],['लाख','lakh',100000],
  ];
  const sorted = wordMap.sort((a,b) =>
    Math.max(a[0]?.length||0, a[1]?.length||0) < Math.max(b[0]?.length||0, b[1]?.length||0) ? 1 : -1
  );
  for (const [hi, en, val] of sorted) {
    if (hi) t = t.replace(new RegExp(`${hi}`, 'g'), val.toString());
    if (en) t = t.replace(new RegExp(`\\b${en}\\b`, 'g'), val.toString());
  }
  return t;
}

// ─── Parse transcript ─────────────────────────────────────────────────────────
function parseTranscript(rawText) {
  // Normalize
  let text = normalizeNumberWords(rawText);
  const lower = text.toLowerCase();

  // ── 1. Detect crop with word-boundary awareness ──
  let cropMatch = null;
  
  // Sort and escape keywords to handle overlapping or special chars
  const findCrop = (text) => {
    // First pass: Direct word-boundary match (most accurate)
    for (const c of CROP_MAP) {
      for (const k of c.keywords) {
        // Regex for whole word: supports English boundaries and space-padded for multilingual, including Hindi punctuation
        const regex = new RegExp(`(?:^|\\s|[.,!?;।'"])${k}(?:$|\\s|[.,!?;।'"])`, 'i');
        if (regex.test(text)) {
          return c;
        }
      }
    }
    
    // Second pass: Fuzzy/Substring match (for agglutinated speech)
    // Only if first pass fails
    for (const c of CROP_MAP) {
      if (c.keywords.some(k => text.includes(k.toLowerCase()) && k.length >= 2)) {
        return c;
      }
    }
    return null;
  };

  cropMatch = findCrop(lower);

  // ── 2. Navigation command detection ──
  let navTarget = null;
  for (const [target, keywords] of Object.entries(NAV_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) {
      navTarget = target;
      break;
    }
  }
  
  if (navTarget) {
    return { 
      mode: 'navigation', 
      transcript: rawText, 
      target: navTarget, 
      confidence: 'high' 
    };
  }

  // ── 3. Control command detection (on/off/toggle) ──
  let controlAction = null;
  for (const [action, keywords] of Object.entries(CONTROL_KEYWORDS)) {
    if (keywords.some(k => lower.includes(k.toLowerCase()))) {
      controlAction = action;
      break;
    }
  }
  
  if (controlAction) {
    // Extract what to control
    let controlTarget = 'unknown';
    if (/mandi|मंडी/.test(lower)) controlTarget = 'mandi';
    if (/notification|नोटिफिकेशन/.test(lower)) controlTarget = 'notifications';
    if (/sound|आवाज|sound|voice|वॉइस/.test(lower)) controlTarget = 'sound';
    if (/language|भाषा/.test(lower)) controlTarget = 'language';
    if (/location|स्थान/.test(lower)) controlTarget = 'location';
    
    return { 
      mode: 'control', 
      transcript: rawText, 
      action: controlAction,
      target: controlTarget,
      confidence: 'high' 
    };
  }

  // ── 4. Help/guidance command detection ──
  const isHelpQuery = HELP_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
  let helpTopic = null;
  
  if (isHelpQuery) {
    if (/photo|फोटो|profile photo|प्रोफाइल फोटो/.test(lower)) helpTopic = 'profile_photo';
    else if (/list|listing|लिस्ट|बेचना|sell/.test(lower)) helpTopic = 'listing_guide';
    else if (/login|लॉगिन/.test(lower)) helpTopic = 'login_guide';
    else if (/logout|लॉगआउट/.test(lower)) helpTopic = 'logout_guide';
    else if (/setting|सेटिंग/.test(lower)) helpTopic = 'settings_guide';
    else helpTopic = 'general';
    
    return { 
      mode: 'help', 
      transcript: rawText, 
      topic: helpTopic,
      confidence: 'high' 
    };
  }

  // ── 5. Price query detection ──
  const isPriceQuery    = PRICE_QUERY_KEYWORDS.some(k => lower.includes(k.toLowerCase()));
  const isListingIntent = /(bech|बेच|sell|list|listing|beche|बिक|bikri|बिक्री|publish|hamra|humko|हमको|mujhe|मुझे|chahiye|चाहिए|karna|करना)/i.test(lower);
  if (isPriceQuery && !isListingIntent && cropMatch) {
    return { mode:'price_query', transcript:rawText, crop:cropMatch.crop, cropHindi:cropMatch.cropHindi, confidence:'high' };
  }

  // ── 3. Currency / rate keywords ──
  const CURR   = /rupay|rupee|rupaye|rupiye|rupiya|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|रूपय|रूपिया|रुपैया|रु\.|रू\./i;
  const RATE   = /rate|daam|dam|bhav|bhau|price|mool|keemat|प्रति|per|दाम|भाव|कीमत/i;
  const UNIT_KG = /(?:\s|^)(?:kilo|kilogram|kilograms|kg|किलो|कि\.ग्रा\.|kilogramme|kilogram)(?:\s|$)/i;
  const UNIT_QT = /(?:\s|^)(?:quintal|kuintal|kwital|क्विंटल|कुंटल|क्विंट|kwintaal|quintal)(?:\s|$)/i;

  // ── 4. Detect quantity unit ──
  let unit = 'quintal'; // default
  if (UNIT_KG.test(lower)) unit = 'kg';
  if (UNIT_QT.test(lower)) unit = 'quintal';

  // ── 5. Detect price unit (may differ from qty unit) ──
  // Pattern: "20 rupay kilo" or "rupay 20 kilo" → price per kg
  // Pattern: "2000 rupay quintal" → price per quintal
  let priceUnit = unit; // default same as qty unit

  // "NUMBER (rupay|rs) kilo|kg" → price per kg (with optional per)
  const pricePerKg = lower.match(/(\d+(?:\.\d+)?)\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|rate|daam|dam|दाम)?\s*(?:ka|ke|का|के|per\s*|pe|par)?\s*(?:kilo|kg|किलो|kilogram)/i);
  // "NUMBER (rupay|rs) quintal" → price per quintal
  const pricePerQt = lower.match(/(\d+(?:\.\d+)?)\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|rate|daam|dam|दाम)?\s*(?:ka|ke|का|के|per\s*|pe|par)?\s*(?:quintal|kuintal|क्विंटल|कुंटल)/i);

  // ── 6. Extract all numbers from text ──
  const allNums = (lower.match(/\d+(?:\.\d+)?/g) || []).map(Number);

  let quantity = null;
  let price    = null;

  // ── 6.5. Early pattern for crop qty price (e.g. "gehu 10 2000") ──
  if (cropMatch && allNums.length >= 2) {
    // Assume first number after crop keywords is qty, last large number is price
    const cropIndex = CROP_MAP.find(c => c.crop === cropMatch.crop)?.keywords.some(k => lower.includes(k.toLowerCase())) ? lower.indexOf(cropMatch.keywords.find(k => lower.includes(k.toLowerCase()))) : -1;
    if (cropIndex !== -1) {
      const textAfterCrop = lower.substring(cropIndex);
      const numsAfterCrop = (textAfterCrop.match(/\d+(?:\.\d+)?/g) || []).map(Number);
      if (numsAfterCrop.length >= 2) {
        quantity = numsAfterCrop[0];
        if (numsAfterCrop[1] >= 100) price = numsAfterCrop[1]; // Assume large number is price
      }
    }
  }

  // ── 7. QUANTITY PASS: find number directly attached to a unit ──
  // "10 kilo" or "kilo 10"
  const qtyKgMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:kilo|kilogram|kilograms|kg|किलो|किलोग्राम)/i);
  const qtyQtMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:quintal|kuintal|kwital|क्विंटल|कुंटल|क्विंट|kwintaal)/i);

  if (unit === 'kg' && qtyKgMatch)        quantity = parseFloat(qtyKgMatch[1]);
  else if (unit === 'quintal' && qtyQtMatch) quantity = parseFloat(qtyQtMatch[1]);
  else if (qtyKgMatch)                    { quantity = parseFloat(qtyKgMatch[1]); unit = 'kg'; }
  else if (qtyQtMatch)                    { quantity = parseFloat(qtyQtMatch[1]); unit = 'quintal'; }

  // ── 8. PRICE PASS ──
  // Pattern A: "X rupay/rate kilo" → price=X per kg (e.g. "20 rupay kilo")
  // Check specifically: number followed by currency/rate THEN unit (capturing the number)
  const pricePerkgPattern = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|rate|daam|dam|दाम)\s*(?:per\s*|ka|ke|का|के|pe|par|me|mein)?\s*(?:kilo|kg|किलो)/i
  );
  const pricePerQtPattern = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|rate|daam|dam|दाम)\s*(?:per\s*|ka|ke|का|के|pe|par|me|mein)?\s*(?:quintal|kuintal|क्विंटल|कुंटल)/i
  );
  // Also check for "X kilo rupay" (number THEN unit THEN currency)
  const priceKgCurrency = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:kilo|kg|किलो|kilogram)\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|rate|daam|dam|दाम)/i
  );
  const priceQtCurrency = lower.match(
    /(\d+(?:\.\d+)?)\s*(?:quintal|kuintal|क्विंटल|कुंटल)\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|rate|daam|dam|दाम)/i
  );

  if (pricePerkgPattern) {
    const candidate = parseFloat(pricePerkgPattern[1]);
    if (candidate !== quantity) { price = candidate; priceUnit = 'kg'; }
  }
  if (price === null && pricePerQtPattern) {
    const candidate = parseFloat(pricePerQtPattern[1]);
    if (candidate !== quantity) { price = candidate; priceUnit = 'quintal'; }
  }
  // Pattern A2: "X kilo rupay" / "X quintal rupay"
  if (price === null && priceKgCurrency) {
    const candidate = parseFloat(priceKgCurrency[1]);
    if (candidate !== quantity) { price = candidate; priceUnit = 'kg'; }
  }
  if (price === null && priceQtCurrency) {
    const candidate = parseFloat(priceQtCurrency[1]);
    if (candidate !== quantity) { price = candidate; priceUnit = 'quintal'; }
  }

// Pattern B: currency keyword BEFORE number ("rate 2000", "daam 1800")
  if (price === null) {
    const before = lower.match(
      /(?:rate|daam|dam|bhav|bhau|price|mool|keemat|rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|रूपय|दाम|भाव|कीमत)\s*(?:hai|ba|ka|ke|का|के|is|pe|par|me|mein|में)?\s*(\d+(?:\.\d+)?)/i
    );
    if (before) { const c = parseFloat(before[1]); if (c !== quantity) price = c; }
  }

  // Pattern C: number BEFORE currency keyword ("2000 rupay", "1500 rate", "20 rupees")
  if (price === null) {
    const after = lower.match(
      /(\d+(?:\.\d+)?)\s*(?:ka|ke|का|के)?\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|रूपय|रुपैया|रूपिया|rate|daam|dam|दाम|bhav|भाव|wala|वाला|ru|r)/i
    );
    if (after) { const c = parseFloat(after[1]); if (c !== quantity) price = c; }
  }

  // Pattern D: "X mein bechna" / "X me sell" ("2000 mein bechna")
  if (price === null) {
    const inSell = lower.match(/(\d+(?:\.\d+)?)\s*(?:me|mein|में)\s*(?:bech|sell|bik|बेच|बिक)/i);
    if (inSell) { const c = parseFloat(inSell[1]); if (c !== quantity) price = c; }
  }

  // Pattern F: "at X" / "par X" (at price X)
  if (price === null) {
    const atPrice = lower.match(/(?:at|par|pe)\s*(\d+(?:\.\d+)?)/i);
    if (atPrice) { const c = parseFloat(atPrice[1]); if (c !== quantity) price = c; }
  }

  // Pattern G: Large number at end of sentence (common for "gehu 20 quintal 3000")
  if (price === null && allNums.length >= 2) {
    const lastNum = allNums[allNums.length - 1];
    if (lastNum !== quantity && lastNum >= 100) price = lastNum;
  }

  // Pattern E: Just a standalone large number (likely price if > 500 and no qty detected)
  if (price === null && quantity === null && allNums.length > 0) {
    const largeNum = allNums.find(n => n >= 100);
    if (largeNum) price = largeNum;
  }

  // ── 9. FALLBACK: use remaining numbers ──
  if (quantity === null && allNums.length > 0) {
    // For qty, prefer smaller numbers
    quantity = allNums.reduce((a, b) => a < b ? a : b);
  }
  if (price === null && allNums.length > 0) {
    // For price, prefer larger numbers (prices tend to be higher)
    const usedQty = quantity ?? 0;
    const candidates = allNums.filter(n => n !== usedQty);
    if (candidates.length > 0) {
      price = candidates.reduce((a, b) => Math.max(a, b));
    } else if (allNums[0] !== quantity && allNums[0] >= 100) {
      // Single large number - likely price
      price = allNums[0];
    }
  }

  // ── FINAL FALLBACK: if no price detected but multiple numbers, prioritize largest as price ──
  if (price === null && allNums.length >= 2) {
    price = Math.max(...allNums);
  }

  // ── 10. SANITY SWAP ──
  // If quantity >> 200 and price < 100, they're likely swapped
  // e.g. "2000 ka gehu 10 quintal" → qty wrongly=2000, price=10 → swap
  if (quantity !== null && price !== null && price > 0) {
    if (quantity > 200 && price < 100 && price < quantity) {
      [quantity, price] = [price, quantity];
    }
  }
  // If price is still 0 and quantity > 0 with a number, try to detect price from remaining
  if ((price === null || price === 0) && quantity !== null && quantity > 0) {
    const candidates = allNums.filter(n => n !== quantity && n !== null);
    if (candidates.length > 0) {
      price = candidates.reduce((a, b) => Math.max(a, b));
    }
  }

  // ── 11. QUALITY detection (Grade only for manual review) ──
  let grade = null;

  // Grade: "Grade A", "A grade", "Best quality"
  const gradeMatch = lower.match(/(?:grade|quality|shreni|darja)\s*([a-c]|best|top|medium|normal|low|sahi|बेस्ट|टॉप|ए|बी|सी)/i);
  if (gradeMatch) {
    grade = gradeMatch[1].toUpperCase();
  } else if (/best|super|top|बेस्ट|सुपर/i.test(lower)) {
    grade = 'A';
  }

  return {
    mode:       'listing',
    transcript: rawText,
    crop:       cropMatch?.crop      || 'Produce',
    cropHindi:  cropMatch?.cropHindi || 'फसल',
    quantity:   quantity ?? 1,
    unit,
    price:      price ?? 0,
    priceUnit,
    grade,
    confidence: cropMatch ? 'high' : 'low',
  };
}


  // ─── Main Hook ─────────────────────────────────────────────────────────────────
export function useVoice() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [result, setResult] = useState(null);
  const [language, setLanguage] = useState('hi-IN');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const hasResultRef = useRef(false);
  const fallbackAttemptedRef = useRef(false);
  const liveTextRef = useRef('');

  // Helper: speak with sweet feminine voice
  const speakText = useCallback((text, rate = 0.82, pitch = 1.1) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = language;
    msg.rate = rate;
    msg.pitch = pitch;
    msg.volume = 1;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = language.split('-')[0];
      let v = voices.find(v => v.lang === language && /female|woman|girl|f/i.test(v.name));
      if (!v) v = voices.find(v => v.lang.startsWith(langPrefix) && /female|woman|girl|f/i.test(v.name));
      if (!v) v = voices.find(v => /female|woman|girl|f/i.test(v.name));
      if (!v) v = voices[0]; // fallback
      if (v) msg.voice = v;
      window.speechSynthesis.speak(msg);
    };

    setTimeout(() => {
      if (window.speechSynthesis.getVoices().length > 0) trySpeak();
      else window.speechSynthesis.onvoiceschanged = trySpeak;
    }, 150);
  }, [language]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const finalize = useCallback((finalText) => {
    clearSilenceTimer();
    if (!finalText.trim()) return;
    setTranscript(finalText);
    setInterimTranscript('');
    hasResultRef.current = true;
    const parsed = parseTranscript(finalText);
    setResult(parsed);
    // Auto-stop recognition after we have a final result
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice recognition not supported. Please use Chrome. / कृपया Chrome browser उपयोग करें।');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');
    setResult(null);
    setListening(true);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    hasResultRef.current = false;
    clearSilenceTimer();
    fallbackAttemptedRef.current = false;
    liveTextRef.current = '';

    const isAndroid = /android/i.test(navigator.userAgent);

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    // On Android Chrome, continuous=true causes the browser to internally
    // restart recognition sessions and re-fire the same text at new indices,
    // causing every word to appear doubled. continuous=false fixes this —
    // the browser captures one clean utterance and stops, no duplication.
    recognition.continuous = !isAndroid;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let accumulatedFinal = '';
    // Deduplicate by normalized content (not just index).
    // Android can fire the same transcript content at different result indices
    // across internal sessions, bypassing an index-only Set.
    const finalizedTexts = new Set();

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        const tNorm = t.trim().toLowerCase();
        if (event.results[i].isFinal) {
          // Deduplicate by content: skip if this exact text was already added.
          // Also skip if accumulatedFinal already ends with this text (safety net).
          const alreadyEnds = accumulatedFinal.trimEnd().toLowerCase().endsWith(tNorm);
          if (tNorm && !finalizedTexts.has(tNorm) && !alreadyEnds) {
            finalizedTexts.add(tNorm);
            accumulatedFinal += t.trim() + ' ';
          }
        } else {
          interim += t;
        }
      }
      // Always show the latest full text while speaking.
      // Only interimTranscript is set here — transcript is only set by finalize().
      const fullText = (accumulatedFinal + interim).trim();
      if (fullText) {
        setInterimTranscript(fullText);
      }
      liveTextRef.current = fullText;

      // Auto-finalize after 2.5s of silence.
      // Guard with !hasResultRef.current to prevent double finalization
      // if onend already called finalize before the timer fires.
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        const finalText = accumulatedFinal.trim() || liveTextRef.current.trim();
        if (finalText && !hasResultRef.current) {
          finalize(finalText);
        }
      }, 2500);
    };

    recognition.onerror = (event) => {
      clearSilenceTimer();
      setListening(false);
      setInterimTranscript('');
      if (event.error === 'no-speech') {
        const fallbackText = accumulatedFinal.trim() || liveTextRef.current.trim();
        if (fallbackText) {
          finalize(fallbackText);
        } else {
          setError('No voice detected. Please speak clearly and try again. / कोई आवाज़ नहीं सुनाई दी। स्पष्ट रूप से बोलें और फिर कोशिश करें।');
        }
      } else if (event.error === 'not-allowed') {
        setError('Microphone permission required. Please allow microphone access. / माइक की अनुमति आवश्यक है।');
      } else if (event.error === 'network') {
        setError('Network error. Please check your internet. / नेटवर्क एरर। इंटरनेट जांचें।');
      } else if (event.error === 'audio-capture') {
        setError('Audio capture failed. Check microphone. / ऑडियो कैप्चर विफल। माइक जांचें।');
      } else if (event.error === 'language-not-supported') {
        if (!fallbackAttemptedRef.current && language !== 'en-IN') {
          fallbackAttemptedRef.current = true;
          setLanguage('en-IN');
          setError('Language not supported. Trying English. / भाषा समर्थित नहीं। अंग्रेजी आजमाते हैं।');
          setTimeout(() => startListening(), 100);
        } else if (!fallbackAttemptedRef.current && language !== 'hi-IN') {
          fallbackAttemptedRef.current = true;
          setLanguage('hi-IN');
          setError('Language not supported. Trying Hindi. / भाषा समर्थित नहीं। हिंदी आजमाते हैं।');
          setTimeout(() => startListening(), 100);
        } else {
          setError('Language not supported. / भाषा समर्थित नहीं।');
        }
      } else if (event.error === 'aborted') {
        const fallbackText = accumulatedFinal.trim() || liveTextRef.current.trim();
        if (fallbackText) finalize(fallbackText);
      } else {
        setError(`Voice error: ${event.error}. / वॉइस एरर: ${event.error}।`);
      }
    };

    recognition.onend = () => {
      clearSilenceTimer();        // ← must be first: kills any pending timer
      setListening(false);
      setInterimTranscript('');
      const fallbackText = accumulatedFinal.trim() || liveTextRef.current.trim();
      if (!hasResultRef.current && fallbackText) {
        finalize(fallbackText);
      }
    };

    recognition.start();
  }, [language, finalize]);

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    hasResultRef.current = false;
  }, []);

  return {
    listening,
    transcript,
    interimTranscript,
    result,
    language,
    setLanguage,
    startListening,
    stopListening,
    clearResult,
    error,
    speakText,
  };
}
