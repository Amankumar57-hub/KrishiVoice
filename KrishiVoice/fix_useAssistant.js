const fs = require('fs');
const file = '/Users/aman/Desktop/KrishiVoice/KrishiVoice/src/hooks/useAssistant.js';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const startIdx = lines.findIndex((l, i) => l.trim() === 'export { CROP_DATABASE }' && lines[i+1] && lines[i+1].includes('Rice: {'));

if (startIdx !== -1) {
  let endIdx = -1;
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].trim() === 'export { CROP_DATABASE };' || 
        (lines[i].trim() === '};' && lines[i+1] && lines[i+1].trim() === '' && lines[i+2] && lines[i+2].includes('const CROP_INTENTS'))) {
      endIdx = i;
      break;
    }
  }
  
  if (endIdx !== -1) {
    const fixedLines = [
      ...lines.slice(0, startIdx),
      'export { CROP_DATABASE };',
      ...lines.slice(endIdx + 1)
    ];
    fs.writeFileSync(file, fixedLines.join('\n'));
    console.log('Fixed useAssistant.js successfully!');
  } else {
    console.log('Could not find end index.');
  }
} else {
  console.log('Could not find start index.');
}
