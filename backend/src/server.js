require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:8080' }));
app.use(helmet());

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

app.use('/api/upload', uploadRouter);
app.use('/api/voice', voiceRouter);

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
server.listen(PORT, () => {
  console.log(`Magic Minds backend listening on port ${PORT}`);
}); 