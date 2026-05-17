const CROP_MAP = [
  { crop: 'Wheat', cropHindi: 'गेहूं', keywords: ['wheat', 'gehu', 'gehun', 'gahu', 'गेहूं', 'कनक'] },
  { crop: 'Paddy', cropHindi: 'धान', keywords: ['paddy', 'dhan', 'dhaan', 'धान', 'chawal', 'rice'] },
  { crop: 'Maize', cropHindi: 'मक्का', keywords: ['maize', 'corn', 'makka', 'makai', 'मक्का', 'मकई'] },
  { crop: 'Potato', cropHindi: 'आलू', keywords: ['potato', 'aloo', 'alu', 'आलू'] },
  { crop: 'Onion', cropHindi: 'प्याज', keywords: ['onion', 'pyaj', 'pyaaj', 'प्याज'] },
  { crop: 'Mango', cropHindi: 'आम', keywords: ['mango', 'aam', 'आम'] },
  { crop: 'Barley', cropHindi: 'जौ', keywords: ['barley', 'jau', 'जौ'] }
];

const findCrop = (text) => {
  for (const c of CROP_MAP) {
    for (const k of c.keywords) {
      const regex = new RegExp(`(?:^|\\s|[.,!?;।'"])${k}(?:$|\\s|[.,!?;।'"])`, 'i');
      if (regex.test(text)) {
        return { method: 'exact', match: k, crop: c.cropHindi };
      }
    }
  }
  for (const c of CROP_MAP) {
    if (c.keywords.some(k => text.includes(k.toLowerCase()) && k.length >= 2)) {
      return { method: 'fuzzy', match: c.keywords.find(k => text.includes(k.toLowerCase())), crop: c.cropHindi };
    }
  }
  return null;
};

const tests = [
  "10 किलो गेहूं",
  "मुझे अपना आलू बेचना है।",
  "मैं बेचूंगा आलू।",
  "10किलोगेहूं",
  "दौसौ किलो आम बेचना है",
  "धान बेचना है",
  "गेहूं10किलो"
];

tests.forEach(t => {
  console.log(`"${t}" ->`, findCrop(t.toLowerCase()));
});
