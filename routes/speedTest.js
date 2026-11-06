const express = require('express');

const {
  getHealth,
  getDownload,
  postUpload,
  getPing
} = require('../controllers/speedTest');

const router = express.Router();

// API health check
router.get('/health', getHealth);

// Test traffic is served to the visitor's browser, which measures timings.
router.get('/download', getDownload);
router.post('/upload', postUpload);
router.get('/ping', getPing);

module.exports = router;
