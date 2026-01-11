const { createClient } = require('@supabase/supabase-js');

// Ensure these are set in Railway variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.warn("WARNING: Supabase URL or Key missing in Backend Envs. Auth might fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
