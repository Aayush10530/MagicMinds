const { supabase } = require('../lib/supabaseClient');
const { User } = require('../db');

const authenticateSupabase = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Malformed token' });
        }

        // Verify token with Supabase (READ ONLY)
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            // console.error("Supabase Auth Error:", error?.message); // Optional logging
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Attach Supabase Identity ONLY (No DB calls)
        // We map it to satisfy basic 'req.user.id' needs, but no DB instance yet.
        req.user = {
            id: user.id,
            email: user.email,
            app_metadata: user.app_metadata,
            user_metadata: user.user_metadata
        };

        req.supabaseUser = user; // Keep full object just in case

        next();
    } catch (err) {
        console.error("Auth Middleware Unexpected Error:", err);
        // CRITICAL: Always return 401/500, NEVER throw to avoid crash
        res.status(500).json({ error: 'Internal Server Error during Auth' });
    }
};

module.exports = { authenticateSupabase };
