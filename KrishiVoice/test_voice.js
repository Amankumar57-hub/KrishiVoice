import fs from 'fs';

const CROP_MAP = [
  { crop: 'Wheat', cropHindi: 'गेहूं', keywords: ['wheat', 'gehu', 'gehun', 'gahu', 'गेहूं', 'गेहूँ', 'गेहु', 'गोदुमा', 'கோதுமை', 'ਕਣਕ', 'गहू', 'gehu ka', 'godhuma', 'godhi', 'gom', 'gau', 'गौ', 'গমের', 'kanak', 'गेहूं का', 'गेहूं की', 'गेहूं के'] },
  { crop: 'Rice', cropHindi: 'चावल / धान', keywords: ['rice', 'dhan', 'chawal', 'paddy', 'चावल', 'धान', 'चाउर', 'அரிசி', 'ਚਾਵਲ', 'तांदूळ', 'dhaan', 'bhaat', 'biyyam', 'vari', 'akki', 'chal', 'chokha', 'tandul', 'பிய்யம்', 'chaval', 'chaul'] },
  { crop: 'Maize', cropHindi: 'मक्का', keywords: ['maize', 'corn', 'makka', 'mka', 'maka', 'मक्का', 'मक्के', 'மக்காச்சோளம்', 'ਮੱਕੀ', 'मका', 'makke', 'bhutta', 'mokka', 'musuku', 'சோளம்', 'మొక్కజొన్న', 'makai', 'makkai', 'bhuta'] },
  { crop: 'Sugarcane', cropHindi: 'गन्ना', keywords: ['sugarcane', 'sugar cane', 'ganna', 'gaanna', 'गन्ना', 'गना', 'கரும்பு', 'ਗੰਨਾ', 'ऊस', 'ikh', 'ketari', 'oos', 'akh', 'kushiar', 'cheruku', 'kabbu', 'చెరకు', 'gane'] },
  { crop: 'Potato', cropHindi: 'आलू', keywords: ['potato', 'aloo', 'आलू', 'अल्लू', 'alu', 'alua', 'உருளைக்கிழங்கு', 'urulai kizhangu', 'ਆਲੂ', 'बटाटा', 'batata', 'alloo', 'aalu', 'batada', 'bateta', 'aalugadde', 'bangala dumpa', 'bilati alu', 'urulakkizhangu'] },
];

function findCrop(text) {
    for (const c of CROP_MAP) {
      for (const k of c.keywords) {
        const regex = new RegExp(`(?:^|\\s|\\.|,)${k}(?:$|\\s|\\.|,)`, 'i');
        if (regex.test(text)) {
          return c;
        }
      }
    }
    for (const c of CROP_MAP) {
      if (c.keywords.some(k => text.includes(k.toLowerCase()) && k.length > 3)) {
        return c;
      }
    }
    return null;
}

console.log(findCrop("alu 50 kg 20 rupay"));
console.log(findCrop("aalu 50 kg 20 rupay"));
console.log(findCrop("aloo 50 kg 20 rupay"));
console.log(findCrop("potato 50 kg 20 rupay"));
console.log(findCrop("me aalu bechna chahta hu"));

