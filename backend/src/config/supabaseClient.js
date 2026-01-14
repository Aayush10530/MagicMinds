const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// We need the SERVICE_ROLE_KEY to verify tokens reliably on backend
// or just the URL/ANON key if we only use getUser().
// However, for strict auth, using the standard client is fine.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️ Supabase URL/Key missing. Auth middleware will likely fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
