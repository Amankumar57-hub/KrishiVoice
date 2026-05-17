import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { MapPin, Phone, Package, ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ListingCard from '../components/ListingCard';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuthContext();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [successfulListings, setSuccessfulListings] = useState(0);
  const [averageRating, setAverageRating] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [roleSuccess, setRoleSuccess] = useState(false);

  const currentRole = profile?.role || 'farmer';

  const handleRoleChange = async (newRole: 'farmer' | 'buyer') => {
    if (!user?.id || newRole === currentRole) return;
    setRoleUpdating(true);
    setRoleSuccess(false);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id);
    if (!error) {
      await refreshProfile();
      setRoleSuccess(true);
      setTimeout(() => setRoleSuccess(false), 2500);
    }
    setRoleUpdating(false);
  };

  useEffect(() => {
    if (!user?.id) return;

    // Fetch available listings
    supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setListings(data);
      });

    // Fetch successful listings count
    supabase
      .from('listings')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('status', 'sold')
      .then(({ count }) => {
        setSuccessfulListings(count || 0);
      });

    // Fetch average rating
    supabase
      .from('ratings')
      .select('rating')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
          setAverageRating(avg.toFixed(1));
        } else {
          setAverageRating('0');
        }
        setLoading(false);
      });
  }, [user?.id]);

  const displayName = profile?.full_name || profile?.username || 'User';

  const adaptListing = (l) => ({
    id: l.id,
    user_id: l.user_id,
    crop_name: l.crop_name,
    crop: l.crop_name,
    crop_name_hindi: l.crop_name_hindi,
    cropHindi: l.crop_name_hindi,
    quantity: l.quantity,
    qty: l.quantity,
    unit: l.unit,
    price_per_unit: l.price_per_unit,
    price: l.price_per_unit,
    price_unit: l.price_unit,
    priceUnit: l.price_unit,
    seller: displayName,
    location: l.location || profile?.address || '',
    phone: l.phone || profile?.phone || '',
    whatsapp: l.whatsapp || profile?.whatsapp || '',
    email: profile?.email || '',
    address: profile?.address || '',
    status: l.status,
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>
      {/* Header — clean white, no blue */}
      <div className="pt-10 pb-8 px-5 relative auth-gradient-bg">
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2.5 rounded-xl transition-all glass-premium text-gray-900 border border-white/40 shadow-sm hover:scale-110 active:scale-90">
          <ArrowLeft size={18} />
        </button>

        <div className="flex flex-col items-center text-center relative z-10 animate-fade-in-scale">
          {/* Avatar with glowing ring */}
          <div className="w-28 h-28 rounded-3xl overflow-hidden flex items-center justify-center mb-5 glass-premium p-1.5 shadow-2xl border border-white/60">
            <div className="w-full h-full rounded-2xl overflow-hidden bg-white/20 backdrop-blur-md flex items-center justify-center">
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                : <span className="text-4xl font-black text-gray-900">{displayName[0]?.toUpperCase()}</span>
              }
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none mb-1">{displayName}</h1>
          <p className="text-primary text-[11px] font-bold uppercase tracking-widest">@{profile?.username}</p>

          {/* Role Switcher */}
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Your Role / आपकी भूमिका</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleRoleChange('farmer')}
                disabled={roleUpdating}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm border ${currentRole === 'farmer'
                  ? 'bg-primary text-white border-primary shadow-primary/30 shadow-md scale-105'
                  : 'glass-premium text-gray-600 border-white/40 hover:scale-105 active:scale-95'}`}
              >
                {roleUpdating && currentRole === 'buyer' ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                👨🏽‍🌾 Farmer / किसान
              </button>
              <button
                onClick={() => handleRoleChange('buyer')}
                disabled={roleUpdating}
                className={`px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm border ${currentRole === 'buyer'
                  ? 'bg-primary text-white border-primary shadow-primary/30 shadow-md scale-105'
                  : 'glass-premium text-gray-600 border-white/40 hover:scale-105 active:scale-95'}`}
              >
                {roleUpdating && currentRole === 'farmer' ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                🛒 Buyer / खरीदार
              </button>
            </div>
            {roleSuccess && (
              <span className="text-[10px] font-bold text-green-600 animate-pulse">✓ Role updated! / भूमिका बदल गई</span>
            )}
            {profile?.verified && (
              <span className="px-4 py-2 rounded-xl text-xs font-black bg-green-500 text-white shadow-lg shadow-green-200">
                ✓ Verified
              </span>
            )}
          </div>
        </div>
      </div>


      {/* Stats Strip — sits cleanly below header */}
      <div className="mx-4 mt-6 glass-premium rounded-3xl shadow-xl flex px-4 py-2 border border-white/40">
        {[
          { label: 'Successful', labelHi: 'सफल', value: successfulListings },
          { label: 'Rating', labelHi: 'रेटिंग', value: averageRating !== '0' ? `⭐ ${averageRating}` : '—' },
        ].map((s, i) => (
          <div key={i} className={`flex-1 px-3 py-5 text-center ${i < 1 ? 'border-r border-gray-100/50' : ''}`}>
            <p className="text-2xl font-black text-gray-900 leading-none">{s.value ?? '—'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-gray-400">{s.label}</p>
            <p className="text-[9px] font-bold text-primary/60">{s.labelHi}</p>
          </div>
        ))}
      </div>

      {/* Info */}
      <div className="px-4 py-5 space-y-3">
        <div className="rounded-2xl shadow-sm p-5 space-y-3" style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: '#111827' }}>Contact Info / संपर्क जानकारी</h3>
          {[
            profile?.phone && { icon: Phone, val: profile.phone, label: 'Phone' },
            profile?.address && { icon: MapPin, val: profile.address, label: 'Address' },
            profile?.state && { icon: MapPin, val: profile.state, label: 'State' },
          ].filter(Boolean).map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#eff6ff' }}>
                <item.icon size={14} style={{ color: '#3730A3' }} />
              </div>
              <div>
                <p className="text-[10px] font-medium" style={{ color: '#9ca3af' }}>{item.label}</p>
                <p className="text-sm font-semibold" style={{ color: '#1f2937' }}>{item.val}</p>
              </div>
            </div>
          ))}
          {!profile?.phone && !profile?.address && (
            <p className="text-sm italic text-center py-2" style={{ color: '#9ca3af' }}>No contact info added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
