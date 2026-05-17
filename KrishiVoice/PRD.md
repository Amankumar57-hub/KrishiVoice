
PROMPT 1 — FRONTEND UI/UX
PROJECT: KrishiVoice — Frontend Only (React + Vite + Tailwind + Capacitor)
You are an expert frontend developer. Build the complete UI/UX for a voice-first agricultural marketplace called KrishiVoice. Use only mock/dummy data for now — no real backend calls. Every screen must be fully designed, pixel-perfect, mobile-first, and desktop responsive.
1. TECH STACK (FRONTEND ONLY) (MCP already connected, project name: KrishiVoice)
React + Vite
Tailwind CSS
React Router v6
Capacitor (for Android APK wrapping)
Recharts (for analytics/graphs)
i18next (for multilingual support)
Web Speech API (browser voice — mock the Bhashini API call with a dummy function for now)
@capacitor/microphone (mobile voice — add plugin, mock the response)
2. BRAND & DESIGN SYSTEM
App Name: KrishiVoice
Primary Color: Sky Blue — 
#38bdf8
Background: White — 
#ffffff
Text/Headers: Black — 
#0f172a
Font: Inter or system sans-serif
Border Radius: rounded-xl for cards, rounded-full for buttons and icons
Shadow: subtle shadow-sm on cards
Design Style: Clean, minimal, flat, agricultural feel
Mobile breakpoint: 375px minimum width
Desktop breakpoint: 1024px and above — show sidebar nav instead of bottom nav
Bilingual UI Rule (MUST FOLLOW EVERYWHERE)
Every single label, button, placeholder, heading, tab, and tooltip must have:
English text on top (font-weight 500)
Hindi translation directly below in smaller size (text-xs, text-gray-500)
Examples:
Search / खोज
Home / मुख्य पृष्ठ
Sell Grain / अनाज बेचें
My Listings / मेरी सूचियां
Price per Quintal / प्रति क्विंटल मूल्य
Transport / परिवहन
3. FOLDER STRUCTURE
src/
├── assets/
│   └── logo.svg
├── components/
│   ├── VoiceButton.jsx
│   ├── ListingCard.jsx
│   ├── MandiPriceBanner.jsx
│   ├── TransportCard.jsx
│   ├── BottomNav.jsx
│   ├── SideNav.jsx
│   ├── GrainInfoCard.jsx
│   ├── ContactModal.jsx
│   ├── LanguageSelector.jsx
│   └── StatusBadge.jsx
├── pages/
│   ├── Home.jsx
│   ├── Search.jsx
│   ├── Analytics.jsx
│   ├── Settings.jsx
│   ├── Dashboard.jsx
│   ├── Transport.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── RegisterUsername.jsx
│   └── admin/
│       ├── AdminLogin.jsx
│       ├── AdminSetup.jsx
│       ├── AdminDashboard.jsx
│       ├── AdminUsers.jsx
│       ├── AdminListings.jsx
│       └── AdminTransporters.jsx
├── hooks/
│   ├── useVoice.js
│   └── useAuth.js
├── context/
│   ├── AuthContext.jsx
│   └── LanguageContext.jsx
├── i18n/
│   ├── en.json
│   ├── hi.json
│   ├── bho.json
│   └── ta.json
├── mock/
│   ├── listings.js
│   ├── mandiPrices.js
│   ├── transporters.js
│   └── users.js
├── App.jsx
└── main.jsx
4. ROUTING
/ → Home
/search → Search
/analytics → Analytics
/settings → Settings
/dashboard → Dashboard
/transport → Transport
/login → Login
/register → Register Step 1
/register/username → Register Step 2
/1234/admin → Admin Login
/1234/admin/setup → First-time Setup (shown only once)
/1234/admin/dashboard → Admin Analytics
/1234/admin/users → Admin User Management
/1234/admin/listings → Admin Listing Management
/1234/admin/transporters → Admin Transporter Management
All user routes redirect to /login if no auth token in context
All /1234/admin routes redirect to /1234/admin if no admin token in context
Use React Router v6 with nested routes
5. SIGN-UP FLOW
Step 1 — /register
Fields (each with English + Hindi label):
Full Name / पूरा नाम
Email / ईमेल
Date of Birth / जन्म तिथि
Gender / लिंग (dropdown: Male/पुरुष, Female/महिला, Other/अन्य)
Password / पासवर्ड
Confirm Password / पासवर्ड दोबारा
Progress bar showing Step 1 of 2.
"Next" button → goes to Step 2.
Step 2 — /register/username
Username input / उपयोगकर्ता नाम (show availability check — mock with green tick)
Role selector: Farmer (किसान) / Buyer (खरीदार) — card style toggle, not dropdown
"Get Started / शुरू करें" button → redirect to /
Both steps use sky blue primary button, white card layout, KrishiVoice logo at top.
6. LOGIN PAGE — /login
Email / ईमेल
Password / पासवर्ड
"Login / लॉगिन" button (sky blue, full width)
"Don't have an account? Register / खाता नहीं है? पंजीकृत करें" link
Clean centered card layout, logo at top
7. HOME PAGE — /
Top Bar
KrishiVoice logo left
Language selector right (flag + language name dropdown)
Notification bell icon
Mandi Price Banner
Horizontal scrolling ticker banner below top bar
Shows: Wheat ₹2100/q · Rice ₹1800/q · Corn ₹1500/q · Soybean ₹4200/q (mock data, auto-scrolling)
Sky blue background, white text
Label: "Live Mandi Prices / लाइव मंडी भाव"
Voice Button Section
Centered large circular sky blue mic button (pulsing ring animation when idle)
Label below: "Tap to speak your listing / बोलकर सूची बनाएं"
On tap: animate to recording state (red pulsing), show text "Listening... / सुन रहा हूं..."
After 3 seconds (mock): show extracted result card:
Crop: Wheat / गेहूं
Quantity: 10 Quintal / 10 क्विंटल
Price: ₹30/kg
Confirm button: "Publish Listing / सूची प्रकाशित करें"
Edit button: "Edit / संपादित करें"
Recent Listings Section
Heading: "Recent Listings / हाल की सूचियां"
Grid of ListingCards (2 columns mobile, 3 columns desktop)
Each card: crop name (English + Hindi), quantity, price, seller name, location, "Contact / संपर्क" button in sky blue
8. LISTING CARD COMPONENT
Each card shows:
Crop icon (emoji: 🌾 for wheat, 🌽 for corn, 🍚 for rice, etc.)
Crop Name / फसल का नाम (bold)
Quantity / मात्रा
Price per kg or quintal / मूल्य
Seller Name / विक्रेता नाम
Location / स्थान
Status badge: Available (हरा) / Sold (लाल) / In Transit (नीला)
Contact button → opens ContactModal
ContactModal
Shows:
Phone number with call icon
WhatsApp number with WhatsApp green icon
Email with mail icon
Address / पता
Close button
9. SEARCH PAGE — /search
Search bar at top (with voice search icon inside)
Placeholder: "Search grain, location... / अनाज, स्थान खोजें..."
Filters row below (pill buttons, horizontally scrollable):
All / सभी
Wheat / गेहूं
Rice / चावल
Corn / मक्का
Soybean / सोयाबीन
By Price / मूल्य अनुसार
By Location / स्थान अनुसार
Results list (same ListingCard component)
Empty state: illustration + "No results found / कोई परिणाम नहीं मिला"
10. ANALYTICS PAGE — /analytics
Show role-based content using mock data:
Farmer View
Stats row (3 cards):
Total Listings / कुल सूचियां — 24
Total Sold / कुल बिके — 18
Earnings / कमाई — ₹1,20,000
Line chart: "Price Trend / मूल्य प्रवृत्ति" — wheat price over last 30 days
Bar chart: "Monthly Sales / मासिक बिक्री"
Recent Activity list
Buyer View
Stats row:
Purchases / खरीद — 12
Sellers Contacted / संपर्क किए — 34
Saved Listings / सहेजी सूचियां — 7
Line chart: "Market Price Trend / बाजार मूल्य प्रवृत्ति"
Contact history list
All charts use sky blue as primary color. Labels in English + Hindi.
11. SETTINGS PAGE — /settings
Sections (each with English + Hindi heading):
Profile / प्रोफ़ाइल
Avatar with upload option
Name, username (read-only), phone number (editable)
"Save Changes / परिवर्तन सहेजें" button
Language / भाषा
Grid of language options (card style with flag emoji):
🇮🇳 Hindi / हिंदी
🇮🇳 Bhojpuri / भोजपुरी
🇮🇳 Tamil / தமிழ்
🇮🇳 Telugu / తెలుగు
🇬🇧 English
🇮🇳 Marathi / मराठी
🇮🇳 Punjabi / ਪੰਜਾਬੀ
🇮🇳 Bengali / বাংলা
Selected language highlighted in sky blue border
Theme / थीम
Color accent picker (sky blue default + 4 other options)
Dark mode toggle (optional, bonus)
Notifications / सूचनाएं
Toggle: New buyer inquiry / नई खरीदार जांच
Toggle: Mandi price alerts / मंडी मूल्य अलर्ट
Toggle: Listing status updates / सूची स्थिति अपडेट
Logout / लॉगआउट
Red outlined "Logout / लॉगआउट" button at bottom
12. DASHBOARD PAGE — /dashboard
Farmer Dashboard
"My Listings / मेरी सूचियां" tab + "Voice Add / आवाज से जोड़ें" button (sky blue)
Listings in a table/card list with:
Crop, Quantity, Price, Status badge, Edit, Delete actions
Filter by status: All / Available / Sold / In Transit
Buyer Dashboard
"Saved Listings / सहेजी सूचियां" tab
"My Inquiries / मेरी जांच" tab
Contact history with seller names, dates, method used (phone/WhatsApp/email)
13. TRANSPORT PAGE — /transport
Heading: "Transport Services / परिवहन सेवाएं"
Filter by region (state dropdown)
Grid of TransportCards, each showing:
Transporter name / नाम
Region / क्षेत्र
Vehicle type / वाहन प्रकार (Truck/Tempo/Mini-truck)
📞 Phone number (tap to call)
💬 WhatsApp number (tap to open WhatsApp)
Verified badge (green tick) if verified
14. BOTTOM NAV (Mobile) / SIDE NAV (Desktop)
Bottom Nav (mobile, fixed bottom)
4 tabs with icon + English label + Hindi label below:
🏠 Home / मुख्य पृष्ठ
🔍 Search / खोज
📊 Progress / प्रगति
⚙️ Settings / सेटिंग
Active tab: sky blue icon + label. Inactive: gray.
Side Nav (desktop, fixed left, 240px wide)
Logo at top
Same 4 nav items as vertical list
User avatar + name + role at bottom
Logout icon
15. ADMIN PANEL UI (Basic — No Design Richness)
Admin panel is a completely separate section. UI must be simple and functional only.
Admin Login — /1234/admin
Plain white card, centered
Email input, Password input
"Login" button (black, full width)
No branding required — just functional
Admin First Setup — /1234/admin/setup
Shown ONLY if no admin exists (mock: check localStorage key adminSetupDone)
Fields: Admin Email, Password, Confirm Password
"Create Admin" button
After submit: set localStorage adminSetupDone = true → redirect to admin dashboard
This page must NEVER show again after setup
Admin Dashboard — /1234/admin/dashboard
Top stat cards (plain, no color):
Total Users: 240
Active Listings: 87
Today's Signups: 12
Verified Transporters: 34
Simple line chart (Recharts) for daily signups
Simple bar chart for grain category breakdown
Admin Users — /1234/admin/users
Plain HTML-style table (Tailwind styled, minimal)
Columns: Name, Username, Email, Role, Joined, Status, Actions
Actions: Edit (modal), Delete (confirm dialog), View Listings (link)
Pagination (10 per page)
Search bar at top
Admin Listings — /1234/admin/listings
Table: Crop, Seller, Quantity, Price, Location, Status, Actions
Actions: Approve, Reject, Delete
Filter by status
Admin Transporters — /1234/admin/transporters
Table: Name, Region, Phone, WhatsApp, Vehicle, Verified, Actions
Actions: Verify toggle, Edit, Delete
"Add Transporter" button → inline form or modal
16. MOCK DATA (use in /mock/ folder)
js
// mock/listings.js
export const mockListings = [
  { id:1, crop:"Wheat", cropHindi:"गेहूं", qty:10, unit:"Quintal", price:30, priceUnit:"kg", seller:"Ramesh Kumar", location:"Patna, Bihar", phone:"9876543210", whatsapp:"9876543210", email:"ramesh@example.com", address:"Village Bihta, Patna", status:"available" },
  { id:2, crop:"Rice", cropHindi:"चावल", qty:25, unit:"Quintal", price:1800, priceUnit:"quintal", seller:"Suresh Yadav", location:"Varanasi, UP", phone:"9123456789", whatsapp:"9123456789", email:"suresh@example.com", address:"Maidagin, Varanasi", status:"sold" },
  { id:3, crop:"Corn", cropHindi:"मक्का", qty:15, unit:"Quintal", price:1500, priceUnit:"quintal", seller:"Mohan Singh", location:"Indore, MP", phone:"9988776655", whatsapp:"9988776655", email:"mohan@example.com", address:"Palasia, Indore", status:"in_transit" }
]

// mock/mandiPrices.js
export const mockMandiPrices = [
  { crop:"Wheat", cropHindi:"गेहूं", price:2100, unit:"quintal", mandi:"Patna Mandi" },
  { crop:"Rice", cropHindi:"चावल", price:1800, unit:"quintal", mandi:"Lucknow Mandi" },
  { crop:"Corn", cropHindi:"मक्का", price:1500, unit:"quintal", mandi:"Indore Mandi" },
  { crop:"Soybean", cropHindi:"सोयाबीन", price:4200, unit:"quintal", mandi:"Bhopal Mandi" }
]

// mock/transporters.js
export const mockTransporters = [
  { id:1, name:"Vijay Transport", region:"Bihar", phone:"9876500001", whatsapp:"9876500001", vehicle:"Truck (10 ton)", verified:true },
  { id:2, name:"Shiva Logistics", region:"UP", phone:"9876500002", whatsapp:"9876500002", vehicle:"Mini Truck", verified:true },
  { id:3, name:"Ram Carriers", region:"MP", phone:"9876500003", whatsapp:"9876500003", vehicle:"Tempo", verified:false }
]
17. VOICE BUTTON COMPONENT (useVoice.js — mock)
js
// hooks/useVoice.js
export function useVoice() {
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState(null)

  const startListening = () => {
    setListening(true)
    setResult(null)
    setTimeout(() => {
      // Mock Bhashini API result
      setResult({
        transcript: "मुझे 10 quintal गेहूं बेचना है 30rs kilo",
        crop: "Wheat",
        cropHindi: "गेहूं",
        quantity: 10,
        unit: "Quintal",
        price: 30,
        priceUnit: "kg"
      })
      setListening(false)
    }, 3000)
  }

  return { listening, result, startListening }
}
18. ADDITIONAL FRONTEND RULES
No backend calls anywhere — all data from /mock/ files
Every page must work on 375px screen width
All forms must have inline validation (red border + error message in English + Hindi)
Loading states: use skeleton loaders (gray animated bars) not spinners
Empty states: friendly message in English + Hindi
All buttons must have hover and active states
Capacitor plugins imported but mocked — do not break if running in browser
Use React Context for auth state and language state
Do not install any paid component library — Tailwind only
Admin panel uses same Tailwind but zero sky blue branding — black and white only
PROMPT 2 — BACKEND
PROJECT: KrishiVoice — Backend Only (Supabase + Edge Functions + API Integrations)
You are an expert backend developer. Build the complete backend for KrishiVoice, a voice-first agricultural marketplace. The frontend already exists — your job is to replace all mock data with real Supabase connections, set up all tables, auth, edge functions, RLS policies, and third-party API integrations.
1. BACKEND TECH STACK
Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
Bhashini API (Indian government multilingual voice API)
Agmarket API / data.gov.in (live Mandi prices)
Supabase Edge Functions (Deno runtime)
Supabase Row Level Security (RLS) on all tables
2. SUPABASE PROJECT SETUP
Create the following in order:
Enable Email Auth in Supabase dashboard
Disable email confirmation (or make optional)
Create all tables below
Enable RLS on every table
Write all RLS policies
Create Edge Functions
Set up Storage bucket for avatars
3. COMPLETE DATABASE SCHEMA
sql
-- PROFILES TABLE
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null,
  username text unique not null,
  email text not null,
  dob date,
  gender text check (gender in ('male','female','other')),
  role text check (role in ('farmer','buyer')) not null,
  language_pref text default 'hi',
  avatar_url text,
  phone text,
  whatsapp text,
  address text,
  state text,
  is_banned boolean default false,
  created_at timestamptz default now()
);

-- LISTINGS TABLE
create table listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  crop_name text not null,
  crop_name_hindi text,
  quantity numeric not null,
  unit text check (unit in ('kg','quintal')) not null,
  price_per_unit numeric not null,
  price_unit text check (price_unit in ('kg','quintal')) not null,
  location text,
  address text,
  phone text,
  whatsapp text,
  status text check (status in ('available','sold','in_transit')) default 'available',
  voice_transcript text,
  is_approved boolean default true,
  created_at timestamptz default now()
);

-- MANDI PRICES TABLE
create table mandi_prices (
  id uuid primary key default gen_random_uuid(),
  crop_name text not null,
  crop_name_hindi text,
  mandi_name text,
  state text,
  price_min numeric,
  price_max numeric,
  price_modal numeric,
  date date,
  source text,
  is_stale boolean default false,
  created_at timestamptz default now()
);

-- CONTACTS / INQUIRIES TABLE
create table contacts (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references profiles(id) on delete cascade not null,
  seller_id uuid references profiles(id) on delete cascade not null,
  listing_id uuid references listings(id) on delete cascade not null,
  method text check (method in ('phone','whatsapp','email','message')) not null,
  message text,
  status text check (status in ('pending','responded','closed')) default 'pending',
  created_at timestamptz default now()
);

-- TRANSPORTERS TABLE
create table transporters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text,
  state text,
  phone text not null,
  whatsapp text,
  vehicle_type text,
  verified boolean default false,
  created_at timestamptz default now()
);

-- ADMIN USERS TABLE
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  created_at timestamptz default now()
);
4. ROW LEVEL SECURITY (RLS) POLICIES
sql
-- PROFILES
alter table profiles enable row level security;
create policy "Users read own profile" on profiles for select using (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);
create policy "Public read profiles" on profiles for select using (true);

-- LISTINGS
alter table listings enable row level security;
create policy "Anyone can read approved listings" on listings for select using (is_approved = true);
create policy "Farmers create own listings" on listings for insert with check (auth.uid() = user_id);
create policy "Farmers update own listings" on listings for update using (auth.uid() = user_id);
create policy "Farmers delete own listings" on listings for delete using (auth.uid() = user_id);

-- MANDI PRICES
alter table mandi_prices enable row level security;
create policy "Anyone can read mandi prices" on mandi_prices for select using (true);

-- CONTACTS
alter table contacts enable row level security;
create policy "Buyer creates contact" on contacts for insert with check (auth.uid() = buyer_id);
create policy "Buyer reads own contacts" on contacts for select using (auth.uid() = buyer_id);
create policy "Seller reads own contacts" on contacts for select using (auth.uid() = seller_id);

-- TRANSPORTERS
alter table transporters enable row level security;
create policy "Anyone reads transporters" on transporters for select using (true);

-- ADMIN USERS (no public access)
alter table admin_users enable row level security;
create policy "No public access to admin" on admin_users for all using (false);
5. SUPABASE EDGE FUNCTIONS
Function 1: voice-to-listing
Path: supabase/functions/voice-to-listing/index.ts
ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { audioBase64, language } = await req.json()

  // Call Bhashini ASR API
  const bhashiniRes = await fetch("https://dhruva-api.bhashini.gov.in/services/inference/pipeline", {
    method: "POST",
    headers: {
      "Authorization": Deno.env.get("BHASHINI_API_KEY")!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      pipelineTasks: [{ taskType: "asr", config: { language: { sourceLanguage: language || "hi" } } }],
      inputData: { audio: [{ audioContent: audioBase64 }] }
    })
  })

  const bhashiniData = await bhashiniRes.json()
  const transcript = bhashiniData?.pipelineResponse?.[0]?.output?.[0]?.source || ""

  // Parse transcript for crop, quantity, price
  const result = parseTranscript(transcript)

  return new Response(JSON.stringify({ transcript, ...result }), {
    headers: { "Content-Type": "application/json" }
  })
})

function parseTranscript(text: string) {
  // Basic NLP parsing — expand with regex or NLP service as needed
  const quantityMatch = text.match(/(\d+)\s*(quintal|kg|किलो|क्विंटल)/i)
  const priceMatch = text.match(/(\d+)\s*(rs|रुपए|₹|rupee)/i)
  const cropMap: Record<string, string> = {
    "गेहूं": "Wheat", "wheat": "Wheat",
    "चावल": "Rice", "rice": "Rice",
    "मक्का": "Corn", "corn": "Corn",
    "सोयाबीन": "Soybean", "soybean": "Soybean"
  }

  let crop = "Unknown", cropHindi = ""
  for (const [key, val] of Object.entries(cropMap)) {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      crop = val
      cropHindi = key
      break
    }
  }

  return {
    crop,
    cropHindi,
    quantity: quantityMatch ? Number(quantityMatch[1]) : null,
    unit: quantityMatch ? quantityMatch[2] : null,
    price: priceMatch ? Number(priceMatch[1]) : null
  }
}
Function 2: fetch-mandi-prices
Path: supabase/functions/fetch-mandi-prices/index.ts
ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  // Fetch from data.gov.in commodity prices API
  const res = await fetch(
    `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${Deno.env.get("DATAGOV_API_KEY")}&format=json&limit=50`
  )
  const data = await res.json()

  const records = data?.records?.map((r: any) => ({
    crop_name: r.commodity,
    mandi_name: r.market,
    state: r.state,
    price_min: parseFloat(r.min_price),
    price_max: parseFloat(r.max_price),
    price_modal: parseFloat(r.modal_price),
    date: r.arrival_date,
    source: "data.gov.in",
    is_stale: false
  })) || []

  await supabase.from("mandi_prices").insert(records)

  return new Response(JSON.stringify({ inserted: records.length }), {
    headers: { "Content-Type": "application/json" }
  })
})
Schedule this Edge Function to run every 6 hours using Supabase cron or an external cron job.
Function 3: admin-auth
Path: supabase/functions/admin-auth/index.ts
ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts"
import { create } from "https://deno.land/x/djwt@v3.0.1/mod.ts"

serve(async (req) => {
  const { action, email, password } = await req.json()
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  if (action === "setup") {
    const { data: existing } = await supabase.from("admin_users").select("id").limit(1)
    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ error: "Admin already exists" }), { status: 403 })
    }
    const hash = await bcrypt.hash(password)
    await supabase.from("admin_users").insert({ email, password_hash: hash })
    return new Response(JSON.stringify({ success: true }))
  }

  if (action === "login") {
    const { data: admin } = await supabase.from("admin_users").select("*").eq("email", email).single()
    if (!admin) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 })
    const valid = await bcrypt.compare(password, admin.password_hash)
    if (!valid) return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 })

    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(Deno.env.get("ADMIN_JWT_SECRET")!), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"])
    const token = await create({ alg: "HS256", typ: "JWT" }, { adminId: admin.id, exp: Math.floor(Date.now() / 1000) + 86400 }, key)
    return new Response(JSON.stringify({ token }))
  }

  return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 })
})
6. SUPABASE AUTH INTEGRATION
Replace all mock auth with real Supabase Auth:
js
// lib/supabase.js
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Register Step 1+2
const { data, error } = await supabase.auth.signUp({ email, password })
await supabase.from('profiles').insert({
  id: data.user.id,
  full_name, email, dob, gender, username, role, language_pref: 'hi'
})

// Login
const { data, error } = await supabase.auth.signInWithPassword({ email, password })

// Logout
await supabase.auth.signOut()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
7. FRONTEND API CALLS (replace mock data)
js
// Fetch all available listings
const { data } = await supabase.from('listings').select('*, profiles(full_name, phone, whatsapp, address)').eq('status','available').eq('is_approved', true)

// Create listing
await supabase.from('listings').insert({ user_id, crop_name, crop_name_hindi, quantity, unit, price_per_unit, price_unit, location, address, phone, whatsapp, voice_transcript })

// Fetch mandi prices
const { data } = await supabase.from('mandi_prices').select('*').eq('is_stale', false).order('date', { ascending: false }).limit(20)

// Fetch transporters
const { data } = await supabase.from('transporters').select('*').eq('verified', true)

// Create contact/inquiry
await supabase.from('contacts').insert({ buyer_id, seller_id, listing_id, method, message })

// Call voice Edge Function
const res = await fetch(`${SUPABASE_URL}/functions/v1/voice-to-listing`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ audioBase64, language: 'hi' })
})
const result = await res.json()
8. ADMIN PANEL BACKEND CALLS
js
// Admin login
const res = await fetch(`${SUPABASE_URL}/functions/v1/admin-auth`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'login', email, password })
})
const { token } = await res.json()
localStorage.setItem('adminToken', token)

// Admin: get all users (use service role key in Edge Function only)
const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })

// Admin: ban user
await supabase.from('profiles').update({ is_banned: true }).eq('id', userId)

// Admin: delete user
await supabase.from('profiles').delete().eq('id', userId)

// Admin: approve listing
await supabase.from('listings').update({ is_approved: true }).eq('id', listingId)

// Admin: verify transporter
await supabase.from('transporters').update({ verified: true }).eq('id', transporterId)

// Admin: mark mandi price stale
await supabase.from('mandi_prices').update({ is_stale: true }).eq('id', priceId)
9. STORAGE BUCKET (Avatars)
sql
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
create policy "Users upload own avatar" on storage.objects for insert with check (auth.uid()::text = (storage.foldername(name))[1]);
create policy "Public read avatars" on storage.objects for select using (bucket_id = 'avatars');
js
// Upload avatar
const { data } = await supabase.storage.from('avatars').upload(`${user.id}/avatar.jpg`, file)
const url = supabase.storage.from('avatars').getPublicUrl(`${user.id}/avatar.jpg`).data.publicUrl
await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
10. ENVIRONMENT VARIABLES
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_BHASHINI_API_KEY=your_bhashini_key
VITE_DATAGOV_API_KEY=your_datagov_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (Edge Functions only, never expose to frontend)
ADMIN_JWT_SECRET=a_long_random_secret_string
11. REALTIME (Optional — Bonus)
js
// Listen for new listings in real time on home page
supabase.channel('listings').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'listings' }, payload => {
  setListings(prev => [payload.new, ...prev])
}).subscribe()
12. BACKEND RULES
Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend — only use inside Edge Functions
All admin operations must go through Edge Functions with JWT verification
RLS must be enabled on every table — no exceptions
Admin JWT expires in 24 hours — frontend must handle expiry and redirect to /1234/admin
Mandi price fetch Edge Function must deduplicate before insert (check crop+date+mandi combination)
Voice Edge Function must handle errors gracefully — return empty fields if parsing fails, never crash