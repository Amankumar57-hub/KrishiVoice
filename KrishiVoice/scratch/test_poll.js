fetch('https://text.pollinations.ai/openai', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [{role: 'user', content: 'hello'}],
    model: 'openai',
    jsonMode: false
  })
}).then(res => res.text()).then(console.log).catch(console.error);
