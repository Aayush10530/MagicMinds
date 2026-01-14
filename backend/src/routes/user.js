const express = require('express');
const router = express.Router();
const authenticateSupabase = require('../middleware/authenticateSupabase');
const { UserProgress } = require('../db');
const asyncWrapper = require('../utils/asyncWrapper');

/**
 * GET /progress
 * Fetch stats for the dashboard
 */
router.get('/progress', authenticateSupabase, asyncWrapper(async (req, res) => {
    // req.user.id is from Supabase Token

    // Find or Create Progress Record
    const [progress] = await UserProgress.findOrCreate({
        where: { user_id: req.user.id },
        defaults: {
            badges: [],
            streak_days: 0,
            chat_sessions_count: 0
        }
    });

    res.json({
        stats: {
            sessions: progress.chat_sessions_count,
            streak: progress.streak_days,
            badges: progress.badges
        }
    });
}));

module.exports = router;
