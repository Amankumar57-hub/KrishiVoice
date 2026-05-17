/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

/**
 * Global window extensions for KrishiVoice
 */

declare global {
  interface Window {
    assVoice?: {
      speak: (text: string, lang?: string, options?: { rate?: number; pitch?: number; volume?: number }) => void;
      stop: () => void;
      isSpeaking: boolean;
    };
  }
}

export {};
