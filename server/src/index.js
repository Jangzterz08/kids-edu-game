require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:4173'];

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

// Temporary debug — remove after fixing auth
app.post('/debug/token', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.json({ error: 'no token provided' });
  const { createClient } = require('@supabase/supabase-js');
  const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data, error } = await sb.auth.getUser(token);
  res.json({
    supabaseUrl: process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
    user: data?.user ? { id: data.user.id, email: data.user.email } : null,
    error: error?.message || null,
  });
});

// Protected routes
app.use('/api/auth', requireAuth, require('./routes/auth'));
app.use('/api/kids', requireAuth, require('./routes/kids'));
app.use('/api/modules', requireAuth, require('./routes/modules'));
app.use('/api/progress', requireAuth, require('./routes/progress'));
app.use('/api/achievements', requireAuth, require('./routes/achievements'));

// Error handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Kids Edu API running on port ${PORT}`);
});

module.exports = app;
