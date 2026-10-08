const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true,
    unique: true,
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  picture: {
    type: String,
  },
  password: {
    type: String,
    default: null,
  },
  plan: {
    type: String,
    enum: ['free', 'plus', 'pro'],
    default: 'free',
  },
  analysesLeft: {
    type: Number,
    default: 10,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('User', userSchema);
