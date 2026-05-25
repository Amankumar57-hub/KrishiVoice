import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { assistantVoice } from '../utils/assistantVoice';
import { supabase } from '../supabaseClient';
import { useAuthContext } from '../context/AuthContext';
import { mockMandiPrices } from '../mock/mandiPrices';
import { formatLocationLabel, getMandiPriceGuidance, normalizeMandiEntry, findLocationHint } from '../utils/mandiInsights';
import { getCropInfo, getAllCrops } from '../data/cropKnowledge';
import { askGemini } from '../utils/geminiService';

const normalizeText = (value) => (value || '').toString().trim().toLowerCase();

// Comprehensive crop database with agricultural knowledge
const CROP_DATABASE = {
  Wheat: {
    hindi: 'गेहूं',
    aliases: ['wheat', 'gehu', 'gehun', 'गेहूं', 'गेहूँ', 'गेहु', 'gahu', 'गहू', 'kanak', 'गेहूं का', 'गेहूं की', 'गेहूं के', 'गोदुमा', 'கோதுமை', 'ਕਣਕ'],
    season: 'Rabi (Oct-Mar)',
    sowing: 'Late Oct to Early Dec',
    harvesting: 'Mar to May',
    waterNeeds: 'Moderate (4-5 irrigations)',
    temperature: '10-25°C optimal',
    soil: 'Loamy, well-drained, pH 6-7.5',
    pests: ['Aphids', 'Pod borer', 'Rust', 'Smut'],
    disease: ['Loose smut', 'Karnal bunt'],
    fertilizers: 'Urea 120kg, DAP 60kg, Potash 40kg per acre (approx)',
    bestPractices: 'Use certified seeds, maintain proper seed rate (100kg/hectare), timely weeding, and incorporate FYM.',
    states: ['Punjab', 'Haryana', 'U.P.', 'M.P.', 'Rajasthan'],
  },
  Rice: {
    hindi: 'चावल / धान',
    aliases: ['rice', 'dhan', 'chawal', 'paddy', 'चावल', 'धान', 'dhaan', 'bhaat', 'biyyam', 'vari', 'akki', 'chal', 'chokha', 'tandul'],
    season: 'Kharif (Jun-Oct)',
    sowing: 'Jun-Jul (with monsoon)',
    harvesting: 'Oct-Nov',
    waterNeeds: 'High (standing water 3-5 cm)',
    temperature: '20-35°C',
    soil: 'Clay loam, pH 5.5-6.5',
    pests: ['Stem borer', 'Leaf folder', 'BLIGHT', 'Brown plant hopper'],
    disease: ['Sheath blight', 'False smut', 'Tungro'],
    fertilizers: 'Urea 80kg, DAP 50kg, MOP 30kg per acre',
    bestPractices: 'Transplant 20-25 day old seedlings, maintain water level, use integrated pest management.',
    states: ['West Bengal', 'Punjab', 'U.P.', 'Andhra Pradesh', 'Tamil Nadu'],
  },
  Maize: {
    hindi: 'मक्का',
    aliases: ['maize', 'corn', 'makka', 'मक्का', 'मकई', 'bhutta', 'makkai'],
    season: 'Kharif & Rabi',
    sowing: 'Jun-Jul (kharif), Oct-Dec (rabi)',
    harvesting: 'Sep-Oct (kharif), Mar-Apr (rabi)',
    waterNeeds: 'Moderate',
    temperature: '18-30°C',
    soil: 'Well-drained loam, pH 5.5-7.5',
    pests: ['Stemborer', 'Earworm', 'Thrips'],
    disease: ['Smut', 'Rust', 'Downy mildew'],
    fertilizers: 'Urea 100kg, DAP 60kg, Potash 30kg per acre',
    bestPractices: 'Use improved hybrids, plant in rows for better aeration, timely harvesting.',
    states: ['Karnataka', 'A.P.', 'Bihar', 'M.P.'],
  },
  Soybean: {
    hindi: 'सोयाबीन',
    aliases: ['soybean', 'soyabean', 'soya', 'सोयाबीन', 'soyabin', 'सोया'],
    season: 'Kharif',
    sowing: 'Jun-Jul',
    harvesting: 'Oct-Nov',
    waterNeeds: 'Low to moderate',
    temperature: '20-30°C',
    soil: 'Well-drained loamy, pH 6-7.5',
    pests: ['Soybean aphid', 'YMV', 'Stem fly', 'Pod borer'],
    disease: ['Yellow mosaic', 'Root rot', 'Rust'],
    fertilizers: 'Urea 40kg, SSP 125kg, MOP 25kg per acre',
    bestPractices: 'Inoculate seeds with Rhizobium, maintain proper spacing (45x10 cm), timely harvesting.',
    states: ['M.P.', 'Maharashtra', 'Rajasthan'],
  },
  Mustard: {
    hindi: 'सरसों',
    aliases: ['mustard', 'sarson', 'सरसों', 'rai', 'raai', 'tori', 'avalu', 'sasive'],
    season: 'Rabi',
    sowing: 'Oct-Nov',
    harvesting: 'Feb-Mar',
    waterNeeds: 'Low',
    temperature: '10-25°C',
    soil: 'Sandy loam, pH 6-7',
    pests: ['Mustard aphid', 'Painted bug', 'Mustard sawfly'],
    disease: ['Alternaria', 'White rust', 'Downey mildew'],
    fertilizers: 'Urea 60kg, DAP 65kg, Potash 40kg per acre',
    bestPractices: 'Seed treatment with fungicide, timely sowing, avoid waterlogging.',
    states: ['Rajasthan', 'M.P.', 'U.P.', 'Haryana', 'Gujarat'],
  },
  Chickpea: {
    hindi: 'चना',
    aliases: ['chickpea', 'chana', 'gram', 'चना', 'kabuli chana', 'கொண்டைக்கடலை', 'ਛੋਲੇ', 'honaga'],
    season: 'Rabi',
    sowing: 'Oct-Nov',
    harvesting: 'Mar-Apr',
    waterNeeds: 'Low (rainfed)',
    temperature: '15-25°C',
    soil: 'Sandy loam to loam, pH 6.5-7.5',
    pests: ['Helicoverpa', 'Aphids', 'Cutworm'],
    disease: ['Fusarium wilt', 'Ascochyta blight', 'Dry root rot'],
    fertilizers: 'Urea 20kg, DAP 60kg, Potash 30kg per acre',
    bestPractices: 'Use disease-resistant varieties, seed treatment, optimal spacing 30x10 cm.',
    states: ['M.P.', 'Rajasthan', 'Maharashtra', 'U.P.'],
  },
  PigeonPea: {
    hindi: 'अरहर / तुअर',
    aliases: ['pigeon pea', 'arhar', 'tur', 'toor', 'अरहर', 'तुअर', 'तूर दाल'],
    season: 'Kharif & Semi-rabi',
    sowing: 'Jun-Jul (kharif), Oct-Nov (semi-rabi)',
    harvesting: 'Dec-Jan (kharif), Mar-Apr (semi-rabi)',
    waterNeeds: 'Low to moderate',
    temperature: '20-30°C',
    soil: 'Deep sandy loam, pH 5.5-7',
    pests: ['Helicoverpa', 'Pod borer', 'Wilt'],
    disease: ['Sterility mosaic', 'Phytophthora', 'Root rot'],
    fertilizers: 'Urea 30kg, DAP 50kg, Potash 20kg per acre',
    bestPractices: 'Adopt row spacing 75x25 cm, timely sowing, avoid waterlogging.',
    states: ['Maharashtra', 'Karnataka', 'A.P.', 'M.P.'],
  },
  GreenGram: {
    hindi: 'मूंग',
    aliases: ['green gram', 'moong', 'मूंग', 'মুগ', 'മുഗ്ദ', 'பாசிப் பருப்பு'],
    season: 'Kharif & Rabi',
    sowing: 'Jun-Jul (kharif), Oct-Nov (rabi)',
    harvesting: 'Sep-Oct (kharif), Feb-Mar (rabi)',
    waterNeeds: 'Low',
    temperature: '20-30°C',
    soil: 'Light textured, pH 6-7',
    pests: ['Thrips', 'Aphids', 'Whitefly'],
    disease: ['Cercospora leaf spot', 'Powdery mildew', 'Mosaic'],
    fertilizers: 'Urea 15kg, DAP 30kg, Potash 20kg per acre',
    bestPractices: 'Seed inoculation with Rhizobium, avoid excess water.',
    states: ['Maharashtra', 'Rajasthan', 'Gujarat', 'M.P.'],
  },
  BlackGram: {
    hindi: 'उडद',
    aliases: ['black gram', 'urad', 'उडद', 'mash kalai', 'ulundam'],
    season: 'Kharif & Rabi',
    sowing: 'Jun-Jul (kharif), Oct-Nov (rabi)',
    harvesting: 'Sep-Oct (kharif), Feb-Mar (rabi)',
    waterNeeds: 'Low',
    temperature: '20-30°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Aphids', 'Thrips', 'Pod borer'],
    disease: ['Yellow mosaic', 'Powdery mildew', 'Root rot'],
    fertilizers: 'Urea 15kg, DAP 30kg, Potash 20kg per acre',
    bestPractice: 'Seed treatment important, avoid standing water.',
    states: ['M.P.', 'Maharashtra', 'Rajasthan', 'A.P.'],
  },
  RedLentil: {
    hindi: 'मसूर',
    aliases: ['lentil', 'masoor', 'red lentil', 'मसूर', 'मसूर दाल', 'மஞ்சள் பருப்பு'],
    season: 'Rabi',
    sowing: 'Oct-Nov',
    harvesting: 'Mar-Apr',
    waterNeeds: 'Low (rainfed)',
    temperature: '12-22°C',
    soil: 'Loamy sand, pH 6.5-7.5',
    pests: ['Aphids', 'Bruchid beetle'],
    disease: ['Rust', 'Blight', 'Root rot'],
    fertilizers: 'Urea 20kg, DAP 40kg per acre',
    bestPractices: 'Early sowing, seed treatment, avoid waterlogging.',
    states: ['U.P.', 'M.P.', 'Rajasthan', 'Haryana'],
  },
  HorseGram: {
    hindi: 'कुल्थी',
    aliases: ['horse gram', 'kulthi', 'कुल्थी', 'hurali', 'almaz', 'kollu'],
    season: 'Kharif & Rabi',
    sowing: 'Jun-Jul (kharif), Oct-Nov (rabi)',
    harvesting: 'Sep-Oct (kharif), Feb-Mar (rabi)',
    waterNeeds: 'Very low (drought tolerant)',
    temperature: '20-35°C',
    soil: 'Sandy loam, pH 6-7.5',
    pests: ['Pod borer', 'Aphids'],
    disease: ['Leaf spot', 'Rust'],
    fertilizers: 'Minimal, 10-15kg urea per acre',
    bestPractices: 'Grows in poor soils, intercropping beneficial.',
    states: ['Karnataka', 'A.P.', 'T.N.', 'M.P.'],
  },
  MothBean: {
    hindi: 'मोठ बीन',
    aliases: ['moth bean', 'moth', 'मोठ', 'matti', 'mat bean'],
    season: 'Kharif',
    sowing: 'Jun-Jul',
    harvesting: 'Sep-Oct',
    waterNeeds: 'Low',
    temperature: '24-35°C',
    soil: 'Arid, sandy loam',
    pests: ['Aphids', 'Jassids'],
    disease: ['Powdery mildew', 'Leaf spot'],
    fertilizers: 'Very low, 10kg urea per acre',
    bestPractices: 'Drought tolerant, good for arid zones.',
    states: ['Rajasthan', 'Gujarat', 'M.P.'],
  },
  Groundnut: {
    hindi: 'मूंगफली',
    aliases: ['groundnut', 'peanut', 'मूंगफली', 'mungfali', 'kadalai', 'moode'],
    season: 'Kharif (Jun-Oct) & Rabi (Oct-Mar)',
    sowing: 'Jun-Jul (kharif), Oct-Nov (rabi)',
    harvesting: 'Sep-Oct (kharif), Feb-Mar (rabi)',
    waterNeeds: 'Moderate (pegging stage critical)',
    temperature: '20-30°C',
    soil: 'Light sandy loam, pH 6-7',
    pests: ['Jassids', 'Thrips', 'Pod borer', 'Root grub'],
    disease: ['Leaf spot', 'Rust', 'Sclerotium'],
    fertilizers: 'Urea 30kg, DAP 50kg, Potash 40kg per acre, Gypsum 100kg',
    bestPractices: 'Maintain soil moisture during pegging, seed treatment with fungicide.',
    states: ['Gujarat', 'A.P.', 'Karnataka', 'T.N.'],
  },
  Sesame: {
    hindi: 'तिल',
    aliases: ['sesame', 'til', 'तिल', 'til seed', 'ellu', 'till', 'gingelly'],
    season: 'Kharif & Rabi',
    sowing: 'Jun-Jul (kharif), Oct-Nov (rabi)',
    harvesting: 'Oct-Nov (kharif), Feb-Mar (rabi)',
    waterNeeds: 'Low to moderate',
    temperature: '20-30°C',
    soil: 'Well-drained loam, pH 5.5-7.5',
    pests: ['Sesame leafhopper', 'Pod borer', 'Aphids'],
    disease: ['Phyllody', 'Stem rot', 'Wilt'],
    fertilizers: 'Urea 40kg, DAP 40kg, Potash 20kg per acre',
    bestPractices: 'Thinning required, avoid excess nitrogen.',
    states: ['Gujarat', 'Rajasthan', 'A.P.', 'Karnataka'],
  },
  Sunflower: {
    hindi: 'सूरजमुखी',
    aliases: ['sunflower', 'surajmukhi', 'सूरजमुखी', 'suryamukhi', 'sorghum'],
    season: 'Kharif & Rabi',
    sowing: 'Jun-Jul (kharif), Oct-Nov (rabi)',
    harvesting: 'Oct-Nov (kharif), Feb-Mar (rabi)',
    waterNeeds: 'Moderate',
    temperature: '20-28°C',
    soil: 'Well-drained loam, pH 6-8',
    pests: ['Helicoverpa', 'Aphids', 'Jassids'],
    disease: ['Alternaria leaf spot', 'Rust', 'Sclerotinia'],
    fertilizers: 'Urea 60kg, DAP 60kg, Potash 40kg per acre',
    bestPractices: 'Maintain plant population, avoid waterlogging.',
    states: ['Karnataka', 'A.P.', 'Maharashtra', 'Gujarat'],
  },
  Castor: {
    hindi: 'अरंडा',
    aliases: ['castor', 'aranda', 'अरंडा', 'castor bean', 'veru'],
    season: 'Kharif',
    sowing: 'Jun-Jul',
    harvesting: 'Dec-Mar (pods picked multiple times)',
    waterNeeds: 'Moderate',
    temperature: '20-35°C',
    soil: 'Deep well-drained, pH 6-8',
    pests: ['Prodenia', 'Aphids', 'Shoot borer'],
    disease: ['Alternaria leaf spot', 'Wilt', 'Powdery mildew'],
    fertilizers: 'Urea 60kg, DAP 60kg, Potash 40kg per acre',
    bestPractices: 'Support for tall varieties, spacing 90x60 cm, timely harvesting.',
    states: ['Gujarat', 'A.P.', 'Karnataka', 'Maharashtra'],
  },
  Linseed: {
    hindi: 'अलसी',
    aliases: ['linseed', 'flaxseed', 'alsi', 'अलसी', 'als', 'tisi'],
    season: 'Rabi',
    sowing: 'Oct-Nov',
    harvesting: 'Feb-Mar',
    waterNeeds: 'Low',
    temperature: '10-25°C',
    soil: 'Loamy, pH 5.5-7',
    pests: ['Aphids', 'Thrips'],
    disease: ['Wilt', 'Rust'],
    fertilizers: 'Urea 30kg, DAP 40kg per acre',
    bestPractices: 'Seed rate 20kg/hectare, avoid excess N.',
    states: ['M.P.', 'U.P.', 'Rajasthan', 'Bihar'],
  },
  Potato: {
    hindi: 'आलू',
    aliases: ['potato', 'aloo', 'आलू', 'batata', 'alloo', 'urulai kizhangu'],
    season: 'Year-round (main Rabi)',
    sowing: 'Oct-Dec (plains), Jul-Aug (hills)',
    harvesting: 'Feb-Mar (plains), Oct-Nov (hills)',
    waterNeeds: 'High (frequent irrigation)',
    temperature: '15-25°C',
    soil: 'Sandy loam, pH 5.5-6.5',
    pests: ['Potato tuber moth', 'Aphids', 'Cutworms'],
    disease: ['Late blight', 'Early blight', 'Black scurf'],
    fertilizers: 'Urea 150kg, DAP 200kg, Potash 100kg per acre, FYM 10 tons',
    bestPractices: 'Use seed potatoes with 2-3 eyes, hilling important, spray fungicides for blight.',
    states: ['U.P.', 'West Bengal', 'Bihar', 'Punjab'],
  },
  Onion: {
    hindi: 'प्याज',
    aliases: ['onion', 'pyaj', 'pyaz', 'प्याज', 'piaz', 'vengayam', 'ullipaya'],
    season: 'Kharif & Rabi',
    sowing: 'Nov-Dec (rabi), Jun-Jul (kharif)',
    harvesting: 'Mar-Apr (rabi), Sep-Oct (kharif)',
    waterNeeds: 'Moderate',
    temperature: '13-24°C',
    soil: 'Sandy loam, pH 6-7',
    pests: ['Thrips', 'Maggots', 'Onion fly'],
    disease: ['Basal rot', 'Purple blotch', 'Smut'],
    fertilizers: 'Urea 100kg, SSP 150kg, Potash 50kg per acre',
    bestPractices: 'Seed treatment, avoid excess N, maintain field sanitation.',
    states: ['Maharashtra', 'Karnataka', 'Gujarat', 'M.P.'],
  },
  Tomato: {
    hindi: 'टमाटर',
    aliases: ['tomato', 'tamatar', 'टमाटर', 'thakkali', 'tamatari', 'tamater'],
    season: 'Year-round',
    sowing: 'Oct-Nov (plains), Feb-Mar (hills)',
    harvesting: 'Feb-Apr onward (varies)',
    waterNeeds: 'Regular (avoid waterlogging)',
    temperature: '20-27°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Fruit borer', 'Whitefly', 'Aphids', 'Serpentine leaf miner'],
    disease: ['Fusarium wilt', 'Bacterial wilt', 'Early blight', 'Late blight'],
    fertilizers: 'Urea 80kg, DAP 120kg, Potash 80kg per acre, FYM 10 tons',
    bestPractices: 'Staking required, regular pruning, spray for pests weekly.',
    states: ['M.P.', 'Karnataka', 'A.P.', 'Maharashtra', 'Gujarat'],
  },
  Brinjal: {
    hindi: 'बैंगन',
    aliases: ['brinjal', 'eggplant', 'baingan', 'वांगी', 'vankaya', 'vaṅgāy'],
    season: 'Year-round',
    sowing: 'Jul-Sep (main), Feb-Mar (spring)',
    harvesting: '60-90 days after transplant',
    waterNeeds: 'Moderate',
    temperature: '20-30°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Fruit and shoot borer', 'Aphids', 'Jassids'],
    disease: ['Fusarium wilt', 'Phomopsis blight', 'Little leaf'],
    fertilizers: 'Urea 80kg, DAP 100kg, Potash 50kg per acre',
    bestPractices: 'Row spacing 75x45 cm, timely fruit picking, manage borer with pheromone traps.',
    states: ['West Bengal', 'U.P.', 'M.P.', 'Gujarat'],
  },
  Okra: {
    hindi: 'भिंडी',
    aliases: ['okra', 'bhindi', 'भिंडी', 'bendakayi', 'vankaya', 'ladyfinger'],
    season: 'Kharif & Summer',
    sowing: 'Jun-Jul (kharif), Feb-Mar (summer)',
    harvesting: '45-60 days after sowing, pick every 2-3 days',
    waterNeeds: 'Moderate',
    temperature: '25-35°C',
    soil: 'Well-drained loam, pH 6-6.8',
    pests: ['Fruit borer', 'Aphids', 'Jassids'],
    disease: ['Yellow vein mosaic', 'Powdery mildew'],
    fertilizers: 'Urea 60kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Seed treatment, timely picking, avoid waterlogging.',
    states: ['U.P.', 'M.P.', 'Gujarat', 'Karnataka'],
  },
  Cauliflower: {
    hindi: 'फूलगोभी',
    aliases: ['cauliflower', 'phool gobhi', 'फूलगोभी', 'flower cabbage'],
    season: 'Rabi (Oct-Dec) & Summer',
    sowing: 'Oct-Nov (plains), Jun-Jul (hills)',
    harvesting: 'Feb-Mar (rabi), Oct-Nov (hills)',
    waterNeeds: 'Regular but moderate',
    temperature: '15-20°C (curd formation)',
    soil: 'Silty loam, pH 6-7',
    pests: ['Aphids', 'Cabbage butterfly caterpillar'],
    disease: ['Downy mildew', 'Black rot', 'Clubroot'],
    fertilizers: 'Urea 100kg, DAP 120kg, Potash 60kg per acre',
    bestPractices: 'Transplant 4-5 leaf stage, use well-rooted seedlings, avoid temperature extremes.',
    states: ['Haryana', 'U.P.', 'Rajasthan', 'M.P.'],
  },
  Cabbage: {
    hindi: 'गोभी',
    aliases: ['cabbage', 'gobhi', 'गोभी', 'patta gobhi'],
    season: 'Kharif & Rabi',
    sowing: 'Oct-Nov (rabi), Jun-Jul (kharif)',
    harvesting: '80-100 days after transplant',
    waterNeeds: 'Moderate',
    temperature: '15-20°C',
    soil: 'Loamy, pH 6-7',
    pests: ['Aphids', 'Cabbage butterfly', 'Cutworm'],
    disease: ['Black rot', 'Downy mildew', 'Clubroot'],
    fertilizers: 'Urea 100kg, DAP 120kg, Potash 60kg per acre',
    bestPractices: 'Spacing 45x30 cm, rotation, seed treatment.',
    states: ['U.P.', 'Haryana', 'M.P.', 'West Bengal'],
  },
  GreenPeas: {
    hindi: 'मटर',
    aliases: ['pea', 'peas', 'matar', 'मटर', 'mutter', 'pisum'],
    season: 'Rabi (Oct-Dec) & Summer',
    sowing: 'Oct-Nov (plains), Sep-Oct (hills)',
    harvesting: '60-70 days after sowing, pick every 2-3 days',
    waterNeeds: 'Moderate',
    temperature: '10-20°C',
    soil: 'Well-drained loam, pH 6.5-7.5',
    pests: ['Aphids', 'Pod borer', 'Thrips'],
    disease: ['Powdery mildew', 'Rust', 'Root rot'],
    fertilizers: 'Urea 40kg, DAP 60kg, Potash 30kg per acre',
    bestPractices: 'Support for climbing varieties, timely picking, avoid excess N.',
    states: ['U.P.', 'Haryana', 'Punjab', 'M.P.'],
  },
  Spinach: {
    hindi: 'पालक',
    aliases: ['spinach', 'palak', 'पालक', 'palak', 'cheera'],
    season: 'Year-round',
    sowing: 'Any time (avoid extreme heat/cold)',
    harvesting: '25-30 days after sowing, cut 2-3 times',
    waterNeeds: 'Moderate to high',
    temperature: '15-20°C',
    soil: 'Well-drained sandy loam, pH 6-7',
    pests: ['Aphids', 'Leaf miners', 'Flea beetles'],
    disease: ['Downy mildew', 'Leaf spot', 'Anthracnose'],
    fertilizers: 'Urea 30kg, DAP 40kg per acre',
    bestPractices: 'Frequent light irrigation, cut at 5-6 leaf stage, bolted plants should be removed.',
    states: ['U.P.', 'Maharashtra', 'Karnataka'],
  },
  BitterGourd: {
    hindi: 'करेला',
    aliases: ['bitter gourd', 'karela', 'करेला', 'karla', 'pavakkai', 'hārala'],
    season: 'Kharif & Summer',
    sowing: 'Jun-Jul (kharif), Feb-Mar (summer)',
    harvesting: '50-60 days after sowing, pick green',
    waterNeeds: 'Moderate',
    temperature: '25-35°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Fruit fly', 'Aphids', 'Red pumpkin beetle'],
    disease: ['Powdery mildew', 'Anthracnose', 'Cercospora leaf spot'],
    fertilizers: 'Urea 40kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Use trellis for better yield, timely fruit picking, spray neem for fruit fly.',
    states: ['U.P.', 'M.P.', 'Bihar', 'West Bengal'],
  },
  BottleGourd: {
    hindi: 'लौकी',
    aliases: ['bottle gourd', 'lauki', 'लौकी', 'lauki', 'suraikai', 'giya'],
    season: 'Kharif & Summer',
    sowing: 'Jun-Jul (kharif), Feb-Mar (summer)',
    harvesting: '45-60 days after sowing',
    waterNeeds: 'Adequate',
    temperature: '25-35°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Fruit fly', 'Aphids', 'Red pumpkin beetle'],
    disease: ['Powdery mildew', 'Anthracnose', 'Cercospora'],
    fertilizers: 'Urea 40kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Provide support for fruit, maintain plant population, timely harvest.',
    states: ['U.P.', 'M.P.', 'Rajasthan', 'Gujarat'],
  },
  RidgeGourd: {
    hindi: 'तोरी',
    aliases: ['ridge gourd', 'tori', 'तोरी', 'turai', 'hireballi', 'pirattin'],
    season: 'Kharif & Summer',
    sowing: 'Jun-Jul (kharif), Feb-Mar (summer)',
    harvesting: '45-55 days after sowing',
    waterNeeds: 'Adequate',
    temperature: '25-35°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Fruit fly', 'Aphids', 'Jassids'],
    disease: ['Powdery mildew', 'Anthracnose'],
    fertilizers: 'Urea 40kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Trellising for better yield, regular picking.',
    states: ['U.P.', 'M.P.', 'Bihar', 'West Bengal'],
  },
  Pumpkin: {
    hindi: 'कद्दू',
    aliases: ['pumpkin', 'kaddu', 'कद्दू', 'kushum', 'saga', 'kumbalanga'],
    season: 'Kharif',
    sowing: 'Jun-Jul',
    harvesting: '90-120 days after sowing',
    waterNeeds: 'Moderate',
    temperature: '25-35°C',
    soil: 'Well-drained loam, pH 6-7.5',
    pests: ['Fruit fly', 'Aphids', 'Red pumpkin beetle'],
    disease: ['Powdery mildew', 'Anthracnose', 'Fusarium wilt'],
    fertilizers: 'Urea 40kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Wide spacing (2x2 m), vines need room, mulch benefits.',
    states: ['U.P.', 'M.P.', 'Rajasthan', 'Gujarat'],
  },
  Carrot: {
    hindi: 'गाजर',
    aliases: ['carrot', 'gajar', 'गाजर', 'gajar', 'caret', 'sivappu மஞ்சள்'],
    season: 'Kharif & Rabi',
    sowing: 'Jul-Sep (kharif), Oct-Nov (rabi)',
    harvesting: '70-80 days after sowing',
    waterNeeds: 'Regular',
    temperature: '15-20°C',
    soil: 'Sandy loam, deep, pH 6-7',
    pests: ['Aphids', 'Carrot fly'],
    disease: ['Leaf blight', 'Alternaria', 'Powdery mildew'],
    fertilizers: 'Urea 40kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Thinning essential, maintain soil moisture, avoid waterlogging.',
    states: ['U.P.', 'Punjab', 'Haryana', 'M.P.'],
  },
  Radish: {
    hindi: 'मूली',
    aliases: ['radish', 'mooli', 'मूली', 'mulangi', 'mallika', 'mullangi'],
    season: 'Year-round',
    sowing: 'Any time (avoid summer peak)',
    harvesting: '25-35 days after sowing',
    waterNeeds: 'Regular',
    temperature: '10-25°C',
    soil: 'Light sandy loam, pH 6-7',
    pests: ['Aphids', 'Flea beetle'],
    disease: ['Alternaria leaf spot', 'White rust'],
    fertilizers: 'Urea 30kg, DAP 40kg per acre',
    bestPractices: ' Sow shallow, maintain moisture, harvest early for crispness.',
    states: ['U.P.', 'Delhi', 'Haryana', 'Punjab'],
  },
  Beetroot: {
    hindi: 'चुकंदर',
    aliases: ['beetroot', 'beet', 'chukandar', 'चुकंदर', 'beet', 'beets'],
    season: 'Winter',
    sowing: 'Oct-Nov',
    harvesting: '60-70 days after sowing',
    waterNeeds: 'Moderate',
    temperature: '15-20°C',
    soil: 'Deep loam, pH 6.5-7.5',
    pests: ['Aphids'],
    disease: ['Cercospora leaf spot', 'Root rot'],
    fertilizers: 'Urea 40kg, DAP 60kg, Potash 30kg per acre',
    bestPractices: 'Thinning important, maintain soil moisture.',
    states: ['U.P.', 'Haryana', 'Punjab', 'M.P.'],
  },
  Cucumber: {
    hindi: 'खीरा',
    aliases: ['cucumber', 'kheera', 'खीरा', 'kheera', 'khe光子', 'keerai'],
    season: 'Kharif & Summer',
    sowing: 'Jun-Jul (kharif), Feb-Mar (summer)',
    harvesting: '40-50 days after sowing, pick regularly',
    waterNeeds: 'High',
    temperature: '20-30°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Fruit fly', 'Aphids', 'Jassids'],
    disease: ['Powdery mildew', 'Anthracnose', 'Downy mildew'],
    fertilizers: 'Urea 40kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Trellis for quality, pick fruits young, avoid waterlogging.',
    states: ['U.P.', 'M.P.', 'Karnataka', 'T.N.'],
  },
  GreenChilli: {
    hindi: 'हरी मिर्च',
    aliases: ['green chilli', 'hari mirch', 'हरी मिर्च', 'green chili', 'mirchi'],
    season: 'Year-round',
    sowing: 'Feb-Mar & Jun-Jul',
    harvesting: '60-90 days after transplant, pick regularly',
    waterNeeds: 'Moderate',
    temperature: '20-30°C',
    soil: 'Well-drained loam, pH 6-7.5',
    pests: ['Thrips', 'Aphids', 'Fruit borer'],
    disease: ['Powdery mildew', 'Leaf spot', 'Leaf curl'],
    fertilizers: 'Urea 80kg, DAP 100kg, Potash 50kg per acre',
    bestPractices: 'Spacing 60x45 cm, pick regularly for more yield, spray neem for thrips.',
    states: ['Andhra Pradesh', 'Karnataka', 'Maharashtra', 'T.N.'],
  },
  Banana: {
    hindi: 'केला',
    aliases: ['banana', 'kela', 'केला', 'kadali', 'vaazha', 'kela'],
    season: 'Perennial, fruiting 9-12 months',
    sowing: 'Year-round (avoid winter)',
    harvesting: '9-12 months after planting',
    waterNeeds: 'High (frequent irrigation)',
    temperature: '20-35°C',
    soil: 'Deep loam, pH 6-7.5',
    pests: ['Bunchy top virus', 'Nematodes', 'Pseudostem weevil'],
    disease: ['Panama wilt', 'Sigatoka leaf spot', 'Rhizome weevil'],
    fertilizers: 'N 200g, P2O5 100g, K2O 400g per plant per year (approx)',
    bestPractices: 'Sucker selection important, maintain shade and irrigation, de-suckering.',
    states: ['Maharashtra', 'T.N.', 'Karnataka', 'A.P.'],
  },
  Mango: {
    hindi: 'आम',
    aliases: ['mango', 'aam', 'आम', 'aam', 'mango', 'maanga'],
    season: 'Summer (Apr-Jun)',
    sowing: 'Jul-Sep (monsoon planting)',
    harvesting: '3-5 years after planting (varies by variety)',
    waterNeeds: 'Moderate',
    temperature: '24-30°C',
    soil: 'Well-drained loam, pH 5.5-7.5',
    pests: ['Mango hopper', 'Fruit fly', 'Leaf webber'],
    disease: ['Anthracnose', 'Powdery mildew', 'Bunchy top'],
    fertilizers: 'Young: N 100g, P2O3 50g, K2O 100g per plant per year; increase as tree grows',
    bestPractices: 'Regular pruning, orchard sanitation, fruit bagging.',
    states: ['U.P.', 'A.P.', 'Karnataka', 'M.P.', 'Bihar'],
  },
  Apple: {
    hindi: 'सेब',
    aliases: ['apple', 'seb', 'सेब', 'seb', 'sap', 'apple'],
    season: 'Autumn (Aug-Oct in hills)',
    sowing: 'Dormant planting Jan-Feb',
    harvesting: 'Aug-Oct',
    waterNeeds: 'Moderate',
    temperature: '10-25°C',
    soil: 'Well-drained loam, pH 6.5-7.5',
    pests: ['Apple borer', 'Aphids', 'Mites'],
    disease: ['Apple scab', 'Fire blight', 'Powdery mildew'],
    fertilizers: 'N 200-400g, P2O3 200g, K2O 400g per tree per year',
    bestPractices: 'Chilling hours required (600-1000), requires cold climate.',
    states: ['H.P.', 'J&K', 'Uttarakhand', 'Himachal Pradesh'],
  },
  Orange: {
    hindi: 'संतरा',
    aliases: ['orange', 'santra', 'संतरा', 'sintoor', 'orange', 'sunkist'],
    season: 'Winter (Dec-Feb)',
    sowing: 'Jul-Sep',
    harvesting: 'Dec-Feb',
    waterNeeds: 'Moderate',
    temperature: '15-30°C',
    soil: 'Well-drained loam, pH 5.5-6.5',
    pests: ['Citrus psylla', 'Fruit fly', 'Aphids'],
    disease: ['Citrus canker', 'Gummosis', 'Root rot'],
    fertilizers: 'N 400g, P2O3 200g, K2O 400g per plant per year',
    bestPractices: 'Pruning for light penetration, manage water stress, protect from frost.',
    states: ['Maharashtra', 'Madhya Pradesh', 'Karnataka', 'Gujarat'],
  },
  Grapes: {
    hindi: 'अंगूर',
    aliases: ['grape', 'grapes', 'angura', 'अंगूर', 'angur', 'draksha'],
    season: 'Winter (Dec-Mar)',
    sowing: 'Dormant planting Jan-Feb',
    harvesting: 'Feb-May',
    waterNeeds: 'Regular (drip irrigation best)',
    temperature: '20-35°C',
    soil: 'Deep loam, pH 6.5-7.5',
    pests: ['Thrips', 'Mealybugs', 'Fruit fly'],
    disease: ['Anthracnose', 'Powdery mildew', 'Downy mildew', 'Flaky bark'],
    fertilizers: 'N 400-600g, P2O3 400g, K2O 800g per vine per year',
    bestPractices: 'Pruning and training essential, berry thinning for size, bower system common.',
    states: ['Maharashtra', 'Karnataka', 'T.N.', 'A.P.'],
  },
  Watermelon: {
    hindi: 'तरबूज',
    aliases: ['watermelon', 'tarbuj', 'तरबूज', 'tarbuj', 'kalingad'],
    season: 'Summer (Mar-Jun)',
    sowing: 'Feb-Mar (plains), Oct-Nov (south)',
    harvesting: '80-100 days after sowing',
    waterNeeds: 'High',
    temperature: '25-35°C',
    soil: 'Sandy loam, pH 6-7',
    pests: ['Fruit fly', 'Aphids', 'Jassids'],
    disease: ['Powdery mildew', 'Anthracnose', 'Fusarium wilt'],
    fertilizers: 'Urea 30kg, DAP 50kg, Potash 30kg per acre',
    bestPractices: 'Spacing 1.5x0.5 m, mulch to conserve moisture, harvest at full slip stage.',
    states: ['U.P.', 'Rajasthan', 'Haryana', 'Karnataka'],
  },
  Pomegranate: {
    hindi: 'अनार',
    aliases: ['pomegranate', 'anar', 'अनार', 'anar', 'madalam', 'maadhulim'],
    season: 'Winter (Feb-Mar) & Summer (Jun-Aug)',
    sowing: 'Planting Jan-Feb & Jul-Aug',
    harvesting: 'Flowers 2nd year, fruits 3rd year, main crop 90-150 days after flowering',
    waterNeeds: 'Moderate',
    temperature: '20-35°C',
    soil: 'Deep loam, pH 6-7.5',
    pests: ['Anar butterfly', 'Aphids', 'Thrips'],
    disease: ['Bacterial blight', 'Anthracnose', 'Root knot nematode'],
    fertilizers: 'N 400g, P2O5 200g, K2O 400g per plant per year',
    bestPractices: 'Pruning for shape, fruit thinning for size, manage fruit borer.',
    states: ['Maharashtra', 'Karnataka', 'Gujarat', 'A.P.'],
  },
  Papaya: {
    hindi: 'पपीता',
    aliases: ['papaya', 'papaya', 'पपीता', 'papaya', 'poppe', 'pappaya'],
    season: 'Year-round',
    sowing: 'Seed Jul-Oct',
    harvesting: '6-9 months after planting',
    waterNeeds: 'Regular',
    temperature: '20-35°C',
    soil: 'Well-drained loam, pH 6-7',
    pests: ['Papaya mealybug', 'Fruit fly', 'Aphids'],
    disease: ['Papaya ringspot virus', 'Anthracnose', 'Powdery mildew'],
    fertilizers: 'N 150g, P2O5 50g, K2O 150g per plant per month (young)',
    bestPractices: 'Regular harvesting, remove male plants (if dioecious), protect from waterlogging.',
    states: ['Karnataka', 'M.P.', 'Gujarat', 'A.P.'],
  },
  Guava: {
    hindi: 'अमरूद',
    aliases: ['guava', 'amrood', 'अमरूद', 'ambare', 'perakka'],
    season: 'Year-round (peak winter)',
    sowing: 'Jul-Sep',
    harvesting: '2-3 years after planting, main crop Feb-Mar & Aug-Sep',
    waterNeeds: 'Moderate',
    temperature: '20-30°C',
    soil: 'Any well-drained soil, pH 5.5-7',
    pests: ['Fruit fly', 'Mealybugs', 'Aphids'],
    disease: ['Anthracnose', 'Canker', 'Root rot'],
    fertilizers: 'N 400g, P2O5 200g, K2O 400g per plant per year',
    bestPractices: 'Regular pruning, timely picking, orchard sanitation.',
    states: ['U.P.', 'M.P.', 'Maharashtra', 'T.N.'],
  },
  Sugarcane: {
    hindi: 'गन्ना',
    aliases: ['sugarcane', 'ganna', 'गन्ना', 'ikshu', 'cheruku', 'kabbu'],
    season: 'Perennial 12-18 months',
    sowing: 'Year-round (main Oct-Dec)',
    harvesting: '12-18 months after planting, staggered harvest',
    waterNeeds: 'Very high (frequent irrigation)',
    temperature: '20-40°C',
    soil: 'Deep loam, pH 6.5-7.5',
    pests: ['Borer', 'Woolly aphid', 'Termites', 'Pyrilla'],
    disease: ['Red rot', 'Smut', 'Sclrotium'],
    fertilizers: 'Urea 250kg, DAP 125kg, Potash 100kg per acre, FYM 10 tons',
    bestPractices: 'Use setts with 3-4 buds, proper spacing (row 1.2-1.5 m), earthing up, ratoon management.',
    states: ['U.P.', 'Maharashtra', 'Karnataka', 'T.N.', 'Bihar'],
  },
  Cotton: {
    hindi: 'कपास',
    aliases: ['cotton', 'kapas', 'कपास', 'kapash', 'rui', 'kapas'],
    season: 'Kharif (May-Dec)',
    sowing: 'May-Jun (with monsoon)',
    harvesting: 'Oct-Mar (picked manually approx 4-5 times)',
    waterNeeds: 'Moderate to high',
    temperature: '21-30°C',
    soil: 'Deep black soil, pH 6-8',
    pests: ['Bollworm complex', 'Jassids', 'Aphids', 'Thrips'],
    disease: ['Boll rot', 'Alternaria leaf spot', 'Fusarium wilt'],
    fertilizers: 'Urea 120kg, DAP 80kg, Potash 60kg per acre',
    bestPractices: 'Maintain plant population (60-70k per hectare), timely insecticide spray for bollworm, irrigation at flowering and boll development.',
    states: ['Gujarat', 'Maharashtra', 'Telangana', 'Punjab', 'M.P.'],
  },
  Turmeric: {
    hindi: 'हल्दी',
    aliases: ['turmeric', 'haldi', 'हल्दी', 'manjal', 'pasupu', 'halad', 'haldar'],
    season: 'Kharif (May-Aug)',
    sowing: 'May-Jul',
    harvesting: 'Jan-Mar (after 8-10 months)',
    waterNeeds: 'Moderate',
    temperature: '20-30°C',
    soil: 'Well-drained loam, pH 6-7.5',
    pests: ['Rhizome rot', 'Sclerotium', 'Leaf spot', 'Shoot borer'],
    disease: ['Leaf blotch', 'Root rot'],
    fertilizers: 'Urea 80kg, DAP 120kg, Potash 100kg, FYM 10 tons per acre',
    bestPractices: 'Mulching important, seed treatment with carbendazim, rhizome selection.',
    states: ['Telangana', 'Karnataka', 'T.N.', 'Maharashtra', 'A.P.'],
  },
  Ginger: {
    hindi: 'अदरक',
    aliases: ['ginger', 'adrak', 'अदरक', 'inji', 'allam', 'shunti', 'ada'],
    season: 'Kharif (Apr-May)',
    sowing: 'Mar-Apr',
    harvesting: 'Dec-Jan (after 8-10 months)',
    waterNeeds: 'High (frequent)',
    temperature: '22-30°C',
    soil: 'Deep loam, rich organic, pH 5.5-6.5',
    pests: ['Rhizome rot', 'Shoot borer', 'Grubs', 'Shoot borer'],
    disease: ['Soft rot', 'Leaf spot', 'Bacterial wilt'],
    fertilizers: 'Urea 60kg, DAP 120kg, Potash 50kg, FYM 5-8 tons per acre',
    bestPractices: 'Select disease-free rhizomes, mulching, shade in hot areas, drainage essential.',
    states: ['Kerala', 'Assam', 'W.B.', 'Odisha', 'Karnataka'],
  },
  Garlic: {
    hindi: 'लहसुन',
    aliases: ['garlic', 'lahsun', 'लहसुन', 'lasun', 'vellulli', 'bellulli'],
    season: 'Rabi (Oct-Nov)',
    sowing: 'Oct-Nov',
    harvesting: 'Apr-May',
    waterNeeds: 'Moderate',
    temperature: '12-24°C',
    soil: 'Sandy loam, pH 6-7.5',
    pests: ['Mite', 'Thrips', 'Stem and bulb'],
    disease: ['Purple blotch', 'Leaf blight', 'Basal rot'],
    fertilizers: 'Urea 100kg, DAP 100kg, Potash 60kg per acre, FYM 5 tons',
    bestPractices: 'Seed cloves selection important, immediate post-harvest drying, store in ventilated place.',
    states: ['M.P.', 'Rajasthan', 'Gujarat', 'U.P.'],
  },
  BlackPepper: {
    hindi: 'काली मिर्च',
    aliases: ['black pepper', 'kali mirch', 'काली मिर्च', 'black pepper', 'maricha'],
    season: 'Perennial',
    sowing: 'May-Jun (cuttings)',
    harvesting: 'Nov-Feb (berries picked manually, 4-5 times)',
    waterNeeds: 'High humidity, regular irrigation',
    temperature: '20-30°C',
    soil: 'Well-drained loam, pH 5.5-6.5',
    pests: ['Pollu beetle', 'Mealybugs', 'Scale insects'],
    disease: ['Foot rot', 'Slow wilt', 'Leaf rot'],
    fertilizers: 'NPK 75:75:300g per plant per year (use organic too)',
    bestPractices: 'Support with standards (live or dead), mulch, manage shade and irrigation.',
    states: ['Kerala', 'Karnataka', 'T.N.', 'Kerala'],
  },
  Cardamom: {
    hindi: 'इलायची',
    aliases: ['cardamom', 'elaichi', 'इलायची', 'elakkay', 'ekka', 'sukum'],
    season: 'Perennial (420 days)',
    sowing: 'May-Jun',
    harvesting: 'Oct-Dec (main flush), Apr-Jun (second flush)',
    waterNeeds: 'High, well-drained slopes',
    temperature: '10-35°C',
    soil: 'Acidic loam, pH 4.5-6.5',
    pests: ['Capsule borer', 'Aphids', 'Mites'],
    disease: ['Leaf blotch', 'Rhizome rot', 'Nematodes'],
    fertilizers: 'NPK 60:60:120g per clump per year, plus organics',
    bestPractices: 'Shade regulation, regular weeding, timely harvest of capsules (just before ripening).',
    states: ['Kerala', 'Karnataka', 'T.N.'],
  },
  Tea: {
    hindi: 'चाय',
    aliases: ['tea', 'chai', 'चाय', 'cha', 'te', 'camellia sinensis'],
    season: 'Perennial, plucked year-round',
    sowing: 'Feb-Mar, Jun-Jul',
    harvesting: 'Every 5-20 days (main flush Feb-Dec)',
    waterNeeds: 'High rainfall zone',
    temperature: '10-30°C',
    soil: 'Acidic loam, pH 4.5-5.5',
    pests: ['Tea mosquito bug', 'Red spider mite', 'Blister blight', 'Caterpillar'],
    disease: ['Blister blight', 'Grey blight', 'Root disease'],
    fertilizers: 'NPK 100-150:40-50:100-150kg/ha annually in split doses',
    bestPractices: 'Plucking standard 2 leaves + bud, prune in winter, shade trees essential.',
    states: ['Assam', 'W.B.', 'T.N.', 'Kerala', 'H.P.'],
  },
  Coffee: {
    hindi: 'कॉफ़ी',
    aliases: ['coffee', 'coffee', 'कॉफ़ी', 'kapi', 'bunna'],
    season: 'Perennial',
    sowing: 'Jun-Jul (monsoon)',
    harvesting: 'Sep-Jan (picking)',
    waterNeeds: 'Moderate',
    temperature: '15-30°C',
    soil: 'Loam, well-drained, pH 5.5-6.5',
    pests: ['Coffee berry borer', 'Green scale', 'Mealybugs', 'Leaf miner'],
    disease: ['Coffee leaf rust', 'Berry blotch', 'Root knot nematode'],
    fertilizers: 'NPK 200-300:100-200:200-300g per plant per year',
    bestPractices: 'Shade regulation, selective picking (only ripe berries), regular pruning, soil conservation.',
    states: ['Karnataka', 'Kerala', 'T.N.'],
  },
  Cinnamon: {
    hindi: 'दालचीनी',
    aliases: ['cinnamon', 'dalchini', 'दालचीनी', 'darchini', 'elvagai', 'dalchini'],
    season: 'Perennial',
    sowing: 'Jul-Sep',
    harvesting: '2-3 years after planting, harvest stems 1.5-2 years old',
    waterNeeds: 'Moderate',
    temperature: '20-35°C',
    soil: 'Well-drained loam, pH 5.5-6.5',
    pests: ['Stem borer', 'Leaf eating caterpillar'],
    disease: ['Collar rot', 'Wilt'],
    fertilizers: 'NPK 200:150:300g per plant per year, organics',
    bestPractices: ' Coppicing after harvest, peel bark carefully, dry immediately.',
    states: ['Kerala', 'T.N.'],
  },
  Clove: {
    hindi: 'लौंग',
    aliases: ['clove', 'laung', 'लौंग', 'lavang', 'krambu', 'lengas'],
    season: 'Perennial (long gestation)',
    sowing: 'Jul-Sep',
    harvesting: '7-8 years after planting, pick flower buds before they open',
    waterNeeds: 'Regular, well-drained',
    temperature: '20-35°C',
    soil: 'Well-drained loam, pH 5.5-6.5',
    pests: ['Capsule borer', 'Mites', 'Mealybugs'],
    disease: ['Pod rot', 'Leaf spot'],
    fertilizers: 'NPK 500:250:500g per plant per year in splits',
    bestPractices: 'Partial shade, mulching, careful harvesting, dry in shade.',
    states: ['Kerala', 'T.N.'],
  },
}

// Export CROP_DATABASE for use elsewhere (optional)
export { CROP_DATABASE };

const CROP_INTENTS = Object.entries(CROP_DATABASE).map(([crop, data]) => ({
  crop,
  cropHindi: data.hindi,
  aliases: data.aliases,
}));

const PRICE_KEYS = ['bhav', 'भाव', 'daam', 'दाम', 'price', 'rate', 'कीमत', 'mandi', 'मंडी'];
const HOME_KEYS = ['home', 'homepage', 'होम', 'मुख्य पेज', 'main page'];
const PROFILE_KEYS = ['profile', 'account', 'khata', 'मेरा प्रोफाइल', 'mera profile', 'mera account'];
const DASHBOARD_KEYS = ['dashboard', 'meri listing', 'my items', 'my listings', 'गतिविधि', 'activities'];
const SETTINGS_KEYS = ['setting', 'settings', 'language', 'bhasha', 'सेटिंग', 'भाषा', 'change language'];
const LISTING_KEYS = ['bech', 'बेच', 'sell', 'listing', 'list', 'publish', 'फसल बेच', 'item list', 'crop list'];
const TRANSPORT_KEYS = ['transport', 'truck', 'gaadi', 'gadi', 'pickup', 'ट्रक', 'गाड़ी'];
const SEARCH_KEYS = ['search', 'khoj', 'खोज', 'buy', 'खरीद'];

// ── AI conversation language switch map ────────────────────────────────────────
// Maps trigger phrases → { lang, locale, label } for "speak in X" commands.
const LANGUAGE_SWITCH_MAP = [
  { patterns: ['speak english', 'talk english', 'talk to me in english', 'speak in english', 'reply in english', 'answer in english', 'english mein baat', 'english mein bolo', 'english me baat', 'switch to english', 'use english', 'in english please', 'english please'], lang: 'en', locale: 'en-IN', label: 'English', ack: 'Sure! I will now speak to you in English.' },
  { patterns: ['hindi mein baat', 'hindi mein bolo', 'hindi me baat', 'speak hindi', 'talk hindi', 'talk to me in hindi', 'speak in hindi', 'reply in hindi', 'switch to hindi', 'hindi please', 'hindi mein bol'], lang: 'hi', locale: 'hi-IN', label: 'Hindi', ack: 'जी, अब मैं हिंदी में बात करूँगी।' },
  { patterns: ['bengali mein baat', 'bengali mein bolo', 'speak bengali', 'talk bengali', 'talk to me in bengali', 'speak in bengali', 'reply in bengali', 'switch to bengali', 'bangla mein baat', 'bangla mein bolo'], lang: 'bn', locale: 'bn-IN', label: 'Bengali', ack: 'ঠিক আছে! আমি এখন বাংলায় কথা বলব।' },
  { patterns: ['punjabi mein baat', 'punjabi mein bolo', 'speak punjabi', 'talk punjabi', 'talk to me in punjabi', 'speak in punjabi', 'reply in punjabi', 'switch to punjabi', 'panjabi mein baat'], lang: 'pa', locale: 'pa-IN', label: 'Punjabi', ack: 'ਜੀ, ਹੁਣ ਮੈਂ ਪੰਜਾਬੀ ਵਿੱਚ ਗੱਲ ਕਰਾਂਗੀ।' },
  { patterns: ['marathi mein baat', 'marathi mein bolo', 'speak marathi', 'talk marathi', 'talk to me in marathi', 'speak in marathi', 'reply in marathi', 'switch to marathi', 'marathit bola'], lang: 'mr', locale: 'mr-IN', label: 'Marathi', ack: 'जी, आता मी मराठीत बोलेन।' },
  { patterns: ['tamil mein baat', 'tamil mein bolo', 'speak tamil', 'talk tamil', 'talk to me in tamil', 'speak in tamil', 'reply in tamil', 'switch to tamil', 'tamizh mein baat'], lang: 'ta', locale: 'ta-IN', label: 'Tamil', ack: 'சரி! இனி நான் தமிழில் பேசுவேன்.' },
  { patterns: ['telugu mein baat', 'telugu mein bolo', 'speak telugu', 'talk telugu', 'talk to me in telugu', 'speak in telugu', 'reply in telugu', 'switch to telugu'], lang: 'te', locale: 'te-IN', label: 'Telugu', ack: 'సరే! నేను ఇప్పుడు తెలుగులో మాట్లాడతాను.' },
  { patterns: ['kannada mein baat', 'kannada mein bolo', 'speak kannada', 'talk kannada', 'talk to me in kannada', 'speak in kannada', 'reply in kannada', 'switch to kannada'], lang: 'kn', locale: 'kn-IN', label: 'Kannada', ack: 'ಸರಿ! ನಾನು ಈಗ ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡುತ್ತೇನೆ.' },
  { patterns: ['gujarati mein baat', 'gujarati mein bolo', 'speak gujarati', 'talk gujarati', 'talk to me in gujarati', 'speak in gujarati', 'reply in gujarati', 'switch to gujarati'], lang: 'gu', locale: 'gu-IN', label: 'Gujarati', ack: 'ઠીક છે! હું હવે ગુજરાતીમાં વાત કરીશ.' },
  { patterns: ['bhojpuri mein baat', 'bhojpuri mein bolo', 'speak bhojpuri', 'talk bhojpuri', 'talk to me in bhojpuri', 'speak in bhojpuri', 'reply in bhojpuri', 'switch to bhojpuri'], lang: 'bh', locale: 'hi-IN', label: 'Bhojpuri', ack: 'ठीक बा! अब हम भोजपुरी में बात करब।' },
];

/**
 * Detect if the user is explicitly requesting a language switch.
 * Returns the matching entry from LANGUAGE_SWITCH_MAP or null.
 */
const detectLanguageSwitchIntent = (transcript) => {
  const lower = normalizeText(transcript);
  for (const entry of LANGUAGE_SWITCH_MAP) {
    if (entry.patterns.some((p) => lower.includes(p))) {
      return entry;
    }
  }
  return null;
};

/**
 * Determines the language to reply in.
 * Priority order:
 *  1. An explicit AI conversation language stored in localStorage ('krishi_ai_lang')
 *  2. Script-based detection from the transcript
 *  3. Keyword-based Hindi/Hinglish detection
 *  4. The user's configured UI/voice language
 */
const detectReplyMode = (transcript, voiceLocale, uiLang) => {
  // 1. Check for a persisted AI conversation language (set by language switch commands)
  const aiLang = localStorage.getItem('krishi_ai_lang');
  if (aiLang) {
    const entry = LANGUAGE_SWITCH_MAP.find((e) => e.lang === aiLang);
    if (entry) return { lang: entry.lang, locale: entry.locale, uiLang: entry.lang };
    // Fallback entries not in map
    if (aiLang === 'en') return { lang: 'en', locale: 'en-IN', uiLang: 'en' };
    if (aiLang === 'hi') return { lang: 'hi', locale: 'hi-IN', uiLang: 'hi' };
  }

  const lower = normalizeText(transcript);

  // 2. Script-based detection (most reliable)
  const hasTamil      = /[\u0B80-\u0BFF]/.test(transcript);
  const hasPunjabi    = /[\u0A00-\u0A7F]/.test(transcript);
  const hasDevanagari = /[\u0900-\u097F]/.test(transcript); // Hindi + Marathi + Bhojpuri
  const hasBengali    = /[\u0980-\u09FF]/.test(transcript);
  const hasTelugu     = /[\u0C00-\u0C7F]/.test(transcript);
  const hasKannada    = /[\u0C80-\u0CFF]/.test(transcript);
  const hasGujarati   = /[\u0A80-\u0AFF]/.test(transcript);
  const hasMalayalam  = /[\u0D00-\u0D7F]/.test(transcript);

  if (hasTamil)      return { lang: 'ta', locale: 'ta-IN', uiLang: 'ta' };
  if (hasPunjabi)    return { lang: 'pa', locale: 'pa-IN', uiLang: 'pa' };
  if (hasBengali)    return { lang: 'bn', locale: 'bn-IN', uiLang: 'bn' };
  if (hasTelugu)     return { lang: 'te', locale: 'te-IN', uiLang: 'te' };
  if (hasKannada)    return { lang: 'kn', locale: 'kn-IN', uiLang: 'kn' };
  if (hasGujarati)   return { lang: 'gu', locale: 'gu-IN', uiLang: 'gu' };
  if (hasMalayalam)  return { lang: 'ml', locale: 'ml-IN', uiLang: 'ml' };

  // Devanagari could be Hindi, Marathi, or Bhojpuri — use voiceLocale/uiLang to distinguish
  if (hasDevanagari) {
    if (voiceLocale === 'mr-IN' || uiLang === 'mr') return { lang: 'mr', locale: 'mr-IN', uiLang: 'mr' };
    if (uiLang === 'bh') return { lang: 'bh', locale: 'hi-IN', uiLang: 'bh' };
    return { lang: 'hi', locale: 'hi-IN', uiLang: uiLang || 'hi' };
  }

  // 3. If the text is purely Latin, treat it as English unless UI lang says otherwise
  const isPurelyLatin = /^[a-zA-Z0-9\s.,!?'-]+$/.test(transcript.trim());
  if (isPurelyLatin && transcript.trim().length > 0) {
    // Only override to English if no Hinglish keywords detected
    const looksHinglish = /(mujhe|mera|meri|bhav|aaj|dikhao|chahiye|kaise|mandi|karo|bolo|dijiye|kholo|batao|jankari)/i.test(lower);
    if (!looksHinglish) {
      return { lang: 'en', locale: 'en-IN', uiLang: 'en' };
    }
  }

  // 4. Keyword-based Hindi/Hinglish detection
  const looksHindi = /(mujhe|mera|meri|bhav|aaj|dikhao|chahiye|kaise|kya|mandi|karo|bolo|dijiye|kholo|batao|setting|kare|jankari)/i.test(lower);
  if (looksHindi) {
    const isHinglish = uiLang === 'hi-en';
    return { lang: isHinglish ? 'hi-en' : 'hi', locale: 'hi-IN', uiLang: uiLang || 'hi' };
  }

  // 5. Fall back to the user's configured UI/voice language
  const resolvedLocale = voiceLocale || 'en-IN';
  const resolvedLang = uiLang || (resolvedLocale.startsWith('en') ? 'en' : 'hi');
  return { lang: resolvedLang, locale: resolvedLocale, uiLang: resolvedLang };
};

const includesAny = (text, tokens) => tokens.some((token) => text.includes(normalizeText(token)));

const findCropIntent = (text) => CROP_INTENTS.find((item) =>
  item.aliases.some((alias) => text.includes(normalizeText(alias)))
);

async function fetchLatestMandiRows() {
  try {
    const { data, error } = await supabase
      .from('mandi_prices')
      .select('*')
      .order('date', { ascending: false })
      .limit(150);

    if (!error && data?.length) {
      return data.map(normalizeMandiEntry);
    }
  } catch (err) {
    console.error('mandi price lookup failed:', err);
  }

  return mockMandiPrices.map(normalizeMandiEntry);
}

export function useAssistant(voiceLocale) {
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  // Cancellation token — incremented each time the user closes the assistant
  const cancelRef = useRef(0);

  const clearResponse = useCallback(() => {
    cancelRef.current += 1; // invalidate any in-flight processIntent call
    setResponse('');
    setIsProcessing(false);
    assistantVoice.stop();
  }, []);

  const processIntent = useCallback(async (transcript) => {
    if (!transcript?.trim()) return;

    assistantVoice.stop();
    cancelRef.current += 1; // cancel any previous in-flight request
    const myToken = cancelRef.current; // snapshot this call's token
    const isCancelled = () => cancelRef.current !== myToken;

    setIsProcessing(true);
    setResponse('');

    const lower = normalizeText(transcript);
    const currentPath = window.location.pathname;
    // Detect the user's active UI language from localStorage (set by LanguageContext)
    const storedUiLang = localStorage.getItem('krishi_ui_language') || 'hi';

    // ── Step 0: Detect explicit language-switch commands FIRST ─────────────────
    const langSwitch = detectLanguageSwitchIntent(transcript);
    if (langSwitch) {
      if (isCancelled()) return;
      // Persist the AI conversation language
      localStorage.setItem('krishi_ai_lang', langSwitch.lang);
      const ack = langSwitch.ack;
      setResponse(ack);
      assistantVoice.speak(ack, langSwitch.locale);
      setIsProcessing(false);
      return;
    }

    const { lang, locale, uiLang: detectedUiLang } = detectReplyMode(transcript, voiceLocale, storedUiLang);
    const effectiveUiLang = detectedUiLang || storedUiLang;

    // ── Per-language navigation reply strings ──────────────────────────────────
    const NAV = {
      alreadyProfile:   { hi: 'आप अभी अपने प्रोफाइल पेज पर हैं।', en: 'You are already on your profile page.', ta: 'நீங்கள் ஏற்கனவே உங்கள் சுயவிவர பக்கத்தில் இருக்கிறீர்கள்.', mr: 'आपण आत्ता आपल्या प्रोफाइल पेजवर आहात.', pa: 'ਤੁਸੀਂ ਪਹਿਲਾਂ ਹੀ ਆਪਣੇ ਪ੍ਰੋਫਾਈਲ ਪੇਜ ਤੇ ਹੋ।', bh: 'आप अभी प्रोफाइल पेज पर बानी।', 'hi-en': 'Aap already profile page pe hain.' },
      openProfile:      { hi: 'जी, मैं आपका प्रोफाइल खोल रही हूँ।', en: 'Sure, opening your profile.', ta: 'சரி, உங்கள் சுயவிவரத்தை திறக்கிறேன்.', mr: 'जी, आपला प्रोफाइल उघडत आहे.', pa: 'ਜੀ, ਤੁਹਾਡਾ ਪ੍ਰੋਫਾਈਲ ਖੋਲ੍ਹ ਰਹੀ ਹਾਂ।', bh: 'जी, आपका प्रोफाइल खोलत बानी।', 'hi-en': 'Ji, aapka profile open kar rahi hoon.' },
      alreadyDashboard: { hi: 'आप अभी डैशबोर्ड पर हैं।', en: 'You are already on your dashboard.', ta: 'நீங்கள் ஏற்கனவே டாஷ்போர்டில் இருக்கிறீர்கள்.', mr: 'आपण आत्ता डॅशबोर्डवर आहात.', pa: 'ਤੁਸੀਂ ਪਹਿਲਾਂ ਹੀ ਡੈਸ਼ਬੋਰਡ ਤੇ ਹੋ।', bh: 'आप अभी डैशबोर्ड पर बानी।', 'hi-en': 'Aap already dashboard pe hain.' },
      openDashboard:    { hi: 'जी, मैं डैशबोर्ड खोल रही हूँ।', en: 'Sure, opening your dashboard.', ta: 'சரி, டாஷ்போர்டை திறக்கிறேன்.', mr: 'जी, डॅशबोर्ड उघडत आहे.', pa: 'ਜੀ, ਡੈਸ਼ਬੋਰਡ ਖੋਲ੍ਹ ਰਹੀ ਹਾਂ।', bh: 'जी, डैशबोर्ड खोलत बानी।', 'hi-en': 'Ji, dashboard open kar rahi hoon.' },
      alreadySettings:  { hi: 'आप सेटिंग्स पर हैं।', en: 'You are already on the settings page.', ta: 'நீங்கள் ஏற்கனவே அமைப்புகள் பக்கத்தில் இருக்கிறீர்கள்.', mr: 'आपण सेटिंग्ज पेजवर आहात.', pa: 'ਤੁਸੀਂ ਪਹਿਲਾਂ ਹੀ ਸੈਟਿੰਗ ਤੇ ਹੋ।', bh: 'आप सेटिंग्स पर बानी।', 'hi-en': 'Aap settings pe hain.' },
      openSettings:     { hi: 'जी, सेटिंग्स खोल रही हूँ।', en: 'Sure, opening settings.', ta: 'சரி, அமைப்புகளை திறக்கிறேன்.', mr: 'जी, सेटिंग्ज उघडत आहे.', pa: 'ਜੀ, ਸੈਟਿੰਗਾਂ ਖੋਲ੍ਹ ਰਹੀ ਹਾਂ।', bh: 'जी, सेटिंग्स खोलत बानी।', 'hi-en': 'Ji, settings open kar rahi hoon.' },
      listing:          { hi: 'जी, नीचे माइक पर बोलिए या मैन्युअल फॉर्म भरिए।', en: 'Sure! Use the mic below or fill the manual form to list your crop.', ta: 'சரி! கீழே உள்ள மைக்கில் பேசுங்கள் அல்லது படிவம் நிரப்புங்கள்.', mr: 'जी, खाली माइक वापरा किंवा मॅन्युअल फॉर्म भरा.', pa: 'ਜੀ, ਹੇਠਾਂ ਮਾਈਕ ਵਰਤੋ ਜਾਂ ਫਾਰਮ ਭਰੋ।', bh: 'जी, माइक पर बोलीं या फॉर्म भरीं।', 'hi-en': 'Ji, mic pe bolo ya manual form bharo.' },
      alreadyTransport: { hi: 'आप ट्रांसपोर्ट पेज पर हैं।', en: 'You are already on the transport page.', ta: 'நீங்கள் ஏற்கனவே போக்குவரத்து பக்கத்தில் இருக்கிறீர்கள்.', mr: 'आपण ट्रान्सपोर्ट पेजवर आहात.', pa: 'ਤੁਸੀਂ ਟਰਾਂਸਪੋਰਟ ਪੇਜ ਤੇ ਹੋ।', bh: 'आप ट्रांसपोर्ट पेज पर बानी।', 'hi-en': 'Aap transport page pe hain.' },
      openTransport:    { hi: 'जी, ट्रांसपोर्ट विकल्प दिखा रही हूँ।', en: 'Sure, showing transport options.', ta: 'சரி, போக்குவரத்து விருப்பங்களை காட்டுகிறேன்.', mr: 'जी, ट्रान्सपोर्ट पर्याय दाखवत आहे.', pa: 'ਜੀ, ਟਰਾਂਸਪੋਰਟ ਵਿਕਲਪ ਦਿਖਾ ਰਹੀ ਹਾਂ।', bh: 'जी, ट्रांसपोर्ट विकल्प दिखावत बानी।', 'hi-en': 'Ji, transport options dikha rahi hoon.' },
      alreadyHome:      { hi: 'आप होमपेज पर हैं।', en: 'You are already on the homepage.', ta: 'நீங்கள் ஏற்கனவே முகப்பு பக்கத்தில் இருக்கிறீர்கள்.', mr: 'आपण होमपेजवर आहात.', pa: 'ਤੁਸੀਂ ਹੋਮਪੇਜ ਤੇ ਹੋ।', bh: 'आप होमपेज पर बानी।', 'hi-en': 'Aap homepage pe hain.' },
      openHome:         { hi: 'जी, होमपेज पर ले चलती हूँ।', en: 'Sure, taking you to the homepage.', ta: 'சரி, முகப்பு பக்கத்திற்கு அழைத்து செல்கிறேன்.', mr: 'जी, होमपेजवर नेत आहे.', pa: 'ਜੀ, ਹੋਮਪੇਜ ਤੇ ਲੈ ਜਾ ਰਹੀ ਹਾਂ।', bh: 'जी, होमपेज पर ले चलत बानी।', 'hi-en': 'Ji, homepage pe le ja rahi hoon.' },
      priceFound:       { hi: (crop, price, unit, mandi, loc) => `आज ${crop} का भाव ${price} रुपये प्रति ${unit} है, ${mandi}${loc ? `, ${loc}` : ''} में।`, en: (crop, price, unit, mandi, loc) => `Today's ${crop} price is ₹${price} per ${unit} at ${mandi}${loc ? `, ${loc}` : ''}.` },
      priceSearch:      { hi: (crop) => `मैं ${crop} के भाव और लिस्टिंग दिखा रही हूँ।`, en: (crop) => `Showing listings and prices for ${crop}.` },
      mandiGeneral:     { hi: 'जी, मंडी भाव दिखा रही हूँ। फसल का नाम बोलिए जैसे "गेहूं का भाव"।', en: 'Here are the latest mandi prices. Say a crop name like "wheat price" for specific rates.' },
    };

    // Helper to get the best reply for current language
    const t = (key, ...args) => {
      const map = NAV[key];
      if (!map) return '';
      const fn = map[effectiveUiLang] || map[lang] || map['hi'];
      return typeof fn === 'function' ? fn(...args) : fn;
    };

    let reply = '';
    let action = null;

    // 1. Navigation intents
    if (includesAny(lower, PROFILE_KEYS)) {
      if (currentPath === '/profile') {
        reply = t('alreadyProfile');
      } else {
        reply = t('openProfile');
        action = () => navigate('/profile');
      }
    } else if (includesAny(lower, DASHBOARD_KEYS)) {
      if (currentPath === '/dashboard') {
        reply = t('alreadyDashboard');
      } else {
        reply = t('openDashboard');
        action = () => navigate('/dashboard');
      }
    } else if (includesAny(lower, SETTINGS_KEYS)) {
      if (currentPath === '/settings') {
        reply = t('alreadySettings');
      } else {
        reply = t('openSettings');
        action = () => navigate('/settings');
      }
    } else if (includesAny(lower, LISTING_KEYS)) {
      reply = t('listing');
      action = () => {
        navigate('/');
        setTimeout(() => {
          const section = document.getElementById('voice-section');
          section?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      };
    } else if (includesAny(lower, TRANSPORT_KEYS)) {
      if (currentPath === '/transport') {
        reply = t('alreadyTransport');
      } else {
        reply = t('openTransport');
        action = () => navigate('/transport');
      }
    } else if (includesAny(lower, HOME_KEYS)) {
      if (currentPath === '/') {
        reply = t('alreadyHome');
      } else {
        reply = t('openHome');
        action = () => navigate('/');
      }
    }
    // 2. Price queries
    else if (includesAny(lower, PRICE_KEYS) || includesAny(lower, SEARCH_KEYS)) {
      const cropIntent = findCropIntent(lower);
      const locationHint = findLocationHint(lower);

      if (cropIntent) {
        const mandiRows = await fetchLatestMandiRows();
        if (isCancelled()) return;
        const guidance = getMandiPriceGuidance({
          crop: cropIntent.crop,
          userPrice: 0,
          userPriceUnit: 'quintal',
          profile,
          mandiPrices: mandiRows,
          preferredLocation: locationHint,
        });

        if (guidance) {
          // Determine reply language: English if lang=en, else Hindi/Indic
          const isEnglish = lang === 'en' || effectiveUiLang === 'en';
          const isIndoAryan = !isEnglish && ['hi', 'bh', 'mr', 'hi-en', 'pa'].includes(lang);
          
          let prefixHi = `आज ${cropIntent.cropHindi} का भाव`;
          let prefixEn = `Today's ${cropIntent.crop} price is`;
          
          const userAddressLower = normalizeText(profile?.address || '');
          const userStateLower = normalizeText(profile?.state || '');
          const marketDistrict = normalizeText(guidance.bestMarket.district);
          const marketState = normalizeText(guidance.bestMarket.state);
          
          const isUserDistrict = userAddressLower && marketDistrict && userAddressLower.includes(marketDistrict);
          const isUserState = userStateLower && marketState && userStateLower.includes(marketState);
          const isHintDistrict = guidance.farmerLocation?.district && marketDistrict.includes(normalizeText(guidance.farmerLocation.district));
          
          if (isUserDistrict || isHintDistrict) {
             prefixHi = `आपके शहर ${guidance.bestMarket.district} में आज ${cropIntent.cropHindi} का भाव`;
             prefixEn = `In your city ${guidance.bestMarket.district}, today's ${cropIntent.crop} price is`;
          } else if (isUserState) {
             prefixHi = `आपके राज्य ${guidance.bestMarket.state} में आज ${cropIntent.cropHindi} का भाव`;
             prefixEn = `In your state ${guidance.bestMarket.state}, today's ${cropIntent.crop} price is`;
          }

          reply = isEnglish
            ? `${prefixEn} ₹${guidance.marketPrice} per ${guidance.unit} at ${guidance.bestMarket.mandi}.`
            : `${prefixHi} ${guidance.marketPrice} रुपये प्रति ${guidance.unit} है (${guidance.bestMarket.mandi})।`;
        } else {
          const isEnglish = lang === 'en' || effectiveUiLang === 'en';
          reply = isEnglish
            ? `Showing listings and prices for ${cropIntent.crop}.`
            : `मैं ${cropIntent.cropHindi} के भाव और लिस्टिंग दिखा रही हूँ।`;
        }

        action = () => navigate(`/search?crop=${encodeURIComponent(cropIntent.crop)}${locationHint?.district ? `&location=${encodeURIComponent(locationHint.district)}` : ''}`);
      } else {
        reply = t('mandiGeneral');
        action = () => navigate('/search');
      }
    }
    else {
      const userLocContext = profile?.address ? ` (Context: user is from ${profile.address}${profile?.state ? `, ${profile.state}` : ''}. Answer accordingly for their area.)` : '';
      reply = await askGemini(transcript + userLocContext, lang === 'hi', locale, effectiveUiLang);
      if (isCancelled()) return;
      action = null;
    }

    if (isCancelled()) return;
    setResponse(reply);
    assistantVoice.speak(reply, locale);

    if (action) {
      setTimeout(action, 50);
    }

    setIsProcessing(false);
  }, [navigate, profile, voiceLocale]);

  return {
    processIntent,
    response,
    isProcessing,
    clearResponse,
  };
}
