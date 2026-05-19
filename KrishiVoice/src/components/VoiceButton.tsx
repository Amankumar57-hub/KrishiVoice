import { useState, useEffect, useCallback, useRef, useMemo, startTransition } from 'react';
import { getCropPrice } from '../utils/priceService';
import { useVoice } from '../hooks/useVoice';
import { Mic, MicOff, Globe, CheckCircle, XCircle, Loader2, Volume2, LogIn, Edit3, TrendingUp, Camera, LocateFixed, MapPin } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { mockMandiPrices } from '../mock/mandiPrices';
import { findLocationHint, formatLocationLabel, getMandiPriceGuidance, getNearestKnownLocation, normalizeMandiEntry } from '../utils/mandiInsights';
import imageCompression from 'browser-image-compression';
import { assistantVoice } from '../utils/assistantVoice';

// ── Live prices database (50+ crops with realistic mandi rates) ──
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
  { crop: 'Horse Gram', cropHindi: 'kulthi', emoji: '🫛', price: 4500, unit: 'quintal', change: '+0.6%', up: true },
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

const VOICE_LANGUAGES = [
  { id: 'hindi',    code: 'hi-IN', label: 'Hindi',    native: 'हिंदी',   flag: '🇮🇳' },
  { id: 'english',  code: 'en-IN', label: 'English',  native: 'English',  flag: '🇬🇧' },
  { id: 'tamil',    code: 'ta-IN', label: 'Tamil',    native: 'தமிழ்',   flag: '🇮🇳' },
  { id: 'marathi',  code: 'mr-IN', label: 'Marathi',  native: 'मराठी',   flag: '🇮🇳' },
  { id: 'punjabi',  code: 'pa-IN', label: 'Punjabi',  native: 'ਪੰਜਾਬੀ',  flag: '🇮🇳' },
  { id: 'bhojpuri', code: 'bho-IN', label: 'Bhojpuri', native: 'भोजपुरी',  flag: '🇮🇳' },
  { id: 'magahi',   code: 'mag-IN', label: 'Magahi',   native: 'मगही',   flag: '🇮🇳' },
  { id: 'maithili', code: 'mai-IN', label: 'Maithili', native: 'मैथिली',   flag: '🇮🇳' },
  { id: 'telugu',   code: 'te-IN', label: 'Telugu',   native: 'తెలుగు',   flag: '🇮🇳' },
  { id: 'kannada',  code: 'kn-IN', label: 'Kannada',  native: 'ಕನ್ನಡ',   flag: '🇮🇳' },
  { id: 'malayalam',code: 'ml-IN', label: 'Malayalam',native: 'മലയാളം',   flag: '🇮🇳' },
  { id: 'bengali',  code: 'bn-IN', label: 'Bengali',  native: 'বাংলা',   flag: '🇮🇳' },
  { id: 'gujarati', code: 'gu-IN', label: 'Gujarati', native: 'ગુજરાતી',   flag: '🇮🇳' },
  { id: 'odia',     code: 'or-IN', label: 'Odia',     native: 'ଓଡ଼ିଆ',   flag: '🇮🇳' },
];

// All crops available in LIVE_PRICES, kept in sync automatically
const CROP_OPTIONS = LIVE_PRICES.map(p => p.crop);

// Helper: Estimate price based on crop category if not in database
function estimateCropPrice(crop) {
  const categories = {
    cereals: ['Wheat', 'Rice', 'Maize', 'Barley', 'Sorghum', 'Pearl Millet', 'Finger Millet', 'Oats'],
    pulses: ['Chickpea', 'Pigeon Pea', 'Green Gram', 'Black Gram', 'Red Lentil', 'Horse Gram', 'Moth Bean'],
    oilseeds: ['Soybean', 'Groundnut', 'Mustard', 'Sesame', 'Sunflower', 'Castor', 'Linseed'],
    vegetables: ['Potato', 'Onion', 'Tomato', 'Brinjal', 'Okra', 'Cauliflower', 'Cabbage', 'Green Peas', 'Spinach', 'Bitter Gourd', 'Bottle Gourd', 'Ridge Gourd', 'Pumpkin', 'Carrot', 'Radish', 'Beetroot', 'Cucumber', 'Green Chilli'],
    fruits: ['Banana', 'Mango', 'Apple', 'Orange', 'Grapes', 'Watermelon', 'Pomegranate', 'Papaya', 'Guava'],
    cash: ['Sugarcane', 'Cotton', 'Turmeric', 'Ginger', 'Garlic', 'Black Pepper', 'Cardamom', 'Cinnamon', 'Clove', 'Tea', 'Coffee', 'Jute', 'Tobacco']
  };

  const cat = Object.entries(categories).find(([_, crops]) => crops.some(c => c.toLowerCase() === crop.toLowerCase()));
  if (!cat) return 2000; // default fallback

  const catAverages = {
    cereals: 1800,
    pulses: 6500,
    oilseeds: 7000,
    vegetables: 1500,
    fruits: 3000,
    cash: 5000
  };
  return catAverages[cat[0]] || 2000;
}

// Helper: Get emoji for any crop
function getCropEmoji(crop) {
  const emojiMap = {
    Wheat: '🌾', Rice: '🍚', Maize: '🌽', Barley: '🌾', Sorghum: '🌾',
    'Pearl Millet': '🌾', 'Finger Millet': '🌾', Oats: '🌾',
    Chickpea: '🫛', 'Pigeon Pea': '🫛', 'Green Gram': '🫛', 'Black Gram': '🫛',
    'Red Lentil': '🫘', 'Horse Gram': '🫛', 'Moth Bean': '🫛',
    Soybean: '🫘', Groundnut: '🥜', Mustard: '🟡', Sesame: '🟤', Sunflower: '🌻',
    Castor: '🌱', Linseed: '🌱',
    Potato: '🥔', Onion: '🧅', Tomato: '🍅', Brinjal: '🍆', Okra: '🥬',
    Cauliflower: '🥦', Cabbage: '🥬', 'Green Peas': '🫛', Spinach: '🥬',
    'Bitter Gourd': '🥒', 'Bottle Gourd': '🥒', 'Ridge Gourd': '🥒', Pumpkin: '🎃',
    Carrot: '🥕', Radish: '🥬', Beetroot: '🍎', Cucumber: '🥒', 'Green Chilli': '🌶️',
    Banana: '🍌', Mango: '🥭', Apple: '🍎', Orange: '🍊', Grapes: '🍇',
    Watermelon: '🍉', Pomegranate: '🍎', Papaya: '🍈', Guava: '🍐',
    Sugarcane: '🌿', Cotton: '🌸', Turmeric: '🟡', Ginger: '🫚', Garlic: '🧄',
    'Black Pepper': '🫚', Cardamom: '🌿', Cinnamon: '🪵', Clove: '🌸',
    Tea: '🍵', Coffee: '☕', Jute: '🌿', Tobacco: '🚬'
  };
  return emojiMap[crop] || '🌾';
}



const VOICE_CODE_TO_PICKER_ID = {
  'en-IN': 'english',
  'hi-IN': 'hindi',
  'ta-IN': 'tamil',
  'mr-IN': 'marathi',
  'pa-IN': 'punjabi',
  'bho-IN': 'bhojpuri',
  'mag-IN': 'magahi',
  'mai-IN': 'maithili',
  'te-IN': 'telugu',
  'kn-IN': 'kannada',
  'ml-IN': 'malayalam',
  'bn-IN': 'bengali',
  'gu-IN': 'gujarati',
  'or-IN': 'odia'
};

const PICKER_ID_TO_VOICE_CODE = {
  english: 'en-IN',
  hindi: 'hi-IN',
  tamil: 'ta-IN',
  marathi: 'mr-IN',
  punjabi: 'pa-IN',
  bhojpuri: 'bho-IN',
  magahi: 'mag-IN',
  maithili: 'mai-IN',
  telugu: 'te-IN',
  kannada: 'kn-IN',
  malayalam: 'ml-IN',
  bengali: 'bn-IN',
  gujarati: 'gu-IN',
  odia: 'or-IN'
};



export default function VoiceButton({ onListingPublished }) {
  const { user, profile } = useAuthContext();
  const { uiLanguage, voiceLanguage, changeVoiceLanguage, voiceLocale } = useLanguage();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    listening, transcript, interimTranscript,
    result, setLanguage: setVoiceLanguage, startListening, stopListening,
    error, clearResult
  } = useVoice();

  const [publishing, setPublishing]     = useState(false);
  const [published, setPublished]       = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [publishError, setPublishError] = useState(null);
  const [lastPublished, setLastPublished] = useState(null);

  const [showEdit, setShowEdit]         = useState(false);
  const [mandiPrices, setMandiPrices]   = useState([]);
  const [priceApplyMessage, setPriceApplyMessage] = useState('');
  const [locationError, setLocationError] = useState(null);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);

  // Edit fields
  const [editCrop, setEditCrop]           = useState('');
  const [editCropHindi, setEditCropHindi] = useState('');
  const [editQty, setEditQty]             = useState('');
  const [editUnit, setEditUnit]           = useState('quintal');
  const [editPrice, setEditPrice]         = useState('');
  const [editPriceUnit, setEditPriceUnit] = useState('quintal');
  const [editLocationCity, setEditLocationCity] = useState('');
  const [editLocationState, setEditLocationState] = useState('');
  const [editPhoto, setEditPhoto]         = useState(null);
  const [editGrade, setEditGrade]         = useState('');
  const [editHarvestDate, setEditHarvestDate] = useState('');
  const [editBagCount, setEditBagCount]   = useState('');
  const [editIsOrganic, setEditIsOrganic] = useState(false);
  const [editDeliveryOption, setEditDeliveryOption] = useState('both');

  const priceQuerySpokenRef = useRef('');

  // Derived state
  const parsedPrice = parseFloat(editPrice) || 0;
  const reviewReady = true; // allow publishing even if spaces are blank

  const profileLocation = useMemo(() => (
    findLocationHint(`${profile?.address || ''} ${profile?.state || ''}`)
  ), [profile?.address, profile?.state]);

  const preferredLocation = useMemo(() => {
    if (editLocationCity.trim() || editLocationState.trim()) {
      return {
        district: editLocationCity.trim(),
        state: editLocationState.trim(),
        source: 'manual',
      };
    }

    if (detectedLocation) {
      return detectedLocation;
    }

    return profileLocation;
  }, [detectedLocation, editLocationCity, editLocationState, profileLocation]);

  const priceGuidance = getMandiPriceGuidance({
    crop: editCrop,
    userPrice: parsedPrice,
    userPriceUnit: editPriceUnit,
    profile,
    mandiPrices,
    preferredLocation,
  });

  const selectedLangId = VOICE_CODE_TO_PICKER_ID[voiceLanguage] || 'hindi';
  const selectedLang = VOICE_LANGUAGES.find(l => l.id === selectedLangId) || VOICE_LANGUAGES[0];

  const activePriceQuery = useMemo(() => {
    if (result?.mode !== 'price_query') return null;

    const liveReference = LIVE_PRICES.find((item) => item.crop.toLowerCase() === result.crop.toLowerCase());
    return {
      crop: result.crop,
      cropHindi: result.cropHindi || liveReference?.cropHindi || result.crop,
      transcript: result.transcript || '',
    };
  }, [result]);

  const priceQueryCard = useMemo(() => {
    if (!activePriceQuery) return null;

    const liveReference = LIVE_PRICES.find((item) => item.crop.toLowerCase() === activePriceQuery.crop.toLowerCase());
    const guidance = getMandiPriceGuidance({
      crop: activePriceQuery.crop,
      userPrice: 0,
      userPriceUnit: 'quintal',
      profile,
      mandiPrices,
      preferredLocation,
    });

    // Always have something to show — use LIVE_PRICES as ultimate fallback
    if (!guidance && !liveReference) {
      // Last resort: generate a reasonable estimate based on crop type
      const estimatedPrice = estimateCropPrice(activePriceQuery.crop);
      return {
        crop: activePriceQuery.crop,
        cropHindi: activePriceQuery.cropHindi,
        price: estimatedPrice,
        unit: 'quintal',
        mandi: 'National Average',
        district: preferredLocation?.district || 'India',
        state: preferredLocation?.state || '',
        insight: 'Price estimated based on similar crops. For precise rates, check your local mandi.',
        suggestedPrice: estimatedPrice,
        emoji: getCropEmoji(activePriceQuery.crop),
        change: 'N/A',
        up: true,
      };
    }

    if (!guidance && liveReference) {
      return {
        ...liveReference,
        crop: activePriceQuery.crop,
        cropHindi: activePriceQuery.cropHindi,
        mandi: 'Nearby mandi',
        district: preferredLocation?.district || '',
        state: preferredLocation?.state || '',
        insight: 'Based on national average rates.',
      };
    }

    return {
      ...(liveReference || {}),
      crop: activePriceQuery.crop,
      cropHindi: activePriceQuery.cropHindi,
      price: guidance.marketPrice,
      unit: guidance.unit,
      mandi: guidance.bestMarket.mandi,
      district: guidance.bestMarket.district,
      state: guidance.bestMarket.state,
      insight: guidance.insight,
      suggestedPrice: guidance.suggestedPrice,
      emoji: liveReference?.emoji || getCropEmoji(activePriceQuery.crop),
      change: liveReference?.change || '',
      up: liveReference?.up ?? true,
    };
  }, [activePriceQuery, mandiPrices, preferredLocation, profile]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const qty = parseFloat(editQty) || 0;
    const price = parseFloat(editPrice) || 0;
    const qtyKg = editUnit === 'quintal' ? qty * 100 : qty;
    const pricePerKg = editPriceUnit === 'quintal' ? price / 100 : price;
    return qtyKg * pricePerKg;
  }, [editQty, editUnit, editPrice, editPriceUnit]);

  // parseConfirmation removed — voice confirmation loop eliminated

  const handleSelectLang = async (lang) => {
    const voiceCode = PICKER_ID_TO_VOICE_CODE[lang.id];
    setVoiceLanguage(voiceCode);
    await changeVoiceLanguage(voiceCode);
    setShowLangPicker(false);
  };

  useEffect(() => {
    setVoiceLanguage(voiceLanguage);
  }, [voiceLanguage, setVoiceLanguage]);

  // Removed voice-confirmation useEffect — form shown directly below

  // speakListingSummary and speakConfirmationQuestion removed — manual-only flow

  useEffect(() => {
    const fetchMandiPrices = async () => {
      const { data, error } = await supabase
        .from('mandi_prices')
        .select('*')
        .eq('is_stale', false)
        .order('date', { ascending: false })
        .limit(100);

      if (!error && data && data.length > 0) {
        setMandiPrices(data.map(normalizeMandiEntry));
      } else {
        setMandiPrices(mockMandiPrices);
      }
    };

    fetchMandiPrices().catch(() => setMandiPrices(mockMandiPrices));
  }, []);

  // ── Speak crop price with sweet, caring tone ──
  const speakPrice = useCallback(async (priceData) => {
    // Format today's date nicely
    const today = new Date().toLocaleDateString(
      uiLanguage === 'en' ? 'en-US' : 'hi-IN',
      { day: 'numeric', month: uiLanguage === 'en' ? 'short' : 'long' }
    );

    const locText = formatLocationLabel(priceData) || priceData.mandi || 'भारत में';
    const emoji = priceData.emoji || '🌾';

    // Fetch enriched price data
    const enriched = await getCropPrice(priceData.crop, locText).catch(() => null);

    const min = enriched?.minPrice || Math.round(priceData.price * 0.9);
    const avg = enriched?.avgPrice || priceData.price;
    const max = enriched?.maxPrice || Math.round(priceData.price * 1.1);

    let narrationHi = `नमस्कार दोस्त! ${emoji} आज (${today}) ${locText} में ${priceData.cropHindi || priceData.crop} का भाव:\n`;
    narrationHi += `कनाब: ₹${min.toLocaleString('en-IN')} प्रति क्विंटल\n`;
    narrationHi += `औसत: ₹${avg.toLocaleString('en-IN')} प्रति क्विंटल\n`;
    narrationHi += `उच्चतम: ₹${max.toLocaleString('en-IN')} प्रति क्विंटल\n`;
    narrationHi += `मैं आपको सुझा रही हूँ: ₹${avg.toLocaleString('en-IN')} के आसपास बेचें। कुछ और मदद चाहिए, बताइए! 💖`;

    let narrationEn = `Hello dear! ${emoji} Today (${today}), ${priceData.crop} prices in ${locText}:\n`;
    narrationEn += `Minimum: ₹${min.toLocaleString('en-IN')} per quintal\n`;
    narrationEn += `Average: ₹${avg.toLocaleString('en-IN')} per quintal\n`;
    narrationEn += `Maximum: ₹${max.toLocaleString('en-IN')} per quintal\n`;
    narrationEn += `I'd suggest selling around ₹${avg.toLocaleString('en-IN')}. Is there anything else I can assist you with, sweetie? 💖`;

    // Use global assistantVoice for consistent sweet feminine voice
    if (window.assVoice && window.assVoice.speak) {
      window.assVoice.speak(
        uiLanguage === 'en' ? narrationEn : narrationHi,
        voiceLocale,
        { rate: 0.82, pitch: 1.12, volume: 1.0 }
      );
    } else {
      // Fallback to direct speech synthesis
      const msg = new SpeechSynthesisUtterance(uiLanguage === 'en' ? narrationEn : narrationHi);
      msg.lang = voiceLocale;
      msg.rate = 0.82;
      msg.pitch = 1.12;
      msg.volume = 1.0;

      const trySpeak = () => {
        const voices = window.speechSynthesis.getVoices();
        const langPrefix = voiceLocale.split('-')[0];
        let v = voices.find(v => v.lang === voiceLocale && /female|woman|girl|f/i.test(v.name))
             || voices.find(v => v.lang.startsWith(langPrefix) && /female|woman|girl|f/i.test(v.name))
             || voices.find(v => /female|woman|girl|f/i.test(v.name))
             || voices[0];
        if (v) msg.voice = v;
        window.speechSynthesis.speak(msg);
      };

      setTimeout(() => {
        if (window.speechSynthesis.getVoices().length > 0) trySpeak();
        else {
          window.speechSynthesis.onvoiceschanged = () => {
            trySpeak();
            window.speechSynthesis.onvoiceschanged = null;
          };
        }
      }, 150);
    }
  }, [uiLanguage, voiceLocale]);

  const speakNotFound = useCallback((cropName) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const narrationHi = `अरे ओर सोने! 🌟 मुझे खेद है, लेकिन ${cropName || 'इस फसल'} का भाव अभी तक डाटाबेस में नहीं मिला। क्या आप किसी और फसल के बारे में पूछना चाहेंगे? मैं आपकी मदद करने के लिए यहाँ हूँ! 💐`;
    const narrationEn = `Oh dear! 🌟 I'm sorry, but I don't have pricing data for ${cropName || 'that crop'} yet. Would you like to ask about something else? I'm here to help you! 💐`;

    const msg = new SpeechSynthesisUtterance(uiLanguage === 'en' ? narrationEn : narrationHi);
    msg.lang = voiceLocale;
    msg.rate = 0.82;
    msg.pitch = 1.12;
    msg.volume = 1.0;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = voiceLocale.split('-')[0];
      let v = voices.find(v => v.lang === voiceLocale && /female|woman|girl|f/i.test(v.name))
           || voices.find(v => v.lang.startsWith(langPrefix) && /female|woman|girl|f/i.test(v.name))
           || voices.find(v => /female|woman|girl|f/i.test(v.name))
           || voices[0];
      if (v) msg.voice = v;
      window.speechSynthesis.speak(msg);
    };

    setTimeout(() => {
      if (window.speechSynthesis.getVoices().length > 0) trySpeak();
      else {
        window.speechSynthesis.onvoiceschanged = () => {
          trySpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    }, 150);
  }, [uiLanguage, voiceLocale]);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Location detection is not supported on this device.');
      return;
    }

    setDetectingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = getNearestKnownLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        if (!nearest) {
          setLocationError('Could not match your city. Please type your city manually.');
          setDetectingLocation(false);
          return;
        }

        setDetectedLocation(nearest);
        setEditLocationCity(nearest.district || '');
        setEditLocationState(nearest.state || '');
        setDetectingLocation(false);
      },
      () => {
        setLocationError('Could not detect your location. Please allow location access or type your city manually.');
        setDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  }, []);



  // ── Ensure profile exists before publishing ──
  const ensureProfile = useCallback(async () => {
    if (!user?.id) return false;
    const { data } = await supabase.from('profiles').select('id').eq('id', user.id).single();
    if (data) return true;

    // Profile missing — create it
    const emailPrefix = user.email ? user.email.split('@')[0] : null;
    const { error: insertErr } = await supabase.from('profiles').insert({
      id:        user.id,
      email:     user.email || '',
      full_name: user.user_metadata?.full_name || emailPrefix || 'User',
      username:  emailPrefix || `user_${Date.now()}`,
      role:      'farmer',
    });
    if (insertErr) {
      console.error('Profile creation failed:', insertErr);
      return false;
    }
    return true;
  }, [user]);

  const uploadPhoto = useCallback(async (file) => {
    if (!file) return null;
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2, // ~200kb
        maxWidthOrHeight: 1024,
        useWebWorker: false,
      });
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const { error } = await supabase.storage.from('listings-photos').upload(fileName, compressedFile, {
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });
      if (error) {
        console.error('Photo upload error:', error);
        throw error;
      }
      const { data: { publicUrl } } = supabase.storage.from('listings-photos').getPublicUrl(fileName);
      return publicUrl;
    } catch (err) {
      console.error('Image compression or upload failed', err);
      throw err;
    }
  }, [user]);

  const resetEditFields = useCallback(() => {
    setEditCrop('');
    setEditCropHindi('');
    setEditQty('');
    setEditUnit('quintal');
    setEditPrice('');
    setEditPriceUnit('quintal');
    setEditLocationCity(profileLocation?.district || '');
    setEditLocationState(profileLocation?.state || '');
    setEditPhoto(null);
    setEditGrade('');
    setEditHarvestDate('');
    setEditBagCount('');
    setEditIsOrganic(false);
    setEditDeliveryOption('both');
    setPriceApplyMessage('');
    setLocationError(null);
    setShowEdit(false);
    setPublishError(null);
  }, [profileLocation]);

  const speakConfirmation = useCallback(() => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const lang = voiceLocale.split('-')[0];
    let message = '';
    if (lang === 'hi') {
      message = 'आपका आइटम लिस्ट हो गया है।';
    } else if (lang === 'pa') {
      message = 'ਤੁਹਾਡਾ ਆਈਟਮ ਲਿਸਟ ਹੋ ਗਿਆ ਹੈ।';
    } else if (lang === 'ta') {
      message = 'உங்கள் ஐட்டம் லிஸ்ட் ஆகிவிட்டது.';
    } else if (lang === 'mr') {
      message = 'तुमचा आयटम लिस्ट झाला आहे.';
    } else if (lang === 'kn') {
      message = 'ನಿಮ್ಮ ಐಟಂ ಲಿಸ್ಟ್ ಆಗಿದೆ.';
    } else if (lang === 'te') {
      message = 'మీ ఐటమ్ లిస్ట్ అయింది.';
    } else if (lang === 'ml') {
      message = 'നിങ്ങളുടെ ഐറ്റം ലിസ്റ്റ് ചെയ്തു.';
    } else {
      message = 'Your item has been listed.';
    }
    
    // Use the robust assistantVoice singleton to avoid English TTS glitching on Devanagari/regional scripts
    assistantVoice.speak(message, voiceLocale);
  }, [voiceLocale]);

  const handleClear = useCallback(() => {
    clearResult();
    resetEditFields();
    priceQuerySpokenRef.current = '';
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }, [clearResult, resetEditFields]);

  // ── PUBLISH ──
  const handlePublish = async (dataOrEvent = null) => {
    if (!user) { navigate('/login'); return; }

    // If the argument has a 'target', it's a browser event, not auto-data
    const autoData = (dataOrEvent && !dataOrEvent.target) ? dataOrEvent : null;

    const cropName = autoData ? autoData.cropName : editCrop.trim();
    const qty      = autoData ? autoData.qty : (parseFloat(editQty) || 0);
    const price    = autoData ? autoData.price : (parseFloat(editPrice) || 0);
    const unitVal  = autoData ? autoData.unitVal : (editUnit === 'kg' ? 'kg' : 'quintal');       
    const priceU   = autoData ? autoData.priceU : (editPriceUnit === 'kg' ? 'kg' : 'quintal');  

    // Ensure we have a crop name
    const finalCropName = cropName || 'Produce';
    const finalCropHindi = autoData ? autoData.cropNameHindi : ((editCropHindi && editCropHindi.trim()) || 'फसल');
    const finalLocation = [
      autoData?.location || '',
      autoData ? '' : editLocationCity.trim(),
      autoData ? '' : editLocationState.trim(),
    ].filter(Boolean).join(', ') || `${profile?.address || ''}${profile?.state ? `${profile?.address ? ', ' : ''}${profile.state}` : ''}` || null;
    // Removed strict quantity/price checks to allow publishing with blank spaces
    
    setPublishing(true);
    setPublishError(null);

    // Ensure profile exists (handles edge case where trigger didn't fire)
    const profileOk = await ensureProfile();
    if (!profileOk) {
      setPublishError('❌ Account setup failed. Please re-login and try again.');
      setPublishing(false);
      return;
    }

    // Upload photo if provided
    let photoUrl = null;
    if (editPhoto) {
      try {
        photoUrl = await uploadPhoto(editPhoto);
      } catch {
        setPublishError('❌ Photo upload failed. Please try again.');
        setPublishing(false);
        return;
      }
    }

    const safeBagCount = editBagCount && !isNaN(parseInt(editBagCount)) ? parseInt(editBagCount) : null;

    const insertData = {
      user_id:         user.id,
      crop_name:       finalCropName,
      crop_name_hindi: finalCropHindi,
      quantity:        qty,
      unit:            unitVal,
      price_per_unit:  price,
      price_unit:      priceU,
      voice_transcript: transcript || null,
      location:        finalLocation,
      status:          'available',
      is_approved:     true,
      photo_url:       photoUrl,
      grade:           editGrade || null,
      harvest_date:    editHarvestDate || null,
      bag_count:       safeBagCount,
      is_organic:      Boolean(editIsOrganic),
      delivery_option: editDeliveryOption || 'both',
    };

    console.log('Publishing listing:', insertData);

    const { data, error: insertError } = await supabase
      .from('listings')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Listing insert error:', insertError);
      let msg = insertError.message || 'Unknown error';
      // User-friendly messages
      if (msg.includes('violates foreign key')) {
        msg = 'Account not set up properly. Please logout, login again, and try.';
      } else if (msg.includes('violates check constraint')) {
        msg = 'Invalid unit value. Use kg or quintal only.';
      } else if (msg.includes('null value in column')) {
        msg = 'Missing required field. Please fill all fields and try again.';
      }
      setPublishError('❌ ' + msg);
      setPublishing(false);
      return;
    }

    console.log('Published successfully:', data);
    setLastPublished({ ...insertData, id: data.id });
    speakConfirmation();
    setPublished(true);
    setPublishing(false);
    if (onListingPublished) onListingPublished();

    setTimeout(() => {
      setPublished(false);
      setLastPublished(null);
      clearResult();
      resetEditFields();
    }, 8000);
  };

  const applyListingResult = useCallback((nextResult) => {
    priceQuerySpokenRef.current = '';
    setEditCrop(nextResult.crop || '');
    setEditCropHindi(nextResult.cropHindi || '');
    setEditQty(String(nextResult.quantity || ''));
    setEditUnit(nextResult.unit || 'quintal');
    setEditPrice(String(nextResult.price || ''));
    setEditPriceUnit(nextResult.priceUnit || 'quintal');
    setEditGrade(nextResult.grade || '');
    setShowEdit(true);
    setPublishError(null);
    setPriceApplyMessage('');
  }, []);

  // ── Speak function for TTS with feminine voice ──
  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = voiceLocale;
    msg.rate = 0.82;
    msg.pitch = 1.1;
    msg.volume = 1;

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const langPrefix = voiceLocale.split('-')[0];
      let v = voices.find(v => v.lang === voiceLocale && /female|woman|girl|f/i.test(v.name));
      if (!v) v = voices.find(v => v.lang.startsWith(langPrefix) && /female|woman|girl|f/i.test(v.name));
      if (!v) v = voices.find(v => /female|woman|girl|f/i.test(v.name));
      if (!v) v = voices[0];
      if (v) msg.voice = v;
      window.speechSynthesis.speak(msg);
    };

    setTimeout(() => {
      if (window.speechSynthesis.getVoices().length > 0) trySpeak();
      else {
        window.speechSynthesis.onvoiceschanged = () => {
          trySpeak();
          window.speechSynthesis.onvoiceschanged = null;
        };
      }
    }, 150);
  }, [voiceLocale]);

  // ── Handle navigation commands ──
  const handleNavigationCommand = useCallback((target) => {
    const routes = {
      settings: '/settings',
      profile: '/profile',
      listing: '/search',
      login: '/login',
      dashboard: '/dashboard',
      home: '/',
      search: '/search',
    };
    
    if (routes[target]) {
      speak(`आपके ${target} पेज पर ले जा रहा हूँ।`);
      setTimeout(() => navigate(routes[target]), 1000);
    }
  }, [navigate, speak]);

  // ── Handle control commands ──
  const handleControlCommand = useCallback((action, target) => {
    const actionText = {
      enable: 'ऑन कर दिया गया है',
      disable: 'ऑफ कर दिया गया है',
      toggle: 'टॉगल कर दिया गया है',
    };
    
    speak(`${target} सेटिंग ${actionText[action]}।`);
    // Here you can integrate with actual settings state when available
  }, [speak]);

  // ── Handle help commands ──
  const handleHelpCommand = useCallback((topic) => {
    const helpResponses = {
      profile_photo: 'प्रोफाइल फोटो बदलने के लिए प्रोफाइल पेज पर जाएं और कैमरा आइकन पर क्लिक करें।',
      listing_guide: 'आइटम लिस्ट करने के लिए माइक पर क्लिक करें और अपनी फसल का नाम, मात्रा और कीमत बताएं।',
      login_guide: 'लॉगिन करने के लिए लॉगिन पेज पर जाएं और अपना फोन नंबर डालें। ओटीपी के साथ लॉगिन करें।',
      logout_guide: 'लॉगआउट करने के लिए प्रोफाइल पेज पर जाएं और नीचे लॉगआउट बटन पर क्लिक करें।',
      settings_guide: 'सेटिंग्स खोलने के लिए हेडर में सेटिंग्स आइकन पर क्लिक करें।',
      general: 'मैं आपकी मदद कर सकता हूँ। आप मुझसे फसल के भाव, लिस्टिंग, सेटिंग्स और अन्य के बारे में पूछ सकते हैं।',
    };
    
    speak(helpResponses[topic] || helpResponses.general);
  }, [speak]);



  // ── Sync voice result → edit fields OR handle price query ──
  useEffect(() => {
    if (!result) return;
    
    startTransition(() => {
      if (result.mode === 'price_query') {
        // Price query handled by other effect
        return;
      } else if (result.mode === 'navigation') {
        handleNavigationCommand(result.target);
      } else if (result.mode === 'control') {
        handleControlCommand(result.action, result.target);
      } else if (result.mode === 'help') {
        handleHelpCommand(result.topic);
      } else {
        applyListingResult(result);
      }
    });
  }, [applyListingResult, result, handleNavigationCommand, handleControlCommand, handleHelpCommand]);

  useEffect(() => {
    if (!activePriceQuery) return;

    const requestKey = `${activePriceQuery.crop}:${activePriceQuery.transcript}`;
    if (priceQuerySpokenRef.current === requestKey) return;

    if (priceQueryCard) {
      speakPrice(priceQueryCard);
    } else {
      speakNotFound(activePriceQuery.cropHindi || activePriceQuery.crop);
    }

    priceQuerySpokenRef.current = requestKey;
  }, [activePriceQuery, priceQueryCard, speakNotFound, speakPrice]);

  const handleMicPress = () => {
    if (listening) {
      stopListening();
      return;
    }

    handleClear();
    startListening();
  };

  const applyGuidancePrice = (mode) => {
    if (!priceGuidance) return;

    const nextPrice = mode === 'market' ? priceGuidance.marketPrice : priceGuidance.suggestedPrice;
    const message = mode === 'market'
      ? `Live mandi price applied from ${priceGuidance.bestMarket.mandi}.`
      : `Suggested price applied for ${formatLocationLabel(priceGuidance.bestMarket) || priceGuidance.bestMarket.mandi}.`;

    setEditPrice(String(nextPrice));
    setEditPriceUnit(priceGuidance.unit);
    setPriceApplyMessage(message);
  };



  const displayTranscript = interimTranscript || transcript;

  return (
    <div className="flex flex-col items-center my-4">

      {/* ── Language Picker ── */}
      <div className="relative mb-5 w-full max-w-sm">
        <button
          onClick={() => setShowLangPicker(!showLangPicker)}
          className="flex items-center gap-2 w-full bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 hover:border-primary transition-colors"
        >
          <Globe size={15} className="text-primary shrink-0" />
          <span className="font-semibold">{selectedLang.flag} {selectedLang.label}</span>
          <span className="text-gray-400 text-xs">/ {selectedLang.native}</span>
          <span className="ml-auto text-gray-400 text-xs">▾</span>
        </button>
        {showLangPicker && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-xl z-30 overflow-hidden">
            {VOICE_LANGUAGES.map(lang => (
              <button
                key={lang.id}
                onClick={() => handleSelectLang(lang)}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm hover:bg-green-50 transition-colors border-b border-gray-50 last:border-0 ${selectedLangId === lang.id ? 'text-primary font-bold bg-green-50' : 'text-gray-700'}`}
              >
                <div className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </div>
                <span className="text-xs text-gray-400">{lang.native}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative group">
        <button
          onClick={handleMicPress}
          disabled={published || publishing}
          className={`relative flex items-center justify-center rounded-full w-28 h-28 text-white transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed ${
            listening
              ? 'bg-red-500 shadow-red-200 shadow-2xl scale-110 z-20'
              : 'bg-green-600 hover:bg-green-700 shadow-green-200 hover:scale-105 animate-pulse-green'
          }`}
        >
          {listening ? <MicOff size={44} className="animate-pulse" /> : <Mic size={44} />}
          {listening && <span className="absolute -inset-4 rounded-full border-4 border-red-300 animate-ping opacity-30" />}
        </button>


      </div>

      {/* ── Status Text ── */}
      <div className="text-center mt-4">
        {listening ? (
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex gap-1 items-end h-5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-1 bg-red-400 rounded-full animate-bounce"
                  style={{ height: `${8 + (i % 3) * 7}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <p className="text-red-500 text-sm font-semibold">{t('voice.listening')}</p>
            <p className="text-gray-400 text-xs">{t('voice.autoStop')}</p>
          </div>
        ) : !result && (
          <div>
            <p className="text-gray-700 font-semibold text-sm">{t('voice.tapSpeak')}</p>
            <p className="text-gray-400 text-xs mt-0.5">{t('voice.tapSpeakHi')}</p>
            <p className="text-gray-300 text-[10px] mt-1.5 bg-gray-50 px-3 py-1 rounded-full inline-block">
              {t('voice.example')}
            </p>
          </div>
        )}
      </div>

      {/* ── Live Interim Transcript ── */}
      {displayTranscript && !result && (
        <div className="mt-12 w-full max-w-sm bg-white border border-gray-100 rounded-3xl p-5 text-center shadow-xl animate-fade-in relative overflow-hidden">
          {!listening && <div className="absolute top-0 left-0 h-1 bg-primary animate-shimmer w-full" />}
          <p className="text-[10px] text-primary uppercase tracking-widest mb-2 font-black flex items-center justify-center gap-2">
            {!listening ? <Loader2 size={12} className="animate-spin" /> : <span>🎙</span>}
            {!listening ? 'Processing / विश्लेषण...' : t('voice.heard')}
          </p>
          <p className={`text-base font-bold leading-relaxed ${!listening ? 'text-gray-900' : 'text-gray-400 italic'}`}>
            "{displayTranscript}"
          </p>
          {!listening && <p className="text-[10px] text-gray-400 mt-3 animate-pulse font-medium">Please wait while I parse the details...</p>}
        </div>
      )}

      {/* ── Error ── */}
      {error && !result && (
        <div className="mt-4 w-full max-w-sm bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-2">
          <XCircle size={16} className="text-red-400 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {/* ── PRICE QUERY RESULT ── */}
      {result && result.mode === 'price_query' && !published && (
        <div className="mt-5 w-full max-w-sm animate-fade-in-scale">
          {priceQueryCard ? (
            <div className="bg-white border border-green-200 rounded-2xl p-5 shadow-lg">
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                  <TrendingUp size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('voice.livePrice')}</p>
                  <p className="text-[10px] text-gray-400">{t('voice.livePriceHi')}</p>
                </div>
                <div className="ml-auto">
                  <span className="text-[10px] text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">● LIVE</span>
                </div>
              </div>

              {/* Price Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-5 text-center mb-4">
                <span className="text-4xl">{priceQueryCard.emoji}</span>
                <h3 className="font-black text-gray-900 text-xl mt-2">{priceQueryCard.crop}</h3>
                <p className="text-sm text-gray-500">{priceQueryCard.cropHindi}</p>
                <p className="text-3xl font-black text-primary mt-3">₹{priceQueryCard.price.toLocaleString('en-IN')}</p>
                <p className="text-xs text-gray-500 mt-1">per {priceQueryCard.unit} / प्रति {priceQueryCard.unit === 'quintal' ? 'क्विंटल' : 'किलो'}</p>
                <p className="mt-3 text-xs font-semibold text-green-800">
                  {priceQueryCard.mandi}
                  {formatLocationLabel(priceQueryCard) ? ` • ${formatLocationLabel(priceQueryCard)}` : ''}
                </p>
                {priceQueryCard.change && (
                  <div className="mt-3 inline-flex items-center gap-1">
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${priceQueryCard.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {priceQueryCard.up ? '▲' : '▼'} {priceQueryCard.change}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3">
                <div className="flex items-start gap-2">
                  <MapPin size={15} className="text-gray-500 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Price Location</p>
                    <p className="text-sm font-semibold text-gray-800">
                      {formatLocationLabel(preferredLocation) || formatLocationLabel(priceQueryCard) || 'Nearby mandi rate'}
                    </p>
                    {priceQueryCard.insight && (
                      <p className="mt-1 text-[11px] text-gray-500">{priceQueryCard.insight}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Voice indicator */}
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl p-3">
                <Volume2 size={16} className="text-blue-500 animate-pulse" />
                <p className="text-xs text-blue-700 font-medium">
                  {t('voice.speakingPrice')}
                </p>
              </div>

              {/* Action buttons */}
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => speakPrice(priceQueryCard)}
                  className="flex items-center justify-center gap-1.5 bg-primary text-white py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  <Volume2 size={14} /> {t('voice.repeat')}
                </button>
                <button
                  onClick={detectLocation}
                  disabled={detectingLocation}
                  className="flex items-center justify-center gap-1.5 border border-green-200 text-green-700 py-2.5 rounded-xl font-medium text-sm hover:bg-green-50 transition-colors disabled:opacity-60"
                >
                  {detectingLocation ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                  Detect My Location
                </button>
                <button
                  onClick={() => {
                    setEditCrop(priceQueryCard.crop);
                    setEditCropHindi(priceQueryCard.cropHindi);
                    setEditPrice(String(priceQueryCard.price));
                    setEditPriceUnit(priceQueryCard.unit);
                    setEditLocationCity(priceQueryCard.district || preferredLocation?.district || '');
                    setEditLocationState(priceQueryCard.state || preferredLocation?.state || '');
                    setShowEdit(true);
                    setPriceApplyMessage(`Live mandi price added from ${priceQueryCard.mandi}.`);
                    clearResult();
                  }}
                  className="flex items-center justify-center gap-1.5 border border-primary text-primary py-2.5 rounded-xl font-medium text-sm hover:bg-sky-50 transition-colors"
                >
                  Use This Price
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-500 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  🎙 {t('voice.askAgain')}
                </button>
              </div>

              {locationError && (
                <p className="mt-3 text-xs text-red-600 font-medium">{locationError}</p>
              )}
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
              <p className="text-3xl mb-2">🔍</p>
              <p className="font-bold text-amber-800">{t('voice.priceNotAvailable')}</p>
              <p className="text-xs text-amber-600 mt-1">{t('voice.priceNotAvailableDesc', { crop: result.cropHindi || result.crop })}</p>
              <button
                onClick={handleClear}
                className="mt-3 text-xs text-amber-700 font-semibold underline"
              >
                {t('voice.tryAgain')}
              </button>
            </div>
          )}
        </div>
      )}




      {/* ── SUCCESS / VICTORY CARD ── */}
      {published && lastPublished && (
        <div className="mt-5 w-full max-w-sm animate-bounce-in">
          <div className="bg-white border-2 border-green-500 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500" />
            
            {/* Victory Header */}
            <div className="pt-6 pb-4 px-6 text-center bg-green-50">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md border-2 border-green-200">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <h3 className="text-xl font-black text-gray-900 leading-tight">Crop Listed!</h3>
              <p className="text-xs font-bold text-green-700 mt-1">आपकी फसल सफलतापूर्वक लिस्ट हो गई है</p>
            </div>

            {/* Photo Preview in Success Card */}
            {lastPublished.photo_url && (
              <div className="h-40 w-full relative">
                <img 
                  src={lastPublished.photo_url} 
                  alt="Success" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            )}

            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Crop / फसल</p>
                  <p className="font-black text-gray-900 text-lg">{lastPublished.crop_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price / भाव</p>
                  <p className="font-black text-primary text-lg">₹{lastPublished.price_per_unit}/{lastPublished.price_unit}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <Volume2 size={18} className="text-blue-500 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-xs text-blue-800 font-medium leading-relaxed">
                  Your item is now live and buyers can see it. Start the mic again only when you want to list the next item.
                </p>
              </div>

              <button
                onClick={() => {
                  setPublished(false);
                  setLastPublished(null);
                }}
                className="mt-5 w-full bg-gray-900 text-white p-4 rounded-2xl font-bold text-sm shadow-xl hover:bg-black transition-all active:scale-95"
              >
                List Another Item / एक और लिस्ट करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          LISTING DETAILS / MANUAL EDIT FORM ── */}
      {showEdit && !published && (
        <div className="mt-5 w-full max-w-sm bg-white/95 backdrop-blur-md border border-white/60 rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-fade-in-scale">
          <h3 className="text-sm font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">
            ✏️ Review & Edit Details / विवरण जांचें और बदलें
          </h3>

          {/* Summary strip always visible */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 mb-4 border border-green-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">{editCrop && LIVE_PRICES.find(p => p.crop === editCrop)?.emoji || '🌾'}</span>
              <div>
                <p className="font-bold text-gray-900 text-sm">{editCrop || '—'} {editCropHindi && <span className="text-gray-400 font-normal text-xs">({editCropHindi})</span>}</p>
                <p className="text-xs text-gray-500">{editQty || '—'} {editUnit} · ₹{editPrice || '0'}/{editPriceUnit}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 uppercase">Total</p>
              <p className="font-black text-primary">₹{totalPrice.toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600">Price Location</p>
                <p className="text-[11px] text-gray-500">Use your city to match the nearest mandi rate</p>
              </div>
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:opacity-60"
              >
                {detectingLocation ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
                Detect
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <input
                type="text"
                value={editLocationCity}
                onChange={(e) => {
                  setEditLocationCity(e.target.value);
                  setPriceApplyMessage('');
                }}
                placeholder="City / District"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-white"
              />
              <input
                type="text"
                value={editLocationState}
                onChange={(e) => {
                  setEditLocationState(e.target.value);
                  setPriceApplyMessage('');
                }}
                placeholder="State"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-white"
              />
            </div>

            <p className="mt-2 text-[11px] text-gray-500">
              Current location: {formatLocationLabel(preferredLocation) || 'Not selected yet'}
            </p>
            {locationError && <p className="mt-1 text-xs text-red-600 font-medium">{locationError}</p>}
            {priceApplyMessage && <p className="mt-1 text-xs text-green-700 font-medium">{priceApplyMessage}</p>}
          </div>

          {priceGuidance && (
            <div className="mb-4 rounded-2xl border border-green-100 bg-green-50 p-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-green-700" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-green-700">Mandi Price Guidance</p>
                  <p className="text-[11px] text-green-600">जिले और मंडी के आधार पर सुझाया गया भाव</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Best Match</p>
                  <p className="mt-1 text-sm font-bold text-gray-900">{priceGuidance.bestMarket.mandi}</p>
                  <p className="text-[11px] text-gray-500">
                    {[priceGuidance.bestMarket.district, priceGuidance.bestMarket.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <div className="rounded-xl bg-white p-3 shadow-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Local Modal Price</p>
                  <p className="mt-1 text-lg font-black text-primary">₹{priceGuidance.marketPrice}</p>
                  <p className="text-[11px] text-gray-500">per {priceGuidance.unit}</p>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-white p-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Suggested Sell Band</p>
                <p className="mt-1 text-sm font-bold text-gray-900">
                  ₹{priceGuidance.suggestedMin} - ₹{priceGuidance.suggestedMax} / {priceGuidance.unit}
                </p>
                <p className="mt-1 text-xs text-gray-500">{priceGuidance.insight}</p>
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => applyGuidancePrice('market')}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-500 transition-colors"
                >
                  Use Mandi Price
                </button>
              </div>
            </div>
          )}

          {/* ── Fields ── */}
          <div className="space-y-3 mb-4">

            {/* Crop */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Crop / फसल</label>
              {showEdit ? (
                <div className="flex gap-2">
                  <select
                    value={editCrop}
                    onChange={e => {
                      const val = e.target.value;
                      setEditCrop(val);
                      setPriceApplyMessage('');
                      const found = LIVE_PRICES.find(p => p.crop === val);
                      if (found) setEditCropHindi(found.cropHindi);
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                  >
                    <option value="">-- Select Crop --</option>
                    {Array.from(new Set([...CROP_OPTIONS, editCrop])).filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input
                    type="text"
                    value={editCropHindi}
                    onChange={e => {
                      setEditCropHindi(e.target.value);
                      setPriceApplyMessage('');
                    }}
                    placeholder="हिंदी नाम"
                    className="w-24 border border-gray-200 rounded-xl px-2 py-2 text-xs outline-none focus:border-primary bg-gray-50"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-lg">{editCrop || '—'}</span>
                  {editCropHindi && <span className="text-gray-400 text-sm">{editCropHindi}</span>}
                </div>
              )}
            </div>

            {/* Quantity + Unit */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Quantity / मात्रा</label>
              {showEdit ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={editQty}
                    onChange={e => {
                      setEditQty(e.target.value);
                      setPriceApplyMessage('');
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                    placeholder="e.g. 10"
                  />
                  <select
                    value={editUnit}
                    onChange={e => {
                      setEditUnit(e.target.value);
                      setPriceApplyMessage('');
                    }}
                    className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                  >
                    <option value="quintal">Quintal</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              ) : (
                <span className="font-bold text-gray-900">{editQty || '—'} {editUnit}</span>
              )}
            </div>

            {/* Price */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Price / मूल्य (₹)</label>
              {showEdit ? (
                <div className="flex gap-2 items-center">
                  <span className="text-gray-500 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={editPrice}
                    onChange={e => {
                      setEditPrice(e.target.value);
                      setPriceApplyMessage('');
                    }}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                    placeholder="e.g. 2000"
                  />
                  <span className="text-gray-400 text-xs">per</span>
                  <select
                    value={editPriceUnit}
                    onChange={e => {
                      setEditPriceUnit(e.target.value);
                      setPriceApplyMessage('');
                    }}
                    className="border border-gray-200 rounded-xl px-2 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                  >
                    <option value="quintal">quintal</option>
                    <option value="kg">kg</option>
                  </select>
                </div>
              ) : (
                <span className="font-bold text-primary text-lg">₹{editPrice || '0'}
                  <span className="text-xs font-normal text-gray-500"> /{editPriceUnit}</span>
                </span>
              )}
            </div>

            {/* Photo Upload — always visible */}
            <div>
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Photo / फोटो (optional)</label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditPhoto(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="flex items-center gap-2 px-3 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm font-semibold bg-gray-50 hover:bg-green-50 hover:border-green-300 cursor-pointer transition-colors flex-1"
                >
                  <Camera size={16} className={editPhoto ? 'text-green-500' : 'text-gray-400'} />
                  <span className={editPhoto ? 'text-green-700' : 'text-gray-500'}>{editPhoto ? editPhoto.name : 'Add a photo of your crop / फसल की फोटो'}</span>
                </label>
                {editPhoto && (
                  <button
                    onClick={() => setEditPhoto(null)}
                    className="text-red-400 text-xs font-semibold hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    ✕
                  </button>
                )}
              </div>
              {editPhoto && (
                <div className="mt-2 rounded-xl overflow-hidden border border-green-200">
                  <img src={URL.createObjectURL(editPhoto)} alt="preview" className="w-full h-28 object-cover" />
                </div>
              )}
            </div>

            {/* Quality Details */}
            <div className="border-t border-gray-200 pt-3 mt-1">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Quality Details / गुणवत्ता विवरण</p>

              {/* Grade */}
              <div className="mb-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Grade / ग्रेड</label>
                {showEdit ? (
                  <select
                    value={editGrade}
                    onChange={e => setEditGrade(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                  >
                    <option value="">Select Grade</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="Premium">Premium</option>
                  </select>
                ) : (
                  <span className="font-bold text-gray-900">{editGrade || '—'}</span>
                )}
              </div>

              {/* Harvest Date */}
              <div className="mb-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Harvest Date / कटाई तारीख</label>
                {showEdit ? (
                  <input
                    type="date"
                    value={editHarvestDate}
                    onChange={e => setEditHarvestDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                  />
                ) : (
                  <span className="font-bold text-gray-900">{editHarvestDate || '—'}</span>
                )}
              </div>

              {/* Bag Count */}
              <div className="mb-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Bag Count / बोरे की संख्या</label>
                {showEdit ? (
                  <input
                    type="number"
                    min="1"
                    value={editBagCount}
                    onChange={e => setEditBagCount(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                    placeholder="e.g. 10"
                  />
                ) : (
                  <span className="font-bold text-gray-900">{editBagCount || '—'}</span>
                )}
              </div>

              {/* Organic */}
              <div className="mb-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Organic / जैविक</label>
                {showEdit ? (
                  <select
                    value={editIsOrganic ? 'yes' : 'no'}
                    onChange={e => setEditIsOrganic(e.target.value === 'yes')}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                ) : (
                  <span className="font-bold text-gray-900">{editIsOrganic ? 'Yes' : 'No'}</span>
                )}
              </div>

              {/* Delivery Option */}
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Delivery / Delivery Option</label>
                {showEdit ? (
                  <select
                    value={editDeliveryOption}
                    onChange={e => setEditDeliveryOption(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-primary bg-gray-50"
                  >
                    <option value="pickup">Pickup Only</option>
                    <option value="delivery">Delivery Only</option>
                    <option value="both">Both</option>
                  </select>
                ) : (
                  <span className="font-bold text-gray-900">{editDeliveryOption === 'pickup' ? 'Pickup Only' : editDeliveryOption === 'delivery' ? 'Delivery Only' : 'Both'}</span>
                )}
              </div>
            </div>
          </div>

          {/* Transcript */}
          {transcript && (
            <div className="bg-gray-50 rounded-xl p-2.5 mb-3">
              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Voice Transcript</p>
              <p className="text-xs text-gray-600 italic">"{transcript}"</p>
            </div>
          )}

          {/* Low confidence warning */}
          {result?.confidence === 'low' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-3 text-xs text-amber-700 font-medium">
              ⚠️ Crop wasn't clearly detected — please tap Edit and select the crop before publishing
            </div>
          )}

          {/* Publish error */}
          {publishError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-3 text-xs text-red-600 font-semibold flex items-start gap-2">
              <XCircle size={14} className="mt-0.5 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => handlePublish()}
              disabled={publishing || !reviewReady}
              className="btn-3d flex-1 text-white py-3.5 rounded-xl font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #166534)' }}
            >
              {publishing ? (
                <><Loader2 size={16} className="animate-spin" /> Publishing… प्रकाशित हो रहा…</>
              ) : !reviewReady ? (
                <><Edit3 size={16} /> Complete Details to Publish / पहले विवरण पूरा करें</>
              ) : !user ? (
                <><LogIn size={16} /> Confirm & Login to Publish / लॉगिन करके प्रकाशित करें</>
              ) : (
                <><CheckCircle size={16} /> Publish / प्रकाशित करें</>
              )}
            </button>
            <button
              onClick={handleClear}
              className="btn-3d flex-1 border-2 border-red-200 text-red-600 py-3.5 rounded-xl font-bold shadow-md hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <XCircle size={16} /> Cancel / रद्द करें
            </button>
          </div>
          <button
            onClick={handleClear}
            className="w-full border border-gray-200 text-gray-500 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm mt-2"
          >
            🎙 Try Again / फिर से बोलें
          </button>
        </div>
      )}
    </div>
  );
}
