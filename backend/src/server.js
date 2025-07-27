require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const audioUtils = require('./utils/audioUtils');

const app = express();
const PORT = process.env.PORT || 3000;

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.server.rateLimit.windowMs,
  max: config.server.rateLimit.max,
});
app.use(limiter);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Magic Minds backend is running!' });
});

// Test endpoint that doesn't require API keys
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'This test endpoint works without API keys!',
    note: 'The 500 errors are likely due to missing API keys in the .env file.'
  });
});

// API Routes
const uploadRouter = require('./routes/upload');
const voiceRouter = require('./routes/voice');

app.use('/api/upload', uploadRouter);
app.use('/api/voice', voiceRouter);

// API for supported languages
app.get('/api/languages', (req, res) => {
  res.json(config.languages);
});

// Error Handling Middleware
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);
  // Placeholder for future real-time events
});

// Schedule cleanup of temp files every hour
setInterval(() => {
  audioUtils.cleanupTempFiles();
}, 3600000);

// Start Server
server.listen(PORT, () => {
  console.log(`Magic Minds backend listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});