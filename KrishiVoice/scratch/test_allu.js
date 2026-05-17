import { readFileSync } from 'fs';

const source = readFileSync('/Users/aman/Desktop/KrishiVoice/KrishiVoice/src/hooks/useVoice.js', 'utf8');

// Extract CROP_MAP from source using a quick hack
const cropMapMatch = source.match(/const CROP_MAP = \[([\s\S]*?)\];/);
let cropMapStr = cropMapMatch[0];
// Evaluate it
const CROP_MAP = eval(cropMapStr.replace('const CROP_MAP = ', ''));

const findCrop = (text) => {
  // First pass
  for (const c of CROP_MAP) {
    for (const k of c.keywords) {
      const regex = new RegExp(`(?:^|\\s|[.,!?;।'"])${k}(?:$|\\s|[.,!?;।'"])`, 'i');
      if (regex.test(text)) {
        return { method: 'exact', match: k, crop: c.cropHindi };
      }
    }
  }
  
  // Second pass
  for (const c of CROP_MAP) {
    if (c.keywords.some(k => text.includes(k.toLowerCase()) && k.length >= 2)) {
      return { method: 'fuzzy', match: c.keywords.find(k => text.includes(k.toLowerCase()) && k.length >= 2), crop: c.cropHindi };
    }
  }
  return null;
};

console.log("अल्लू ->", findCrop("अल्लू"));
console.log("allu ->", findCrop("allu"));
console.log("alu ->", findCrop("alu"));
