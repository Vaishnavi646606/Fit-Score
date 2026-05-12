const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');

const Analysis = require('../models/Analysis');
const { PYTHON_URL } = require('../config/python');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    const jd = req.body.jd;

    console.log('\n🚀 ANALYZE REQUEST RECEIVED');
    console.log(`📄 Resume file: ${file?.originalname} (${file?.size} bytes)`);
    console.log(`📝 JD length: ${jd?.length} chars`);
    
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

    console.log(`🐍 Calling Python backend at: ${PYTHON_URL}/analyze`);
    const pythonResponse = await axios.post(`${PYTHON_URL}/analyze`, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });
    console.log(`✅ Python response received (status: ${pythonResponse.status})`);
    console.log(`📊 Python response:`, JSON.stringify(pythonResponse.data, null, 2));

    const pythonData = pythonResponse.data?.data || pythonResponse.data || {}

    const score = typeof pythonData?.score === 'number'
      ? pythonData.score
      : typeof pythonResponse.data?.score === 'number'
        ? pythonResponse.data.score
        : null

    if (typeof score !== 'number') {
      console.error(`❌ Invalid score from Python: ${score}`);
      return res.status(502).json({ message: 'Invalid response from analysis service' })
    }

    console.log(`💾 Saving analysis to DB: score=${score}`);
    await Analysis.create({
      score,
      jd: jd.trim(),
    })
    console.log(`✅ Analysis saved to DB`);

    const matchedSkills = pythonData.matched_skills || pythonData.matched || pythonData.matchedSkills || []
    console.log(`🎯 Matched skills: ${matchedSkills.join(', ')}`);
    
    const topSkills = matchedSkills.slice(0, 3).join(' ')
    const searchQuery = topSkills || 'Software Developer'
    console.log(`🔍 Adzuna search query: "${searchQuery}"`);

    let adzunaJobs = []
    try {
      const adzunaApiId = process.env.ADZUNA_APP_ID;
      const adzunaApiKey = process.env.ADZUNA_API_KEY;
      
      if (!adzunaApiId || !adzunaApiKey) {
        console.warn('⚠️  Adzuna credentials missing - skipping job search');
        console.log(`ADZUNA_APP_ID: ${adzunaApiId ? '✅ SET' : '❌ MISSING'}`);
        console.log(`ADZUNA_API_KEY: ${adzunaApiKey ? '✅ SET' : '❌ MISSING'}`);
      } else {
        console.log(`✅ Adzuna credentials found, making API call...`);
      }
      
      const adzunaRes = await axios.get(
        `https://api.adzuna.com/v1/api/jobs/in/search/1`,
        {
          params: {
            app_id: adzunaApiId,
            app_key: adzunaApiKey,
            results_per_page: 10,
            what: searchQuery,
            where: 'india',
            sort_by: 'relevance',
          },
          timeout: 10000,
        }
      )
      console.log(`✅ Adzuna API response (status: ${adzunaRes.status})`);
      console.log(`📊 Total jobs found: ${adzunaRes.data?.results?.length || 0}`);
      
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
      console.log(`✅ Processed ${adzunaJobs.length} jobs for frontend`);
      
    } catch (adzunaErr) {
      console.error('❌ Adzuna API error:', adzunaErr.message);
      if (adzunaErr.response) {
        console.error(`   Status: ${adzunaErr.response.status}`);
        console.error(`   Data: ${JSON.stringify(adzunaErr.response.data)}`);
      }
      adzunaJobs = []
      console.log(`⚠️  Continuing without job recommendations`);
    }

    console.log(`\n✅ ANALYSIS COMPLETE - Returning response`);
    console.log(`   Score: ${score}`);
    console.log(`   Matched skills: ${matchedSkills.length}`);
    console.log(`   Missing skills: ${pythonData.missing_skills?.length || 0}`);
    console.log(`   Jobs found: ${adzunaJobs.length}`);
    
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
    console.error("🔥 FULL ERROR:", error);

    if (error.response) {
      console.error("🔥 PYTHON ERROR:", error.response.data);
      return res.status(500).json({ message: error.response.data });
    }

    console.error("🔥 ERROR MESSAGE:", error.message);
    return res.status(500).json({ message: error.message });
  }
});

module.exports = router;
