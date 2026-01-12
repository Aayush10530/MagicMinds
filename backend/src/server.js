// Force IPv4
const dns = require('node:dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

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

// 1. GLOBAL MANUAL CORS MIDDLEWARE (Guaranteed Fix)
// Must be the very first middleware to handle preflights before anything else.
app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow all origins (reflection)
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  // Allow all standard headers + Auth + Custom
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Intercept OPTIONS method (Preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

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

// app.use(cors({...})); // REMOVED: Replaced by manual middleware above

// 2. Helmet Security (Relaxed for Internal API usage)
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