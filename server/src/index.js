require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { requireAuth } = require('./middleware/auth');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Public
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
