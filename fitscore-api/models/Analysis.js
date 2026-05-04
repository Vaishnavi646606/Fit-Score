const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
  },
  jd: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Analysis', analysisSchema);
