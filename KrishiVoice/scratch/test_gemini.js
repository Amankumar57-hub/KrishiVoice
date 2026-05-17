const apiKey = process.env.VITE_GEMINI_API_KEY || 'AIzaSyCAcuXHt4awFS2QvhBfe2cdKtGy5J8v0HA';
fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [{ parts: [{ text: "say hello" }] }],
  })
}).then(res => res.json()).then(console.log).catch(console.error);
