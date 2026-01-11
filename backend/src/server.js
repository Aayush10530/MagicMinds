require('dotenv').config();
const { syncDatabase } = require('./db');

// Initialize Database
syncDatabase();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

console.log('-----------------------------------');
console.log('🚀 Server Starting...');
console.log('🌍 PORT:', PORT);
console.log('🔒 CORS_ORIGIN:', process.env.CORS_ORIGIN || '(Falling back to localhost:8080)');
console.log('-----------------------------------');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Robust CORS Setup
const allowedOrigins = [
  'https://magicminds.vercel.app', // Explicitly allow production frontend
  'http://localhost:3000',         // Allow local frontend
  'http://localhost:8080',         // Allow local backend
  process.env.CORS_ORIGIN          // Allow env variable
].filter(Boolean);                 // Remove null/undefined

// 1. Global CORS Middleware - MUST be first
app.use(cors({
  origin: true, // Reflects the request origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// 2. Explicit OPTIONS Handler (Preflight Fix for Express 5)
// Using middleware to check method avoids 'path-to-regexp' errors with '*'
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

// 3. Helmet Security (Relaxed for Internal API usage)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Fixes "CORP" block
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP
});
app.use(limiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Magic Minds backend is running!' });
});

const uploadRouter = require('./routes/upload');
const voiceRouter = require('./routes/voice');
// const authRouter = require('./routes/auth'); // REMOVED

app.use('/api/upload', uploadRouter);
app.use('/api/voice', voiceRouter);
// app.use('/api/auth', authRouter); // REMOVED: Replaced by Supabase Auth
app.use('/api/user', require('./routes/user'));

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  // Placeholder for future real-time events
});

// Start Server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Magic Minds backend listening on port ${PORT} at 0.0.0.0`);
}); 