async function test() {
  const response = await fetch("https://text.pollinations.ai/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are a farmer assistant. Reply in 1 sentence." },
        { role: "user", content: "How to grow wheat?" }
      ]
    })
  });
  const text = await response.text();
  console.log("Status:", response.status);
  console.log("Response:", text);
}
test();
