const API_KEY = "AIzaSyCAcuXHt4awFS2QvhBfe2cdKtGy5J8v0HA";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function test() {
  const response = await fetch(url);
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Models:", data.models?.map(m => m.name));
}

test();
