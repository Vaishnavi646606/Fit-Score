const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const Analysis = require('../models/Analysis');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    const jd = req.body.jd;

    if (!file) {
      return res.status(400).json({ message: 'Resume file is required' });
    }

    if (!jd || typeof jd !== 'string' || !jd.trim()) {
      return res.status(400).json({ message: 'Job description (jd) is required' });
    }

    const form = new FormData();
    form.append('resume', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });
    form.append('jd', jd);

    const pythonUrl = process.env.PYTHON_URL || 'http://localhost:8000';

    const pythonResponse = await axios.post(`${pythonUrl}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });

    const pythonData = pythonResponse.data?.data || pythonResponse.data || {}

    const score = typeof pythonData?.score === 'number'
      ? pythonData.score
      : typeof pythonResponse.data?.score === 'number'
        ? pythonResponse.data.score
        : null

    if (typeof score !== 'number') {
      return res.status(502).json({ message: 'Invalid response from analysis service' })
    }

    await Analysis.create({
      score,
      jd: jd.trim(),
    })

    const matchedSkills = pythonData.matched_skills || pythonData.matched || pythonData.matchedSkills || []
    const topSkills = matchedSkills.slice(0, 3).join(' ')
    const searchQuery = topSkills || 'Software Developer'

    let adzunaJobs = []
    try {
      const adzunaRes = await axios.get(
        `https://api.adzuna.com/v1/api/jobs/in/search/1`,
        {
          params: {
            app_id: process.env.ADZUNA_APP_ID,
            app_key: process.env.ADZUNA_API_KEY,
            results_per_page: 10,
            what: searchQuery,
            where: 'india',
            sort_by: 'relevance',
          },
          timeout: 10000,
        }
      )
      adzunaJobs = (adzunaRes.data?.results || []).map(job => ({
        title: job.title,
        company: job.company?.display_name || 'Unknown',
        location: job.location?.display_name || 'India',
        salary: job.salary_min
          ? `₹${Math.round(job.salary_min/1000)}k - ₹${Math.round(job.salary_max/1000)}k`
          : 'Not specified',
        applyUrl: job.redirect_url,
        description: job.description?.slice(0, 120) + '...',
        created: job.created,
      }))
    } catch (adzunaErr) {
      console.log('Adzuna API error:', adzunaErr.message)
      adzunaJobs = []
    }

    return res.status(200).json({
      score,
      message: 'Analysis completed',
      matched: matchedSkills,
      missing: pythonData.missing_skills || pythonData.missing || [],
      suggestions: pythonData.suggestions || [],
      skills_match: pythonData.skills_match || 0,
      experience_match: pythonData.experience_match || 0,
      education_match: pythonData.education_match || 0,
      jobs: adzunaJobs,
    })
  } catch (error) {
    console.log("🔥 FULL ERROR:", error);

    if (error.response) {
      console.log("🔥 PYTHON ERROR:", error.response.data);
      return res.status(500).json({ message: error.response.data });
    }

    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
