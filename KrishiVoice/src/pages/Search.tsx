import { Search as SearchIcon, Mic, MicOff, TrendingUp, X, MapPin, ChevronDown } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import { mockListings } from '../mock/listings';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useLanguage } from '../context/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import { getMandiPriceGuidance, findLocationHint, normalizeMandiEntry, LOCATION_HINTS } from '../utils/mandiInsights';
import { useAuthContext } from '../context/AuthContext';
import { mockMandiPrices } from '../mock/mandiPrices';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ── Live commodity prices (50+ crops) ──
const LIVE_PRICES = [
  // ── CEREALS ──
  { crop: 'Wheat', cropHindi: 'गेहूं', emoji: '🌾', price: 2125, unit: 'quintal', change: '+1.2%', up: true },
  { crop: 'Rice', cropHindi: 'चावल', emoji: '🍚', price: 1980, unit: 'quintal', change: '+0.8%', up: true },
  { crop: 'Maize', cropHindi: 'मक्का', emoji: '🌽', price: 1540, unit: 'quintal', change: '-0.5%', up: false },
  { crop: 'Barley', cropHindi: 'जौ', emoji: '🌾', price: 1450, unit: 'quintal', change: '+0.3%', up: true },
  { crop: 'Sorghum', cropHindi: 'ज्वार', emoji: '🌾', price: 1850, unit: 'quintal', change: '+1.1%', up: true },
  { crop: 'Pearl Millet', cropHindi: 'बाजरा', emoji: '🌾', price: 1650, unit: 'quintal', change: '-0.2%', up: false },
  { crop: 'Finger Millet', cropHindi: 'रागी', emoji: '🌾', price: 3200, unit: 'quintal', change: '+0.5%', up: true },
  { crop: 'Oats', cropHindi: 'जई', emoji: '🌾', price: 2800, unit: 'quintal', change: '0%', up: true },

  // ── PULSES ──
  { crop: 'Chickpea', cropHindi: 'चना', emoji: '🫛', price: 5800, unit: 'quintal', change: '-0.2%', up: false },
  { crop: 'Pigeon Pea', cropHindi: 'अरहर', emoji: '🫛', price: 8900, unit: 'quintal', change: '+1.5%', up: true },
  { crop: 'Green Gram', cropHindi: 'मूंग', emoji: '🫛', price: 7800, unit: 'quintal', change: '+0.8%', up: true },
  { crop: 'Black Gram', cropHindi: 'उडद', emoji: '🫛', price: 8200, unit: 'quintal', change: '+1.2%', up: true },
  { crop: 'Red Lentil', cropHindi: 'मसूर', emoji: '🫘', price: 6200, unit: 'quintal', change: '+0.4%', up: true },
  { crop: 'Horse Gram', cropHindi: 'कुल्थी', emoji: '🫛', price: 4500, unit: 'quintal', change: '+0.6%', up: true },
  { crop: 'Moth Bean', cropHindi: 'मोठ बीन', emoji: '🫛', price: 6000, unit: 'quintal', change: '+0.5%', up: true },

  // ── OILSEEDS ──
  { crop: 'Soybean', cropHindi: 'सोयाबीन', emoji: '🫘', price: 4350, unit: 'quintal', change: '+2.1%', up: true },
  { crop: 'Groundnut', cropHindi: 'मूंगफली', emoji: '🥜', price: 5500, unit: 'quintal', change: '+1.5%', up: true },
  { crop: 'Mustard', cropHindi: 'सरसों', emoji: '🟡', price: 5200, unit: 'quintal', change: '+0.3%', up: true },
  { crop: 'Sesame', cropHindi: 'तिल', emoji: '🟤', price: 12500, unit: 'quintal', change: '+0.9%', up: true },
  { crop: 'Sunflower', cropHindi: 'सूरजमुखी', emoji: '🌻', price: 6500, unit: 'quintal', change: '-0.4%', up: false },
  { crop: 'Castor', cropHindi: 'अरंडा', emoji: '🌱', price: 5800, unit: 'quintal', change: '+1.0%', up: true },
  { crop: 'Linseed', cropHindi: 'अलसी', emoji: '🌱', price: 6200, unit: 'quintal', change: '+0.7%', up: true },

  // ── VEGETABLES ──
  { crop: 'Potato', cropHindi: 'आलू', emoji: '🥔', price: 1200, unit: 'quintal', change: '+3.5%', up: true },
  { crop: 'Onion', cropHindi: 'प्याज', emoji: '🧅', price: 1800, unit: 'quintal', change: '-1.1%', up: false },
  { crop: 'Tomato', cropHindi: 'टमाटर', emoji: '🍅', price: 2400, unit: 'quintal', change: '+5.2%', up: true },
  { crop: 'Brinjal', cropHindi: 'बैंगन', emoji: '🍆', price: 2200, unit: 'quintal', change: '+0.8%', up: true },
  { crop: 'Okra', cropHindi: 'भिंडी', emoji: '🥬', price: 2800, unit: 'quintal', change: '+1.2%', up: true },
  { crop: 'Cauliflower', cropHindi: 'फूलगोभी', emoji: '🥦', price: 1500, unit: 'quintal', change: '-0.6%', up: false },
  { crop: 'Cabbage', cropHindi: 'गोभी', emoji: '🥬', price: 1100, unit: 'quintal', change: '+0.4%', up: true },
  { crop: 'Green Peas', cropHindi: 'मटर', emoji: '🫛', price: 3500, unit: 'quintal', change: '+2.1%', up: true },
  { crop: 'Spinach', cropHindi: 'पालक', emoji: '🥬', price: 1400, unit: 'quintal', change: '+1.5%', up: true },
  { crop: 'Bitter Gourd', cropHindi: 'करेला', emoji: '🥒', price: 2600, unit: 'quintal', change: '-0.8%', up: false },
  { crop: 'Bottle Gourd', cropHindi: 'लौकी', emoji: '🥒', price: 1200, unit: 'quintal', change: '0%', up: true },
  { crop: 'Ridge Gourd', cropHindi: 'तोरी', emoji: '🥒', price: 2100, unit: 'quintal', change: '+0.7%', up: true },
  { crop: 'Pumpkin', cropHindi: 'कद्दू', emoji: '🎃', price: 900, unit: 'quintal', change: '+0.2%', up: true },
  { crop: 'Carrot', cropHindi: 'गाजर', emoji: '🥕', price: 1800, unit: 'quintal', change: '+0.9%', up: true },
  { crop: 'Radish', cropHindi: 'मूली', emoji: '🥬', price: 800, unit: 'quintal', change: '-0.3%', up: false },
  { crop: 'Beetroot', cropHindi: 'चुकंदर', emoji: '🍎', price: 1600, unit: 'quintal', change: '+1.2%', up: true },
  { crop: 'Cucumber', cropHindi: 'खीरा', emoji: '🥒', price: 1600, unit: 'quintal', change: '+1.8%', up: true },
  { crop: 'Green Chilli', cropHindi: 'हरी मिर्च', emoji: '🌶️', price: 5500, unit: 'quintal', change: '+2.5%', up: true },

  // ── FRUITS ──
  { crop: 'Banana', cropHindi: 'केला', emoji: '🍌', price: 2800, unit: 'quintal', change: '+0.6%', up: true },
  { crop: 'Mango', cropHindi: 'आम', emoji: '🥭', price: 4200, unit: 'quintal', change: '+2.2%', up: true },
  { crop: 'Apple', cropHindi: 'सेब', emoji: '🍎', price: 8500, unit: 'quintal', change: '+1.3%', up: true },
  { crop: 'Orange', cropHindi: 'संतरा', emoji: '🍊', price: 3200, unit: 'quintal', change: '-0.7%', up: false },
  { crop: 'Grapes', cropHindi: 'अंगूर', emoji: '🍇', price: 7200, unit: 'quintal', change: '+3.1%', up: true },
  { crop: 'Watermelon', cropHindi: 'तरबूज', emoji: '🍉', price: 650, unit: 'quintal', change: '+4.2%', up: true },
  { crop: 'Pomegranate', cropHindi: 'अनार', emoji: '🍎', price: 6800, unit: 'quintal', change: '+0.9%', up: true },
  { crop: 'Papaya', cropHindi: 'पपीता', emoji: '🍈', price: 1500, unit: 'quintal', change: '+1.4%', up: true },
  { crop: 'Guava', cropHindi: 'अमरूद', emoji: '🍐', price: 2400, unit: 'quintal', change: '+0.5%', up: true },

  // ── CASH CROPS & SPICES ──
  { crop: 'Sugarcane', cropHindi: 'गन्ना', emoji: '🌿', price: 350, unit: 'quintal', change: '0%', up: true },
  { crop: 'Cotton', cropHindi: 'कपास', emoji: '🌸', price: 6800, unit: 'quintal', change: '+0.9%', up: true },
  { crop: 'Turmeric', cropHindi: 'हल्दी', emoji: '🟡', price: 12000, unit: 'quintal', change: '+1.1%', up: true },
  { crop: 'Ginger', cropHindi: 'अदरक', emoji: '🫚', price: 15000, unit: 'quintal', change: '-0.7%', up: false },
  { crop: 'Garlic', cropHindi: 'लहसुन', emoji: '🧄', price: 8000, unit: 'quintal', change: '+2.8%', up: true },
  { crop: 'Black Pepper', cropHindi: 'काली मिर्च', emoji: '🫚', price: 42000, unit: 'quintal', change: '+0.4%', up: true },
  { crop: 'Cardamom', cropHindi: 'इलायची', emoji: '🌿', price: 95000, unit: 'quintal', change: '+1.8%', up: true },
  { crop: 'Cinnamon', cropHindi: 'दालचीनी', emoji: '🪵', price: 38000, unit: 'quintal', change: '+0.6%', up: true },
  { crop: 'Clove', cropHindi: 'लौंग', emoji: '🌸', price: 85000, unit: 'quintal', change: '+2.3%', up: true },
  { crop: 'Tea', cropHindi: 'चाय', emoji: '🍵', price: 3000, unit: 'quintal', change: '+1.8%', up: true },
  { crop: 'Coffee', cropHindi: 'कॉफ़ी', emoji: '☕', price: 8000, unit: 'quintal', change: '-0.6%', up: false },
  { crop: 'Jute', cropHindi: 'पटसन', emoji: '🌿', price: 2200, unit: 'quintal', change: '0%', up: true },
  { crop: 'Tobacco', cropHindi: 'तंबाकू', emoji: '🚬', price: 4500, unit: 'quintal', change: '-0.3%', up: false },
];

const FILTERS = ['All', 'Wheat', 'Rice', 'Maize', 'Barley', 'Sorghum', 'Pearl Millet', 'Finger Millet', 'Oats',
  'Chickpea', 'Pigeon Pea', 'Green Gram', 'Black Gram', 'Red Lentil', 'Horse Gram', 'Moth Bean',
  'Soybean', 'Groundnut', 'Mustard', 'Sesame', 'Sunflower', 'Castor', 'Linseed',
  'Potato', 'Onion', 'Tomato', 'Brinjal', 'Okra', 'Cauliflower', 'Cabbage', 'Green Peas', 'Spinach',
  'Bitter Gourd', 'Bottle Gourd', 'Ridge Gourd', 'Pumpkin', 'Carrot', 'Radish', 'Beetroot', 'Cucumber', 'Green Chilli',
  'Banana', 'Mango', 'Apple', 'Orange', 'Grapes', 'Watermelon', 'Pomegranate', 'Papaya', 'Guava',
  'Sugarcane', 'Cotton', 'Turmeric', 'Ginger', 'Garlic', 'Black Pepper', 'Cardamom', 'Cinnamon', 'Clove',
  'Tea', 'Coffee', 'Jute', 'Tobacco'];
const FILTERS_HI = ['सभी', 'गेहूं', 'चावल', 'मक्का', 'जौ', 'ज्वार', 'बाजरा', 'रागी', 'जई',
  'चना', 'अरहर', 'मूंग', 'उडद', 'मसूर', 'kulthi', 'मोठ बीन',
  'सोयाबीन', 'मूंगफली', 'सरसों', 'तिल', 'सूरजमुखी', 'अरंडा', 'अलसी',
  'आलू', 'प्याज', 'टमाटर', 'बैंगन', 'भिंडी', 'फूलगोभी', 'गोभी', 'मटर', 'पालक',
  'करेला', 'लौकी', 'तोरी', 'कद्दू', 'गाजर', 'मूली', 'चुकंदर', 'खीरा', 'हरी मिर्च',
  'केला', 'आम', 'सेब', 'संतरा', 'अंगूर', 'तरबूज', 'अनार', 'पपीता', 'अमरूद',
  'गन्ना', 'कपास', 'हल्दी', 'अदरक', 'लहसुन', 'काली मिर्च', 'इलायची', 'दालचीनी', 'लौंग',
  'चाय', 'कॉफ़ी', 'पटसन', 'तंबाकू'];

export default function Search() {
  const { profile } = useAuthContext();
  const { languages, voiceLocale } = useLanguage();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('crop') || '');
  const [locationQuery, setLocationQuery] = useState(searchParams.get('location') || '');
  const [filter, setFilter] = useState(
    searchParams.get('crop')
      ? FILTERS.find(f => f.toLowerCase() === searchParams.get('crop')?.toLowerCase()) || 'All'
      : 'All'
  );
  const [allData, setAllData] = useState([]);
  const [voiceListening, setVoiceListening] = useState(false);
  const [showPrices, setShowPrices] = useState(true);
  const [voiceLang, setVoiceLang] = useState(voiceLocale);
  const recognitionRef = useRef(null);

  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [mandiPrices, setMandiPrices] = useState([]);
  const [displayPrices, setDisplayPrices] = useState<any[]>(LIVE_PRICES);
  // selectedLocation: auto-filled from profile, user can override via dropdown
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showLocationDrop, setShowLocationDrop] = useState(false);

  const LIMIT = 12;

  // Auto-detect location from user profile on mount
  useEffect(() => {
    if (profile?.state || profile?.address) {
      const hint = findLocationHint(`${profile?.address || ''} ${profile?.state || ''}`);
      if (hint?.district) setSelectedLocation(hint.district);
      else if (profile?.state) setSelectedLocation(profile.state);
    }
  }, [profile]);

  const voiceOptions = languages.filter((lang, index, allLanguages) => (
    allLanguages.findIndex((candidate) => candidate.voiceLocale === lang.voiceLocale) === index
  ));

  useEffect(() => {
    setVoiceLang(voiceLocale);
  }, [voiceLocale]);

  // Fetch mandi prices
  useEffect(() => {
    const fetchMandiPrices = async () => {
      try {
        const { data, error } = await supabase
          .from('mandi_prices')
          .select('*')
          .order('date', { ascending: false })
          .limit(500);
        if (!error && data?.length) {
          setMandiPrices(data.map(normalizeMandiEntry));
        } else {
          setMandiPrices(mockMandiPrices.map(normalizeMandiEntry));
        }
      } catch {
        setMandiPrices(mockMandiPrices.map(normalizeMandiEntry));
      }
    };
    fetchMandiPrices();
  }, []);

  // Recompute displayed prices whenever location, mandiPrices, or profile changes
  useEffect(() => {
    const activeDistrict = selectedLocation || locationQuery || '';
    const activeLocationText = activeDistrict || `${profile?.address || ''} ${profile?.state || ''}`;
    const locationHint = findLocationHint(activeLocationText) ||
      (activeDistrict ? { district: activeDistrict, state: '', keywords: [] } : null);

    const computedPrices = LIVE_PRICES.map(p => {
      // 1️⃣ Direct district match — highest priority (exact AgMarkNet data)
      if (activeDistrict && mandiPrices.length) {
        const directMatch = mandiPrices.find(
          m => m.crop.toLowerCase() === p.crop.toLowerCase() &&
               m.district.toLowerCase() === activeDistrict.toLowerCase()
        );
        if (directMatch && directMatch.price > 0) {
          return {
            ...p,
            price: directMatch.price,
            priceMin: directMatch.priceMin,
            priceMax: directMatch.priceMax,
            unit: directMatch.unit || 'quintal',
            mandiName: directMatch.mandi,
            mandiDistrict: directMatch.district,
          };
        }
      }
      // 2️⃣ Nearest-location guidance fallback
      if (mandiPrices.length) {
        const guidance = getMandiPriceGuidance({
          crop: p.crop, userPrice: 0, userPriceUnit: 'quintal',
          profile, mandiPrices, preferredLocation: locationHint,
        });
        if (guidance && guidance.marketPrice > 0) {
          return {
            ...p,
            price: guidance.marketPrice,
            priceMin: guidance.bestMarket?.priceMin || 0,
            priceMax: guidance.bestMarket?.priceMax || 0,
            unit: guidance.unit,
            mandiName: guidance.bestMarket?.mandi || '',
            mandiDistrict: guidance.bestMarket?.district || activeDistrict || '',
          };
        }
      }
      return { ...p, mandiName: '', mandiDistrict: activeDistrict || '' };
    });

    setDisplayPrices(computedPrices);
  }, [mandiPrices, query, locationQuery, selectedLocation, profile]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    setAllData([]);
  }, [query, filter, locationQuery]);

  const fetchListings = async (currentPage) => {
    try {
      setLoading(true);
      let queryBuilder = supabase.from('listings')
        .select('*, profiles:user_id(full_name, username, phone, whatsapp, email, address, state, avatar_url, role)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
        
      if (filter !== 'All') {
        queryBuilder = queryBuilder.eq('crop_name', filter);
      }
      
      if (query) {
         queryBuilder = queryBuilder.or(`crop_name.ilike.%${query}%,crop_name_hindi.ilike.%${query}%,location.ilike.%${query}%`);
      }

      const start = currentPage * LIMIT;
      const end = start + LIMIT - 1;

      const { data, error } = await queryBuilder.range(start, end);
      
      if (!error && data) {
        const formattedData = data.map(l => ({
            id: l.id,
            user_id: l.user_id,
            crop: l.crop_name,
            crop_name: l.crop_name,
            cropHindi: l.crop_name_hindi,
            crop_name_hindi: l.crop_name_hindi,
            qty: l.quantity,
            quantity: l.quantity,
            unit: l.unit,
            price: l.price_per_unit,
            price_per_unit: l.price_per_unit,
            priceUnit: l.price_unit,
            price_unit: l.price_unit,
            seller: l.profiles?.full_name || l.profiles?.username || 'Farmer',
            location: l.location || '',
            phone: l.phone || l.profiles?.phone || '',
            whatsapp: l.whatsapp || l.profiles?.whatsapp || '',
            email: l.profiles?.email || '',
            address: l.address || l.profiles?.address || '',
            state: l.profiles?.state || '',
            status: l.status,
            profiles: l.profiles,
            // Full quality fields
            photo_url: l.photo_url || null,
            grade: l.grade || '',
            moisture: l.moisture ?? null,
            is_organic: l.is_organic || false,
            bag_count: l.bag_count ?? null,
            delivery_option: l.delivery_option || 'both',
            harvest_date: l.harvest_date || '',
            voice_transcript: l.voice_transcript || '',
          }));
          
          if (currentPage === 0) setAllData(formattedData);
          else setAllData(prev => [...prev, ...formattedData]);
          
          if (data.length < LIMIT) setHasMore(false);
        } else {
          if (currentPage === 0) setAllData([]);
          setHasMore(false);
        }
      } catch {
        if (currentPage === 0) setAllData([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchListings(page);
    }, 400); // debounce search input

    return () => clearTimeout(delayDebounceFn);
  }, [query, filter, page]);

  // Voice search
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (voiceListening) {
      recognitionRef.current?.stop();
      setVoiceListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = voiceLang;
    recognition.interimResults = true;
    recognition.continuous = false;
    recognitionRef.current = recognition;
    setVoiceListening(true);

    recognition.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setQuery(text);
    };
    recognition.onend = () => setVoiceListening(false);
    recognition.onerror = () => setVoiceListening(false);
    recognition.start();
  };

  // Server-side filtering handles the base filtering now. 
  // We just use allData as it already reflects the searched rows.
  const filtered = allData;

  // Price card search: match by crop name (English or Hindi) against query
  const priceSearchQuery = query.trim().toLowerCase();
  const visiblePrices = displayPrices.filter(p => {
    const matchesCropFilter = filter === 'All' || p.crop === filter;
    const matchesSearch = !priceSearchQuery
      || p.crop.toLowerCase().includes(priceSearchQuery)
      || p.cropHindi?.includes(priceSearchQuery);
    return matchesCropFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-body)' }}>
      {/* Search Bar */}
      <header className="bg-white px-4 py-3 shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="relative w-full max-w-3xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search crop / फसल खोजें..."
              className="w-full pl-10 pr-10 py-3 rounded-2xl border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-sky-100 bg-gray-50 text-sm"
            />
            {query && (
              <button onClick={() => setQuery('')} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>

          {/* Voice Button */}
          <button
            onClick={startVoiceSearch}
            className={`p-3 rounded-2xl transition-all shadow-sm ${voiceListening ? 'bg-red-500 text-white animate-pulse' : 'bg-primary text-white hover:bg-sky-500'}`}
            title="Voice Search / आवाज़ से खोजें"
          >
            {voiceListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        </div>

        {/* Location selector row */}
        <div className="relative max-w-3xl mx-auto mt-2">
          <button
            onClick={() => setShowLocationDrop(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
          >
            <MapPin size={12} className="text-green-600" />
            <span className="text-green-700">
              {selectedLocation ? `📍 ${selectedLocation}` : '📍 Select State / District'}
            </span>
            <ChevronDown size={12} className="text-green-600" />
          </button>
          {selectedLocation && (
            <button
              onClick={() => setSelectedLocation('')}
              className="ml-2 text-[10px] text-gray-400 hover:text-red-500"
            >✕ Clear</button>
          )}

          {showLocationDrop && (
            <div className="absolute left-0 top-9 z-50 bg-white border border-gray-200 rounded-2xl shadow-xl w-64 max-h-60 overflow-y-auto">
              <div className="p-2 sticky top-0 bg-white border-b border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Select District / State</p>
              </div>
              {LOCATION_HINTS.map(loc => (
                <button
                  key={loc.district}
                  onClick={() => { setSelectedLocation(loc.district); setShowLocationDrop(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 transition-colors flex justify-between items-center ${
                    selectedLocation === loc.district ? 'bg-green-50 text-green-700 font-bold' : 'text-gray-700'
                  }`}
                >
                  <span>{loc.district}</span>
                  <span className="text-[10px] text-gray-400">{loc.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice lang selector */}
        {voiceListening && (
          <div className="flex justify-center gap-2 mt-2">
            {voiceOptions.map(l => (
              <button
                key={l.id}
                onClick={() => setVoiceLang(l.voiceLocale)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${voiceLang === l.voiceLocale ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}
              >
                {l.native}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Filters */}
      <div className="px-4 py-2.5 bg-white border-b border-gray-100 overflow-x-auto flex space-x-2 shadow-sm">
        <div className="flex w-max">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex flex-col items-center px-4 py-1.5 mr-2 rounded-xl border text-xs transition-all shrink-0 ${
                filter === f ? 'bg-primary border-primary text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="font-semibold">{f}</span>
              <span className={`text-[9px] mt-0.5 ${filter === f ? 'text-sky-100' : 'text-gray-400'}`}>{FILTERS_HI[i]}</span>
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 pb-6 max-w-5xl mx-auto w-full">
        {/* Live Prices Panel */}
        {showPrices && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <TrendingUp size={16} className="text-green-600" />
                <h2 className="font-bold text-gray-900 text-sm">Live Market Prices</h2>
                <span className="text-[10px] text-gray-400">/ लाइव मंडी भाव</span>
                {selectedLocation && (
                  <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin size={9} /> {selectedLocation}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">● LIVE</span>
                <button onClick={() => setShowPrices(false)} className="text-gray-300 hover:text-gray-500">
                  <X size={14} />
                </button>
              </div>
            </div>

            {visiblePrices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-3xl mb-2">🌾</p>
                <p className="text-gray-500 text-sm font-semibold">No crops found for "{query}"</p>
                <p className="text-xs text-gray-400 mt-1">Try searching: Wheat, Rice, Potato... / गेहूं, चावल, आलू...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 mb-6">
                {visiblePrices.map(p => (
                  <button
                    key={p.crop}
                    onClick={() => { setQuery(p.crop); setFilter('All'); }}
                    className="bg-white rounded-2xl border border-gray-100 p-3 text-left hover:border-primary hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="text-2xl">{p.emoji}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${p.up ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                        {p.change}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors leading-tight">{p.crop}</p>
                    <p className="text-[10px] text-gray-400">{p.cropHindi}</p>
                    <p className="text-green-700 font-black text-base mt-1">₹{p.price.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-gray-400">per {p.unit}</p>
                    {p.priceMin > 0 && p.priceMax > 0 && (
                      <p className="text-[9px] text-gray-400 mt-0.5">
                        ₹{p.priceMin.toLocaleString('en-IN')} – ₹{p.priceMax.toLocaleString('en-IN')}
                      </p>
                    )}
                    {(p.mandiDistrict || p.mandiName) && (
                      <p className="text-[9px] text-green-600 mt-1 flex items-center gap-0.5 truncate">
                        <MapPin size={8} />{p.mandiName || p.mandiDistrict}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!showPrices && (
          <button onClick={() => setShowPrices(true)} className="mt-4 mb-3 flex items-center gap-1 text-xs text-primary font-semibold">
            <TrendingUp size={13} /> Show live prices / मूल्य दिखाएं
          </button>
        )}

        {/* Listings */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-gray-900">
              {query ? `Results for "${query}"` : filter !== 'All' ? `${filter} Listings` : 'All Listings'}
            </h3>
            <p className="text-xs text-gray-400">{filtered.length} results / परिणाम</p>
          </div>
        </div>

        {filtered.length === 0 && !loading ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-600 font-semibold">No listings found</p>
            <p className="text-sm text-gray-400 mt-1">Try a different search / कोई और खोजें</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((listing, i) => (
                <ListingCard key={`${listing.id}-${i}`} listing={listing} />
              ))}
            </div>
            {loading && (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            {hasMore && !loading && (
              <div className="flex justify-center mt-6">
                <button 
                  onClick={() => setPage(p => p + 1)}
                  className="bg-white border border-gray-200 text-primary font-bold px-6 py-2.5 rounded-full shadow-sm hover:shadow-md hover:bg-sky-50 transition-all text-sm"
                >
                  Load More / और देखें
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
