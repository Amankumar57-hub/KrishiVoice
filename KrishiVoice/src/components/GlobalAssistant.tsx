import React, { useState, useEffect } from 'react';
import { useVoice } from '../hooks/useVoice';
import { useAssistant } from '../hooks/useAssistant';
import { useLanguage } from '../context/LanguageContext';
import { Mic, MicOff, X, Sparkles, Volume2, Globe } from 'lucide-react';

export default function GlobalAssistant() {
  const { voiceLocale } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  
  const {
    listening,
    transcript,
    interimTranscript,
    result,
    startListening,
    stopListening,
    error,
    clearResult
  } = useVoice();

  const { processIntent, response, isProcessing, clearResponse } = useAssistant(voiceLocale);

  // Handle voice result when user stops speaking
  useEffect(() => {
    if (result && result.transcript) {
      const text = result.transcript;
      clearResult(); // Clear immediately for snappiness
      processIntent(text);
    }
  }, [result, processIntent, clearResult]);

  // Show tooltip after 5 seconds to guide the user
  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  const toggleAssistant = () => {
    if (isOpen) {
      stopListening();
      clearResult();
      clearResponse();
      setIsOpen(false);
    } else {
      setIsOpen(true);
      setShowTooltip(false);
    }
  };

  const handleMicClick = () => {
    if (listening) {
      stopListening();
    } else {
      clearResponse();
      clearResult();
      startListening();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-[88px] md:bottom-6 right-4 md:right-6 z-[9999] flex flex-col items-end gap-3">
        {showTooltip && (
          <div className="bg-white/95 backdrop-blur-md shadow-2xl border-2 border-primary/20 px-5 py-3 rounded-2xl animate-bounce-slow max-w-[240px]">
            <p className="text-xs font-black text-primary uppercase tracking-widest mb-1 flex items-center gap-1.5">
              <Sparkles size={12} className="animate-pulse" /> Krishi Saathi
            </p>
            <p className="text-sm text-gray-800 font-bold leading-tight">
              Tap to talk to your AI assistant!
            </p>
            <button 
              onClick={() => setShowTooltip(false)}
              className="absolute -top-1 -right-1 bg-gray-200 rounded-full p-0.5 text-gray-500 hover:bg-gray-300"
            >
              <X size={8} />
            </button>
          </div>
        )}
        <button
          onClick={toggleAssistant}
          className="group relative w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden ring-4 ring-primary/30 animate-pulse-slow"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <Sparkles size={24} className="animate-spin-slow" />
          <div className="absolute -inset-1 bg-primary/20 rounded-full animate-ping opacity-40" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-end justify-center pointer-events-none p-6">
      <div className="w-full max-w-md pointer-events-auto animate-slide-up">
        <div className="rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden bg-white">
          
          {/* Header */}
          <div className="px-6 pt-5 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-black text-gray-900 text-sm uppercase tracking-wider">Krishi Saathi</h3>
                <p className="text-[10px] text-gray-400 font-bold">YOUR AI GUIDE • आपकी कृषि सहायक</p>
              </div>
            </div>
            <button 
              onClick={toggleAssistant}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content Area */}
          <div className="px-6 py-4 min-h-[160px] flex flex-col justify-center text-center">
            {listening || interimTranscript || transcript || isProcessing ? (
              <div className="flex flex-col items-center animate-fade-in">
                <div className="mb-6 relative flex justify-center">
                  <div className={`absolute inset-0 bg-green-300 rounded-full blur-2xl opacity-40 ${listening ? 'animate-pulse' : ''}`} />
                  <img 
                    src="/assistant-girl.png" 
                    alt="Krishi Saathi" 
                    className={`relative w-28 h-28 object-cover object-top rounded-full shadow-2xl border-4 border-white bg-green-50 transition-transform ${listening || isProcessing ? 'avatar-talking' : 'avatar-idle'}`}
                  />
                </div>
                <p className="text-primary text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1">
                  {listening ? 'Listening / सुन रही हूँ...' : isProcessing ? 'Thinking / सोच रही हूँ...' : 'Ready'}
                </p>
                <div className="max-h-[80px] overflow-hidden">
                  <p className={`text-base font-bold leading-relaxed px-4 ${listening ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                    "{interimTranscript || transcript || (isProcessing ? 'Thinking...' : '...')}"
                  </p>
                </div>
              </div>
            ) : response ? (
              <div className="animate-fade-in flex flex-col items-center">
                <div className="mb-4 relative flex justify-center">
                  <div className="absolute inset-0 bg-blue-300 rounded-full blur-2xl opacity-40 animate-pulse" />
                  <img 
                    src="/assistant-girl.png" 
                    alt="Krishi Saathi" 
                    className="relative w-20 h-20 object-cover object-top rounded-full shadow-lg border-2 border-white bg-green-50 avatar-talking"
                  />
                </div>
                <p className="text-gray-800 font-bold text-lg leading-snug px-2">
                  {response}
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase">Mandi Bhav</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase">Listing</span>
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase">Transport</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 flex flex-col items-center">
                <img 
                  src="/assistant-girl.png" 
                  alt="Krishi Saathi" 
                  className="w-16 h-16 object-cover object-top rounded-full shadow-md border-2 border-white bg-green-50 mb-3 avatar-idle"
                />
                <p className="text-gray-400 text-sm font-medium mb-1">How can I help you today?</p>
                <p className="text-xs text-gray-300">"Aaj gehu ka bhav kya hai?" • "Mujhe gehu bechna hai"</p>
              </div>
            )}

            {error && (
              <p className="text-red-500 text-[10px] font-bold mt-4 bg-red-50 px-3 py-1 rounded-full">{error}</p>
            )}
          </div>

          {/* Controller */}
          <div className="p-6 bg-gray-50/50 flex flex-col items-center">
            <button
              onClick={handleMicClick}
              disabled={isProcessing}
              className={`relative flex items-center justify-center rounded-full w-16 h-16 text-white transition-all shadow-xl ${
                listening
                  ? 'bg-red-500 shadow-red-200 scale-110 active:scale-95'
                  : 'bg-primary hover:bg-primary-600 shadow-primary/20 hover:scale-105 active:scale-95'
              } disabled:opacity-50`}
            >
              {listening ? <MicOff size={24} /> : <Mic size={24} />}
              {listening && <span className="absolute -inset-2 rounded-full border-2 border-red-300 animate-ping opacity-30" />}
            </button>
            
            <div className="mt-4 flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              <Globe size={10} />
              <span>Speaking in: {voiceLocale}</span>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes breathe {
          0%, 100% { transform: scaleY(1) translateY(0); }
          50% { transform: scaleY(1.03) translateY(-3px); }
        }
        
        @keyframes talk-jiggle {
          0%, 100% { transform: scale(1) translateY(0) rotate(0deg); }
          25% { transform: scale(1.01) translateY(-1px) rotate(1deg); }
          75% { transform: scale(1.01) translateY(-1px) rotate(-1deg); }
        }

        .avatar-idle {
          animation: breathe 4s ease-in-out infinite;
          transform-origin: bottom center;
        }

        .avatar-talking {
          animation: talk-jiggle 0.3s ease-in-out infinite, breathe 3s ease-in-out infinite;
          transform-origin: bottom center;
        }
        
        @keyframes slide-up {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .glass-premium {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
      `}} />
    </div>
  );
}
