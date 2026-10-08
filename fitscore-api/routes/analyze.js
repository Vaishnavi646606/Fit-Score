const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { fetchAllJobs } = require('../services/jobSources');

const Analysis = require('../models/Analysis');
const { PYTHON_URL } = require('../config/python');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', authMiddleware, upload.single('resume'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

if (!user) {
  return res.status(401).json({ message: 'User not found' });
}
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
      timeout: 180000,
    });
    console.log(`✅ Python response received (status: ${pythonResponse.status})`);
    console.log(`📊 Python response:`, JSON.stringify(pythonResponse.data, null, 2));

    const pythonData = pythonResponse.data?.data || pythonResponse.data || {}
    // If python provided extracted fields for observability, log them
    if (pythonData.extracted_text) {
      console.log('🔎 Python extracted_text (truncated):', pythonData.extracted_text.slice(0, 500));
    }
    if (pythonData.extracted_skills) {
      console.log('🔎 Python extracted_skills:', pythonData.extracted_skills);
    }

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
      userId: user._id,
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



      // ==================================================
// 🔎 JOB SEARCH QUERIES FROM JD
// ==================================================

const jdLower = jd.toLowerCase();

const possibleRoles = [
  'data analyst',
  'business analyst',
  'data scientist',
  'machine learning engineer',
  'ai engineer',
  'ai/ml engineer',
  'software engineer',
  'software developer',
  'python developer',
  'full stack developer',
  'backend developer',
  'frontend developer',
  'java developer',
  'web developer',
];

const detectedRoles = possibleRoles.filter(role =>
  jdLower.includes(role)
);

const searchQueries =
  detectedRoles.length > 0
    ? detectedRoles
    : ['Software Engineer', 'Data Analyst', 'AI Engineer'];

console.log(
  `🔍 JD-based job search queries: ${searchQueries.join(' | ')}`
);
    let adzunaJobs = [];
    try {
      adzunaJobs = await fetchAllJobs(searchQueries);
      console.log(`✅ ${adzunaJobs.length} jobs fetched`);
      console.log('📊 Sources:', [...new Set(adzunaJobs.map(j => j.source))].join(', '));
      console.log('🔗 Official links:', adzunaJobs.filter(j => j.isOfficial).length);
    } catch (err) {
      console.error('❌ Job fetch error:', err.message);
    }

    // ==================================================
// 🚀 DAY 3 — INTELLIGENT JOB RANKING
// ==================================================

let rankedJobs = []

if (adzunaJobs.length > 0) {
  try {
    console.log('\n🧠 Starting intelligent job ranking...')

    const rankForm = new FormData()

    rankForm.append('resume', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    })

    rankForm.append(
      'jobs',
      JSON.stringify(adzunaJobs)
    )

    console.log(
      `🐍 Calling Python ranking API at: ${PYTHON_URL}/rank-jobs`
    )

    const rankingResponse = await axios.post(
      `${PYTHON_URL}/rank-jobs`,
      rankForm,
      {
        headers: rankForm.getHeaders(),
        timeout: 120000,
      }
    )

    rankedJobs =
      rankingResponse.data?.ranked_jobs || []

    console.log(
      `🏆 ${rankedJobs.length} jobs ranked successfully`
    )

    rankedJobs.forEach(job => {
      console.log(
        `   #${job.rank} ${job.title} → ${job.score}/100`
      )
    })

        // Add job source information back to ranked jobs
    rankedJobs = rankedJobs.map(rankedJob => {
      const originalJob = adzunaJobs.find(
        job => job.job_id === rankedJob.job_id
      )

      return {
        ...rankedJob,
        source: originalJob?.source || '',
        location: originalJob?.location || 'India',
        applyUrl: originalJob?.applyUrl || '',
        fallbackUrl: originalJob?.fallbackUrl || '',
        isOfficial: originalJob?.isOfficial || false,
        created: originalJob?.created || null,
        description: originalJob?.description || '',
      }
    })
  } catch (rankingError) {

    console.error(
      '❌ Job ranking API error:',
      rankingError.message
    )

    if (rankingError.response) {
      console.error(
        'Ranking API response:',
        rankingError.response.data
      )
    }

    // Keep original Adzuna jobs if ranking fails
    rankedJobs = adzunaJobs
  }
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
      jobs: rankedJobs,
      matched: matchedSkills,
      missing: missingSkills,
      skills_match: skillsScore,
      experience_match: experienceScore,
      education_match: educationScore,
      plan: user.plan
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
