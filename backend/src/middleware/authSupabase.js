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

        // Verify token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error("Supabase Auth Error:", error?.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Sync User to Local DB
        // We try to find by ID (UUID match) or Email (fallback)
        let localUser = await User.findByPk(user.id);

        if (!localUser) {
            // Create new user in local DB with same UUID
            const metadata = user.user_metadata || {};
            const name = metadata.full_name || metadata.name || user.email.split('@')[0];

            try {
                localUser = await User.create({
                    id: user.id, // FORCE Same UUID
                    email: user.email,
                    name: name,
                    country: metadata.country || 'US'
                });
            } catch (createError) {
                // Handle race condition or email conflict (if email existed with different UUID ?)
                console.error("User Sync Error:", createError);
                // Fallback: Try finding by email
                localUser = await User.findOne({ where: { email: user.email } });
                if (!localUser) {
                    return res.status(500).json({ error: 'Failed to synchronize user account.' });
                }
            }
        }

        // Attach to request
        req.user = localUser; // Contains database record with 'id'
        req.supabaseUser = user; // Contains auth record

        next();
    } catch (err) {
        console.error("Auth Middleware Error:", err);
        res.status(500).json({ error: 'Internal Server Error during Auth' });
    }
};

module.exports = { authenticateSupabase };
