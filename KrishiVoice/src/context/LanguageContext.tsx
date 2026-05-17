import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import i18n from '../i18n';
import { useAuthContext } from './AuthContext';
import { supabase } from '../supabaseClient';

const UI_STORAGE_KEY = 'krishi_ui_language';
const VOICE_STORAGE_KEY = 'krishi_voice_language';

export const LANGUAGE_OPTIONS = [
  { id: 'hi', flag: '🇮🇳', name: 'Hindi', native: 'हिंदी', voiceLocale: 'hi-IN' },
  { id: 'hi-en', flag: '🇮🇳', name: 'Hinglish', native: 'हिंदी-इंग्लिश', voiceLocale: 'hi-IN' },
  { id: 'en', flag: '🇬🇧', name: 'English', native: 'English', voiceLocale: 'en-IN' },
  { id: 'bh', flag: '🇮🇳', name: 'Bhojpuri', native: 'भोजपुरी', voiceLocale: 'hi-IN' },
  { id: 'ta', flag: '🇮🇳', name: 'Tamil', native: 'தமிழ்', voiceLocale: 'ta-IN' },
  { id: 'mr', flag: '🇮🇳', name: 'Marathi', native: 'मराठी', voiceLocale: 'mr-IN' },
  { id: 'pa', flag: '🇮🇳', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', voiceLocale: 'pa-IN' },
];

const getLanguageOption = (lang) => LANGUAGE_OPTIONS.find((option) => option.id === lang) || LANGUAGE_OPTIONS[0];

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const { user, profile, refreshProfile } = useAuthContext();
  const [uiLanguage, setUiLanguage] = useState(() => profile?.language_pref || localStorage.getItem(UI_STORAGE_KEY) || 'hi');
  const [voiceLanguage, setVoiceLanguage] = useState(() => profile?.voice_language || localStorage.getItem(VOICE_STORAGE_KEY) || 'hi-IN');

  useEffect(() => {
    if (profile?.language_pref && profile.language_pref !== uiLanguage) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setUiLanguage(profile.language_pref);
    }
    if (profile?.voice_language && profile.voice_language !== voiceLanguage) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setVoiceLanguage(profile.voice_language);
    }
  }, [profile?.language_pref, profile?.voice_language]);

  useEffect(() => {
    localStorage.setItem(UI_STORAGE_KEY, uiLanguage);
    document.documentElement.lang = uiLanguage === 'bh' ? 'hi' : uiLanguage;
    void i18n.changeLanguage(uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    localStorage.setItem(VOICE_STORAGE_KEY, voiceLanguage);
  }, [voiceLanguage]);

  const changeUiLanguage = useCallback(async (lang) => {
    const nextLanguage = getLanguageOption(lang).id;
    const previousLanguage = uiLanguage;

    if (nextLanguage === uiLanguage) {
      return true;
    }

    setUiLanguage(nextLanguage);

    if (!user?.id) {
      return true;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ language_pref: nextLanguage })
      .eq('id', user.id);

    if (error) {
      setUiLanguage(previousLanguage);
      return false;
    }

    try {
      await refreshProfile();
    } catch (_) {
      // Profile refresh is best-effort after a successful save.
    }

    return true;
  }, [uiLanguage, refreshProfile, user?.id]);

  const changeVoiceLanguage = useCallback(async (voiceLang) => {
    const previousLanguage = voiceLanguage;

    if (voiceLang === voiceLanguage) {
      return true;
    }

    setVoiceLanguage(voiceLang);

    if (!user?.id) {
      return true;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ voice_language: voiceLang })
      .eq('id', user.id);

    if (error) {
      setVoiceLanguage(previousLanguage);
      return false;
    }

    try {
      await refreshProfile();
    } catch (_) {
      // Profile refresh is best-effort after a successful save.
    }

    return true;
  }, [voiceLanguage, refreshProfile, user?.id]);

  const currentUiLanguage = useMemo(() => getLanguageOption(uiLanguage), [uiLanguage]);
  const voiceLocale = useMemo(() => {
    const option = LANGUAGE_OPTIONS.find(opt => opt.voiceLocale === voiceLanguage);
    return option ? option.voiceLocale : voiceLanguage;
  }, [voiceLanguage]);

  const value = useMemo(() => ({
    uiLanguage,
    voiceLanguage,
    languages: LANGUAGE_OPTIONS,
    currentUiLanguage,
    voiceLocale,
    changeUiLanguage,
    changeVoiceLanguage,
  }), [changeUiLanguage, changeVoiceLanguage, currentUiLanguage, uiLanguage, voiceLanguage, voiceLocale]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }

  // Backward compatibility
  return {
    ...context,
    language: context.uiLanguage,
    changeLanguage: context.changeUiLanguage,
    currentLanguage: context.currentUiLanguage,
  };
}
