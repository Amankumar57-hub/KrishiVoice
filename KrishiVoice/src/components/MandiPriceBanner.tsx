import { useEffect, useState } from 'react';
import { mockMandiPrices } from '../mock/mandiPrices';
import { useAuthContext } from '../context/AuthContext';

const EMOJI = {
  // Cereals
  Wheat: '🌾', Rice: '🍚', Maize: '🌽', Barley: '🌾', Sorghum: '🌾',
  'Pearl Millet': '🌾', 'Finger Millet': '🌾', Oats: '🌾',
  // Pulses
  Chickpea: '🫛', 'Pigeon Pea': '🫛', 'Green Gram': '🫛', 'Black Gram': '🫛',
  'Red Lentil': '🫘', 'Horse Gram': '🫛', 'Moth Bean': '🫛',
  // Oilseeds
  Soybean: '🫘', Groundnut: '🥜', Mustard: '🟡', Sesame: '🟤', Sunflower: '🌻',
  Castor: '🌱', Linseed: '🌱',
  // Vegetables
  Potato: '🥔', Onion: '🧅', Tomato: '🍅', Brinjal: '🍆', Okra: '🥬',
  Cauliflower: '🥦', Cabbage: '🥬', 'Green Peas': '🫛', Spinach: '🥬',
  'Bitter Gourd': '🥒', 'Bottle Gourd': '🥒', 'Ridge Gourd': '🥒', Pumpkin: '🎃',
  Carrot: '🥕', Radish: '🥬', Beetroot: '🍎', Cucumber: '🥒', 'Green Chilli': '🌶️',
  // Fruits
  Banana: '🍌', Mango: '🥭', Apple: '🍎', Orange: '🍊', Grapes: '🍇',
  Watermelon: '🍉', Pomegranate: '🍎', Papaya: '🍈', Guava: '🍐',
  // Cash crops & Spices
  Sugarcane: '🌿', Cotton: '🌸', Turmeric: '🟡', Ginger: '🫚', Garlic: '🧄',
  'Black Pepper': '🫚', Cardamom: '🌿', Cinnamon: '🪵', Clove: '🌸',
  Tea: '🍵', Coffee: '☕', Jute: '🌿', Tobacco: '🚬',
};

const CHANGE = {
  // Cereals
  Wheat: '+1.2%', Rice: '+0.8%', Maize: '-0.5%', Barley: '+0.3%',
  Sorghum: '+1.1%', 'Pearl Millet': '-0.2%', 'Finger Millet': '+0.5%', Oats: '0%',
  // Pulses
  Chickpea: '-0.2%', 'Pigeon Pea': '+1.5%', 'Green Gram': '+0.8%',
  'Black Gram': '+1.2%', 'Red Lentil': '+0.4%', 'Horse Gram': '+0.6%',
  'Moth Bean': '+0.5%',
  // Oilseeds
  Soybean: '+2.1%', Groundnut: '+1.5%', Mustard: '+0.3%', Sesame: '+0.9%',
  Sunflower: '-0.4%', Castor: '+1.0%', Linseed: '+0.7%',
  // Vegetables
  Potato: '+3.5%', Onion: '-1.1%', Tomato: '+5.2%', Brinjal: '+0.8%',
  Okra: '+1.2%', Cauliflower: '-0.6%', Cabbage: '+0.4%', 'Green Peas': '+2.1%',
  Spinach: '+1.5%', 'Bitter Gourd': '-0.8%', 'Bottle Gourd': '0%',
  'Ridge Gourd': '+0.7%', Pumpkin: '+0.2%', Carrot: '+0.9%', Radish: '-0.3%',
  Beetroot: '+1.2%', Cucumber: '+1.8%', 'Green Chilli': '+2.5%',
  // Fruits
  Banana: '+0.6%', Mango: '+2.2%', Apple: '+1.3%', Orange: '-0.7%',
  Grapes: '+3.1%', Watermelon: '+4.2%', Pomegranate: '+0.9%', Papaya: '+1.4%', Guava: '+0.5%',
  // Cash crops & Spices
  Sugarcane: '0%', Cotton: '+0.9%', Turmeric: '+1.1%', Ginger: '-0.7%',
  Garlic: '+2.8%', 'Black Pepper': '+0.4%', Cardamom: '+1.8%',
  Cinnamon: '+0.6%', Clove: '+2.3%', Tea: '+1.8%', Coffee: '-0.6%',
  Jute: '0%', Tobacco: '-0.3%',
};

export default function MandiPriceBanner() {
  const { profile } = useAuthContext();
  const [allPrices] = useState(mockMandiPrices);
  const [prices, setPrices] = useState(mockMandiPrices);
  const [locName, setLocName] = useState('MANDI');

  useEffect(() => {
    if (profile?.address && profile.address.trim() !== '') {
      const userLoc = profile.address.toLowerCase().trim();
      
      // 1. Try to find exact/partial district match
      const districtMatch = allPrices.filter(p => 
        userLoc.includes(p.district.toLowerCase()) || 
        p.district.toLowerCase().includes(userLoc)
      );
      
      if (districtMatch.length > 0) {
        setPrices(districtMatch);
        setLocName(districtMatch[0].district.toUpperCase());
        return;
      }
      
      // 2. Try to find state match
      const stateMatch = allPrices.filter(p => 
        userLoc.includes(p.state.toLowerCase()) || 
        p.state.toLowerCase().includes(userLoc)
      );
      
      if (stateMatch.length > 0) {
        setPrices(stateMatch);
        setLocName(stateMatch[0].state.toUpperCase());
        return;
      }
    }
    
    // Fallback
    setPrices(allPrices);
    setLocName('MANDI');
  }, [profile?.address, allPrices]);

  if (prices.length === 0) return null;

  return (
    <div
      className="sticky top-0 z-30 overflow-hidden shadow-lg"
      style={{
        background: 'linear-gradient(135deg, #0f3d1a 0%, #1a5228 40%, #166534 70%, #0f3d1a 100%)',
      }}
    >
      <div className="flex items-stretch">

        {/* ── LIVE Badge ── */}
        <div
          className="shrink-0 flex flex-col items-center justify-center px-3 py-2 gap-0.5 z-10"
          style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            boxShadow: '4px 0 12px rgba(0,0,0,0.3)',
            minWidth: '54px',
          }}
        >
          <span className="text-[7px] text-yellow-900 font-black uppercase tracking-[0.15em] leading-none truncate w-12 text-center" title={locName}>
            {locName}
          </span>
          <span className="text-[7px] text-yellow-900 font-black uppercase tracking-[0.15em] leading-none">LIVE</span>
          <span
            className="mt-1 w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#7c3a00', boxShadow: '0 0 6px #f59e0b' }}
          />
        </div>

        {/* ── Scrolling Ticker ── */}
        <div className="flex-1 overflow-hidden relative">
          {/* fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
               style={{ background: 'linear-gradient(to right, #0f3d1a, transparent)' }} />
          <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
               style={{ background: 'linear-gradient(to left, #0f3d1a, transparent)' }} />

          <div className="py-2.5 animate-ticker whitespace-nowrap inline-flex items-center">
            {/* Doubled for seamless loop */}
            {[...prices, ...prices].map((p, i) => {
              const chg  = CHANGE[p.crop] || '0%';
              const isUp = !chg.startsWith('-') && chg !== '0%';
              return (
                <span key={i} className="inline-flex items-center gap-1.5 mx-5">
                  {/* Emoji */}
                  <span className="text-base leading-none">{EMOJI[p.crop] || '🌾'}</span>

                  {/* Crop name EN — white, bold */}
                  <span
                    className="font-bold text-[13px] tracking-wide"
                    style={{ color: '#ffffff', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                  >
                    {p.crop}
                  </span>

                  {/* Hindi in softer yellow */}
                  <span className="text-[11px] font-medium" style={{ color: '#fde68a' }}>
                    {p.cropHindi}
                  </span>

                  {/* Price — large amber */}
                  <span
                    className="font-black text-[14px]"
                    style={{
                      color: '#fbbf24',
                      textShadow: '0 0 8px rgba(251,191,36,0.4)',
                    }}
                  >
                    ₹{p.price.toLocaleString('en-IN')}
                  </span>

                  {/* Unit */}
                  <span className="text-[10px] font-medium" style={{ color: '#86efac' }}>
                    /{p.unit}
                  </span>

                  {/* Change badge */}
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: isUp ? 'rgba(134,239,172,0.2)' : 'rgba(252,165,165,0.2)',
                      color: isUp ? '#86efac' : '#fca5a5',
                      border: `1px solid ${isUp ? 'rgba(134,239,172,0.3)' : 'rgba(252,165,165,0.3)'}`,
                    }}
                  >
                    {isUp ? '▲' : '▼'} {chg}
                  </span>

                  {/* Location label (small) */}
                  <span className="text-[10px] font-medium tracking-wide" style={{ color: '#a7f3d0', marginLeft: '4px' }}>
                    ({p.district || p.state || 'Local'})
                  </span>

                  {/* Separator */}
                  <span className="text-green-600 mx-1 text-lg leading-none">·</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* ── Right label ── */}
        <div
          className="shrink-0 flex flex-col items-center justify-center px-2.5 text-center"
          style={{ minWidth: '40px' }}
        >
          <span className="text-[8px] font-bold text-green-300 leading-tight tracking-widest uppercase">मंडी</span>
          <span className="text-[8px] font-bold text-green-300 leading-tight tracking-widest uppercase">भाव</span>
        </div>
      </div>
    </div>
  );
}
