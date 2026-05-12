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

    const matchedSkills = pythonData.matchedSkills || pythonData.matched_skills || pythonData.matched || []
    const missingSkills = pythonData.missingSkills || pythonData.missing_skills || pythonData.missing || []
    const suggestions = pythonData.suggestions || []
    const skillsScore = typeof pythonData.skillsScore === 'number' ? pythonData.skillsScore : (typeof pythonData.skills_match === 'number' ? pythonData.skills_match : 0)
    const experienceScore = typeof pythonData.experienceScore === 'number' ? pythonData.experienceScore : (typeof pythonData.experience_match === 'number' ? pythonData.experience_match : 0)
    const educationScore = typeof pythonData.educationScore === 'number' ? pythonData.educationScore : (typeof pythonData.education_match === 'number' ? pythonData.education_match : 0)
    const keywords = Array.isArray(pythonData.keywords) ? pythonData.keywords : []
    const radarData = Array.isArray(pythonData.radarData) ? pythonData.radarData : [
      { subject: 'Skills', A: skillsScore },
      { subject: 'Experience', A: experienceScore },
      { subject: 'Education', A: educationScore },
      { subject: 'Keywords', A: Math.max(0, Math.min(100, Math.round((keywords.length || 0) * 10))) },
      { subject: 'ATS', A: score },
    ]

    console.log(`🎯 Matched skills: ${matchedSkills.join(', ')}`);
    console.log(`🧩 Missing skills: ${missingSkills.join(', ')}`);
    console.log(`💡 Suggestions: ${suggestions.join(' | ')}`);

    const topSkills = matchedSkills.slice(0, 5).join(' ')
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
            results_per_page: 5,
            what: searchQuery,
            where: 'india',
            sort_by: 'relevance',
          },
          timeout: 10000,
        }
      )
      console.log(`✅ Adzuna API response (status: ${adzunaRes.status})`);
      console.log(`📊 Total jobs found: ${adzunaRes.data?.results?.length || 0}`);
      
      adzunaJobs = (adzunaRes.data?.results || []).slice(0, 5).map(job => ({
        title: job.title,
        company: job.company?.display_name || 'Unknown',
        location: job.location?.display_name || 'India',
        redirect_url: job.redirect_url,
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
      adzunaJobs = [
        {
          title: `Search more ${searchQuery} roles`,
          company: 'Adzuna',
          location: 'India',
          redirect_url: `https://www.adzuna.in/search?keywords=${encodeURIComponent(searchQuery)}&location=India`,
          applyUrl: `https://www.adzuna.in/search?keywords=${encodeURIComponent(searchQuery)}&location=India`,
          description: 'Open Adzuna search results for this skill set.',
        },
      ]
      console.log(`⚠️  Using fallback job recommendations`);
    }

    console.log(`\n✅ ANALYSIS COMPLETE - Returning response`);
    console.log(`   Score: ${score}`);
    console.log(`   Matched skills: ${matchedSkills.length}`);
    console.log(`   Missing skills: ${missingSkills.length}`);
    console.log(`   Jobs found: ${adzunaJobs.length}`);
    
    return res.status(200).json({
      score,
      message: 'Analysis completed',
      matchedSkills,
      missingSkills,
      suggestions,
      educationScore,
      experienceScore,
      skillsScore,
      keywords,
      radarData,
      jobs: adzunaJobs,
      matched: matchedSkills,
      missing: missingSkills,
      skills_match: skillsScore,
      experience_match: experienceScore,
      education_match: educationScore,
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
