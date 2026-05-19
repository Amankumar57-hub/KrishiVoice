import { Phone, MessageCircle, Mail, MapPin, X, ExternalLink, Loader2, LogIn } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuthContext } from '../context/AuthContext';

export default function ContactModal({ isOpen, onClose, listing }) {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingMethod, setSavingMethod] = useState(null);
  const [notice, setNotice] = useState(null);

  // Fetch the real seller profile from the DB whenever modal opens
  useEffect(() => {
    if (!isOpen || !listing) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setSellerProfile(null);

    const fetchSeller = async () => {
      setLoading(true);

      // Try by user_id first (most reliable)
      const userId = listing.user_id;
      if (userId) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, username, phone, whatsapp, email, address, state, avatar_url, role')
          .eq('id', userId)
          .single();
        if (!error && data) {
          setSellerProfile(data);
          setLoading(false);
          return;
        }
      }

      // Fallback: build from what listing already brought
      setSellerProfile({
        full_name: listing.seller || listing.profiles?.full_name || '',
        username: listing.profiles?.username || '',
        phone: listing.phone || listing.profiles?.phone || '',
        whatsapp: listing.whatsapp || listing.profiles?.whatsapp || '',
        email: listing.email || listing.profiles?.email || '',
        address: listing.location || listing.address || '',
        state: listing.state || '',
        avatar_url: listing.profiles?.avatar_url || null,
        role: listing.profiles?.role || 'farmer',
      });
      setLoading(false);
    };

    fetchSeller();
  }, [isOpen, listing]);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setSavingMethod(null);
    setNotice(null);
  }, [isOpen, listing?.id]);

  if (!isOpen || !listing) return null;

  // Derived contact info — prefer profile data
  const name = sellerProfile?.full_name || sellerProfile?.username || listing.seller || 'Farmer';
  const phone = sellerProfile?.phone || listing.phone || '';
  const whatsapp = sellerProfile?.whatsapp || sellerProfile?.phone || listing.phone || '';
  const email = sellerProfile?.email || listing.email || '';
  const address = sellerProfile?.address || listing.location || listing.address || '';
  const state = sellerProfile?.state || '';
  const avatarUrl = sellerProfile?.avatar_url || null;

  // Build tel/wa numbers (strip non-digits, add 91 if needed)
  const cleanPhone = phone.replace(/\D/g, '');
  const telNumber = cleanPhone.startsWith('91') ? `+${cleanPhone}` : cleanPhone ? `+91${cleanPhone}` : '';
  const waNumber = (() => {
    const n = whatsapp.replace(/\D/g, '');
    return n.startsWith('91') ? n : n ? `91${n}` : '';
  })();

  const crop = listing.crop_name || listing.crop || 'Crop';
  const qty = listing.quantity || listing.qty || '';
  const unit = listing.unit || '';
  const price = listing.price_per_unit || listing.price || 0;
  const isOwnListing = !!user?.id && user.id === listing.user_id;
  const canSaveInquiry = !!user?.id && !!listing.id && !!listing.user_id && !isOwnListing;

  const locationFull = [address, state].filter(Boolean).join(', ');

  const saveInquiry = async (method, message = null) => {
    if (!user?.id) {
      setNotice({
        type: 'warning',
        text: 'Login to contact sellers and save inquiry history. / विक्रेता से संपर्क करने और पूछताछ सहेजने के लिए लॉगिन करें।',
      });
      return false;
    }

    if (isOwnListing) {
      setNotice({
        type: 'warning',
        text: 'This is your own listing. / यह आपकी अपनी सूची है।',
      });
      return false;
    }

    if (!listing?.id || !listing?.user_id) {
      setNotice({
        type: 'error',
        text: 'Listing details are incomplete. / सूची की जानकारी अधूरी है।',
      });
      return false;
    }

    setSavingMethod(method);

    const { data, error } = await supabase.from('contacts').insert({
      buyer_id: user.id,
      seller_id: listing.user_id,
      listing_id: listing.id,
      method,
      message,
    }).select().single();

    if (error) {
      setNotice({
        type: 'error',
        text: 'Could not save inquiry right now. / अभी पूछताछ सहेजी नहीं जा सकी।',
      });
      setSavingMethod(null);
      return false;
    }

    // Send notification
    if (data && (method === 'phone' || method === 'whatsapp')) {
      const sellerPhone = sellerProfile?.phone || listing.phone || '';
      const cleanPhone = sellerPhone.replace(/\D/g, '');
      const phoneNumber = cleanPhone.startsWith('91') ? cleanPhone : cleanPhone ? `91${cleanPhone}` : '';

      if (phoneNumber) {
        const notificationMessage = `New inquiry from KrishiVoice: ${message || `Interested in ${crop} (${qty} ${unit}).`}`;

        supabase.functions.invoke('send-notification', {
          body: {
            contactId: data.id,
            method,
            sellerPhone: `+${phoneNumber}`,
            message: notificationMessage,
          },
        }).catch(err => console.error('Notification failed:', err));
      }
    }

    setNotice({
      type: 'success',
      text:
        method === 'message'
          ? '✅ Callback requested! Seller will be notified. / कॉलबैक अनुरोध भेजा गया।'
          : '✅ Inquiry saved to your dashboard! / पूछताछ सहेजी गई।',
    });
    setSavingMethod(null);

    // Auto-close after success if it's a contact method
    if (method === 'phone' || method === 'whatsapp') {
      setTimeout(() => onClose(), 2000);
    }
    return true;
  };

  const handleLoginRedirect = () => {
    onClose();
    navigate('/login');
  };

  const noticeStyles = {
    success: 'bg-green-50 border-green-200 text-green-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    error: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-white w-full sm:max-w-sm sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* ── Green top strip ── */}
        <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #2d7a3a, #4ade80, #2d7a3a)' }} />

        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-gray-900">Contact Seller</h3>
            <p className="text-xs font-semibold text-gray-500">विक्रेता से संपर्क करें</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-5 space-y-4">

          {/* Seller avatar + info */}
          <div className="flex items-center gap-4 bg-green-50 rounded-2xl p-4 border border-green-100">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-white font-black text-2xl shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2d7a3a, #166534)', boxShadow: '0 4px 12px rgba(45,122,58,0.3)' }}
            >
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                : name[0]?.toUpperCase() || '👨🏽‍🌾'}
            </div>
            <div className="min-w-0">
              <h4 className="font-black text-gray-900 text-base leading-tight truncate">{loading ? 'Loading…' : name}</h4>
              <p className="text-xs font-semibold text-green-700 mt-0.5">
                {sellerProfile?.role === 'buyer' ? '🛒 Buyer' : '👨🏽‍🌾 Farmer / किसान'}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {crop} · {qty} {unit} {price > 0 ? `· ₹${price}/${unit}` : ''}
              </p>
            </div>
          </div>

          {notice && (
            <div className={`rounded-2xl border px-4 py-3 text-sm font-medium ${noticeStyles[notice.type] || noticeStyles.success}`}>
              {notice.text}
            </div>
          )}

          {!user && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm font-semibold text-sky-800">
                Login required to contact sellers
              </p>
              <p className="text-xs text-sky-700 mt-1">
                लॉगिन के बाद आपकी कॉल, व्हाट्सऐप और कॉलबैक पूछताछ सहेजी जाएगी।
              </p>
              <button
                onClick={handleLoginRedirect}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition-colors"
              >
                <LogIn size={16} />
                Login / लॉगिन
              </button>
            </div>
          )}

          {isOwnListing && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
              This listing belongs to you. / यह सूची आपकी है।
            </div>
          )}

          {/* ── Call + WhatsApp ── */}
          <div className="grid grid-cols-2 gap-3">
            {/* Call */}
            {telNumber && user ? (
              <a
                href={`tel:${telNumber}`}
                onClick={() => {
                  void saveInquiry('phone', `Called about ${crop} (${qty} ${unit}).`);
                }}
                className="flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-sm transition-all group border"
                style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  color: '#15803d',
                  borderColor: '#86efac',
                  boxShadow: '0 4px 12px rgba(45,122,58,0.12)',
                }}
              >
                <Phone size={24} className="mb-1.5 group-hover:scale-110 transition-transform" />
                <span>Call</span>
                <span className="text-[10px] font-normal mt-0.5 opacity-80">{phone}</span>
              </a>
            ) : telNumber ? (
              <button
                onClick={handleLoginRedirect}
                className="flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-sm transition-all group border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
              >
                <LogIn size={22} className="mb-1.5 transition-transform group-hover:scale-110" />
                <span>Login to Call</span>
                <span className="text-[10px] font-normal mt-0.5 opacity-80">कॉल के लिए लॉगिन</span>
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 rounded-2xl border border-dashed border-gray-200 text-gray-300">
                <Phone size={22} className="mb-1" />
                <span className="text-xs">No number</span>
                <span className="text-[9px] text-gray-400">नंबर नहीं</span>
              </div>
            )}

            {/* WhatsApp */}
            {waNumber && user ? (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Namaste! I saw your listing of ${qty} ${unit} ${crop} on KrishiVoice. I'm interested. Please share details.`)}`}
                target="_blank"
                rel="noreferrer"
                onClick={() => {
                  void saveInquiry('whatsapp', `WhatsApp inquiry for ${crop} (${qty} ${unit}).`);
                }}
                className="flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-sm transition-all group border"
                style={{
                  background: 'linear-gradient(135deg, #f0fff4, #dcfce7)',
                  color: '#16a34a',
                  borderColor: '#86efac',
                  boxShadow: '0 4px 12px rgba(37,211,102,0.15)',
                }}
              >
                <MessageCircle size={24} className="mb-1.5 group-hover:scale-110 transition-transform" />
                <span>WhatsApp</span>
                <span className="text-[10px] font-normal mt-0.5 opacity-80">Direct chat</span>
              </a>
            ) : waNumber ? (
              <button
                onClick={handleLoginRedirect}
                className="flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-sm transition-all group border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100"
              >
                <LogIn size={22} className="mb-1.5 transition-transform group-hover:scale-110" />
                <span>Login for WhatsApp</span>
                <span className="text-[10px] font-normal mt-0.5 opacity-80">व्हाट्सऐप के लिए लॉगिन</span>
              </button>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 rounded-2xl border border-dashed border-gray-200 text-gray-300">
                <MessageCircle size={22} className="mb-1" />
                <span className="text-xs">No WA</span>
              </div>
            )}
          </div>

          {/* ── Details: Email + Location ── */}
          <div className="space-y-2">
            {/* Email */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                <Mail size={16} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Email / ईमेल</p>
                {email && user ? (
                  <a
                    href={`mailto:${email}?subject=KrishiVoice Inquiry - ${crop}&body=Namaste, I saw your listing of ${qty} ${unit} ${crop} on KrishiVoice and I'm interested.`}
                    onClick={() => {
                      void saveInquiry('email', `Email inquiry for ${crop} (${qty} ${unit}).`);
                    }}
                    className="text-sm font-bold text-primary hover:underline truncate block"
                  >
                    {email}
                  </a>
                ) : email ? (
                  <button
                    onClick={handleLoginRedirect}
                    className="text-sm font-bold text-primary hover:underline truncate block"
                  >
                    Login to email / ईमेल के लिए लॉगिन
                  </button>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not provided</p>
                )}
              </div>
              {email && user && (
                <a
                  href={`mailto:${email}`}
                  onClick={() => {
                    void saveInquiry('email', `Email inquiry for ${crop} (${qty} ${unit}).`);
                  }}
                  className="shrink-0 text-gray-400 hover:text-primary"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Location */}
            <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-gray-100 bg-gray-50">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                <MapPin size={16} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Location / स्थान</p>
                {locationFull ? (
                  <p className="text-sm font-bold text-gray-800 truncate">{locationFull}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">Not provided</p>
                )}
              </div>
              {locationFull && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(locationFull)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-gray-400 hover:text-primary"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          </div>



          {/* ── No contact fallback ── */}
          {!phone && !email && !loading && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
              <p className="text-amber-700 text-xs font-semibold">
                ⚠️ Seller hasn't added contact info yet.
              </p>
              <p className="text-amber-600 text-[10px] mt-0.5">
                विक्रेता ने संपर्क जानकारी नहीं जोड़ी है।
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Close / बंद करें
          </button>
        </div>
      </div>
    </div>
  );
}
