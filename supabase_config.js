// Supabase SDK ইমপোর্ট
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// ⚠️ আপনার Supabase ড্যাশবোর্ড থেকে কপি করে এখানে বসান
const supabaseUrl = 'https://cmrgloxlyovihqhdxdls.supabase.co';
const supabaseKey = 'sb_publishable_esoQsmiwVi1dADt88PEX_g_SL7e38Zz';

// কানেকশন তৈরি
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
