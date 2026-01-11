const express = require('express');
const router = express.Router();
const { User, UserProgress } = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'magic_secret_key_123';

const { authenticateSupabase } = require('../middleware/authSupabase');

// Safe Increment Endpoint
router.post('/progress/increment', authenticateSupabase, async (req, res) => {
    try {
        const { type } = req.body; // 'chat' or 'roleplay'
        const userId = req.user.id;

        let progress = await UserProgress.findOne({ where: { user_id: userId } });
        if (!progress) {
            progress = await UserProgress.create({ user_id: userId });
        }

        // Atomic-like update (Sequelize instance update)
        if (type === 'chat') {
            progress.chat_sessions_count += 1;
        } else if (type === 'roleplay') {
            progress.roleplay_completed_count += 1;
        }

        // Logic for Badges (Server-side is safer)
        let badges = progress.badges || [];
        if (progress.chat_sessions_count >= 5 && !badges.includes('chatter')) {
            badges.push('chatter');
        }
        if (progress.roleplay_completed_count >= 3 && !badges.includes('actor')) {
            badges.push('actor');
        }
        // Force update since array mutation might not be detected
        progress.badges = [...badges];
        progress.changed('badges', true);

        progress.last_active_date = new Date();
        await progress.save();

        res.json(progress);
    } catch (error) {
        console.error('Increment error:', error);
        res.status(500).json({ error: 'Failed to increment progress' });
    }
});

// Update Progress (Keep for manual sync if needed, but risky)
router.post('/progress', authenticateSupabase, async (req, res) => {
    try {
        const { chatSessions, roleplayCompleted, streak, badges } = req.body;
        const userId = req.user.id;

        let progress = await UserProgress.findOne({ where: { user_id: userId } });

        if (!progress) {
            progress = await UserProgress.create({ user_id: userId });
        }

        // Update fields if provided
        if (chatSessions !== undefined) progress.chat_sessions_count = chatSessions;
        if (roleplayCompleted !== undefined) progress.roleplay_completed_count = roleplayCompleted;
        if (streak !== undefined) progress.streak_days = streak;
        if (badges !== undefined) progress.badges = badges;

        progress.last_active_date = new Date();

        await progress.save();

        res.json(progress);
    } catch (error) {
        console.error('Progress update error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// Get Progress (redundant if /auth/me returns it, but good for standalone fetch)
router.get('/progress', authenticateSupabase, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ where: { user_id: req.user.id } });
        res.json(progress || {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

module.exports = router;
