import fs from 'fs';
import path from 'path';

// Small translation object for testing the script logic before we do the full one
const base = {
  nav: {
    home: 'Home',
    dashboard: 'Dashboard',
    search: 'Search',
    transport: 'Transport',
    notifications: 'Notifications',
    noNotifications: 'No new notifications',
    clearAll: 'Clear all',
    menu: 'Menu',
    account: 'Account',
    settings: 'Settings',
    history: 'My History',
    login: 'Login',
    language: 'Language',
  },
  home: {
    heroTitle: 'Speak to the Land.',
    heroSubtitle: 'Listen to the voice of the earth.',
    welcome: 'Welcome,',
    voiceExample: '"What is today\'s wheat price?"',
  }
};

const EN_JSON = JSON.stringify(base);

const langs = [
  { code: 'bn', name: 'Bengali' },
  { code: 'te', name: 'Telugu' },
  { code: 'kn', name: 'Kannada' },
  { code: 'ml', name: 'Malayalam' },
  { code: 'gu', name: 'Gujarati' },
  { code: 'or', name: 'Odia' },
  { code: 'mag', name: 'Magahi' },
  { code: 'mai', name: 'Maithili' }
];

async function translate() {
  let output = '';
  for (const lang of langs) {
    console.log(`Translating to ${lang.name}...`);
    try {
      const prompt = `Translate this JSON into ${lang.name}. Return ONLY valid JSON, no markdown formatting, no backticks. Keep keys same:\n${EN_JSON}`;
      const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          model: 'openai',
          private: true
        })
      });
      const text = await res.text();
      let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      output += `  '${lang.code}': {\n    translation: ${clean}\n  },\n`;
      console.log(`Done ${lang.name}`);
    } catch (e) {
      console.error(`Failed ${lang.name}`, e.message);
    }
  }
  fs.writeFileSync('translations_dump.js', output);
  console.log('Saved to translations_dump.js');
}

translate();
