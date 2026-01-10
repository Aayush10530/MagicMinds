const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, UserProgress } = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'magic_secret_key_123';

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, country } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create User
        const user = await User.create({
            email,
            password_hash,
            name,
            country
        });

        // Create initial progress
        await UserProgress.create({ user_id: user.id });

        // Generate Token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                country: user.country
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find User
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate Token
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                country: user.country
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get Current User (Me)
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) return res.status(401).json({ error: 'No token provided' });

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password_hash'] },
            include: [{ model: UserProgress, as: 'progress' }]
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "791380293314-37abc0o9vb2eeuhf4dlameq9rkusunco.apps.googleusercontent.com";
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Google Auth verification
router.post('/google', async (req, res) => {
    try {
        const { token } = req.body;

        // METHOD CHANGE: Verify Access Token by fetching User Info
        // The frontend useGoogleLogin hook (default flow) returns an access token, not an ID token.
        const googleUserRes = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` }
        });

        const { sub: googleId, email, name, picture } = googleUserRes.data;

        if (!email) {
            return res.status(400).json({ error: 'Google account has no email' });
        }

        // Find or Create User
        let user = await User.findOne({ where: { googleId } });

        if (!user) {
            // Check if user exists by email to link
            user = await User.findOne({ where: { email } });

            if (user) {
                // Link existing account
                user.googleId = googleId;
                await user.save();
            } else {
                // Create new user
                user = await User.create({
                    googleId,
                    email,
                    name,
                    country: 'US', // Default
                    password_hash: null
                });

                // Create initial progress
                await UserProgress.create({ user_id: user.id });
            }
        }

        // Generate App Token
        const appToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token: appToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                country: user.country
            }
        });

    } catch (error) {
        console.error('Google Auth Error:', error.response?.data || error.message);
        res.status(401).json({ error: 'Invalid Google Token' });
    }
});

module.exports = router;
