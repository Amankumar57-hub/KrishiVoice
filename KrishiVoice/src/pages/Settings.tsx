import { useState, useRef, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { Camera, Check, Loader2, LogOut, Palette, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { mockMandiPrices } from '../mock/mandiPrices';

const THEMES = [
  { id: 'light',   label: 'Light',   labelHi: 'उजला',     previewBg: '#f3f4f6', previewBorder: '#e5e7eb' },
  { id: 'dark',    label: 'Dark',    labelHi: 'अंधेरा',   previewBg: '#1f2937', previewBorder: '#374151' },
  { id: 'green',   label: 'Nature',  labelHi: 'प्रकृति',  previewBg: '#bbf7d0', previewBorder: '#86efac' },
  { id: 'saffron', label: 'Saffron', labelHi: 'केसरिया',  previewBg: '#fed7aa', previewBorder: '#fdba74' },
  { id: 'grey',    label: 'Grey',    labelHi: 'धूसर',     previewBg: '#d1d5db', previewBorder: '#9ca3af' },
  { id: 'blue',    label: 'Ocean',   labelHi: 'महासागर',  previewBg: '#bfdbfe', previewBorder: '#93c5fd' },
];

function applyTheme(id) {
  document.documentElement.setAttribute('data-theme', id);
  localStorage.setItem('krishi_theme', id);
}

export default function Settings() {
  const { user, profile, signOut, refreshProfile } = useAuthContext();
  const { uiLanguage, voiceLanguage, changeUiLanguage, changeVoiceLanguage, languages } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [phone, setPhone]       = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saved' | 'error'
  const [saveError, setSaveError]   = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl]   = useState(null);
  const [theme, setTheme]           = useState(() => localStorage.getItem('krishi_theme') || 'light');
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_notifications');
      return saved ? JSON.parse(saved) : { buyer: true, mandi: false, status: true };
    } catch {
      return { buyer: true, mandi: false, status: true };
    }
  });
  const [toast, setToast]           = useState<any>(null);
  const fileInputRef = useRef(null);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Apply saved theme on mount
  useEffect(() => {
    applyTheme(theme);
  }, []); // only on mount

  // Sync from profile once loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile?.id]); // only when profile id changes, not on every render

  const handleTheme = (id) => {
    setTheme(id);
    applyTheme(id);
  };

  // ── Auto-save UI language immediately on select ──
  const handleUiLangSelect = async (id) => {
    const ok = await changeUiLanguage(id);
    if (ok) {
      // brief flash confirmation
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1800);
    } else {
      setSaveError('Could not update UI language. Try again.');
      setSaveStatus('error');
    }
  };

  // ── Auto-save voice language immediately on select ──
  const handleVoiceLangSelect = async (voiceLang) => {
    const ok = await changeVoiceLanguage(voiceLang);
    if (ok) {
      // brief flash confirmation
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(null), 1800);
    } else {
      setSaveError('Could not update voice language. Try again.');
      setSaveStatus('error');
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      setSaveError('Not logged in. Please login again.');
      setSaveStatus('error');
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    setSaveError('');

    try {
      const updates = {
        full_name:     fullName.trim() || null,
        phone:         phone.trim()    || null,
        address:       address.trim()  || null,
        language_pref: uiLanguage,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        console.error('Profile save error:', error);
        // User-friendly messages for common RLS / constraint errors
        let msg = error.message || 'Failed to save. Try again.';
        if (msg.includes('row-level security') || error.code === '42501') {
          msg = 'Permission denied. Your account may not have update access. Please re-login and try again.';
        }
        setSaveError(msg);
        setSaveStatus('error');
      } else {
        try {
          await refreshProfile();
        } catch (_) {
          // Profile refresh failed but save succeeded — ignore
        }
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus(null), 3000);
      }
    } catch (err) {
      console.error('Profile save exception:', err);
      setSaveError(err?.message || 'An unexpected error occurred. Try again.');
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setAvatarUploading(true);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const filePath = `avatars/${user.id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (!uploadError) {
        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        const publicUrl = urlData?.publicUrl;
        if (publicUrl) {
          await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
          setAvatarUrl(publicUrl + '?t=' + Date.now()); // cache-bust
          try { await refreshProfile(); } catch (_) { /* ignore */ }
        }
      } else {
        // Fallback: base64 data URL stored directly in profile
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const dataUrl = ev.target.result;
            await supabase.from('profiles').update({ avatar_url: dataUrl }).eq('id', user.id);
            setAvatarUrl(dataUrl);
            try { await refreshProfile(); } catch (_) { /* ignore */ }
          } catch (err) {
            console.error('Avatar fallback save error:', err);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    setIsLoggingOut(true);
    signOut(); // signOut now handles redirect via window.location.href
  };

  const displayName     = profile?.full_name || profile?.username || user?.email || 'User';
  const displayUsername = profile?.username  || user?.email?.split('@')[0] || '';
  
  const toggleNotif = (key: string) => {
    if (key === 'mandi' && !notifications.mandi) {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
    setNotifications(p => {
      const next = { ...p, [key]: !p[key] };
      localStorage.setItem('krishi_notifications', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-xl text-sm font-semibold transition-all animate-slide-up ${toast.type === 'error' ? 'bg-red-600 text-white' : toast.type === 'info' ? 'bg-amber-500 text-white' : 'bg-green-600 text-white'}`}>
          <AlertCircle size={18} />
          {toast.msg}
        </div>
      )}
      <header className="auth-gradient-bg px-5 py-10 shadow-lg border-b border-white/20 sticky top-0 z-10 flex flex-col items-center">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{t('settings.title')}</h1>
        <p className="text-primary text-[10px] font-bold uppercase tracking-widest mt-2">{t('settings.titleHi')}</p>
      </header>

      <main className="px-4 py-8 max-w-xl mx-auto w-full space-y-8 animate-fade-in-scale">

        {/* ── Profile ── */}
        <section className="glass-premium p-6 rounded-3xl shadow-xl border border-white/40">
          <h2 className="text-lg font-black text-gray-900 mb-6 uppercase tracking-wider">
            {t('settings.profile')} <span className="text-[10px] font-bold text-primary/60 ml-1">{t('settings.profileHi')}</span>
          </h2>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative shrink-0">
              <div className="w-24 h-24 glass-premium rounded-full overflow-hidden flex items-center justify-center p-1 border border-white/60 shadow-inner">
                <div className="w-full h-full rounded-full overflow-hidden bg-primary flex items-center justify-center">
                  {avatarUploading
                    ? <Loader2 size={28} className="animate-spin text-white" />
                    : avatarUrl
                      ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-3xl font-black text-white">{displayName[0]?.toUpperCase()}</span>
                  }
                </div>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full flex items-center justify-center border-2 border-primary/20 shadow-lg hover:scale-110 transition-transform cursor-pointer"
              >
                <Camera size={14} className="text-primary" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div>
              <p className="font-black text-xl text-gray-900 leading-tight">{displayName}</p>
              <p className="text-sm font-bold text-primary/60">@{displayUsername}</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-white/50 backdrop-blur-sm border border-primary/20 px-3 py-1 rounded-full mt-2 inline-block">
                {profile?.role === 'buyer' ? '🛒 Buyer' : '👨🏽‍🌾 Farmer'}
              </span>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            {[
              { label: t('settings.fullName'), value: fullName, set: setFullName, type: 'text', placeholder: 'Ramesh Kumar' },
              { label: t('settings.phone'),    value: phone,    set: setPhone,    type: 'tel',  placeholder: '9876543210' },
              { label: t('settings.address'),  value: address,  set: setAddress,  type: 'text', placeholder: 'Village, District, State' },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{f.label}</label>
                <input
                  type={f.type}
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-sky-100"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            {/* Email (read-only) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full rounded-xl border border-gray-100 bg-gray-100 p-3 text-sm text-gray-400 cursor-not-allowed"
              />
            </div>

            {/* Save Status Banner */}
            {saveStatus === 'error' && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-red-600 text-sm">
                <AlertCircle size={15} />
                <span>{saveError}</span>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 text-sm shadow-xl group relative overflow-hidden active:scale-95 ${
                saveStatus === 'saved' ? 'bg-green-500 text-white' :
                saveStatus === 'error' ? 'bg-red-500 text-white' :
                'bg-primary text-white hover:bg-sky-500'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:animate-shimmer" />
              {saving
                ? <><Loader2 size={16} className="animate-spin" /> {t('settings.saving')}</>
                : saveStatus === 'saved'
                  ? <><Check size={16} /> {t('settings.saved')}</>
                  : saveStatus === 'error'
                    ? t('settings.tryAgain')
                    : t('settings.saveChanges')
              }
            </button>
          </div>
        </section>

        {/* ── Theme ── */}
        <section className="glass-premium p-6 rounded-3xl shadow-xl border border-white/40">
          <div className="flex items-center gap-3 mb-6">
            <Palette size={20} className="text-primary" />
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wider">
              {t('settings.theme')} <span className="text-[10px] font-bold text-primary/60 ml-1">{t('settings.themeHi')}</span>
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => handleTheme(t.id)}
                className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                  theme === t.id ? 'border-primary shadow-md scale-105' : 'border-gray-100 hover:border-gray-300'
                }`}
              >
                {/* Color swatch */}
                <div
                  className="w-10 h-10 rounded-full mb-2 relative flex items-center justify-center"
                  style={{ backgroundColor: t.previewBg, border: `2px solid ${t.previewBorder}` }}
                >
                  {theme === t.id && (
                    <Check size={16} className="text-gray-700" />
                  )}
                </div>
                <span className={`font-semibold text-xs ${theme === t.id ? 'text-primary' : 'text-gray-700'}`}>{t.label}</span>
                <span className="text-[10px] text-gray-400">{t.labelHi}</span>
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-3">{t('settings.themeDesc')}</p>
        </section>

        {/* ── UI Language ── */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            UI Language <span className="text-xs font-normal text-gray-400">यूआई भाषा</span>
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {languages.map(l => (
              <button
                key={l.id}
                onClick={() => handleUiLangSelect(l.id)}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                  uiLanguage === l.id
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{l.flag}</span>
                <div className="text-left min-w-0">
                  <div className={`font-bold text-sm ${uiLanguage === l.id ? 'text-primary' : 'text-gray-800'}`}>{l.name}</div>
                  <div className="text-[10px] text-gray-400" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>{l.native}</div>
                </div>
                {uiLanguage === l.id && <Check size={13} className="text-primary ml-auto shrink-0" />}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
            Saved automatically
          </p>
        </section>

        {/* ── Voice Language ── */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Voice Language <span className="text-xs font-normal text-gray-400">वॉइस भाषा</span>
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'hi-IN', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
              { id: 'en-IN', name: 'English', native: 'English', flag: '🇬🇧' },
              { id: 'ta-IN', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
              { id: 'mr-IN', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
              { id: 'pa-IN', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
            ].map(l => (
              <button
                key={l.id}
                onClick={() => handleVoiceLangSelect(l.id)}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all ${
                  voiceLanguage === l.id
                    ? 'border-primary bg-primary/5 shadow-md ring-2 ring-primary/20'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{l.flag}</span>
                <div className="text-left min-w-0">
                  <div className={`font-bold text-sm ${voiceLanguage === l.id ? 'text-primary' : 'text-gray-800'}`}>{l.name}</div>
                  <div className="text-[10px] text-gray-400" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>{l.native}</div>
                </div>
                {voiceLanguage === l.id && <Check size={13} className="text-primary ml-auto shrink-0" />}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
            Saved automatically
          </p>
        </section>

        {/* ── Notifications ── */}
        <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {t('settings.notifications')} <span className="text-xs font-normal text-gray-400">{t('settings.notificationsHi')}</span>
          </h2>
          <div className="space-y-4">
            {[
              { key: 'buyer',  label: t('settings.buyerInquiries'),    hi: t('settings.buyerInquiriesHi') },
              { key: 'mandi',  label: t('settings.mandiAlerts'),       hi: t('settings.mandiAlertsHi') },
              { key: 'status', label: t('settings.listingUpdates'),    hi: t('settings.listingUpdatesHi') },
            ].map(n => (
              <div key={n.key} className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.hi}</p>
                </div>
                <button
                  onClick={() => toggleNotif(n.key)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${notifications[n.key] ? 'bg-primary' : 'bg-gray-200'}`}
                >
                  <div
                    className="w-5 h-5 bg-white rounded-full absolute top-0.5 shadow-sm transition-transform duration-200"
                    style={{ transform: notifications[n.key] ? 'translateX(26px)' : 'translateX(2px)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Logout ── */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`w-full flex items-center justify-center gap-4 p-5 rounded-2xl border transition-all shadow-lg active:scale-95 ${isLoggingOut ? 'bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed' : 'border-red-200/50 bg-red-500/10 backdrop-blur-sm text-red-600 hover:bg-red-500 hover:text-white'}`}
        >
          {isLoggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
          <div className="text-left">
            <span className="font-black block text-sm uppercase tracking-wider">{isLoggingOut ? 'Logging out...' : t('settings.logout')}</span>
            <span className="text-[9px] font-bold opacity-70 tracking-widest">{t('settings.logoutHi')}</span>
          </div>
        </button>

        <p className="text-center text-xs text-gray-300 pb-2">{t('settings.appVersion')}</p>
      </main>
    </div>
  );
}
