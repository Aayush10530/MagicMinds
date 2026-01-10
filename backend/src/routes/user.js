const express = require('express');
const router = express.Router();
const { User, UserProgress } = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'magic_secret_key_123';

// Middleware to authenticate user
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Update Progress
router.post('/progress', authenticate, async (req, res) => {
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
router.get('/progress', authenticate, async (req, res) => {
    try {
        const progress = await UserProgress.findOne({ where: { user_id: req.user.id } });
        res.json(progress || {});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});

module.exports = router;
