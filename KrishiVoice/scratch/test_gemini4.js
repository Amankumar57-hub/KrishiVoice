const API_KEY = "AIzaSyCAcuXHt4awFS2QvhBfe2cdKtGy5J8v0HA";
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

async function test() {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello" }] }]
    })
  });
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Data:", JSON.stringify(data, null, 2));
}

test();
