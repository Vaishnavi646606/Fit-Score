const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Google OAuth route
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google OAuth callback route
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth-error?message=' + encodeURIComponent('Google authentication failed'),
    failureMessage: true,
  }),
  async (req, res) => {
    try {
      // User is authenticated by passport, create JWT token
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-error?message=${encodeURIComponent(
            'Authentication failed: User not found'
          )}`
        );
      }

      const token = jwt.sign(
        {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Successfully authenticated, redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth-callback?token=${token}`);
    } catch (err) {
      console.error('Error during Google callback:', err);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = err.message || 'OAuth callback failed';
      res.redirect(`${frontendUrl}/auth-error?message=${encodeURIComponent(errorMessage)}`);
    }
  }
);

// Get current user (protected route)
router.get('/me', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Logout route (frontend will clear token)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// GitHub OAuth route
router.get(
  '/github',
  passport.authenticate('github', { scope: ['user:email'] })
);

// GitHub OAuth callback route
router.get(
  '/github/callback',
  passport.authenticate('github', {
    failureRedirect: '/auth-error?message=' + encodeURIComponent('GitHub authentication failed'),
    failureMessage: true,
  }),
  async (req, res) => {
    try {
      // User is authenticated by passport, create JWT token
      if (!req.user) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/auth-error?message=${encodeURIComponent(
            'Authentication failed: User not found'
          )}`
        );
      }

      const token = jwt.sign(
        {
          id: req.user._id,
          email: req.user.email,
          name: req.user.name,
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Successfully authenticated, redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth-callback?token=${token}`);
    } catch (err) {
      console.error('Error during GitHub callback:', err);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const errorMessage = err.message || 'OAuth callback failed';
      res.redirect(`${frontendUrl}/auth-error?message=${encodeURIComponent(errorMessage)}`);
    }
  }
);

const bcrypt = require('bcryptjs');

// Email/Password Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'Please enter all fields' })
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' })
  }
  try {
    const existing = await User.findOne({ email: email.toLowerCase() })
    if (existing) {
      return res.status(400).json({ message: 'Account already exists with this email. Please sign in.' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const user = await User.create({ email: email.toLowerCase(), name, password: hashed })
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Email/Password Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter email and password' })
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return res.status(400).json({ message: 'No account found. Please create an account first.' })
    }
    if (!user.password) {
      return res.status(400).json({ message: 'This account uses Google/GitHub login. Please use those options.' })
    }
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Wrong password. Please try again.' })
    }
    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, email: user.email, name: user.name } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router;
