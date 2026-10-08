const axios = require('axios');
const { resolveOfficialLink } = require('./officialLink');


// ============================================================
// 🏢 GOOD / PREFERRED COMPANIES
// ============================================================

const PREFERRED_COMPANIES = [
  // IT Services
  'tcs',
  'tata consultancy services',
  'infosys',
  'wipro',
  'hcl',
  'hcltech',
  'cognizant',
  'accenture',
  'capgemini',
  'tech mahindra',
  'ltimindtree',
  'persistent',
  'genpact',

  // Consulting
  'deloitte',
  'ey',
  'ernst young',
  'pwc',
  'pricewaterhousecoopers',
  'kpmg',

  // Product / Tech
  'microsoft',
  'google',
  'amazon',
  'oracle',
  'ibm',
  'sap',
  'salesforce',
  'adobe',
  'cisco',
  'intel',
  'nvidia',
  'qualcomm',
  'paypal',
  'visa',
  'mastercard',

  // Hardware / Enterprise
  'hp',
  'hewlett packard',
  'dell',
  'siemens',
  'bosch',

  // Indian Product Companies
  'zoho',
  'freshworks',
  'flipkart',
  'meesho',
  'phonepe',
  'razorpay',
  'paytm',
  'swiggy',
  'zomato',
  'groww',
  'myntra',
  'cred',
  'upstox',
  'ola',
];


// ============================================================
// 🚫 WORDS THAT INDICATE NON-FRESHER ROLES
// ============================================================

const SENIOR_WORDS = [
  'senior',
  'sr.',
  'sr ',
  'lead',
  'principal',
  'staff engineer',
  'manager',
  'director',
  'architect',
  'head of',
  'vp ',
  'vice president',
  'expert',
  'specialist',
  'consultant',
];


// ============================================================
// 🚫 EXPERIENCE REQUIREMENTS THAT ARE TOO HIGH
// ============================================================

function isTooExperienced(job) {

  const text = `
    ${job.title || ''}
    ${job.description || ''}
  `.toLowerCase();


  // Explicit senior keywords
  if (
    SENIOR_WORDS.some(word =>
      text.includes(word)
    )
  ) {
    return true;
  }


  // Examples:
  // 2+ years
  // 3+ years
  // 4 years experience
  // 5 years of experience
  // minimum 3 years

  const experiencePatterns = [
    /(\d+)\s*\+\s*years?/gi,
    /(\d+)\s*-\s*(\d+)\s*years?/gi,
    /(\d+)\s*years?\s+(?:of\s+)?experience/gi,
    /minimum\s+(\d+)\s*years?/gi,
    /at least\s+(\d+)\s*years?/gi,
  ];


  for (const pattern of experiencePatterns) {

    const matches = text.matchAll(pattern);

    for (const match of matches) {

      const numbers = match
        .slice(1)
        .filter(Boolean)
        .map(Number);

      if (!numbers.length) continue;

      // If minimum/lower bound is 2 or more
      if (numbers[0] >= 2) {
        return true;
      }

      // For ranges like 2-4 years
      if (
        numbers.length >= 2 &&
        numbers[0] >= 2
      ) {
        return true;
      }
    }
  }


  return false;
}


// ============================================================
// 🎓 FRESHER / ENTRY LEVEL DETECTION
// ============================================================

function isFresherJob(job) {

  const text = `
    ${job.title || ''}
    ${job.description || ''}
  `.toLowerCase();


  const fresherKeywords = [
    'fresher',
    'freshers',
    'fresh graduate',
    'recent graduate',
    'new graduate',
    'graduate',
    'entry level',
    'entry-level',
    'junior',
    'associate',
    'trainee',
    'campus',
    'campus hiring',
    'graduate program',
    'graduate programme',
    'early career',
    '0 years',
    '0-1 years',
    '0 - 1 years',
    '0 to 1 years',
    '0-2 years',
    '0 - 2 years',
    '0 to 2 years',
    '1 year',
    '1 years',
  ];


  // If clearly senior -> reject
  if (isTooExperienced(job)) {
    return false;
  }


  // Explicit fresher indicator
  if (
    fresherKeywords.some(keyword =>
      text.includes(keyword)
    )
  ) {
    return true;
  }


  // Job title itself indicates junior/associate/trainee
  const title = (job.title || '').toLowerCase();

  if (
    title.includes('junior') ||
    title.includes('associate') ||
    title.includes('trainee') ||
    title.includes('graduate')
  ) {
    return true;
  }


  // If no experience requirement is mentioned,
  // don't automatically reject yet.
  // We will use company + freshness + relevance ranking.
  return true;
}


// ============================================================
// 🔎 JSEARCH
// ============================================================

async function fetchJSearch(
  query,
  datePosted = 'today'
) {

  if (!process.env.RAPIDAPI_KEY) {

    console.warn(
      '⚠️ RAPIDAPI_KEY missing - JSearch skipped'
    );

    return [];
  }


  try {

    const res = await axios.get(
      'https://jsearch.p.rapidapi.com/search',
      {
        params: {

          query: `${query} in India`,

          page: 1,

          num_pages: 4,

          country: 'in',

          date_posted: datePosted,

        },

        headers: {

          'X-RapidAPI-Key':
            process.env.RAPIDAPI_KEY,

          'X-RapidAPI-Host':
            'jsearch.p.rapidapi.com',

        },

        timeout: 20000,

      }
    );


    const results =
      res.data?.data || [];


    console.log(
      `🔎 JSearch "${query}" (${datePosted}) → ${results.length} jobs`
    );


    return results.map(j => {

      const direct =
        (j.apply_options || []).find(
          option =>
            option.is_direct === true
        );


      return {

        job_id:
          `JSEARCH_${j.job_id}`,

        source:
          j.job_publisher ||
          'JSearch',

        title:
          j.job_title || '',

        company:
          j.employer_name ||
          'Unknown',

        location:
          [
            j.job_city,
            j.job_state,
          ]
            .filter(Boolean)
            .join(', ') ||
          j.job_country ||
          'India',

        applyUrl: '',

isOfficial: false,

sourceApplyUrl:
  direct?.apply_link ||
  j.job_apply_link ||
  '',

        description:
          j.job_description ||
          '',

        created:
          j.job_posted_at_datetime_utc ||
          j.job_posted_at ||
          null,

        publisher:
          j.job_publisher ||
          '',

      };

    });

  } catch (err) {

    console.warn(
      `⚠️ JSearch failed for "${query}":`,
      err.response?.data?.message ||
      err.message
    );

    return [];
  }
}


// ============================================================
// 🔎 ADZUNA
// ============================================================
async function fetchAdzuna(query) {

  const {
    ADZUNA_APP_ID,
    ADZUNA_API_KEY
  } = process.env;

  if (!ADZUNA_APP_ID || !ADZUNA_API_KEY) {
    console.warn('⚠️ Adzuna credentials missing');
    return [];
  }

  try {

    const res = await axios.get(
      'https://api.adzuna.com/v1/api/jobs/in/search/1',
      {
        params: {
          app_id: ADZUNA_APP_ID,
          app_key: ADZUNA_API_KEY,
          results_per_page: 50,
          what: query,
          where: 'india',
          sort_by: 'date'
        },
        timeout: 15000
      }
    );

    const results = res.data?.results || [];

    console.log(
      `🔎 Adzuna "${query}" → ${results.length} jobs`
    );

    return results.map(j => ({

      job_id: `ADZUNA_${j.id}`,

      source:'Job Discovery',

      title: j.title || '',

      company:
        j.company?.display_name || 'Unknown',

      location:
        j.location?.display_name || 'India',

      // Job-specific Adzuna application URL
      applyUrl:
        j.redirect_url || '',

      // This is not necessarily the company's official URL
      isOfficial: false,

      description:
        j.description || '',

      created:
        j.created || null,

      // Keep original Adzuna URL as backup
      fallbackUrl:
        j.redirect_url || ''

    }));

  } catch (err) {

    console.warn(
      `⚠️ Adzuna failed for "${query}":`,
      err.response?.data?.message ||
      err.message
    );

    return [];
  }
}


// ============================================================
// 🧠 TEXT HELPERS
// ============================================================

const GENERIC = new Set([
  'engineer',
  'developer',
  'senior',
  'junior',
  'jr',
  'sr',
  'lead',
  'the',
  'and',
  'for',
  'with',
  'in',
  'job',
  'jobs',
  'role',
  'roles',
  'associate',
  'graduate',
]);


const tokens = text =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(
      word =>
        word.length >= 2 &&
        !GENERIC.has(word)
    );


// ============================================================
// 🎯 RELEVANCE FILTER
// ============================================================

function makeRelevanceFilter(queries) {

  const wanted = new Set(
    queries.flatMap(tokens)
  );


  return job => {

    const titleWords =
      tokens(job.title);


    return titleWords.some(
      word =>
        wanted.has(word)
    );
  };
}


// ============================================================
// 🏢 COMPANY QUALITY
// ============================================================

function companyScore(company) {

  const name =
    String(company || '')
      .toLowerCase()
      .trim();


  const index =
    PREFERRED_COMPANIES.findIndex(
      preferred =>
        name.includes(preferred)
    );


  if (index === -1) {

    // Unknown company
    return 0;
  }


  // First companies get highest score
  return 100;
}


// ============================================================
// ⏰ FRESHNESS SCORE
// ============================================================

function freshnessScore(created) {

  if (!created) return 0;


  const time =
    new Date(created).getTime();


  if (Number.isNaN(time)) {
    return 0;
  }


  const ageHours =
    (Date.now() - time) /
    (1000 * 60 * 60);


  if (ageHours < 1)
    return 100;


  if (ageHours <= 6)
    return 90;


  if (ageHours <= 12)
    return 80;


  if (ageHours <= 24)
    return 70;


  if (ageHours <= 48)
    return 60;


  if (ageHours <= 72)
    return 50;


  if (ageHours <= 168)
    return 35;


  return 10;
}


// ============================================================
// 🎓 FRESHER SCORE
// ============================================================

function fresherScore(job) {

  const text = `
    ${job.title || ''}
    ${job.description || ''}
  `.toLowerCase();


  if (isTooExperienced(job)) {
    return -100;
  }


  const strongFresherWords = [
    'fresher',
    'fresh graduate',
    'recent graduate',
    'entry level',
    'entry-level',
    'graduate program',
    'graduate programme',
    'campus hiring',
    'trainee',
    '0 years',
    '0-1 years',
    '0 - 1 years',
    '0-2 years',
    '0 - 2 years',
  ];


  if (
    strongFresherWords.some(
      word =>
        text.includes(word)
    )
  ) {
    return 100;
  }


  const juniorWords = [
    'junior',
    'associate',
    'graduate',
    'early career',
  ];


  if (
    juniorWords.some(
      word =>
        text.includes(word)
    )
  ) {
    return 80;
  }


  // No experience specified
  return 50;
}


// ============================================================
// ⭐ FINAL JOB PRIORITY
// ============================================================

function jobPriority(job) {

  const freshness =
    freshnessScore(
      job.created
    );

  const company =
    companyScore(
      job.company
    );

  const fresher =
    fresherScore(
      job
    );

  const official =
    job.isOfficial
      ? 30
      : 0;


  /*
    Company quality is important,
    but freshness + fresher status
    also matter.

    Maximum roughly:
    Company 100
    Freshness 100
    Fresher 100
    Official 30
  */

  return (
    company * 1.5 +
    freshness * 1.2 +
    fresher * 1.5 +
    official
  );
}


// ============================================================
// 🚀 MAIN JOB FETCH FUNCTION
// ============================================================

async function fetchAllJobs(queries) {

  console.log(
    '\n🚀 Starting quality-focused job search...'
  );

  console.log(
    `🔍 Queries: ${queries.join(' | ')}`
  );


  // ==========================================================
  // 1️⃣ FETCH TODAY
  // ==========================================================

  const tasks = [];


  for (const query of queries) {

    tasks.push(
      fetchJSearch(
        query,
        'today'
      )
    );

    tasks.push(
      fetchAdzuna(
        query
      )
    );
  }


  const settled =
    await Promise.allSettled(
      tasks
    );


  let allJobs = [];


  settled.forEach(result => {

    if (
      result.status ===
      'fulfilled'
    ) {

      allJobs.push(
        ...result.value
      );

    }

  });


  console.log(
    `📥 Raw jobs fetched: ${allJobs.length}`
  );


  // ==========================================================
  // 2️⃣ DEDUPLICATE
  // ==========================================================

  const seen =
    new Set();


  let unique =
    allJobs.filter(job => {

      if (
        !job.title ||
        !job.company ||
        job.company === 'Unknown'
      ) {
        return false;
      }


      const key =
        `${job.title}|${job.company}`
          .toLowerCase()
          .replace(
            /[^a-z0-9|]/g,
            ''
          );


      if (
        seen.has(key)
      ) {
        return false;
      }


      seen.add(key);

      return true;

    });


  console.log(
    `🧹 Unique jobs: ${unique.length}`
  );


  // ==========================================================
  // 3️⃣ RELEVANCE
  // ==========================================================

  const isRelevant =
    makeRelevanceFilter(
      queries
    );


  unique =
    unique.filter(
      isRelevant
    );


  console.log(
    `🎯 Relevant jobs: ${unique.length}`
  );


  // ==========================================================
  // 4️⃣ REMOVE DEFINITELY NON-FRESHER JOBS
  // ==========================================================

  const fresherJobs =
    unique.filter(
      job =>
        isFresherJob(job)
    );


  console.log(
    `🎓 Fresher/Entry-level candidates: ${fresherJobs.length}`
  );


  // ==========================================================
  // 5️⃣ PREFERRED COMPANIES FIRST
  // ==========================================================

  const preferredJobs =
    fresherJobs.filter(
      job =>
        companyScore(
          job.company
        ) > 0
    );


  console.log(
    `🏢 Good-company candidates: ${preferredJobs.length}`
  );


  /*
    IMPORTANT:

    If good-company jobs exist,
    use them.

    This prevents random companies
    like unknown small employers from
    dominating the results.
  */

  let candidates;


  if (
    preferredJobs.length >= 5
  ) {

    candidates =
      preferredJobs;

    console.log(
      '✅ Using preferred-company jobs'
    );

  } else {

    /*
      If there are fewer than 5 good-company
      fresher jobs, allow a few other companies
      so the user does not get an empty result.
    */

    const otherJobs =
      fresherJobs
        .filter(
          job =>
            companyScore(
              job.company
            ) === 0
        )
        .sort(
          (a, b) =>
            jobPriority(b) -
            jobPriority(a)
        )
        .slice(0, 5);


    candidates = [
      ...preferredJobs,
      ...otherJobs
    ];


    console.log(
      '⚠️ Few preferred-company jobs; adding limited other companies'
    );
  }


  // ==========================================================
  // 6️⃣ SORT BY QUALITY + FRESHNESS + FRESHER
  // ==========================================================

  candidates.sort(
    (a, b) =>
      jobPriority(b) -
      jobPriority(a)
  );


  // Resolve official URLs for more candidates
  const linkCandidates =
    candidates.slice(
      0,
      60
    );


  console.log(
    `🔗 Resolving official Apply URLs for ${linkCandidates.length} candidates...`
  );


  // ==========================================================
  // 7️⃣ OFFICIAL APPLY URL
  // ==========================================================

  for (
    let i = 0;
    i < linkCandidates.length;
    i += 5
  ) {

    await Promise.all(

      linkCandidates
        .slice(i, i + 5)
        .map(async job => {

          // Already has direct official URL
          // ALWAYS resolve the final application URL.
// Never trust JSearch/Adzuna URLs as final Apply URLs.
job.applyUrl = '';
job.isOfficial = false;

try {
  const official = await resolveOfficialLink(
    job.company,
    job.title
  );

  if (official) {
    job.applyUrl = official;
    job.isOfficial = true;
  }
} catch (err) {
  console.warn(
    `⚠️ Official URL failed: ${job.company} - ${job.title}`
  );
}


          try {

            const official =
              await resolveOfficialLink(
                job.company,
                job.title
              );


            if (
              official
            ) {

              job.applyUrl =
                official;

              job.isOfficial =
                true;
            }

          } catch (error) {

            console.warn(
              `⚠️ Official URL failed: ${job.company} - ${job.title}`
            );

          }

        })
    );
  }


  // ==========================================================
  // 8️⃣ ONLY JOBS WITH OFFICIAL APPLY URL
  // ==========================================================

    // ==========================================================
// 8️⃣ KEEP ALL QUALITY JOBS
// ==========================================================

// Do NOT remove jobs just because an official Apply URL
// could not be resolved.
//
// If an official URL exists:
// → Apply button will be shown.
//
// If no official URL exists:
// → Job is still shown.

const finalJobs =
  linkCandidates
    .sort(
      (a, b) =>
        jobPriority(b) -
        jobPriority(a)
    )
    .slice(0, 15);


console.log(
  `🏢 Official Apply URLs found: ${
    finalJobs.filter(
      job =>
        job.isOfficial &&
        job.applyUrl
    ).length
  }/${finalJobs.length}`
);


// ==========================================================
// 9️⃣ FINAL RESULTS
// ==========================================================

console.log(
  `\n✅ FINAL JOBS RETURNED: ${finalJobs.length}`
);


finalJobs.forEach(
  (job, index) => {

    console.log(
      `#${index + 1} | ${job.title} | ${job.company} | Apply: ${
        job.applyUrl
          ? 'YES'
          : 'NO'
      }`
    );

  }
);


return finalJobs;


  console.log(
    `\n✅ FINAL JOBS RETURNED: ${finalJobs.length}`
  );


  finalJobs.forEach(
    (job, index) => {

      console.log(
        `#${index + 1} | ${job.title} | ${job.company} | ${job.created}`
      );

    }
  );


  return finalJobs;
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
  fetchAllJobs
};