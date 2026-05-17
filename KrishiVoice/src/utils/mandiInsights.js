export const LOCATION_HINTS = [
  { district: 'Patna', state: 'Bihar', keywords: ['patna', 'bihta', 'bihar'], lat: 25.5941, lng: 85.1376 },
  { district: 'Purnea', state: 'Bihar', keywords: ['purnea', 'purnia', 'bihar'], lat: 25.7771, lng: 87.4753 },
  { district: 'Lucknow', state: 'Uttar Pradesh', keywords: ['lucknow', 'uttar pradesh', 'up'], lat: 26.8467, lng: 80.9462 },
  { district: 'Agra', state: 'Uttar Pradesh', keywords: ['agra', 'uttar pradesh', 'up'], lat: 27.1767, lng: 78.0081 },
  { district: 'Kanpur', state: 'Uttar Pradesh', keywords: ['kanpur', 'uttar pradesh', 'up'], lat: 26.4499, lng: 80.3319 },
  { district: 'Muzaffarnagar', state: 'Uttar Pradesh', keywords: ['muzaffarnagar', 'uttar pradesh', 'up'], lat: 29.4727, lng: 77.7085 },
  { district: 'Indore', state: 'Madhya Pradesh', keywords: ['indore', 'madhya pradesh', 'mp'], lat: 22.7196, lng: 75.8577 },
  { district: 'Bhopal', state: 'Madhya Pradesh', keywords: ['bhopal', 'madhya pradesh', 'mp'], lat: 23.2599, lng: 77.4126 },
  { district: 'Neemuch', state: 'Madhya Pradesh', keywords: ['neemuch', 'madhya pradesh', 'mp'], lat: 24.4734, lng: 74.872 },
  { district: 'Nagpur', state: 'Maharashtra', keywords: ['nagpur', 'maharashtra'], lat: 21.1458, lng: 79.0882 },
  { district: 'Nashik', state: 'Maharashtra', keywords: ['nashik', 'maharashtra'], lat: 19.9975, lng: 73.7898 },
  { district: 'Pune', state: 'Maharashtra', keywords: ['pune', 'maharashtra'], lat: 18.5204, lng: 73.8567 },
  { district: 'Madurai', state: 'Tamil Nadu', keywords: ['madurai', 'tamil nadu', 'tn'], lat: 9.9252, lng: 78.1198 },
  { district: 'Nagapattinam', state: 'Tamil Nadu', keywords: ['nagapattinam', 'tamil nadu', 'tn'], lat: 10.7656, lng: 79.8428 },
  { district: 'Ludhiana', state: 'Punjab', keywords: ['ludhiana', 'punjab'], lat: 30.9009, lng: 75.8573 },
  { district: 'Bathinda', state: 'Punjab', keywords: ['bathinda', 'punjab'], lat: 30.211, lng: 74.9455 },
  { district: 'Rajkot', state: 'Gujarat', keywords: ['rajkot', 'gujarat'], lat: 22.3039, lng: 70.8022 },
  { district: 'Junagadh', state: 'Gujarat', keywords: ['junagadh', 'gujarat'], lat: 21.5222, lng: 70.4579 },
  { district: 'Jaipur', state: 'Rajasthan', keywords: ['jaipur', 'rajasthan'], lat: 26.9124, lng: 75.7873 },
  { district: 'Bharatpur', state: 'Rajasthan', keywords: ['bharatpur', 'rajasthan'], lat: 27.2152, lng: 77.4904 },
  { district: 'Wayanad', state: 'Kerala', keywords: ['wayanad', 'kerala'], lat: 11.6085, lng: 76.083 },
  { district: 'Delhi', state: 'Delhi', keywords: ['delhi'], lat: 28.6139, lng: 77.209 },
  { district: 'Surat', state: 'Gujarat', keywords: ['surat', 'gujarat'], lat: 21.1702, lng: 72.8311 },
];

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();
const toNumber = (value) => Number(value || 0);

const convertPrice = (value, fromUnit, toUnit) => {
  if (!value) return 0;
  if (fromUnit === toUnit) return Number(value);
  if (fromUnit === 'quintal' && toUnit === 'kg') return Number(value) / 100;
  if (fromUnit === 'kg' && toUnit === 'quintal') return Number(value) * 100;
  return Number(value);
};

const toRadians = (value) => (value * Math.PI) / 180;

const haversineDistanceKm = (left, right) => {
  if (!left?.lat || !left?.lng || !right?.lat || !right?.lng) return Number.POSITIVE_INFINITY;

  const earthRadiusKm = 6371;
  const deltaLat = toRadians(right.lat - left.lat);
  const deltaLng = toRadians(right.lng - left.lng);
  const startLat = toRadians(left.lat);
  const endLat = toRadians(right.lat);

  const a =
    (Math.sin(deltaLat / 2) ** 2) +
    Math.cos(startLat) * Math.cos(endLat) * (Math.sin(deltaLng / 2) ** 2);

  return earthRadiusKm * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

export const formatLocationLabel = (location) => (
  [location?.district, location?.state].filter(Boolean).join(', ')
);

export const findLocationHint = (value) => {
  const searchText = normalizeText(value);
  if (!searchText) return null;

  const hintedLocation = LOCATION_HINTS.find((hint) => {
    const tokens = [hint.district, hint.state, ...(hint.keywords || [])].map(normalizeText).filter(Boolean);
    return tokens.some((keyword) => searchText.includes(keyword));
  });

  if (hintedLocation) {
    return { ...hintedLocation, source: 'matched' };
  }

  const parts = searchText.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  return {
    district: parts.length > 1 ? parts[parts.length - 2] : parts[0],
    state: parts[parts.length - 1] || '',
    keywords: [],
    source: 'typed',
  };
};

export const getNearestKnownLocation = ({ lat, lng }) => {
  if (!toNumber(lat) || !toNumber(lng)) return null;

  const nearest = LOCATION_HINTS
    .map((hint) => ({
      ...hint,
      distanceKm: haversineDistanceKm({ lat: toNumber(lat), lng: toNumber(lng) }, hint),
    }))
    .sort((left, right) => left.distanceKm - right.distanceKm)[0];

  return nearest ? { ...nearest, source: 'device' } : null;
};

const inferFarmerLocation = (profile, preferredLocation) => {
  if (preferredLocation?.district || preferredLocation?.state) {
    return preferredLocation;
  }

  const addressText = normalizeText(`${profile?.address || ''} ${profile?.state || ''}`);
  return findLocationHint(addressText);
};

export const normalizeMandiEntry = (entry) => ({
  crop: entry.crop_name || entry.crop || '',
  cropHindi: entry.crop_name_hindi || entry.cropHindi || '',
  price: Number(entry.price_modal || entry.price || 0),
  priceMin: Number(entry.price_min || 0),
  priceMax: Number(entry.price_max || 0),
  unit: entry.unit || 'quintal',
  mandi: entry.mandi_name || entry.mandi || 'Nearby Mandi',
  district: entry.district || entry.location || '',
  state: entry.state || '',
  lat: toNumber(entry.lat),
  lng: toNumber(entry.lng),
});

export function getMandiPriceGuidance({ crop, userPrice, userPriceUnit = 'quintal', profile, mandiPrices, preferredLocation }) {
  if (!crop || !mandiPrices?.length) return null;

  const matchingPrices = mandiPrices
    .map(normalizeMandiEntry)
    .filter((entry) => normalizeText(entry.crop) === normalizeText(crop) && entry.price > 0);

  if (matchingPrices.length === 0) return null;

  const farmerLocation = inferFarmerLocation(profile, preferredLocation);
  const rankedPrices = matchingPrices
    .map((entry) => {
      const searchText = normalizeText(`${entry.district} ${entry.state} ${entry.mandi}`);
      let score = 0;

      if (farmerLocation?.district && searchText.includes(normalizeText(farmerLocation.district))) score += 5;
      if (farmerLocation?.state && searchText.includes(normalizeText(farmerLocation.state))) score += 3;
      if (farmerLocation?.keywords?.some((keyword) => searchText.includes(normalizeText(keyword)))) score += 1;

      const distanceKm = farmerLocation?.lat && farmerLocation?.lng && entry?.lat && entry?.lng
        ? haversineDistanceKm(farmerLocation, entry)
        : Number.POSITIVE_INFINITY;

      return { ...entry, score, distanceKm };
    })
    .sort((left, right) =>
      right.score - left.score ||
      left.distanceKm - right.distanceKm ||
      left.price - right.price
    );

  const bestMarket = rankedPrices[0];
  const marketPrice = Math.round(convertPrice(bestMarket.price, bestMarket.unit, userPriceUnit));
  const averagePrice = Math.round(
    rankedPrices.reduce((sum, entry) => sum + convertPrice(entry.price, entry.unit, userPriceUnit), 0) / rankedPrices.length
  );
  const suggestedPrice = Math.round((marketPrice * 0.7) + (averagePrice * 0.3));
  const suggestedMin = Math.round(suggestedPrice * 0.98);
  const suggestedMax = Math.round(suggestedPrice * 1.03);
  const priceDelta = typeof userPrice === 'number' && userPrice > 0 ? Math.round(userPrice - marketPrice) : null;

  let insight = 'Use the mandi range as a safe starting point.';
  if (priceDelta !== null) {
    if (priceDelta < -25) insight = 'Your entered price is below the nearby mandi trend.';
    if (priceDelta > 25) insight = 'Your entered price is above the nearby mandi trend.';
    if (Math.abs(priceDelta) <= 25) insight = 'Your entered price is close to the local mandi trend.';
  }

  return {
    bestMarket,
    farmerLocation,
    marketPrice,
    averagePrice,
    suggestedPrice,
    suggestedMin,
    suggestedMax,
    unit: userPriceUnit,
    priceDelta,
    insight,
  };
}
