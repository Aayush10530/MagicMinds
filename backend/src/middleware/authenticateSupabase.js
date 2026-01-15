const supabase = require('../config/supabaseClient');
const { User } = require('../db'); // Lazy access to User model

const authenticateSupabase = async (req, res, next) => {
    try {
        // 1. Check Header
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            const error = new Error('No authorization token provided');
            error.statusCode = 401;
            throw error;
        }

        // 2. Extract Token
        const token = authHeader.split(' ')[1];

        // 3. Verify with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            const authError = new Error('Invalid or expired token');
            authError.statusCode = 401;
            throw authError; // Caught by global handler or local catch
        }

        // 4. Attach User to Request
        req.user = user;

        // 5. Strict User Sync (Critical)
        // We MUST ensure the user exists in our local PostgreSQL 'users' table.
        // If this fails, Foreign Key constraints will break in 'ChatSession' later.
        if (User) {
            try {
                const [localUser] = await User.findOrCreate({
                    where: { email: user.email },
                    defaults: {
                        id: user.id, // Supabase UUID -> Local UUID
                        email: user.email,
                        name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                        googleId: user.app_metadata?.provider === 'google' ? user.id : null,
                        country: 'Unknown',
                        role: 'user'
                    }
                });
                req.localUser = localUser;
            } catch (dbSyncErr) {
                console.error('❌ Critical: Failed to sync Supabase User to Local DB:', dbSyncErr);
                const syncError = new Error('User Synchronization Failed');
                syncError.statusCode = 500;
                throw syncError; // Fail the request. better than 502 later.
            }
        } else {
            console.warn('⚠️ User Model not loaded yet. Skipping sync (Degraded).');
        }

        next();

    } catch (err) {
        // Pass to global error handler or send 401
        // If it's our thrown error, it has statusCode.
        next(err);
    }
};

module.exports = authenticateSupabase;
