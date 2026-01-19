// Supabase SDK ইমপোর্ট
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// কী-গুলোকে অস্পষ্ট (Obfuscate) করা হয়েছে
const _u = "aHR0cHM6Ly9jbXJnbG94bHlvdmlocWhkeGRscy5zdXBhYmFzZS5jbw==";
const _k = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcmdsb3hseW92aWhxaGR4ZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDQ2MDEsImV4cCI6MjA4NDMyMDYwMX0.-boSPxeSV4Q_6lX7rcXauRrpAw--YA-MGAH_IknXa84";

// ডিকোড ফাংশন
const decode = (s) => s.startsWith("ey") ? s : atob(s);

const supabaseUrl = decode(_u);
const supabaseKey = decode(_k);

// কানেকশন তৈরি
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
