import { askGemini } from './src/utils/geminiService.js';
(async () => {
  try {
    const reply = await askGemini("what is the price of wheat?", false, "en-IN", "en");
    console.log("REPLY:", reply);
  } catch (e) {
    console.error(e);
  }
})();
