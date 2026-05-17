// Simulate exactly what the new geminiService.js does in the browser

const SYSTEM_CONTEXT = `You are "Krishi Saathi", an expert female AI agricultural assistant integrated into the KrishiVoice platform for Indian farmers.
Personality: Extremely sweet, calm, polite, positive, well-mannered, and distinctly feminine. Speak with warmth and encouragement. Always address the user with deep respect.
FORMATTING:
- Keep your answers brief (2-4 sentences max) so they can be spoken aloud naturally.
- Use the user's primary language. If asked in Hindi, reply entirely in sweet, polite Hindi (use 'जी', 'नमस्ते', 'आप').
- If the user writes in Hindi script or uses Hindi words, ALWAYS reply in Hindi.
- DO NOT use markdown (no asterisks, hashes, or bullet points) because your response will be immediately fed into a Text-to-Speech engine.`;

async function askPollinations(prompt, isHindi) {
  const userMessage = isHindi ? `(कृपया हिंदी में जवाब दें) ${prompt}` : prompt;
  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM_CONTEXT },
        { role: 'user', content: userMessage }
      ],
      model: 'openai',
      seed: 42,
      private: true,
    }),
  });
  if (!response.ok) throw new Error(`Status: ${response.status}`);
  const text = await response.text();
  return text.replace(/\*/g, '').replace(/#+\s/g, '').trim();
}

async function main() {
  console.log("=== Test 1: Hindi farming question ===");
  const h1 = await askPollinations("गेहूं में कौन सा खाद डालना चाहिए?", true);
  console.log(h1);

  console.log("\n=== Test 2: English farming question ===");
  const e1 = await askPollinations("What is the best time to plant onion in Rajasthan?", false);
  console.log(e1);

  console.log("\n=== Test 3: KrishiVoice platform question ===");
  const h2 = await askPollinations("अपनी फसल कैसे बेचें?", true);
  console.log(h2);
}
main();
