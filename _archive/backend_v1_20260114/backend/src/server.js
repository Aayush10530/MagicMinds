// Force IPv4
const dns = require('node:dns');
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

require('dotenv').config();

// Wrap startup to allow Async DNS Resolution
const startServer = async () => {
  try {
    // 0. Explicitly Resolve DB_HOST to IPv4
    // This fixes the persistent ENETUNREACH (IPv6) errors on Railway
    if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
      try {
        // Use dns.lookup (OS resolver) + family: 4
        // This is robust for containers/CNAMEs where resolve4 (network query) fails
        const { address } = await dns.promises.lookup(process.env.DB_HOST, { family: 4 });
        if (address) {
          console.log(`🔍 DNS: Resolved ${process.env.DB_HOST} to IPv4: ${address}`);
          process.env.DB_HOST = address;
        }
      } catch (dnsErr) {
        console.warn('⚠️ DNS Resolution Warning:', dnsErr.message);
      }
    }

    // 1. Initialize Database (After DNS Fix)
    const { syncDatabase } = require('./db');
    await syncDatabase();

    const express = require('express');
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

    // 1.5. Request Logger
    app.use((req, res, next) => {
      console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);
      console.log('   Headers:', JSON.stringify(req.headers['user-agent']));
      next();
    });

    // 2. GLOBAL MANUAL CORS MIDDLEWARE
    app.use((req, res, next) => {
      const origin = req.headers.origin;
      if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });

    // Middleware
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    app.use(helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }));

    // Rate Limiting
    const limiter = rateLimit({
      windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    });
    app.use(limiter);

    // Health Check Endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'ok', message: 'Magic Minds backend is running!' });
    });

    // Root Endpoint (For Default Health Checks)
    app.get('/', (req, res) => {
      res.send('Magic Minds Backend is Monitorable & Running 🚀');
    });

    // Heartbeat to prove process uptime
    setInterval(() => {
      const mem = process.memoryUsage();
      console.log(`💓 [${new Date().toISOString()}] Server Heartbeat | RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`);
    }, 10000);

    // Routes
    const uploadRouter = require('./routes/upload');
    const voiceRouter = require('./routes/voice');

    console.log('✅ Mounted Upload Routes');
    app.use('/api/upload', uploadRouter);
    console.log('✅ Mounted Voice Routes');
    app.use('/api/voice', voiceRouter);
    console.log('✅ Mounted User Routes');
    app.use('/api/user', require('./routes/user'));
    console.log('✅ All Routes Mounted Successfully');

    // Error Handling
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
    });

    const serverInstance = server.listen(PORT, '0.0.0.0', () => {
      console.log(`Magic Minds backend listening on port ${PORT} at 0.0.0.0`);
    });

    // KEEP-ALIVE SETTINGS (Critical for Load Balancers to prevent 502s)
    // Ensure Node's timeout is longer than the Load Balancer's (usually 60s)
    serverInstance.keepAliveTimeout = 120000; // 120 seconds
    serverInstance.headersTimeout = 120000;   // 120 seconds

  } catch (criticalError) {
    console.error("❌ CRITICAL SERVER FAILURE:", criticalError);
    process.exit(1);
  }
};

startServer(); 