const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load appsettings.json (and appsettings.<NODE_ENV>.json) first so that
// Azure App Service Application Settings always win, then fall back to .env.
const { loadAppSettings } = require('./config/appSettings');
loadAppSettings();
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security headers – explicitly disable browser device-access and credential
// APIs that the app does not use.  This prevents browsers (especially
// Microsoft Edge on Azure-hosted origins) from showing unexpected permission
// prompts such as "Access other apps and services on this device".
app.use((_req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    [
      'bluetooth=()',
      'usb=()',
      'serial=()',
      'nfc=()',
      'hid=()',
      'window-management=()',
      'identity-credentials-get=()',
      'publickey-credentials-get=()',
      'publickey-credentials-create=()',
      'otp-credentials=()',
      'payment=()',
      'geolocation=()',
      'camera=()',
      'microphone=()',
    ].join(', ')
  );
  next();
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/destinations', require('./routes/destinations'));
app.use('/api/search', require('./routes/search'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/regions', require('./routes/regions'));
app.use('/api/resorts', require('./routes/resorts'));
app.use('/api/resorts', require('./routes/proximity'));
app.use('/api/services', require('./routes/services'));
app.use('/api/knowledge', require('./routes/knowledge'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'TürkiyeAI API',
    brand: 'Powered by OrkinosAI',
    timestamp: new Date().toISOString()
  });
});

// Serve static assets if client build exists, regardless of NODE_ENV
const clientBuildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // Fallback root route when client build is not present
  app.get('/', (req, res) => {
    res.json({
      service: 'TürkiyeAI API',
      brand: 'Powered by OrkinosAI',
      status: 'running',
      health: '/api/health'
    });
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TürkiyeAI Server running on port ${PORT}`);
  console.log(`🌊 Powered by OrkinosAI - Azure-native AI & SaaS platform`);
});
