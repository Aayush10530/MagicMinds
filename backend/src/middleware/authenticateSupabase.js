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

        // 5. (Optional) Sync/Fetch Local User from DB
        // This effectively "logs them in" to our PostgreSQL
        // We wrap this in a non-blocking try/catch so auth succeeds even if DB is flaky
        try {
            if (User) {
                // Check if user exists, if not create (Sync)
                // This ensures our 'users' table matches Supabase Auth
                const [localUser] = await User.findOrCreate({
                    where: { email: user.email },
                    defaults: {
                        id: user.id, // Sync UUID
                        email: user.email,
                        name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
                        googleId: user.app_metadata?.provider === 'google' ? user.id : null
                    }
                });
                req.localUser = localUser;
            }
        } catch (dbErr) {
            console.warn('⚠️ Auth Succeeded but Local DB Sync failed:', dbErr.message);
            // We continue! Auth is valid, just DB record missing/unreachable.
        }

        next();

    } catch (err) {
        // Pass to global error handler or send 401
        // If it's our thrown error, it has statusCode.
        next(err);
    }
};

module.exports = authenticateSupabase;
