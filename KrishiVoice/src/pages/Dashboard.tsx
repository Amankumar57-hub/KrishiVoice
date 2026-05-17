import { Mic, Trash2, Loader2, Phone, MessageCircle, Mail, Volume2, ArrowRight, Plus, Edit2, Upload, X, CheckCircle } from 'lucide-react';
import VoiceButton from '../components/VoiceButton';
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import toast, { Toaster } from 'react-hot-toast';

export default function Dashboard() {
  const { user, profile } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState('farmer');
  
  // Tab states - load default based on URL search query
  const [farmerSubTab, setFarmerSubTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'crops';
  });
  const [buyerSubTab, setBuyerSubTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'inquiries';
  });
  
  const [listings, setListings] = useState([]);
  const [myTransporters, setMyTransporters] = useState([]);
  const [buyerInquiries, setBuyerInquiries] = useState([]);
  const [sellerInquiries, setSellerInquiries] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [transportersLoading, setTransportersLoading] = useState(false);
  const [buyerInquiriesLoading, setBuyerInquiriesLoading] = useState(true);
  const [sellerInquiriesLoading, setSellerInquiriesLoading] = useState(true);
  
  // Profile Stats states
  const [successfulListings, setSuccessfulListings] = useState(0);
  const [averageRating, setAverageRating] = useState('0');
  const [roleUpdating, setRoleUpdating] = useState(false);
  
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [editingTransporterId, setEditingTransporterId] = useState(null);
  const [transportPublishing, setTransportPublishing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);
  
  const [transportFormData, setTransportFormData] = useState({ name: '', phone: '', whatsapp: '', email: '', vehicle: '', region: '', address: '' });
  const [transportPhoto, setTransportPhoto] = useState(null);
  const [transportPhotoPreview, setTransportPhotoPreview] = useState('');
  const [transportExistingPhotoUrl, setTransportExistingPhotoUrl] = useState('');
  const transportFileInputRef = useRef(null);

  const speakListing = useCallback((listing) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const text = `Listing details: Crop ${listing.crop_name}, quantity ${listing.quantity} ${listing.unit}, price ${listing.price_per_unit} rupees per ${listing.price_unit}.`;
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'en-IN'; // Or based on language
    window.speechSynthesis.speak(msg);
  }, []);

  // Decide tab based on role
  useEffect(() => {
    if (profile?.role === 'buyer') setTab('buyer');
    else setTab('farmer');
  }, [profile]);

  // Sync sub-tabs state with URL query search parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'crops') {
      setFarmerSubTab('crops');
    } else if (tabParam === 'inquiries') {
      setBuyerSubTab('inquiries');
      setFarmerSubTab('inquiries');
    } else if (tabParam === 'transports') {
      setFarmerSubTab('transports');
    }
  }, [location.search]);

  const fetchListings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setListings(data);
    setLoading(false);
  }, [user?.id]);

  const fetchMyTransporters = useCallback(async () => {
    if (!user?.id) return;
    setTransportersLoading(true);
    const { data, error } = await supabase
      .from('transporters')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setMyTransporters(data);
    setTransportersLoading(false);
  }, [user?.id]);

  const fetchBuyerInquiries = useCallback(async () => {
    if (!user?.id) return;
    setBuyerInquiriesLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*, listings(crop_name, quantity, unit), seller:seller_id(full_name, username, phone)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setBuyerInquiries(data);
    setBuyerInquiriesLoading(false);
  }, [user?.id]);

  const fetchSellerInquiries = useCallback(async () => {
    if (!user?.id) return;
    setSellerInquiriesLoading(true);
    const { data, error } = await supabase
      .from('contacts')
      .select('*, listings(crop_name, quantity, unit), buyer:buyer_id(full_name, username, phone)')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setSellerInquiries(data);
    setSellerInquiriesLoading(false);
  }, [user?.id]);

  const fetchProfileStats = useCallback(async () => {
    if (!user?.id) return;
    try {
      // Fetch successful listings count
      const { count } = await supabase
        .from('listings')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'sold');
      setSuccessfulListings(count || 0);

      // Fetch average rating
      const { data } = await supabase
        .from('ratings')
        .select('rating')
        .eq('user_id', user.id);
      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAverageRating(avg.toFixed(1));
      } else {
        setAverageRating('0');
      }
    } catch (err) {
      console.error(err);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchListings();
    fetchMyTransporters();
    fetchBuyerInquiries();
    fetchSellerInquiries();
    fetchProfileStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchListings, fetchMyTransporters, fetchBuyerInquiries, fetchSellerInquiries, fetchProfileStats]);

  // Real-time subscription for inquiries and listings
  useEffect(() => {
    if (!user?.id || profile?.role === 'buyer') return;

    const inquiriesSub = supabase
      .channel('new-inquiries')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contacts',
        filter: `seller_id=eq.${user.id}`,
      }, (_payload) => {
        toast.success('New inquiry received!');
        fetchSellerInquiries();
      })
      .subscribe();
      
    const listingsSub = supabase
      .channel('listings-updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'listings',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new.status === 'sold' && payload.old.status !== 'sold') {
           toast.success(`Your listing was marked as Sold!`);
        }
        fetchListings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(inquiriesSub);
      supabase.removeChannel(listingsSub);
    };
  }, [user?.id, profile?.role, fetchSellerInquiries, fetchListings]);

  const handleDelete = async (listingId) => {
    if (!window.confirm('Delete this listing?')) return;
    setDeleteLoading(listingId);
    const { error } = await supabase.from('listings').delete().eq('id', listingId).eq('user_id', user.id);
    if (!error) {
      setListings(prev => prev.filter(l => l.id !== listingId));
      toast.success('Listing deleted.');
    } else toast.error('Delete failed.');
    setDeleteLoading(null);
  };

  const handleTransportPhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setTransportPhoto(file);
      setTransportPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadTransportPhoto = async (file) => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1024,
        useWebWorker: false,
      });
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `transporters/${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('listings-photos').upload(path, compressedFile, { 
        upsert: true,
        contentType: file.type || 'image/jpeg'
      });
      if (error) throw error;
      const { data } = supabase.storage.from('listings-photos').getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      console.error('Image compression or upload failed', err);
      throw err;
    }
  };

  const handleEditTransporterClick = (t) => {
    setEditingTransporterId(t.id);
    setTransportFormData({
      name: t.name || '',
      phone: t.phone || '',
      whatsapp: t.whatsapp || '',
      email: t.email || '',
      vehicle: t.vehicle_type || t.vehicle || '',
      region: t.region || '',
      address: t.address || ''
    });
    if (t.photo_url) {
      setTransportExistingPhotoUrl(t.photo_url);
      setTransportPhotoPreview(t.photo_url);
    } else {
      setTransportExistingPhotoUrl('');
      setTransportPhotoPreview('');
    }
    setTransportPhoto(null);
    setShowTransportModal(true);
  };

  const handleDeleteTransporter = async (id) => {
    if (!window.confirm('Delete this transport service listing?')) return;
    try {
      const { error } = await supabase
        .from('transporters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      if (error) throw error;
      setMyTransporters(prev => prev.filter(t => t.id !== id));
      toast.success('Transport service deleted successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete transport.');
    }
  };

  const handleTransportSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    setTransportPublishing(true);

    try {
      let photoUrl = transportExistingPhotoUrl || null;
      if (transportPhoto) {
        photoUrl = await uploadTransportPhoto(transportPhoto);
      }

      const transData = {
        name: transportFormData.name,
        phone: transportFormData.phone,
        whatsapp: transportFormData.whatsapp || transportFormData.phone,
        email: transportFormData.email || null,
        address: transportFormData.address || null,
        vehicle_type: transportFormData.vehicle,
        region: transportFormData.region,
        user_id: user.id,
        photo_url: photoUrl
      };

      let error;
      if (editingTransporterId) {
        const { error: err } = await supabase
          .from('transporters')
          .update(transData)
          .eq('id', editingTransporterId)
          .eq('user_id', user.id);
        error = err;
      } else {
        const { error: err } = await supabase
          .from('transporters')
          .insert([transData]);
        error = err;
      }

      if (error) throw error;
      
      toast.success(editingTransporterId ? "Transport updated!" : "Transport registered!");
      setShowTransportModal(false);
      setEditingTransporterId(null);
      setTransportFormData({ name: '', phone: '', whatsapp: '', email: '', vehicle: '', region: '', address: '' });
      setTransportPhoto(null);
      setTransportPhotoPreview('');
      setTransportExistingPhotoUrl('');
      fetchMyTransporters();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save transport.");
    } finally {
      setTransportPublishing(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    if (!user?.id || newRole === profile?.role) return;
    setRoleUpdating(true);
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id);
    if (!error) {
      toast.success('Account role updated successfully.');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.error('Failed to change role.');
    }
    setRoleUpdating(false);
  };

  const statusColor = (s) => {
    if (s === 'available') return 'bg-green-100 text-green-700';
    if (s === 'sold') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  const contactMethodLabel = {
    phone: 'Phone Call',
    whatsapp: 'WhatsApp',
    email: 'Email',
    message: 'Callback Request',
  };

  const contactMethodIcon = {
    phone: Phone,
    whatsapp: MessageCircle,
    email: Mail,
    message: MessageCircle,
  };

  const formatDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isFarmer = (profile?.role || tab) !== 'buyer';

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ backgroundColor: 'var(--bg-body)' }}>
      <Toaster position="top-center" />
      
      <header className="bg-white px-5 py-5 border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900">{isFarmer ? 'Farmer Dashboard' : 'Buyer Dashboard'}</h1>
        <p className="text-sm text-gray-500 font-medium mt-1">
          {isFarmer ? 'किसान डैशबोर्ड • Manage Crops, Transports & Inquiries' : 'खरीदार डैशबोर्ड • Saved Inquiries'}
        </p>
      </header>

      <main className="px-4 py-6 max-w-5xl mx-auto w-full flex-grow">
        {isFarmer ? (
          <div>
            {/* Header Actions */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900 leading-tight">My Listings & Transports</h2>
                <p className="text-xs text-gray-500 font-medium">मेरी फसलें व परिवहन सेवाएं</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/add-listing')}
                  className="bg-emerald-500 text-white flex flex-col items-center justify-center px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-emerald-600 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <Plus size={14} />
                    <span className="text-sm">Add Crop</span>
                  </div>
                  <span className="text-[9px] font-normal opacity-80 mt-0.5">फसल जोड़ें</span>
                </button>

                <button
                  onClick={() => {
                    setEditingTransporterId(null);
                    setTransportFormData({ name: '', phone: '', whatsapp: '', email: '', vehicle: '', region: '', address: '' });
                    setTransportPhoto(null);
                    setTransportPhotoPreview('');
                    setTransportExistingPhotoUrl('');
                    setShowTransportModal(true);
                  }}
                  className="bg-indigo-600 text-white flex flex-col items-center justify-center px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-indigo-700 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <Plus size={14} />
                    <span className="text-sm">Add Vehicle</span>
                  </div>
                  <span className="text-[9px] font-normal opacity-80 mt-0.5">गाड़ी जोड़ें</span>
                </button>

                <button
                  onClick={() => setShowVoiceModal(true)}
                  className="bg-primary text-white flex flex-col items-center justify-center px-4 py-2.5 rounded-xl font-bold shadow-md hover:bg-sky-500 transition-colors"
                >
                  <div className="flex items-center space-x-1">
                    <Mic size={14} />
                    <span className="text-sm">Voice Add</span>
                  </div>
                  <span className="text-[9px] font-normal opacity-80 mt-0.5">आवाज से फसल</span>
                </button>
              </div>
            </div>

            {/* Sub Tabs Switcher */}
            <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3 mb-6">
              <button 
                onClick={() => setFarmerSubTab('crops')} 
                className={`pb-1.5 px-3 text-sm font-bold border-b-2 transition-all ${farmerSubTab === 'crops' ? 'border-emerald-500 text-emerald-600 font-extrabold shadow-sm' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                🌾 Crop Listings ({listings.length})
              </button>
              <button 
                onClick={() => setFarmerSubTab('transports')} 
                className={`pb-1.5 px-3 text-sm font-bold border-b-2 transition-all ${farmerSubTab === 'transports' ? 'border-indigo-500 text-indigo-600 font-extrabold shadow-sm' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                🚚 Transport Listings ({myTransporters.length})
              </button>
              <button 
                onClick={() => setFarmerSubTab('inquiries')} 
                className={`pb-1.5 px-3 text-sm font-bold border-b-2 transition-all ${farmerSubTab === 'inquiries' ? 'border-sky-500 text-sky-600 font-extrabold shadow-sm' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                💬 Buyer Inquiries ({sellerInquiries.length})
              </button>
            </div>

            {/* TAB CONTENT: CROPS */}
            {farmerSubTab === 'crops' && (
              <div>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={30} className="animate-spin text-primary" />
                  </div>
                ) : listings.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center rounded-3xl p-8 border border-white/40 glass-premium relative overflow-hidden shadow-xl mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 via-white/50 to-green-50/80 z-0"></div>
                    <div className="relative z-10 flex flex-col items-center">
                      <span className="text-6xl mb-5 drop-shadow-sm">🌾</span>
                      <p className="text-2xl font-black text-gray-900 tracking-tight">No crops listed yet</p>
                      <p className="text-sm font-semibold text-gray-500 mt-1 mb-7">अभी कोई फसल सूची नहीं है</p>
                      <button
                        onClick={() => navigate('/add-listing')}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Plus size={20} /> Add Your First Crop
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map(l => (
                      <div key={l.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full ${statusColor(l.status)}`}>
                            {l.status?.replace('_', ' ') || 'AVAILABLE'}
                          </span>
                           <div className="flex space-x-1.5">
                             <button
                               onClick={() => navigate(`/listing/${l.id}`)}
                               className="text-gray-400 bg-gray-55 p-2 rounded-lg hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                               title="View full details"
                             >
                               <ArrowRight size={16} />
                             </button>
                             <button
                               onClick={() => speakListing(l)}
                               className="text-gray-400 bg-gray-55 p-2 rounded-lg hover:text-blue-500 hover:bg-blue-50 transition-colors"
                               title="Listen to listing details"
                             >
                               <Volume2 size={16} />
                             </button>
                             <button
                               onClick={() => navigate(`/edit-listing/${l.id}`)}
                               className="text-gray-400 bg-gray-55 p-2 rounded-lg hover:text-green-500 hover:bg-green-50 transition-colors"
                               title="Edit listing"
                             >
                               <Edit2 size={16} />
                             </button>
                             <button
                               onClick={() => handleDelete(l.id)}
                               disabled={deleteLoading === l.id}
                               className="text-gray-400 bg-gray-55 p-2 rounded-lg hover:text-red-500 hover:bg-red-50 transition-colors"
                             >
                               {deleteLoading === l.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                             </button>
                           </div>
                        </div>
                        <div className="flex justify-between items-end mt-1">
                          <div className="flex gap-4">
                            {l.photo_url && (
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                                <img src={l.photo_url} alt={l.crop_name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-gray-900 text-xl leading-none">{l.crop_name}</p>
                              <p className="text-xs text-gray-500 mb-1">{l.crop_name_hindi}</p>
                              <p className="text-sm font-semibold text-gray-700 mt-2">{l.quantity} {l.unit}</p>
                              {l.voice_transcript && (
                                <p className="text-xs text-gray-400 mt-1 italic">🎙 "{l.voice_transcript}"</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-1">Price</p>
                            <p className="font-black text-primary text-2xl leading-none">₹{l.price_per_unit}</p>
                            <p className="text-[10px] text-gray-500 font-medium">/ {l.price_unit}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: TRANSPORTS */}
            {farmerSubTab === 'transports' && (
              <div>
                {transportersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={30} className="animate-spin text-indigo-600" />
                  </div>
                ) : myTransporters.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center bg-white rounded-2xl p-8 border border-gray-100">
                    <span className="text-5xl mb-4">🚚</span>
                    <p className="font-bold text-gray-700">No transport facilities registered</p>
                    <p className="text-sm text-gray-400 mt-1">अभी आपकी कोई परिवहन सेवा नहीं है</p>
                    <button
                      onClick={() => {
                        setEditingTransporterId(null);
                        setTransportFormData({ name: '', phone: '', whatsapp: '', email: '', vehicle: '', region: '', address: '' });
                        setTransportPhoto(null);
                        setTransportPhotoPreview('');
                        setTransportExistingPhotoUrl('');
                        setShowTransportModal(true);
                      }}
                      className="mt-6 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={16} /> Register Transport Facility
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myTransporters.map(t => (
                      <div key={t.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center transition-all hover:shadow-md">
                        {/* Vehicle Photo */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100 mb-3 sm:mb-0 sm:mr-4">
                          {t.photo_url ? (
                            <img src={t.photo_url} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl">🚚</span>
                          )}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-gray-900 text-lg leading-tight">{t.name}</p>
                            {t.verified && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100">Verified</span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-semibold">
                              🚚 {t.vehicle_type || 'Truck'}
                            </span>
                            <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-semibold">
                              📍 {t.region}
                            </span>
                            {t.address && (
                              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold">
                                🏙️ {t.address}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            {t.phone && <span>📞 {t.phone}</span>}
                            {t.whatsapp && <span className="text-green-600 font-medium">💬 WhatsApp Connected</span>}
                            {t.email && <span>✉️ {t.email}</span>}
                          </div>
                        </div>

                        <div className="flex sm:flex-col gap-2 mt-3 sm:mt-0 sm:ml-4 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => handleEditTransporterClick(t)}
                            className="flex-1 sm:flex-initial text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteTransporter(t.id)}
                            className="flex-1 sm:flex-initial text-red-600 bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center space-x-1"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: INQUIRIES */}
            {farmerSubTab === 'inquiries' && (
              <div>
                {sellerInquiriesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-primary" />
                  </div>
                ) : sellerInquiries.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-sm text-gray-500">
                    No buyer inquiries yet. / अभी कोई खरीदार पूछताछ नहीं है
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sellerInquiries.map((inquiry) => {
                      const MethodIcon = contactMethodIcon[inquiry.method] || MessageCircle;
                      const buyerName = inquiry.buyer?.full_name || inquiry.buyer?.username || 'Buyer';
                      return (
                        <div key={inquiry.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-gray-900">{buyerName}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {inquiry.listings?.crop_name} ({inquiry.listings?.quantity} {inquiry.listings?.unit})
                              </p>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-primary">
                              <MethodIcon size={12} />
                              {contactMethodLabel[inquiry.method] || inquiry.method}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                            <span>{formatDate(inquiry.created_at)}</span>
                            {inquiry.buyer?.phone && <a href={`tel:${inquiry.buyer.phone}`} className="font-semibold text-primary hover:underline">Call Buyer</a>}
                          </div>

                          {inquiry.message && (
                            <p className="mt-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-600">
                              {inquiry.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          <div>
            {/* Sub Tabs Switcher for Buyer */}
            <div className="flex border-b border-gray-100 pb-3 mb-6 space-x-6">
              <button 
                onClick={() => setBuyerSubTab('inquiries')} 
                className={`pb-1.5 px-3 text-sm font-bold border-b-2 transition-all ${buyerSubTab === 'inquiries' ? 'border-emerald-500 text-emerald-600 font-extrabold shadow-sm' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                🤝 My Inquiries ({buyerInquiries.length})
              </button>
            </div>

            {buyerSubTab === 'inquiries' && (
              <div>
                {buyerInquiriesLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 size={30} className="animate-spin text-primary" />
                  </div>
                ) : buyerInquiries.length === 0 ? (
                  <div className="flex flex-col items-center py-16 text-center">
                    <span className="text-5xl mb-4">🤝</span>
                    <p className="font-bold text-gray-700">No inquiries yet</p>
                    <p className="text-sm text-gray-400 mt-1">Browse listings and contact farmers</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {buyerInquiries.map(c => {
                      const MethodIcon = contactMethodIcon[c.method] || MessageCircle;
                      return (
                      <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
                          <div>
                            <p className="font-bold text-gray-900">{c.seller?.full_name || c.seller?.username}</p>
                            <p className="text-xs text-gray-500">{c.listings?.crop_name} ({c.listings?.quantity} {c.listings?.unit})</p>
                          </div>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-3 py-1.5 rounded-lg capitalize">
                            <MethodIcon size={12} />
                            {contactMethodLabel[c.method] || c.method}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 px-1">{formatDate(c.created_at)}</p>
                        {c.message && <p className="text-sm text-gray-600 mt-2 px-1">{c.message}</p>}
                      </div>
                    )})}
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </main>

      {/* Crop Voice Add Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-black text-gray-900 text-lg">Add Listing by Voice</h3>
                <p className="text-xs text-gray-500 mt-0.5">आवाज से फसल सूची बनाएं</p>
              </div>
              <button onClick={() => setShowVoiceModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <VoiceButton onListingPublished={() => { fetchListings(); setTimeout(() => setShowVoiceModal(false), 4000); }} />
          </div>
        </div>
      )}

      {/* Dashboard Add/Edit Transport Modal */}
      {showTransportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-250 my-8">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{editingTransporterId ? 'Edit Transport Service' : 'Register Transport Service'}</h2>
                <p className="text-xs text-gray-500 font-medium">परिवहन सेवा का विवरण भरें</p>
              </div>
              <button 
                onClick={() => {
                  setShowTransportModal(false);
                  setEditingTransporterId(null);
                }} 
                className="p-2 bg-gray-105 text-gray-500 rounded-full hover:bg-gray-200 transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTransportSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Transporter Name / नाम <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  value={transportFormData.name}
                  onChange={e => setTransportFormData({...transportFormData, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                  placeholder="e.g. Ram Cargo Logistics"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Vehicle Name & Model / गाड़ी <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  value={transportFormData.vehicle}
                  onChange={e => setTransportFormData({...transportFormData, vehicle: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                  placeholder="e.g. Mahindra Pickup, Tata Ace, Truck"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Contact Number / फ़ोन <span className="text-red-500">*</span></label>
                  <input 
                    required
                    type="tel" 
                    pattern="[0-9]{10}"
                    value={transportFormData.phone}
                    onChange={e => setTransportFormData({...transportFormData, phone: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                    placeholder="10 digit number"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">WhatsApp Number / व्हाट्सएप</label>
                  <div className="relative">
                    <input 
                      type="tel" 
                      pattern="[0-9]{10}"
                      value={transportFormData.whatsapp}
                      onChange={e => setTransportFormData({...transportFormData, whatsapp: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                      placeholder="WhatsApp number"
                    />
                    {transportFormData.phone && !transportFormData.whatsapp && (
                      <button 
                        type="button"
                        onClick={() => setTransportFormData({...transportFormData, whatsapp: transportFormData.phone})}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md"
                      >
                        Copy Phone
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Gmail / Email Address / ईमेल</label>
                <input 
                  type="email" 
                  value={transportFormData.email}
                  onChange={e => setTransportFormData({...transportFormData, email: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                  placeholder="e.g. contact@logistic.com"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">State & Region / क्षेत्र <span className="text-red-500">*</span></label>
                  <select 
                    required
                    value={transportFormData.region}
                    onChange={e => setTransportFormData({...transportFormData, region: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium appearance-none bg-white"
                  >
                    <option value="">Select State</option>
                    <option value="Bihar">Bihar / बिहार</option>
                    <option value="UP">Uttar Pradesh / उत्तर प्रदेश</option>
                    <option value="MP">Madhya Pradesh / मध्य प्रदेश</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">District/City / जिला</label>
                  <input 
                    type="text" 
                    value={transportFormData.address}
                    onChange={e => setTransportFormData({...transportFormData, address: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all font-medium"
                    placeholder="e.g. Patna or Bhopal"
                  />
                </div>
              </div>

              {/* Vehicle Photo Upload */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-105">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Upload size={14} className="text-violet-500" /> Vehicle Photo / गाड़ी का फोटो (Optional)
                </label>
                {transportPhotoPreview ? (
                  <div className="relative group overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                    <img src={transportPhotoPreview} alt="Preview" className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-500 ease-out" />
                    <button
                      type="button"
                      onClick={() => { setTransportPhoto(null); setTransportPhotoPreview(''); setTransportExistingPhotoUrl(''); }}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md hover:bg-red-600 transition-colors shadow-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => transportFileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-center hover:border-indigo-400 hover:bg-indigo-50/20 transition-all cursor-pointer group"
                  >
                    <Upload size={22} className="mx-auto text-gray-300 group-hover:text-indigo-400 transition-colors mb-1.5" />
                    <p className="text-xs text-gray-400 group-hover:text-indigo-600 font-semibold">Upload vehicle photo</p>
                    <p className="text-[10px] text-gray-300 mt-0.5">JPG, PNG up to 5MB</p>
                  </button>
                )}
                <input ref={transportFileInputRef} type="file" accept="image/*" onChange={handleTransportPhotoChange} className="hidden" />
              </div>

              <button 
                type="submit"
                disabled={transportPublishing}
                className="w-full mt-4 bg-indigo-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center space-x-2"
              >
                {transportPublishing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{editingTransporterId ? 'Update Transport Facility' : 'Publish Transport Facility'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
