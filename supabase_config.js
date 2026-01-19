// Supabase SDK ইমপোর্ট
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// আপনার Supabase ড্যাশবোর্ড থেকে কপি করে এখানে বসান
const supabaseUrl = 'https://cmrgloxlyovihqhdxdls.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcmdsb3hseW92aWhxaGR4ZGxzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDQ2MDEsImV4cCI6MjA4NDMyMDYwMX0.-boSPxeSV4Q_6lX7rcXauRrpAw--YA-MGAH_IknXa84';

// কানেকশন তৈরি
const supabase = createClient(supabaseUrl, supabaseKey);

export { supabase };
