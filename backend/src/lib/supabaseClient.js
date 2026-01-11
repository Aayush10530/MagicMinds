const { createClient } = require('@supabase/supabase-js');

// Ensure these are set in Railway variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ CRITICAL: Supabase URL or Key missing. Auth will fail.");
    // Create a dummy client object to prevent server crash on startup
    supabase = {
        auth: {
            getUser: async () => ({ data: { user: null }, error: { message: "Supabase not configured on server" } })
        }
    };
} else {
    supabase = createClient(supabaseUrl, supabaseKey);
}

module.exports = { supabase };
