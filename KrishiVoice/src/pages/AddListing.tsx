import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import toast, { Toaster } from 'react-hot-toast';
import {
  Plus, Loader2, CheckCircle, Upload, Leaf, ChevronDown,
  Package, IndianRupee, MapPin, Calendar, Droplets, Star
} from 'lucide-react';

const CROP_OPTIONS = [
  { name: 'Wheat', hindi: 'गेहूं', emoji: '🌾' },
  { name: 'Rice', hindi: 'चावल', emoji: '🍚' },
  { name: 'Maize', hindi: 'मक्का', emoji: '🌽' },
  { name: 'Soybean', hindi: 'सोयाबीन', emoji: '🫘' },
  { name: 'Mustard', hindi: 'सरसों', emoji: '🟡' },
  { name: 'Chickpea', hindi: 'चना', emoji: '🫛' },
  { name: 'Pigeon Pea', hindi: 'अरहर', emoji: '🫛' },
  { name: 'Green Gram', hindi: 'मूंग', emoji: '🫛' },
  { name: 'Black Gram', hindi: 'उड़द', emoji: '🫛' },
  { name: 'Red Lentil', hindi: 'मसूर', emoji: '🫘' },
  { name: 'Groundnut', hindi: 'मूंगफली', emoji: '🥜' },
  { name: 'Sugarcane', hindi: 'गन्ना', emoji: '🌿' },
  { name: 'Cotton', hindi: 'कपास', emoji: '☁️' },
  { name: 'Potato', hindi: 'आलू', emoji: '🥔' },
  { name: 'Onion', hindi: 'प्याज', emoji: '🧅' },
  { name: 'Tomato', hindi: 'टमाटर', emoji: '🍅' },
  { name: 'Banana', hindi: 'केला', emoji: '🍌' },
  { name: 'Mango', hindi: 'आम', emoji: '🥭' },
  { name: 'Apple', hindi: 'सेब', emoji: '🍎' },
  { name: 'Orange', hindi: 'संतरा', emoji: '🍊' },
  { name: 'Turmeric', hindi: 'हल्दी', emoji: '🟨' },
  { name: 'Cumin', hindi: 'जीरा', emoji: '🌿' },
];

const UNIT_OPTIONS = ['kg', 'quintal', 'ton', 'bag', 'piece', 'dozen'];
const PRICE_UNIT_OPTIONS = ['kg', 'quintal', 'ton', 'piece'];
const GRADE_OPTIONS = ['A', 'B', 'C', 'Premium', 'Standard'];
const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Pickup Only / सिर्फ़ पिकअप' },
  { value: 'delivery', label: 'Delivery Only / सिर्फ़ डिलीवरी' },
  { value: 'both', label: 'Both / दोनों' },
];

export default function AddListing() {
  const { user, profile } = useAuthContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { id } = useParams();
  const [existingPhotoUrl, setExistingPhotoUrl] = useState('');
  const [fetchingListing, setFetchingListing] = useState(false);

  // Form state
  const [cropName, setCropName] = useState('');
  const [cropNameHindi, setCropNameHindi] = useState('');
  const [customCrop, setCustomCrop] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('quintal');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [priceUnit, setPriceUnit] = useState('quintal');
  const [location, setLocation] = useState(profile?.address || '');
  const [grade, setGrade] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [bagCount, setBagCount] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState('both');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');

  // Fetch listing data if in edit mode
  useEffect(() => {
    if (!id || !user) return;
    const loadListing = async () => {
      setFetchingListing(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setCropName(data.crop_name || '');
        setCropNameHindi(data.crop_name_hindi || '');
        setQuantity(data.quantity?.toString() || '');
        setUnit(data.unit || 'quintal');
        setPricePerUnit(data.price_per_unit?.toString() || '');
        setPriceUnit(data.price_unit || 'quintal');
        setLocation(data.location || '');
        setGrade(data.grade || '');
        setHarvestDate(data.harvest_date || '');
        setBagCount(data.bag_count?.toString() || '');
        setIsOrganic(!!data.is_organic);
        setDeliveryOption(data.delivery_option || 'both');
        if (data.photo_url) {
          setExistingPhotoUrl(data.photo_url);
          setPhotoPreview(data.photo_url);
        }
      } else {
        toast.error('Listing not found or unauthorized.');
        navigate('/dashboard');
      }
      setFetchingListing(false);
    };
    loadListing();
  }, [id, user, navigate]);

  // UI state
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showCropDropdown, setShowCropDropdown] = useState(false);
  const [cropSearch, setCropSearch] = useState('');

  const filteredCrops = CROP_OPTIONS.filter(
    c => c.name.toLowerCase().includes(cropSearch.toLowerCase()) || c.hindi.includes(cropSearch)
  );

  const selectCrop = (crop: typeof CROP_OPTIONS[0]) => {
    setCropName(crop.name);
    setCropNameHindi(crop.hindi);
    setShowCropDropdown(false);
    setCropSearch('');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const uploadPhoto = async (file: File): Promise<string | null> => {
    try {
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.2, // Compress aggressively to ~200kb
        maxWidthOrHeight: 1024,
        useWebWorker: false,
      });
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `listings/${user!.id}/${Date.now()}.${ext}`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (!user) { navigate('/login'); return; }

    const finalCropName = cropName || customCrop;
    let hasError = false;
    const errors: Record<string, string> = {};

    if (!finalCropName.trim()) { errors.crop = 'Please select or enter a crop name.'; hasError = true; }
    if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) { errors.quantity = 'Please enter a valid quantity.'; hasError = true; }
    if (!pricePerUnit || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) <= 0) { errors.price = 'Please enter a valid price.'; hasError = true; }

    if (hasError) {
      setFormErrors(errors);
      toast.error('कृपया सभी फील्ड भरें / Please fill all fields properly', { duration: 4000 });
      return;
    }

    setPublishing(true);

    let photoUrl: string | null = existingPhotoUrl || null;
    if (photo) {
      try {
        photoUrl = await uploadPhoto(photo);
      } catch {
        toast.error('Photo upload failed. Please try again.');
        setPublishing(false);
        return;
      }
    }

    const insertData = {
      user_id: user.id,
      crop_name: finalCropName,
      crop_name_hindi: cropNameHindi || null,
      quantity: Number(quantity),
      unit,
      price_per_unit: Number(pricePerUnit),
      price_unit: priceUnit,
      location: location || profile?.address || null,
      status: 'available',
      is_approved: true,
      photo_url: photoUrl,
      grade: grade || null,
      harvest_date: harvestDate || null,
      bag_count: bagCount ? parseInt(bagCount) : null,
      is_organic: Boolean(isOrganic),
      delivery_option: deliveryOption || 'both',
    };

    let dbError = null;
    try {
      // Ensure profile exists for phone-auth users before inserting
      const { data: profileCheck } = await supabase.from('profiles').select('id').eq('id', user.id).single();
      if (!profileCheck) {
        const emailPrefix = user.email ? user.email.split('@')[0] : null;
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || emailPrefix || 'User',
          username: emailPrefix || `user_${Date.now()}`,
          role: 'farmer',
        });
      }

      if (id) {
        const { error } = await supabase
          .from('listings')
          .update(insertData)
          .eq('id', id)
          .eq('user_id', user.id);
        dbError = error;
      } else {
        const { error } = await supabase
          .from('listings')
          .insert(insertData);
        dbError = error;
      }
    } catch (err) {
      dbError = err;
    }

    if (dbError) {
      let msg = dbError.message || 'Unknown error';
      if (msg.includes('violates foreign key')) msg = 'Account not set up properly. Please logout, login again, and try.';
      else if (msg.includes('null value in column')) msg = 'Missing required field. Please fill all fields and try again.';
      toast.error(msg);
      setPublishing(false);
      return;
    }

    setPublished(true);
    setPublishing(false);
    toast.success(id ? 'Listing updated successfully!' : 'Listing published successfully!');
    setTimeout(() => navigate('/dashboard'), 2500);
  };

  if (published) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-body)' }}>
        <div className="bg-white rounded-3xl shadow-xl p-10 text-center max-w-sm mx-4 animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={44} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Listed Successfully! ✅</h2>
          <p className="text-gray-500 text-sm">आपकी फसल सफलतापूर्वक लिस्ट हो गई है।</p>
          <p className="text-gray-400 text-xs mt-3">Redirecting to Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--bg-body)' }}>
      <Toaster position="top-center" />
      {/* Header */}
      <header className="bg-white px-5 py-5 shadow-sm border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
              <Plus size={20} className="text-white" />
            </div>
            {id ? 'Edit Your Listing / फसल सुधारें' : 'Add Your Listing / फसल जोड़ें'}
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1 ml-11">
            {id ? 'Update your crop details • अपनी फसल की जानकारी सुधारें' : ' अपनी फसल की जानकारी भरें • Fill your crop details'}
          </p>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>

          {/* ── Crop Selection ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <Leaf size={16} className="text-green-500" /> Crop Name / फसल का नाम <span className="text-red-400">*</span>
            </label>

            {cropName ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{CROP_OPTIONS.find(c => c.name === cropName)?.emoji || '🌱'}</span>
                  <div>
                    <p className="font-bold text-gray-900">{cropName}</p>
                    <p className="text-xs text-gray-500">{cropNameHindi}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setCropName(''); setCropNameHindi(''); }} className="text-xs font-bold text-red-400 hover:text-red-600">Change</button>
              </div>
            ) : (
              <div className="relative">
                <div
                  onClick={() => setShowCropDropdown(!showCropDropdown)}
                  className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 cursor-pointer hover:border-green-400 transition-colors"
                >
                  <span className="text-gray-400 text-sm">Select a crop...</span>
                  <ChevronDown size={18} className="text-gray-400" />
                </div>

                {showCropDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-30 max-h-72 overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <input
                        type="text"
                        placeholder="Search crop / फसल खोजें..."
                        value={cropSearch}
                        onChange={e => setCropSearch(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
                        autoFocus
                      />
                    </div>
                    <div className="overflow-y-auto max-h-52">
                      {filteredCrops.map(c => (
                        <button
                          type="button"
                          key={c.name}
                          onClick={() => selectCrop(c)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition-colors text-left"
                        >
                          <span className="text-xl">{c.emoji}</span>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.hindi}</p>
                          </div>
                        </button>
                      ))}
                      {filteredCrops.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">No match found</p>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-400 mt-2">Or type a custom crop name below:</p>
                <input
                  type="text"
                  placeholder="e.g. Amla, Drumstick..."
                  value={customCrop}
                  onChange={e => setCustomCrop(e.target.value)}
                  className="mt-2 w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
                />
              </div>
            )}
            {formErrors.crop && <p className="text-red-500 text-xs mt-1.5 ml-1">{formErrors.crop}</p>}
          </div>

          {/* ── Quantity & Price ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-2">
                  <Package size={14} className="text-blue-500" /> Quantity <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" min="0" step="any"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={e => { setQuantity(e.target.value); setFormErrors(p => ({...p, quantity: ''})) }}
                  className={`w-full bg-gray-50 border ${formErrors.quantity ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400`}
                  required
                />
                {formErrors.quantity && <p className="text-red-500 text-xs mt-1.5 ml-1">{formErrors.quantity}</p>}
              </div>
              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">Unit / इकाई</label>
                <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 appearance-none">
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-bold text-gray-800 mb-2">
                  <IndianRupee size={14} className="text-amber-500" /> Price (₹) <span className="text-red-400">*</span>
                </label>
                <input
                  type="number" min="0" step="any"
                  placeholder="e.g. 2200"
                  value={pricePerUnit}
                  onChange={e => { setPricePerUnit(e.target.value); setFormErrors(p => ({...p, price: ''})) }}
                  className={`w-full bg-gray-50 border ${formErrors.price ? 'border-red-400' : 'border-gray-200'} rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400`}
                  required
                />
                {formErrors.price && <p className="text-red-500 text-xs mt-1.5 ml-1">{formErrors.price}</p>}
              </div>
              <div>
                <label className="text-sm font-bold text-gray-800 mb-2 block">Per / प्रति</label>
                <select value={priceUnit} onChange={e => setPriceUnit(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 appearance-none">
                  {PRICE_UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Location ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-2">
              <MapPin size={14} className="text-rose-500" /> Location / स्थान
            </label>
            <input
              type="text"
              placeholder="e.g. Indore Mandi, MP"
              value={location}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
            />
          </div>

          {/* ── Quality Details (collapsible) ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4">
              <Star size={14} className="text-yellow-500" /> Quality Details / गुणवत्ता (Optional)
            </p>
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Grade / ग्रेड</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 appearance-none">
                <option value="">Select</option>
                {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-gray-500 mb-1">
                  <Calendar size={12} className="text-indigo-400" /> Harvest Date
                </label>
                <input
                  type="date"
                  value={harvestDate}
                  onChange={e => setHarvestDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Bag Count / बोरियाँ</label>
                <input
                  type="number" min="0"
                  placeholder="e.g. 20"
                  value={bagCount}
                  onChange={e => setBagCount(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <button
                type="button"
                onClick={() => setIsOrganic(!isOrganic)}
                className={`w-12 h-7 rounded-full transition-all duration-300 relative ${isOrganic ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${isOrganic ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
              <span className="text-sm font-semibold text-gray-700">Organic / जैविक 🌿</span>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Delivery Option</label>
              <select value={deliveryOption} onChange={e => setDeliveryOption(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400 appearance-none">
                {DELIVERY_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {/* ── Photo Upload ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <label className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-3">
              <Upload size={14} className="text-violet-500" /> Photo / फोटो (Optional)
            </label>
            {photoPreview ? (
              <div className="relative">
                <img src={photoPreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(''); }}
                  className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors shadow-md"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-center hover:border-green-400 hover:bg-green-50/30 transition-all cursor-pointer group"
              >
                <Upload size={28} className="mx-auto text-gray-300 group-hover:text-green-400 transition-colors mb-2" />
                <p className="text-sm text-gray-400 group-hover:text-green-600 font-medium">Click to upload photo</p>
                <p className="text-xs text-gray-300 mt-1">JPG, PNG up to 5MB</p>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          </div>

          {/* ── Submit ── */}
          <button
            type="submit"
            disabled={publishing}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {publishing ? (
              <><Loader2 size={22} className="animate-spin" /> Saving...</>
            ) : (
              <><Plus size={22} /> {id ? 'Save Changes • फसल अपडेट करें' : 'Publish Listing • फसल लिस्ट करें'}</>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 pb-32">
            Your listing will be immediately visible to buyers across India.
          </p>
        </form>
      </main>
    </div>
  );
}
