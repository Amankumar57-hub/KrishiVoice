import { supabase } from '../supabaseClient';
import { useAuthContext } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MandiPriceBanner from '../components/MandiPriceBanner';
import VoiceButton from '../components/VoiceButton';
import ListingCard from '../components/ListingCard';
import {
  Mic,
  Sprout,
  ChevronRight
} from 'lucide-react';

const FARMER_QUOTES = [0, 1, 2]; // Use indices for translation keys

const STATS = [
  { value: '14Cr+', labelKey: 'farmers', icon: '👨🏽‍🌾' },
  { value: '500+', labelKey: 'mandis', icon: '🏪' },
  { value: '₹2,400Cr', labelKey: 'tradeValue', icon: '💰' },
  { value: '6', labelKey: 'languages', icon: '🗣' },
];

export default function Home() {
  const { user, profile } = useAuthContext();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [listings, setListings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quoteIdx, setQuoteIdx]   = useState(0);


  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % FARMER_QUOTES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('*, profiles:user_id(full_name, username, phone, whatsapp, email, address, state, avatar_url, role)')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(6);
    setListings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchListings(); }, [fetchListings, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect to profile completion if user signed in but no profile yet
  useEffect(() => {
    if (user && !profile) {
      navigate('/register/username');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  const adapt = (l) => ({
    id:              l.id,
    user_id:         l.user_id,
    crop_name:       l.crop_name,
    crop_name_hindi: l.crop_name_hindi,
    quantity:        l.quantity,
    unit:            l.unit,
    price_per_unit:  l.price_per_unit,
    price_unit:      l.price_unit,
    seller:          l.profiles?.full_name || l.profiles?.username || 'Farmer',
    location:        l.location || '',
    phone:           l.phone    || l.profiles?.phone    || '',
    whatsapp:        l.whatsapp || l.profiles?.whatsapp || '',
    email:           l.profiles?.email   || '',
    address:         l.address  || l.profiles?.address  || '',
    state:           l.profiles?.state   || '',
    status:          l.status,
    profiles:        l.profiles,
    // Add quality fields for card/detail support
    photo_url:       l.photo_url || null,
    grade:           l.grade || '',
    moisture:        l.moisture ?? null,
    is_organic:      l.is_organic || false,
    bag_count:       l.bag_count ?? null,
    delivery_option: l.delivery_option || 'both',
    harvest_date:    l.harvest_date || '',
    voice_transcript: l.voice_transcript || '',
  });

  const quote = t(`home.farmerQuotes.${quoteIdx}`, { returnObjects: true });
  const displayName = profile?.full_name || profile?.username || '';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>

      {/* ── Mandi Ticker ── */}
      <MandiPriceBanner />

      {/* ── HERO SECTION ── */}
      <section className="hero-field min-h-[50vh] md:min-h-[380px] flex flex-col items-center justify-center pt-8 pb-8 px-4 relative overflow-hidden">
        {/* Hero Text */}
        <div className="text-center animate-slide-up mb-6">
          <h1 className="font-display text-4xl md:text-6xl font-black text-white leading-tight mb-2 drop-shadow-lg">
            {t('home.heroTitle')}
          </h1>
          <p className="text-green-200 text-lg md:text-xl font-medium" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>
            {t('home.heroSubtitle')}
          </p>

          {/* Greeting */}
          {user && displayName && (
            <p className="text-white/70 text-sm mt-2">
              {t('home.welcome')} <span className="text-amber-300 font-bold">{displayName}</span> 🌾
            </p>
          )}
        </div>

        {/* Voice button in hero */}
        <div className="flex flex-col items-center gap-3">
          <Link
            to={user ? '/#voice' : '/login'}
            onClick={user ? (e) => { e.preventDefault(); document.getElementById('voice-section')?.scrollIntoView({ behavior: 'smooth' }); } : undefined}
            className="btn-amber-3d w-16 h-16 rounded-full bg-amber-400 hover:bg-amber-500 transition-all flex items-center justify-center shadow-2xl animate-pulse-amber"
          >
            <Mic size={32} className="text-white" />
          </Link>
          <div className="glass px-4 py-2 rounded-full text-center">
            <p className="text-white text-xs font-medium">"{t('home.voiceExample')}"</p>
          </div>
        </div>
      </section>

      {/* ── JAI JAWAN JAI KISAN Banner ── */}
      <div className="jai-banner py-3.5 px-2 sm:px-4 overflow-hidden flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <span className="text-amber-300 text-sm sm:text-lg">🇮🇳</span>
          <p
            className="text-center font-black tracking-widest uppercase whitespace-nowrap text-[10px] sm:text-xs md:text-sm lg:text-base"
            style={{
              fontFamily: 'Playfair Display, serif',
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fcd34d, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '0.15em',
            }}
          >
            JAI JAWAN · JAI KISAN · JAI VIGYAN
          </p>
          <span className="text-amber-300 text-sm sm:text-lg">🇮🇳</span>
        </div>
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <span className="text-amber-300 text-[10px] sm:text-xs opacity-80">🇮🇳</span>
          <p className="text-center text-green-300 text-[9px] sm:text-[10px] font-medium tracking-widest whitespace-nowrap">
            जय जवान · जय किसान · जय विज्ञान
          </p>
          <span className="text-amber-300 text-[10px] sm:text-xs opacity-80">🇮🇳</span>
        </div>
      </div>

      {/* ── FARMER QUOTE ── */}
      <section className="mx-4 my-5 quote-card rounded-3xl shadow-sm p-5 transition-all duration-500 overflow-hidden">
        <div className="w-full">
          <p
            className="font-display text-gray-900 font-bold text-sm sm:text-base leading-snug italic mb-1 truncate"
            style={{ transition: 'opacity 0.5s ease' }}
          >
            {(quote as any).en.replace(/^"|"$/g, '')}
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mb-2 truncate" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>
            {(quote as any).hi.replace(/^"|"$/g, '')}
          </p>
          <p className="text-primary text-xs font-bold">— {(quote as any).author}</p>
        </div>
      </section>


      {/* ── STATS STRIP ── */}
      <div className="mx-4 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {STATS.map(s => (
          <div key={s.labelKey} className="stat-3d rounded-2xl border border-green-100 p-2.5 text-center cursor-default">
            <div className="text-xl mb-0.5">{s.icon}</div>
            <p className="font-black text-primary text-sm leading-none">{s.value}</p>
            <p className="text-[9px] font-bold text-gray-500 mt-0.5">{t(`home.stats.${s.labelKey}`)}</p>
            <p className="text-[8px] text-gray-400">{t(`home.stats.${s.labelKey}Hi`)}</p>
          </div>
        ))}
      </div>

      <main className="px-4 max-w-5xl mx-auto">

        {/* ── VOICE SECTION ── */}
        <section id="voice-section" className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Mic size={14} className="text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm leading-none">{t('home.voiceSection.title')}</h2>
              <p className="text-[10px] text-gray-400">{t('home.voiceSection.subtitle')}</p>
            </div>
          </div>
          <VoiceButton onListingPublished={() => setRefreshKey(k => k + 1)} />
        </section>

        {/* ── RECENT LISTINGS ── */}
        <section className="mb-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('home.listings.title')}</h2>
              <p className="text-xs text-gray-400 font-medium">{t('home.listings.subtitle')}</p>
            </div>
            <Link to="/search" className="flex items-center gap-1 text-primary text-sm font-bold hover:underline">
              {t('home.listings.viewAll')} <ChevronRight size={15} />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-14 bg-gray-100 rounded-xl mb-4" />
                  <div className="h-10 bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-14 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sprout size={32} className="text-primary" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t('home.listings.noListings')}</h3>
              <p className="text-sm text-gray-400 mt-1 mb-6">{t('home.listings.noListingsDesc')}</p>
              {!user && (
                <Link to="/register" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-md">
                  <Mic size={15} /> {t('home.listings.registerSell')}
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map(l => <ListingCard key={l.id} listing={adapt(l)} />)}
            </div>
          )}
        </section>

        {/* ── FEATURES STRIP ── */}
        <section className="mb-6 grid grid-cols-3 gap-3">
          {[
            { icon: '🎙', titleKey: 'voiceListing', hiKey: 'voiceListingHi', descKey: 'voiceDesc' },
            { icon: '📊', titleKey: 'livePrices', hiKey: 'livePricesHi', descKey: 'pricesDesc' },
            { icon: '🚛', titleKey: 'transport', hiKey: 'transportHi', descKey: 'transportDesc' },
          ].map(f => (
            <div key={f.titleKey} className="card-3d bg-white rounded-2xl border border-gray-100 p-3 text-center cursor-default">
              <div className="text-2xl mb-1.5">{f.icon}</div>
              <p className="font-bold text-xs text-gray-900">{t(`home.features.${f.titleKey}`)}</p>
              <p className="text-[9px] text-primary font-medium">{t(`home.features.${f.hiKey}`)}</p>
              <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">{t(`home.features.${f.descKey}`)}</p>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}
