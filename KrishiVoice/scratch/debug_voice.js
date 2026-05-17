
const CROP_MAP = [
  { crop: 'Wheat', cropHindi: 'गेहूं', keywords: ['wheat', 'gehu', 'gehun', 'gahu', 'गेहूं', 'गेहूँ', 'गेहु', 'गोदुमा', 'கோதுமை', 'ਕਣਕ', 'गहू', 'gehu ka'] },
];

function normalizeNumberWords(text) {
  let t = text.toLowerCase();

  const wordMap = [
    ['एक','ek',1],['दो','do',2],['तीन','teen',3],['tin',null,3],
    ['चार','char',4],['पांच','paanch',5],['paach',null,5],['panch',null,5],['पाँच',null,5],
    ['छह','chhah',6],['chhe',null,6],['chha',null,6],
    ['सात','saat',7],['sat',null,7],
    ['आठ','aath',8],['ath',null,8],
    ['नौ','nau',9],['nao',null,9],
    ['दस','das',10],['dus',null,10],['dah',null,10],
    ['बीस','bees',20],['biis',null,20],['bis',null,20],['बीस','बीसा',20],
    ['तीस','tees',30],['तिस','tis',30],
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

function parseTranscript(rawText) {
  let text = normalizeNumberWords(rawText);
  const lower = text.toLowerCase();
  
  console.log('Normalized text:', text);

  const allNums = (lower.match(/\d+(?:\.\d+)?/g) || []).map(Number);
  console.log('All numbers:', allNums);

  let quantity = (lower.match(/(\d+(?:\.\d+)?)\s*(?:kg|किलो)/i) || [])[1];
  if (quantity) quantity = parseFloat(quantity);
  
  console.log('Detected Quantity:', quantity);

  const pricePattern = lower.match(
      /(\d+(?:\.\d+)?)\s*(?:ka|ke|का|के)?\s*(?:rupay|rupee|rupaye|rupiye|rupe|rs\.?|re\.?|₹|रुपये|रुपए|रूपया|रूपए|रूपये|रूपय|rate|daam|dam|दाम|bhav|भाव|wala|वाला|ru|r)/i
  );
  
  let price = pricePattern ? parseFloat(pricePattern[1]) : null;
  console.log('Detected Price:', price);

  return { quantity, price };
}

const transcript = "30 kg गेहूं बेचना है बीस रुपए";
console.log('Testing transcript:', transcript);
parseTranscript(transcript);
