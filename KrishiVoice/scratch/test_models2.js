// Test different Pollinations models

const models = ['openai', 'openai-fast', 'mistral', 'claude-hybridspace', undefined];

async function testModel(model) {
  const body = {
    messages: [
      { role: 'system', content: 'You are a farmer assistant. Reply in 1 sentence only.' },
      { role: 'user', content: 'गेहूं में कौन सा खाद डालें?' }
    ],
    seed: 42,
    private: true,
  };
  if (model) body.model = model;

  const response = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  return { model: model || 'default', status: response.status, text: text.slice(0, 200) };
}

async function main() {
  for (const model of models) {
    try {
      const result = await testModel(model);
      console.log(`[${result.model}] Status: ${result.status}`);
      console.log(`  => ${result.text}`);
    } catch (e) {
      console.log(`[${model}] ERROR: ${e.message}`);
    }
  }
}
main();
