// Final integration test: Hindi + English both work via Pollinations

async function testPollinations(isHindi, userPrompt) {
  const SYSTEM = `You are "Krishi Saathi", an expert female AI agricultural assistant for Indian farmers.
Personality: Sweet, calm, polite. Address user with respect.
FORMATTING: 2-4 sentences max. No markdown. If Hindi, reply only in Hindi using respectful words like जी, आप.`;

  const userMessage = isHindi ? `(कृपया हिंदी में जवाब दें) ${userPrompt}` : userPrompt;

  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: userMessage }
      ],
      model: 'openai-large',
      seed: 42,
      private: true,
    }),
  });

  const text = await response.text();
  return text.replace(/\*/g, '').replace(/#+\s/g, '').trim();
}

async function main() {
  console.log("--- Test 1: Hindi ---");
  const hindi = await testPollinations(true, "गेहूं में कौन सा खाद डालना चाहिए?");
  console.log(hindi);

  console.log("\n--- Test 2: English ---");
  const english = await testPollinations(false, "What is the best time to sow onion?");
  console.log(english);
}

main();
