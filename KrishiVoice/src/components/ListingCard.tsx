import { Phone, Truck, Flag, ArrowRight, Image } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ContactModal from './ContactModal';

const EMOJI_MAP: Record<string, string> = {
  Wheat: '🌾', Rice: '🍚', Maize: '🌽', Corn: '🌽', Soybean: '🌱', Mustard: '🟡',
  Chickpea: '🟤', Potato: '🥔', Tomato: '🍅', Onion: '🧅', Cotton: '🌸',
  Sugarcane: '🌿', Groundnut: '🥜', Lentil: '🫘', Garlic: '🧄', Ginger: '🫚', Turmeric: '🌿',
};

export default function ListingCard({ listing }: { listing: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const navigate = useNavigate();

  const crop      = listing.crop_name       || listing.crop       || 'Produce';
  const cropHindi = listing.crop_name_hindi || listing.cropHindi  || '';
  const qty       = listing.quantity        || listing.qty        || 0;
  const unit      = listing.unit            || 'kg';
  const price     = listing.price_per_unit  || listing.price      || 0;
  const priceUnit = listing.price_unit      || listing.priceUnit  || unit;
  const seller    = listing.seller          || listing.profiles?.full_name || 'Farmer';
  const location  = listing.location        || '';
  const status    = listing.status          || 'available';
  const icon      = EMOJI_MAP[crop]         || '🌾';
  const photoUrl  = listing.photo_url       || null;
  const isOrganic = listing.is_organic      || false;
  const grade     = listing.grade           || '';

  const normalized = { ...listing, crop, cropHindi, qty, unit, price, priceUnit, seller, location, status };

  const statusColor = {
    available:  { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', label: 'Available' },
    sold:       { bg: '#fef2f2', text: '#dc2626', dot: '#ef4444', label: 'Sold' },
    in_transit: { bg: '#eff6ff', text: '#2563eb', dot: '#3b82f6', label: 'In Transit' },
  }[status] || { bg: '#f9fafb', text: '#6b7280', dot: '#9ca3af', label: status };

  const goToDetail = () => navigate(`/listing/${listing.id}`);

  return (
    <>
      <div className="listing-card rounded-2xl border border-green-50 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
        {/* Card header strip */}
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #2d7a3a, #4ade80, #2d7a3a)' }} />

        {/* Photo Hero (if available) */}
        {photoUrl && !imgError ? (
          <button onClick={goToDetail} className="block w-full relative overflow-hidden" style={{ height: 140 }}>
            <img
              src={photoUrl}
              alt={crop}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className="absolute bottom-2 right-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Image size={10} /> Photo
            </span>
            {isOrganic && (
              <span className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                🌿 Organic
              </span>
            )}
          </button>
        ) : null}

        <div className="p-4">
          {/* Top row */}
          <div className="flex justify-between items-start mb-3">
            <button onClick={goToDetail} className="flex items-center gap-3 text-left">
              {/* Crop icon 3D bubble */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{
                  background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)',
                  boxShadow: '3px 3px 6px rgba(45,122,58,0.15), -2px -2px 5px rgba(255,255,255,0.9)',
                }}
              >
                {icon}
              </div>
              <div>
                <h3 className="font-black text-gray-900 leading-tight text-base hover:text-primary transition-colors">{crop}</h3>
                {cropHindi && (
                  <p className="text-xs font-semibold text-green-700" style={{ fontFamily: 'Noto Sans Devanagari, sans-serif' }}>
                    {cropHindi}
                  </p>
                )}
                <div className="flex items-center gap-1.5 mt-0.5">
                  {grade && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700">Grade {grade}</span>
                  )}
                  {!photoUrl && isOrganic && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">🌿 Organic</span>
                  )}
                </div>
              </div>
            </button>

            {/* Status badge */}
            <span
              className="text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0"
              style={{ background: statusColor.bg, color: statusColor.text }}
            >
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: statusColor.dot }} />
              {statusColor.label}
            </span>
          </div>

          {/* Price + Qty grid */}
          <div
            className="rounded-xl p-3 mb-3 grid grid-cols-2 gap-3"
            style={{
              background: 'linear-gradient(145deg, #f0fdf4, #dcfce7)',
              boxShadow: 'inset 2px 2px 5px rgba(45,122,58,0.1), inset -1px -1px 3px rgba(255,255,255,0.8)',
            }}
          >
            <div>
              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-0.5">Quantity</p>
              <p className="font-black text-gray-900 text-sm">
                {qty} <span className={`font-black text-[10px] px-1.5 py-0.5 rounded shadow-sm ${unit.toLowerCase().includes('quintal') || unit.toLowerCase().includes('क्विंटल') ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-800'}`}>{unit}</span>
              </p>
              <p className="text-[9px] text-gray-500 font-medium mt-1">मात्रा</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-0.5">Price</p>
              <p className="font-black text-base" style={{ color: '#15803d' }}>
                ₹{price > 0 ? price.toLocaleString('en-IN') : '0'}
              </p>
              <p className="text-[9px] text-gray-500 font-medium mt-0.5">
                / <span className={`font-bold ${priceUnit.toLowerCase().includes('quintal') || priceUnit.toLowerCase().includes('क्विंटल') ? 'bg-amber-200 text-amber-900 px-1 py-0.5 rounded' : 'text-gray-700'}`}>{priceUnit}</span> · मूल्य
              </p>
            </div>
          </div>

          {/* Seller + Location */}
          <div className="mb-3">
            <p className="font-bold text-gray-900 text-sm flex items-center gap-1">
              👨🏽‍🌾 <span>{seller}</span>
            </p>
            {location && (
              <p className="text-xs text-gray-500 font-medium truncate mt-0.5">📍 {location}</p>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {listing.verified && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">✓ Verified</span>
              )}
              {listing.averageRating && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  listing.averageRating >= 4.5 ? 'bg-green-100 text-green-800' :
                  listing.averageRating >= 3.5 ? 'bg-blue-100 text-blue-800' :
                  listing.averageRating >= 2.5 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                }`}>
                  {listing.averageRating >= 4.5 ? 'Best' : listing.averageRating >= 3.5 ? 'Good' :
                   listing.averageRating >= 2.5 ? 'Average' : 'Poor'}
                </span>
              )}
              {listing.successfulListings && (
                <span className="text-xs text-gray-500">{listing.successfulListings} sold</span>
              )}
            </div>
            <button
              className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
              onClick={() => alert('Report functionality to be implemented')}
            >
              <Flag size={12} />
              Report
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-3d text-white flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-colors col-span-1"
              style={{ background: 'linear-gradient(135deg, #2d7a3a 0%, #166534 100%)' }}
            >
              <Phone size={13} />
              <div className="text-left leading-tight">
                <span className="block font-bold">Contact</span>
                <span className="block text-[7px] opacity-80">संपर्क</span>
              </div>
            </button>
            <button
              onClick={() => navigate('/transport', { state: { listing: normalized } })}
              className="btn-3d text-white flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-colors col-span-1"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}
            >
              <Truck size={13} />
              <div className="text-left leading-tight">
                <span className="block font-bold">Transport</span>
                <span className="block text-[7px] opacity-80">परिवहन</span>
              </div>
            </button>
            <button
              onClick={goToDetail}
              className="btn-3d text-white flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-xs transition-colors col-span-1"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              <ArrowRight size={13} />
              <div className="text-left leading-tight">
                <span className="block font-bold">Details</span>
                <span className="block text-[7px] opacity-80">विवरण</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      <ContactModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} listing={normalized} />
    </>
  );
}
