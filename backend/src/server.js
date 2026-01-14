const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

// Utils
const globalErrorHandler = require('./utils/globalErrorHandler');

// Configuration
const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '::'; // Dual Stack Listener

const startServer = async () => {
    try {
        console.log('🚀 Booting MagicMinds Backend...');

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
        app.get('/', (req, res) => res.send('Backend Running 🚀'));
        app.get('/api/health', (req, res) => {
            // Phase 2 will add DB check here
            res.json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            });
        });

        // 4. API Routes (Plugged in later)
        // app.use('/api/voice', voiceRoutes);

        // 5. Global Error Handler (Must be last)
        app.use(globalErrorHandler);

        // 6. Start Listener
        const server = http.createServer(app);

        // BINDING & TIMEOUTS (The "Railway Fix")
        const serverInstance = server.listen(PORT, HOST, () => {
            const addr = server.address();
            console.log(`✅ Server listening on [${typeof addr === 'string' ? addr : addr.address}]:${PORT}`);
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
