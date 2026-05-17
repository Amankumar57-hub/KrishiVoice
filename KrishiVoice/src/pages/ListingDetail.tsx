import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import ContactModal from '../components/ContactModal';
import {
  ArrowLeft, Phone, Truck, MapPin, Calendar, Leaf,
  Package, Droplets, Star, CheckCircle, Loader2,
  Scale, ShoppingBag, Share2
} from 'lucide-react';

const EMOJI_MAP: Record<string, string> = {
  Wheat: '🌾', Rice: '🍚', Maize: '🌽', Corn: '🌽',
  Soybean: '🌱', Mustard: '🟡', Chickpea: '🟤',
  Potato: '🥔', Tomato: '🍅', Onion: '🧅', Cotton: '🌸',
  Sugarcane: '🌿', Groundnut: '🥜', Lentil: '🫘',
  Garlic: '🧄', Ginger: '🫚', Turmeric: '🌿',
};

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-100 text-green-800',
  B: 'bg-blue-100 text-blue-800',
  C: 'bg-yellow-100 text-yellow-800',
  Premium: 'bg-purple-100 text-purple-800',
  Standard: 'bg-gray-100 text-gray-700',
};

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('listings')
        .select('*, profiles:user_id(full_name, username, phone, whatsapp, email, address, state, avatar_url, role)')
        .eq('id', id)
        .single();
      if (err || !data) {
        setError('Listing not found / सूची नहीं मिली');
      } else {
        setListing(data);
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-body)' }}>
      <Loader2 size={36} className="animate-spin text-primary" />
    </div>
  );

  if (error || !listing) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ backgroundColor: 'var(--bg-body)' }}>
      <span className="text-5xl">😕</span>
      <p className="font-bold text-gray-700">{error || 'Listing not found'}</p>
      <button onClick={() => navigate(-1)} className="text-primary font-semibold flex items-center gap-2">
        <ArrowLeft size={16} /> Go Back
      </button>
    </div>
  );

  const crop      = listing.crop_name || 'Produce';
  const cropHindi = listing.crop_name_hindi || '';
  const qty       = listing.quantity || 0;
  const unit      = listing.unit || 'kg';
  const price     = listing.price_per_unit || 0;
  const priceUnit = listing.price_unit || unit;
  const seller    = listing.profiles?.full_name || listing.profiles?.username || 'Farmer';
  const avatarUrl = listing.profiles?.avatar_url || null;
  const location  = listing.location || listing.address || '';
  const state     = listing.profiles?.state || '';
  const status    = listing.status || 'available';
  const icon      = EMOJI_MAP[crop] || '🌾';
  const totalValue = qty && price ? (
    unit === 'quintal' && priceUnit === 'kg'
      ? qty * 100 * price
      : unit === 'kg' && priceUnit === 'quintal'
      ? (qty / 100) * price
      : qty * price
  ) : 0;

  const statusMap: Record<string, { bg: string; text: string; dot: string; label: string; labelHi: string }> = {
    available:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', label: 'Available', labelHi: 'उपलब्ध' },
    sold:       { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', label: 'Sold',      labelHi: 'बिक चुका' },
    in_transit: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6', label: 'In Transit', labelHi: 'परिवहन में' },
  };
  const statusStyle = statusMap[status] || statusMap.available;

  const deliveryLabel: Record<string, string> = {
    pickup: '📍 Farm Pickup Only',
    delivery: '🚚 Delivery Available',
    both: '✅ Pickup & Delivery',
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${crop} - KrishiVoice`, url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied!');
    }
  };

  const normalized = {
    ...listing,
    crop, cropHindi, qty, unit, price, priceUnit, seller, status,
    location: [location, state].filter(Boolean).join(', '),
    phone: listing.phone || listing.profiles?.phone || '',
    whatsapp: listing.whatsapp || listing.profiles?.whatsapp || '',
    email: listing.profiles?.email || '',
    address: listing.address || listing.profiles?.address || '',
    profiles: listing.profiles,
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-body)' }}>

      {/* ── Hero Section ── */}
      <div className="relative w-full bg-gradient-to-br from-green-800 to-green-600 overflow-hidden" style={{ minHeight: 260 }}>
        {/* Back + Share */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            onClick={handleShare}
            className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors"
          >
            <Share2 size={18} />
          </button>
        </div>

        {/* Photo or emoji fallback */}
        {listing.photo_url && !imgError ? (
          <img
            src={listing.photo_url}
            alt={crop}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover absolute inset-0"
            style={{ minHeight: 260 }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-9xl opacity-60 select-none">{icon}</span>
          </div>
        )}

        {/* Overlay gradient for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Crop Info */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-5 text-white">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black leading-none">{crop}</h1>
              {cropHindi && <p className="text-green-200 text-sm font-semibold mt-0.5" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>{cropHindi}</p>}
            </div>
            <span
              className="text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 mb-1"
              style={{ background: statusStyle.bg + 'dd', color: statusStyle.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle.dot }} />
              {statusStyle.label} · {statusStyle.labelHi}
            </span>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* Price + Quantity card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
            <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Price / मूल्य</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-green-700">₹{price.toLocaleString('en-IN')}</span>
              <span className="text-gray-500 font-semibold">/ {priceUnit}</span>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-gray-100 px-0 py-0">
            <div className="p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Quantity</p>
              <p className="font-black text-gray-900 text-lg leading-none">{qty}</p>
              <p className="text-xs text-gray-500 font-medium">{unit} · मात्रा</p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Total Value</p>
              <p className="font-black text-primary text-lg leading-none">₹{totalValue.toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 font-medium">est. · अनुमानित</p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Bag Count</p>
              <p className="font-black text-gray-900 text-lg leading-none">{listing.bag_count ?? '—'}</p>
              <p className="text-xs text-gray-500 font-medium">bags · बोरे</p>
            </div>
          </div>
        </div>

        {/* Quality Details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Quality Details / गुणवत्ता विवरण</p>
          <div className="grid grid-cols-2 gap-3">

            {/* Grade */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-white flexshrink-0 flex items-center justify-center shadow-sm border border-gray-100">
                <Star size={16} className="text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Grade</p>
                {listing.grade ? (
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${GRADE_COLORS[listing.grade] || 'bg-gray-100 text-gray-700'}`}>
                    {listing.grade}
                  </span>
                ) : <p className="text-sm font-semibold text-gray-400 italic">Not set</p>}
              </div>
            </div>

            {/* Moisture */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-white shrink-0 flex items-center justify-center shadow-sm border border-gray-100">
                <Droplets size={16} className="text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Moisture</p>
                <p className="text-sm font-black text-gray-800">
                  {listing.moisture != null ? `${listing.moisture}%` : '—'}
                </p>
              </div>
            </div>

            {/* Organic */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-white shrink-0 flex items-center justify-center shadow-sm border border-gray-100">
                <Leaf size={16} className={listing.is_organic ? 'text-green-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Organic</p>
                <span className={`text-xs font-black px-2 py-0.5 rounded-full ${listing.is_organic ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {listing.is_organic ? '✓ Yes / हाँ' : '✗ No / नहीं'}
                </span>
              </div>
            </div>

            {/* Harvest Date */}
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <div className="w-9 h-9 rounded-xl bg-white shrink-0 flex items-center justify-center shadow-sm border border-gray-100">
                <Calendar size={16} className="text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Harvest</p>
                <p className="text-sm font-semibold text-gray-700">{listing.harvest_date || '—'}</p>
              </div>
            </div>

          </div>

          {/* Delivery Option */}
          {listing.delivery_option && (
            <div className="mt-3 flex items-center gap-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <Truck size={16} className="text-blue-600 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">Delivery / डिलीवरी</p>
                <p className="text-sm font-bold text-blue-800">{deliveryLabel[listing.delivery_option] || listing.delivery_option}</p>
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        {(location || state) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <MapPin size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Location / स्थान</p>
              <p className="font-bold text-gray-800">{[location, state].filter(Boolean).join(', ')}</p>
            </div>
          </div>
        )}

        {/* Voice Transcript */}
        {listing.voice_transcript && (
          <div className="bg-sky-50 rounded-2xl border border-sky-100 p-4">
            <p className="text-[10px] font-black text-sky-400 uppercase tracking-wider mb-2">🎙 Voice Listing</p>
            <p className="text-sm text-sky-800 italic">"{listing.voice_transcript}"</p>
          </div>
        )}

        {/* Listed date */}
        <p className="text-[11px] text-gray-400 text-center">
          Listed on {new Date(listing.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>

        {/* Seller Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Seller / विक्रेता</p>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-xl shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #166534)' }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : seller[0]?.toUpperCase() || '👨🏽‍🌾'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-gray-900 text-base leading-tight truncate">{seller}</p>
              <p className="text-xs font-semibold text-green-700 mt-0.5">
                {listing.profiles?.role === 'buyer' ? '🛒 Buyer' : '👨🏽‍🌾 Farmer / किसान'}
              </p>
              {(listing.profiles?.state || listing.profiles?.address) && (
                <p className="text-xs text-gray-500 mt-1 truncate">
                  📍 {[listing.profiles?.address, listing.profiles?.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          <button
            onClick={() => setIsContactOpen(true)}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #2d7a3a, #166534)', boxShadow: '0 8px 20px rgba(45,122,58,0.35)' }}
          >
            <Phone size={18} />
            <div className="text-left leading-tight">
              <span className="block font-bold">Contact Seller</span>
              <span className="block text-[9px] opacity-80">विक्रेता से मिलें</span>
            </div>
          </button>
          <button
            onClick={() => navigate('/transport', { state: { listing: normalized } })}
            className="flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 8px 20px rgba(245,158,11,0.35)' }}
          >
            <Truck size={18} />
            <div className="text-left leading-tight">
              <span className="block font-bold">Book Transport</span>
              <span className="block text-[9px] opacity-80">परिवहन बुक करें</span>
            </div>
          </button>
        </div>

      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} listing={normalized} />
    </div>
  );
}
