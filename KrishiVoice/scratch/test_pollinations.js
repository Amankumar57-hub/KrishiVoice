async function test() {
  const prompt = encodeURIComponent("What is the best fertilizer for wheat?");
  const system = encodeURIComponent("You are a helpful agricultural assistant.");
  const response = await fetch(`https://text.pollinations.ai/${prompt}?system=${system}`);
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}
test();
