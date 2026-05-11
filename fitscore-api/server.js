require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');

const analyzeRoutes = require('./routes/analyze');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Log environment for debugging
console.log(`Starting server in ${NODE_ENV} mode`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log(`Backend URL: ${BACKEND_URL}`);

// Trust proxy for Render reverse proxy (CRITICAL: must be before session middleware)
// This ensures OAuth sees HTTPS URLs from the reverse proxy
app.set('trust proxy', 1);

// CORS configuration - allows frontend to communicate with backend
const corsOptions = {
  origin: FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Session middleware for passport
// Note: Cookies are for server-side session management during OAuth flow
// After OAuth, JWT tokens are used (stored in localStorage) for API calls
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      // In production, only send cookie over HTTPS
      secure: NODE_ENV === 'production' ? true : false,
      // Use 'lax' for same-site flows (recommended for OAuth)
      // Use 'none' only if you need cross-site cookies (less common for OAuth)
      sameSite: NODE_ENV === 'production' ? 'lax' : 'lax',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error('MONGODB_URI is not set in .env');
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => {
    console.log('MongoDB connected');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

app.use('/analyze', analyzeRoutes);
app.use('/auth', authRoutes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
