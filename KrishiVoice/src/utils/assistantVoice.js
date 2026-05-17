/**
 * Krishi Saathi - Voice Synthesis Utility
 * Sweet, calm, feminine voice for agricultural assistant.
 */

class AssistantVoice {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSpeaking = false;
  }

  /**
   * Speak with sweet feminine voice — optimized for农产品 price assistant
   * @param {string} text - Message to speak
   * @param {string} lang - Locale (hi-IN, en-IN, ta-IN, etc.)
   * @param {Object} options - { rate, pitch, volume }
   */
  speak(text, lang = 'hi-IN', options = {}) {
    if (!this.synth) {
      console.warn('Speech synthesis not available');
      return;
    }

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    // Sweet, calm, feminine parameters
    utterance.rate = options.rate || 0.82;  // Gentle pace
    utterance.pitch = options.pitch || 1.12; // Warm, feminine pitch
    utterance.volume = options.volume || 1.0;

    const setVoice = () => {
      const voices = this.synth.getVoices();
      const langPrefix = lang.split('-')[0];

      // Priority: Sweet feminine Google/Microsoft voices → any female → default
      const bestVoice =
        voices.find(v =>
          v.lang === lang &&
          /female|woman|girl|f|femaleUS|Female/i.test(v.name) &&
          (v.name.includes('Google') || v.name.includes('Microsoft'))
        ) ||
        voices.find(v =>
          v.lang === lang &&
          /female|woman|girl|f/i.test(v.name)
        ) ||
        voices.find(v =>
          v.lang.startsWith(langPrefix) &&
          /female|woman|girl|f/i.test(v.name)
        ) ||
        voices.find(v => v.lang === lang && v.name.includes('Google')) ||
        voices.find(v => v.lang === lang) ||
        voices[0];

      if (bestVoice) {
        utterance.voice = bestVoice;
        console.log('🎤 Assistant voice:', bestVoice.name, '(lang:', bestVoice.lang, ')');
      } else {
        console.log('⚠️ No ideal female voice found, using default');
      }

      this.synth.speak(utterance);
    };

    utterance.onstart = () => { this.isSpeaking = true; };
    utterance.onend = () => { this.isSpeaking = false; };
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      this.isSpeaking = false;
    };

    const voices = this.synth.getVoices();
    if (voices.length === 0) {
      this.synth.onvoiceschanged = () => {
        setVoice();
        this.synth.onvoiceschanged = null;
      };
    } else {
      setVoice();
    }
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }
}

/** Global assistant voice singleton */
export const assistantVoice = new AssistantVoice();

