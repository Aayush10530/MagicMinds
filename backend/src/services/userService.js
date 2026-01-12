const { User } = require('../db');

/**
 * Ensures a user exists in the local database matching the Supabase ID.
 * Handles race conditions where parallel requests might try to create the user.
 * 
 * @param {Object} supabaseUser - The user object from Supabase Auth
 * @returns {Promise<User>} The Sequelize User model instance
 */
const ensureUserExists = async (supabaseUser) => {
    if (!supabaseUser || !supabaseUser.id) {
        throw new Error("Invalid Supabase User object provided to ensureUserExists");
    }

    // 1. Try to find by ID (Fastest)
    let localUser = await User.findByPk(supabaseUser.id);
    if (localUser) return localUser;

    // 2. If not found, prepare data
    const metadata = supabaseUser.user_metadata || {};
    const name = metadata.full_name || metadata.name || supabaseUser.email?.split('@')[0] || 'Friend';

    // 3. Try to Create (Atomic-ish)
    try {
        localUser = await User.create({
            id: supabaseUser.id, // FORCE Same UUID
            email: supabaseUser.email,
            name: name,
            country: metadata.country || 'US'
        });
        return localUser;
    } catch (error) {
        // 4. Handle Race Condition (Unique Constraint Violation)
        // If it failed because "id already exists" (or email), that means another request won.
        // So we just fetch it again.
        console.warn(`User creation race condition handled for ${supabaseUser.id}:`, error.message);

        localUser = await User.findByPk(supabaseUser.id);

        // Final fallback validation
        if (!localUser) {
            // If we still can't find it after a unique constraint error, something is wrong.
            // Maybe email collision with different ID?
            localUser = await User.findOne({ where: { email: supabaseUser.email } });
        }

        if (!localUser) {
            throw new Error(`Failed to ensure user exists. DB Error: ${error.message}`);
        }
        return localUser;
    }
};

module.exports = { ensureUserExists };
