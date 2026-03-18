require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const cron    = require('node-cron');
const { sendWeeklyDigests } = require('./services/weeklyDigest');
const { requireAuth } = require('./middleware/auth');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3001', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return cb(null, true);
    if (allowedOrigins.some(o => origin === o || origin.endsWith('.vercel.app'))) {
      return cb(null, true);
    }
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());

// Public
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Public kid auth endpoints (no requireAuth)
const { kidLookupHandler, kidLoginHandler } = require('./routes/auth');
app.post('/api/auth/kid-lookup', kidLookupHandler);
app.post('/api/auth/kid-login', kidLoginHandler);

// Protected routes
app.use('/api/auth', requireAuth, require('./routes/auth'));
app.use('/api/kids', requireAuth, require('./routes/kids'));
app.use('/api/modules', requireAuth, require('./routes/modules'));
app.use('/api/progress', requireAuth, require('./routes/progress'));
app.use('/api/achievements', requireAuth, require('./routes/achievements'));
app.use('/api/classrooms',   requireAuth, require('./routes/classrooms'));
app.use('/api/daily-challenge', requireAuth, require('./routes/dailyChallenge'));

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Kids Edu API running on port ${PORT}`);
});

// Weekly digest — every Monday at 8:00 AM (server local time)
cron.schedule('0 8 * * 1', () => {
  sendWeeklyDigests().catch(err => console.error('[digest] Unhandled error:', err));
});
console.log('[digest] Weekly digest cron scheduled (Mon 08:00)');

module.exports = app;
