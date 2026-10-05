const GEMINI_API_KEY = "AIzaSyCAcuXHt4awFS2QvhBfe2cdKtGy5J8v0HA";

async function testGemini() {
  console.log("Testing Gemini...");
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "hello" }] }],
        }),
      }
    );
    const data = await response.text();
    console.log("Gemini Status:", response.status);
    console.log("Gemini Response:", data.substring(0, 200));
  } catch (e) {
    console.error("Gemini Error:", e.message);
  }
}

async function testPollinations() {
  console.log("\nTesting Pollinations...");
  try {
    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          { role: 'user', content: 'hello' }
        ],
        model: 'openai-fast',
        private: true,
      }),
    });
    const data = await response.text();
    console.log("Pollinations Status:", response.status);
    console.log("Pollinations Response:", data.substring(0, 200));
  } catch (e) {
    console.error("Pollinations Error:", e.message);
  }
}

(async () => {
  await testGemini();
  await testPollinations();
})();
