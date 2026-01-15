const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Utils
const globalErrorHandler = require('./utils/globalErrorHandler');

// Configuration
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0'; // Force IPv4 for Railway Compatibility

const startServer = async () => {
    try {
        console.log('🚀 Booting MagicMinds Backend...');

        // 0. Initialize Database (Background Mode)
        const { connectDB } = require('./db');
        // connectDB(); // Moved to after listener to guarantee instant boot

        // 1. Initialize Express
        const app = express();

        // 2. Middleware (Security & Parsing)
        app.use(helmet());
        app.use(cors({
            origin: process.env.CORS_ORIGIN || '*',
            credentials: true
        }));
        app.use(express.json());

        // 3. Health Check (Independent of Database)
        app.get('/', (req, res) => {
            res.status(200).json({
                status: "ok",
                service: "MagicMinds Backend",
                uptime: process.uptime()
            });
        });
        app.get('/api/health', (req, res) => {
            const { getDBStatus } = require('./db');
            const isDBConnected = getDBStatus();

            // Return 503 if DB is down, but keep app alive
            res.status(isDBConnected ? 200 : 503).json({
                status: isDBConnected ? 'ok' : 'degraded',
                database: isDBConnected ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // 4. API Routes
        app.use('/api/voice', require('./routes/voice'));
        app.use('/api/user', require('./routes/user'));

        // 5. Global Error Handler (Must be last)
        app.use(globalErrorHandler);

        // 6. Start Listener
        const server = http.createServer(app);

        // BINDING & TIMEOUTS (The "Railway Fix")
        const serverInstance = server.listen(PORT, HOST, () => {
            const addr = server.address();
            console.log(`✅ Server listening on [${typeof addr === 'string' ? addr : addr.address}]:${PORT}`);

            // Trigger DB Connection AFTER server is up (Zero-Downtime Boot)
            const { connectDB } = require('./db');
            connectDB();
        });

        // Critical: Prevent Load Balancer 502s
        serverInstance.keepAliveTimeout = 120000; // 120s
        serverInstance.headersTimeout = 120000;   // 120s

    } catch (criticalErr) {
        // 7. Boot Failure Handling
        console.error('❌ CRITICAL STARTUP FAILURE:', criticalErr);
        // In production, we might want to restart, but logging is step 1.
        // We do NOT process.exit(1) blindly; we let the container orchestrator decide.
    }
};

// Start the engine
startServer();
