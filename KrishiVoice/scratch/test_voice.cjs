const fs = require('fs');

// Mock CROP_MAP from the actual file
const CROP_MAP = [
  { crop: 'Wheat', cropHindi: 'गेहूं', keywords: ['wheat', 'gehu', 'gehun', 'gahu', 'गेहूं', 'गेहूँ', 'गेहु', 'गोदुमा', 'கோதுமை', 'ਕਣਕ', 'गहू', 'gehu ka', 'godhuma', 'godhi', 'gom', 'gau', 'गौ', 'গমের', 'kanak'] },
  { crop: 'Rice', cropHindi: 'चावल / धान', keywords: ['rice', 'dhan', 'chawal', 'paddy', 'चावल', 'धान', 'चाउर', 'அரிசி', 'ਚਾਵਲ', 'तांदੂळ', 'dhaan', 'bhaat', 'biyyam', 'vari', 'akki', 'chal', 'chokha', 'tandul', 'பிய்யம்', 'chaval', 'chaul'] },
  { crop: 'Maize', cropHindi: 'मक्का', keywords: ['maize', 'corn', 'makka', 'mka', 'maka', 'मक्का', 'मक्के', 'மக்காச்சோளம்', 'ਮੱਕੀ', 'मका', 'makke', 'bhutta', 'mokka', 'musuku', 'சோளம்', 'మొక్కజొన్న', 'makai', 'makkai', 'bhuta'] },
  { crop: 'Sugarcane', cropHindi: 'गन्ना', keywords: ['sugarcane', 'sugar cane', 'ganna', 'gaanna', 'गन्ना', 'गना', 'கரும்பு', 'ਗੰਨਾ', 'ऊस', 'ikh', 'ketari', 'oos', 'akh', 'kushiar', 'cheruku', 'kabbu', 'చెరకు', 'gane'] },
  { crop: 'Potato', cropHindi: 'आलू', keywords: ['potato', 'loo', 'आलू', 'अल्लू', 'alu', 'alua', 'உருளைக்கிழங்கு', 'urulai kizhangu', 'ਆਲੂ', 'बटाटा', 'batata', 'alloo', 'aalu', 'batada', 'bateta', 'aalugadde', 'bangala dumpa', 'bilati alu', 'urulakkizhangu'] },
  { crop: 'Tomato', cropHindi: 'टमाटर', keywords: ['tomato', 'tamatar', 'टमाटर', 'தக்காளி', 'ਟਮਾਟਰ', 'टोमॅटो', 'tamater', 'rama', 'tamata', 'thakkali', 'టొమాటో', 'tmatar', 'tamatar', 'tamatari'] },
  { crop: 'Onion', cropHindi: 'प्याज', keywords: ['onion', 'pyaj', 'pyaz', 'प्याज', 'வெங்காயம்', 'ਪਿਆਜ਼', 'कांदा', 'piaz', 'pyaaj', 'kanda', 'ulli', 'vengayam', 'ullipaya', 'ullagaddi', 'dungri', 'peyaj', 'ఉల్లిपाय', 'pyas', 'pyaas', 'pyaaj'] },
  { crop: 'Soybean', cropHindi: 'सोयाबीन', keywords: ['soybean', 'soyabean', 'soya', 'soy', 'सोयाबीन', 'சோயா', 'ਸੋਇਆਬੀਨ', 'soyabin', 'soyabeen'] },
  { crop: 'Cotton', cropHindi: 'कपास', keywords: ['cotton', 'kapas', 'कपास', 'பருத்தி', 'ਕਪਾਹ', 'कापूस', 'kapaas', 'rui', 'prathi', 'hatti', 'tula', 'పత్తి', 'kapash'] },
  { crop: 'Mustard', cropHindi: 'सरसों', keywords: ['mustard', 'sarson', 'सरसों', 'கடுगु', 'ਸਰ੍ਹੋਂ', 'मोहरी', 'sarson', 'raai', 'rai', 'tori', 'avalu', 'sasive', 'sarisha', 'आवాలు', 'rai', 'rayi'] },
  { crop: 'Chickpea', cropHindi: 'चना', keywords: ['chickpea', 'chana', 'gram', 'चना', 'கொண்டைக்கடலை', 'ਛੋਲੇ', 'हरभरा', 'chane', 'chhola', 'senagalu', 'kadale', 'శనగలు', 'chane'] },
  { crop: 'Lentil', cropHindi: 'दाल / मसूर', keywords: ['lentil', 'dal', 'daal', 'masoor', 'मसूर', 'दाल', 'பருப்பு', 'ਦਾਲ', 'masur', 'paruppu', 'kandulu', 'bele', 'పప్పు', 'massor', 'masur'] },
  { crop: 'Garlic', cropHindi: 'लहसुन', keywords: ['garlic', 'lahsun', 'लहसुन', 'பூண்டு', 'ਲਸਣ', 'लसूण', 'lahsan', 'lasun', 'vellulli', 'bellulli', 'rasun', 'lasan', 'வெల్లుల్లి', 'lahasuna'] },
  { crop: 'Ginger', cropHindi: 'अदरक', keywords: ['ginger', 'adrak', 'अदरक', 'இஞ்சி', 'ਅਦਕਰ', 'आले', 'adrak', 'inji', 'ale', 'allam', 'shunti', 'ada', 'adu', 'అల్లం', 'adara'] },
  { crop: 'Turmeric', cropHindi: 'हल्दी', keywords: ['turmeric', 'haldi', 'हल्दी', 'மஞ்சள்', 'ਹਲਦੀ', 'हळद', 'halad', 'manjal', 'pasupu', 'arisina', 'holud', 'haldar', 'పసుపు', 'haladhi'] },
  { crop: 'Groundnut', cropHindi: 'मूंगफली', keywords: ['groundnut', 'peanut', 'moongfali', 'मूंगफली', 'கடலை', 'ਮੂੰਗਫਲੀ', 'शेंगदाणे', 'moongphali', 'verkadala', 'veru', 'kadalekaayi', 'badam', 'magfali', 'వేరుశनगे', 'நிலக்கடலை', 'mungfali'] },
];

function parseTranscript(rawText) {
  let text = rawText.toLowerCase();
  const lower = text;

  let cropMatch = null;
  const findCrop = (text) => {
    for (const c of CROP_MAP) {
      for (const k of c.keywords) {
        const regex = new RegExp(`(?:^|\\s|\\.|,)${k}(?:$|\\s|\\.|,)`, 'i');
        if (regex.test(text)) return c;
      }
    }
    for (const c of CROP_MAP) {
      if (c.keywords.some(k => text.includes(k.toLowerCase()) && k.length > 3)) return c;
    }
    return null;
  };

  cropMatch = findCrop(lower);
  return cropMatch ? cropMatch.crop : 'None';
}

const tests = [
  "muje makka bechna hai",
  "10 kilogram tamatar",
  "pyaz ka bhav kya hai",
  "muje mka bechna h",
  "tamatar bechna hai 20 rupay kilo",
  "chana bechna hai",
  "10 gram sonu", // Should match Chickpea (legit name)
  "10 kilogram gehu" // Should match Wheat, NOT Chickpea
];

tests.forEach(t => {
  console.log(`Transcript: "${t}" => Detected: ${parseTranscript(t)}`);
});
