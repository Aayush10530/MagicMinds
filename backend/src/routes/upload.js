const express = require('express');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure Multer storage (in-memory for now)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // For now, just return file info
  res.json({
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });
});

module.exports = router; 