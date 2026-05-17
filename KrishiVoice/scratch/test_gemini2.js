const apiKey = process.env.VITE_GEMINI_API_KEY || 'AIzaSyCAcuXHt4awFS2QvhBfe2cdKtGy5J8v0HA';
fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
.then(res => res.json()).then(data => console.log(data.models.map(m=>m.name))).catch(console.error);
