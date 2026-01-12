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
        const addresses = await dns.promises.resolve4(process.env.DB_HOST);
        if (addresses && addresses.length > 0) {
          console.log(`🔍 DNS: Resolved ${process.env.DB_HOST} to IPv4: ${addresses[0]}`);
          process.env.DB_HOST = addresses[0];
        }
      } catch (dnsErr) {
        console.warn('⚠️ DNS Resolution Warning:', dnsErr.message);
        // Fallback to original host if resolution fails (e.g. it was already an IP)
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

    // Routes
    const uploadRouter = require('./routes/upload');
    const voiceRouter = require('./routes/voice');

    app.use('/api/upload', uploadRouter);
    app.use('/api/voice', voiceRouter);
    app.use('/api/user', require('./routes/user'));

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

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Magic Minds backend listening on port ${PORT} at 0.0.0.0`);
    });

  } catch (criticalError) {
    console.error("❌ CRITICAL SERVER FAILURE:", criticalError);
    process.exit(1);
  }
};

startServer(); 