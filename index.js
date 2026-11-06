require('dotenv').config();

const express = require('express');
const routes = require('./routes/speedTest');

const app = express();

const PORT = process.env.PORT || 3000;

// Allow the deployed frontend (configured with FRONTEND_ORIGIN) and local
// development clients to call the test endpoints from a browser.
const allowedOrigins = new Set([
  process.env.FRONTEND_ORIGIN,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean));

app.use((req, res, next) => {
  const origin = req.get('Origin');
  if (!origin || allowedOrigins.has(origin)) {
    if (origin) res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  } else if (req.method === 'OPTIONS') {
    return res.sendStatus(403);
  }
  next();
});

// Disable Express identification header
app.disable('x-powered-by');

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Skirill Speed Test API!',
    version: '1.0.0',
    endpoints: {
      health: 'GET /speedtest/health',
      download: 'GET /speedtest/download?bytes=10485760',
      upload: 'POST /speedtest/upload',
      ping: 'GET /speedtest/ping'
    }
  });
});

// Speed test routes
app.use('/speedtest', routes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'The requested endpoint does not exist.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error.'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Skirill Speed Test API running on http://localhost:${PORT}`);
});
