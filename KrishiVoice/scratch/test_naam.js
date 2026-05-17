// Simulate the new multi-model fallback logic

const POLLINATIONS_MODELS = ['openai', 'openai-fast', 'mistral'];

const BAD_RESPONSE_PATTERNS = [
  /deprecated/i,
  /pollinations\.ai/i,
  /Please migrate/i,
  /legacy text API/i,
  /being deprecated/i,
  /enter\.pollinations/i,
  /⚠️/,
  /NOTE:/i,
];

function validateResponse(raw) {
  const trimmed = (raw || '').trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      const errMsg = parsed?.error || 'JSON response';
      throw new Error(String(errMsg).slice(0, 200));
    } catch (e) { if (e.message !== 'JSON response') throw e; }
  }
  for (const p of BAD_RESPONSE_PATTERNS) {
    if (p.test(trimmed)) throw new Error('Bad response: contains notice/warning');
  }
  const cleaned = trimmed.replace(/\*/g, '').replace(/#+\s/g, '').trim();
  if (!cleaned || cleaned.length < 5) throw new Error('Empty response');
  return cleaned;
}

async function askPollinationsModel(prompt, model) {
  const r = await fetch('https://text.pollinations.ai/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are Krishi Saathi, a female AI assistant for Indian farmers. Reply in Hindi.' },
        { role: 'user', content: prompt }
      ],
      model,
      seed: Math.floor(Math.random() * 9999),
      private: true,
    }),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const raw = await r.text();
  return validateResponse(raw);
}

async function main() {
  const prompt = "tumhara naam kya h?";
  for (const model of POLLINATIONS_MODELS) {
    try {
      console.log(`\nTrying model: [${model}]`);
      const reply = await askPollinationsModel(prompt, model);
      console.log(`✅ SUCCESS with [${model}]:`);
      console.log(reply);
      break;
    } catch (err) {
      console.log(`❌ [${model}] failed: ${err.message}`);
    }
  }
}
main();
