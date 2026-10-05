async function test() {
  const userMessage = "hello";
  const sysContext = "reply in hindi";
  const model = "openai-fast";
  const url = `https://text.pollinations.ai/prompt/${encodeURIComponent(userMessage)}?model=${model}&system=${encodeURIComponent(sysContext)}&seed=${Math.floor(Math.random() * 9999)}`;
  const response = await fetch(url);
  console.log(response.status);
  const text = await response.text();
  console.log(text.substring(0, 100));
}
test();
