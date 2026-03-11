const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'TürkiyeAI API',
    brand: 'Powered by OrkinosAI',
    timestamp: new Date().toISOString()
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 TürkiyeAI Server running on port ${PORT}`);
  console.log(`🌊 Powered by OrkinosAI - Azure-native AI & SaaS platform`);
});
