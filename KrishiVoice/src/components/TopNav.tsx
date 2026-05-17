import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import {
  Search,
  LayoutDashboard,
  Settings,
  History,
  Menu,
  X,
  Bell,
  LogIn,
  AlertCircle,
  Truck,
  Globe,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';

export default function TopNav() {
  const { user, profile } = useAuthContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { language, languages, currentLanguage, changeLanguage } = useLanguage();
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Starts with a welcoming prompt
  const [notifs, setNotifs] = useState<any[]>([
    { id: 'welcome', title: 'Welcome to KrishiVoice! 🎉', desc: 'Use voice to list your crops or find sellers nearby.', color: 'sky', icon: TrendingUp, path: '/' }
  ]);
  const menuRef = useRef(null);
  const notifyRef = useRef(null);

  // ── Mandi Price Notifications ──
  useEffect(() => {
    const role = profile?.role || 'farmer'; // default notify farmers

    // Helper to create a price-change notification
    const makePriceNotif = (cropName: string, cropHindi: string, newPrice: number, prevPrice: number) => {
      if (!prevPrice || !newPrice || prevPrice === newPrice) return null;
      const changeAmt = newPrice - prevPrice;
      const changePct = ((changeAmt / prevPrice) * 100).toFixed(1);
      const isUp = changeAmt > 0;

      // Farmers care about price UP (sell now), Buyers care about price DOWN (buy now)
      if (isUp && role !== 'farmer') return null;
      if (!isUp && role !== 'buyer') return null;

      return {
        id: `price-${cropName}-${Date.now()}`,
        title: `${cropName} ${isUp ? '▲' : '▼'} ${isUp ? '+' : ''}${changePct}%`,
        desc: isUp
          ? `मंडी भाव ₹${newPrice.toLocaleString('en-IN')}/q — अभी बेचें! ${cropHindi}`
          : `मंडी भाव ₹${newPrice.toLocaleString('en-IN')}/q — सस्ता मिल रहा है! ${cropHindi}`,
        icon: isUp ? ArrowUpRight : ArrowDownRight,
        color: isUp ? 'green' : 'red',
        path: `/search?crop=${encodeURIComponent(cropName)}`,
        isUp,
      };
    };

    // Fetch the latest records for all crops in a single query on mount
    const loadInitialNotifs = async () => {
      const crops = ['Wheat', 'Rice', 'Maize', 'Soybean', 'Mustard', 'Chickpea', 'Potato', 'Onion', 'Tomato', 'Cotton', 'Groundnut'];
      const initial: any[] = [];
      
      const { data, error } = await supabase
        .from('mandi_prices')
        .select('crop_name, price_modal, previous_price_modal, crop_name_hindi')
        .in('crop_name', crops)
        .order('created_at', { ascending: false });

      if (data) {
        // Since we order by created_at desc, we take the FIRST record for each crop
        const uniqueCrops = new Set();
        data.forEach(row => {
          if (!uniqueCrops.has(row.crop_name)) {
            uniqueCrops.add(row.crop_name);
            const n = makePriceNotif(row.crop_name, row.crop_name_hindi || '', row.price_modal, row.previous_price_modal);
            if (n) initial.push(n);
          }
        });
      }

      if (initial.length > 0) {
        setNotifs(prev => [...initial, ...prev]);
        setUnreadCount(initial.length);
      }
    };
    loadInitialNotifs();

    // Subscribe to live mandi_prices changes
    const channel = supabase
      .channel('mandi-price-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mandi_prices' },
        (payload) => {
          const row = payload.new as any;
          const n = makePriceNotif(row.crop_name, row.crop_name_hindi || '', row.price_modal, row.previous_price_modal);
          if (n) {
            setNotifs(prev => [n, ...prev]);
            setUnreadCount(c => c + 1);
            // Browser push notification if permitted
            if (Notification.permission === 'granted') {
              new Notification(`KrishiVoice — ${n.title}`, { body: n.desc, icon: '/krishivoice-icon.png' });
            }
          }
        }
      )
      .subscribe();

    // Request notification permission on first load
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => { supabase.removeChannel(channel); };
  }, [profile?.role]);

  const displayName = profile?.full_name || profile?.username || '';
  const avatarUrl = profile?.avatar_url;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const NAV_LINKS = [
    { label: t('nav.home'), icon: LayoutDashboard, path: '/' },
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { label: t('nav.search'), icon: Search, path: '/search' },
    { label: t('nav.transport'), icon: Truck, path: '/transport' },
  ];

  const MENU_LINKS = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard', color: 'bg-blue-500' },
    { label: t('nav.history'), icon: History, path: '/profile', color: 'bg-purple-500' },
    { label: t('nav.settings'), icon: Settings, path: '/settings', color: 'bg-gray-500' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shadow-sm">
              <img src="/krishivoice-icon.png" alt="KrishiVoice" className="w-full h-full object-cover" />
            </div>
            <div className="hidden sm:block">
              <p className="font-black text-gray-900 text-lg tracking-tight leading-none">KrishiVoice</p>
              <p className="text-primary text-[10px] font-bold">कृषि आवाज़</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                  isActive(link.path) 
                    ? 'bg-sky-50 text-primary' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <link.icon size={16} />
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Actions Wrapper */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <Globe size={15} className="text-primary shrink-0" />
              <select
                value={language}
                onChange={(e) => {
                  void changeLanguage(e.target.value);
                }}
                aria-label={t('nav.language')}
                className="bg-transparent text-sm font-semibold text-gray-700 outline-none"
              >
                {languages.map((langOption) => (
                  <option key={langOption.id} value={langOption.id}>
                    {langOption.flag} {langOption.native}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Notification Bell */}
            <div className="relative" ref={notifyRef}>
              <button 
                onClick={() => {
                    setShowNotifications(!showNotifications);
                    setUnreadCount(0);
                  }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full border border-white flex items-center justify-center text-[9px] font-black text-white px-0.5">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute top-full right-0 mt-3 w-80 glass-premium rounded-3xl shadow-2xl z-[100] p-5 animate-fade-in-scale border border-white/40">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100/50">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{t('nav.notifications')}</h3>
                    {notifs.length > 0 && <span className="text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">{notifs.length} NEW</span>}
                  </div>
                  <div className="space-y-3">
                    {notifs.length === 0 ? (
                      <p className="text-xs text-center py-4" style={{ color: '#9ca3af' }}>{t('nav.noNotifications')}</p>
                    ) : (
                      notifs.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (n.path) navigate(n.path);
                            setShowNotifications(false);
                          }}
                          className="flex gap-3 p-3 rounded-xl transition-all cursor-pointer hover:scale-[1.01] active:scale-95"
                          style={{
                            backgroundColor: n.color === 'red' ? '#fef2f2' : n.color === 'green' ? '#f0fdf4' : '#f0f9ff',
                            border: `1px solid ${n.color === 'red' ? '#fecaca' : n.color === 'green' ? '#dcfce7' : '#bae6fd'}`,
                          }}
                        >
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: n.color === 'red' ? '#fee2e2' : n.color === 'green' ? '#dcfce7' : '#e0f2fe',
                              color: n.color === 'red' ? '#dc2626' : n.color === 'green' ? '#16a34a' : '#0284c7',
                            }}
                          >
                            <n.icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-black truncate" style={{ color: '#1f2937' }}>{n.title}</p>
                            <p className="text-[10px] leading-snug" style={{ color: '#6b7280' }}>{n.desc}</p>
                            {n.path && n.path.startsWith('/search') && (
                              <p className="text-[9px] font-bold text-primary mt-0.5">Tap to see listings →</p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifs.length > 0 && (
                    <button 
                      onClick={() => setNotifs([])}
                      className="w-full mt-3 py-1.5 text-[10px] font-bold transition-colors hover:opacity-70"
                      style={{ color: '#6b7280' }}
                    >
                      {t('nav.clearAll')}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop User Logic / Mobile Menu */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="hidden sm:block">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-primary border-2 border-white flex items-center justify-center text-white font-bold text-sm shadow-sm hover:ring-2 hover:ring-sky-100 transition-all">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      (displayName[0] || 'U').toUpperCase()
                    )}
                  </div>
                </Link>
                {/* Hamburger Menu Icon */}
                <div className="relative" ref={menuRef}>
                  <button 
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
                  >
                    {showMenu ? <X size={24} /> : <Menu size={24} />}
                  </button>
                  
                  {showMenu && (
                    <div className="absolute top-full right-0 mt-3 w-64 glass-premium rounded-3xl shadow-2xl z-[100] overflow-hidden animate-fade-in-scale border border-white/40">
                      <div className="p-5 flex items-center gap-4 bg-primary/5 border-b border-gray-100/50">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden bg-primary flex items-center justify-center text-white font-black text-lg shadow-inner ring-4 ring-white/50 shrink-0">
                          {avatarUrl ? (
                            <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            (displayName[0] || 'U').toUpperCase()
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold truncate" style={{ color: '#111827' }}>{displayName}</p>
                          <p className="text-[10px] font-semibold truncate" style={{ color: '#9ca3af' }}>{profile?.role || 'User'}</p>
                        </div>
                      </div>
                      
                      {/* Mobile Only Core Links added to Menu */}
                      <div className="md:hidden py-2" style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-1 mt-1" style={{ color: '#9ca3af' }}>{t('nav.menu')}</p>
                        {NAV_LINKS.map(link => (
                          <Link
                            key={link.path}
                            to={link.path}
                            onClick={() => setShowMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:opacity-80 transition-colors"
                            style={{ color: isActive(link.path) ? '#3730A3' : '#4b5563' }}
                          >
                            <link.icon size={16} />
                            <span className="text-sm font-semibold">{link.label}</span>
                          </Link>
                        ))}
                        <div className="px-4 pt-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#9ca3af' }}>
                            {t('nav.language')}
                          </label>
                          <div className="mt-2 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                            <Globe size={15} className="text-primary shrink-0" />
                            <select
                              value={language}
                              onChange={(e) => {
                                void changeLanguage(e.target.value);
                              }}
                              className="w-full bg-transparent text-sm font-semibold text-gray-700 outline-none"
                            >
                              {languages.map((langOption) => (
                                <option key={langOption.id} value={langOption.id}>
                                  {langOption.flag} {langOption.native}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="py-2">
                        <p className="px-4 text-[10px] font-bold uppercase tracking-widest mb-1 mt-1" style={{ color: '#9ca3af' }}>{t('nav.account')}</p>
                        {MENU_LINKS.map((item, idx) => (
                          <Link 
                            key={idx} 
                            to={item.path}
                            onClick={() => setShowMenu(false)}
                            className="flex items-center gap-3 px-4 py-2 hover:opacity-80 transition-colors group"
                          >
                            <div className={`w-7 h-7 ${item.color} text-white rounded-lg flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                              <item.icon size={14} />
                            </div>
                            <span className="text-sm font-semibold" style={{ color: '#374151' }}>{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="text-sm font-semibold text-primary hover:text-sky-600 px-3 py-2 rounded-lg hover:bg-sky-50 transition-colors flex items-center gap-2">
                  <LogIn size={16} />
                  {currentLanguage.flag} {t('nav.login')}
                </Link>
              </div>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}
