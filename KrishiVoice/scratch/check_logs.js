import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(envContent.split('\n').filter(Boolean).map(line => line.split('=')));

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('transporters').insert({
    name: 'Test',
    phone: '1234567890',
    vehicle_type: 'Truck',
    user_id: 'test_user_id'
  });
  console.log('Insert Result:', data, error);
}
run();
