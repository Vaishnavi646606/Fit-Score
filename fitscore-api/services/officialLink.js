const axios = require('axios');

// ============================================================
// HELPERS
// ============================================================

function normalize(text = '') {
  return String(text)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text = '') {
  return normalize(text).replace(/\s+/g, '');
}

// Words that don't help identify the exact job
const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'job',
  'role',
  'india',
  'remote',
  'hybrid',
  'work',
  'of',
  'in',
  'to',
  'a',
  'an',
  'on',
  'at',
  'team',
  'level'
]);

function meaningfulWords(text = '') {
  return normalize(text)
    .split(' ')
    .filter(w => w.length >= 2 && !STOP_WORDS.has(w));
}

function titleScore(target, candidate) {
  const targetWords = meaningfulWords(target);
  const candidateWords = new Set(meaningfulWords(candidate));

  if (!targetWords.length) return 0;

  const matched = targetWords.filter(w => candidateWords.has(w)).length;

  return matched / targetWords.length;
}

function companyTokens(company = '') {
  return meaningfulWords(company)
    .filter(w => w.length >= 3);
}

// ============================================================
// BLOCKED JOB AGGREGATORS
// ============================================================

const BLOCKED_DOMAINS = [
  'linkedin.',
  'indeed.',
  'naukri.',
  'glassdoor.',
  'adzuna.',
  'jooble.',
  'foundit.',
  'monster.',
  'shine.',
  'timesjobs.',
  'ziprecruiter.',
  'simplyhired.',
  'talent.com',
  'careerjet.',
  'freshersworld.',
  'apna.co',
  'instahyre.',
  'wellfound.',
  'remotive.',
  'jobgether.',
  'bebee.',
  'grabjobs.',
  'jora.',
  'hirist.',
  'cutshort.',
  'workindia.',
  'quikr.',
  'google.',
  'bing.'
];

// ============================================================
// SUPPORTED ATS DOMAINS
// ============================================================

const ATS_DOMAINS = [
  'greenhouse.io',
  'boards.greenhouse.io',

  'lever.co',
  'jobs.lever.co',

  'ashbyhq.com',
  'jobs.ashbyhq.com',

  'myworkdayjobs.com',
  'workday.com',

  'smartrecruiters.com',

  'icims.com',

  'jobvite.com',

  'successfactors.com',

  'oraclecloud.com',

  'workable.com',

  'zohorecruit.com',

  'taleo.net',

  'eightfold.ai',

  'avature.net',

  'bamboohr.com',

  'brassring.com',

  'phenompeople.com'
];

// ============================================================
// GENERIC CAREER PAGES = NOT ACCEPTED
// ============================================================

const GENERIC_PATHS = [
  '/careers',
  '/career',
  '/jobs',
  '/job-search',
  '/jobsearch',
  '/search-jobs',
  '/search',
  '/opportunities',
  '/employment',
  '/join-us',
  '/work-with-us',
  '/open-positions',
  '/vacancies'
];

function isGenericCareerPage(url) {
  try {
    const parsed = new URL(url);

    const path = parsed.pathname
      .toLowerCase()
      .replace(/\/+$/, '');

    // Exact generic pages
    if (GENERIC_PATHS.includes(path)) {
      return true;
    }

    // Generic career page with query only
    if (
      GENERIC_PATHS.some(p => path === p) &&
      !parsed.searchParams.has('gh_jid')
    ) {
      return true;
    }

    return false;

  } catch {
    return true;
  }
}

// ============================================================
// URL VALIDATION
// ============================================================

function isBlocked(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();

    return BLOCKED_DOMAINS.some(domain =>
      host.includes(domain)
    );

  } catch {
    return true;
  }
}

function isATS(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();

    return ATS_DOMAINS.some(domain =>
      host.includes(domain)
    );

  } catch {
    return false;
  }
}

function looksLikeJobDetail(url) {
  try {
    const parsed = new URL(url);

    const full = `${parsed.pathname} ${parsed.search}`.toLowerCase();

    const jobIndicators = [
      '/job/',
      '/jobs/',
      '/posting/',
      '/postings/',
      '/position/',
      '/positions/',
      '/requisition/',
      '/requisitions/',
      '/opening/',
      '/openings/',
      '/apply',
      'jobid=',
      'job_id=',
      'jobid',
      'gh_jid=',
      '/careers/job/',
      '/career/job/',
      '/job-details/',
      '/jobdetail/',
      '/job-detail/'
    ];

    return jobIndicators.some(indicator =>
      full.includes(indicator)
    );

  } catch {
    return false;
  }
}

// ============================================================
// COMPANY MATCH
// ============================================================

function companyMatches(company, result) {

  const companyWords = companyTokens(company);

  if (!companyWords.length) {
    return false;
  }

  const combined = normalize(`
    ${result.title || ''}
    ${result.snippet || ''}
    ${result.link || ''}
  `);

  return companyWords.some(word =>
    combined.includes(word)
  );
}

// ============================================================
// FETCH JSON
// ============================================================

async function get(url) {

  try {

    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/154 Safari/537.36'
      }
    });

    return response.data;

  } catch {

    return null;

  }
}

// ============================================================
// ATS DIRECT SEARCH
// ============================================================

async function fromKnownATS(company, title) {

  const slug = slugify(company);

  if (!slug) {
    return '';
  }

  const candidates = [];

  // ----------------------------------------------------------
  // GREENHOUSE
  // ----------------------------------------------------------

  try {

    const gh = await get(
      `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`
    );

    for (const job of gh?.jobs || []) {

      const score = titleScore(
        title,
        job.title
      );

      if (
        job.absolute_url &&
        score >= 0.60
      ) {

        candidates.push({
          url: job.absolute_url,
          score: score + 0.20,
          source: 'Greenhouse'
        });

      }

    }

  } catch {}

  // ----------------------------------------------------------
  // LEVER
  // ----------------------------------------------------------

  try {

    const lever = await get(
      `https://api.lever.co/v0/postings/${slug}?mode=json`
    );

    if (Array.isArray(lever)) {

      for (const job of lever) {

        const score = titleScore(
          title,
          job.text
        );

        const url =
          job.applyUrl ||
          job.hostedUrl;

        if (
          url &&
          score >= 0.60
        ) {

          candidates.push({
            url,
            score: score + 0.20,
            source: 'Lever'
          });

        }

      }

    }

  } catch {}

  // ----------------------------------------------------------
  // ASHBY
  // ----------------------------------------------------------

  try {

    const ashby = await get(
      `https://api.ashbyhq.com/posting-api/job-board/${slug}`
    );

    for (const job of ashby?.jobs || []) {

      const score = titleScore(
        title,
        job.title
      );

      const url =
        job.jobUrl ||
        job.applyUrl;

      if (
        url &&
        score >= 0.60
      ) {

        candidates.push({
          url,
          score: score + 0.20,
          source: 'Ashby'
        });

      }

    }

  } catch {}

  candidates.sort(
    (a, b) => b.score - a.score
  );

  for (const candidate of candidates) {

    if (
      !isBlocked(candidate.url) &&
      !isGenericCareerPage(candidate.url)
    ) {

      return candidate.url;

    }

  }

  return '';
}

// ============================================================
// SERPER / GOOGLE SEARCH
// ============================================================

async function searchSerper(query) {

  if (!process.env.SERPER_API_KEY) {
    console.warn(
      '⚠️ SERPER_API_KEY missing'
    );

    return [];
  }

  try {

    const response = await axios.post(

      'https://google.serper.dev/search',

      {
        q: query,
        gl: 'in',
        hl: 'en',
        num: 10
      },

      {
        headers: {
          'X-API-KEY':
            process.env.SERPER_API_KEY,

          'Content-Type':
            'application/json'
        },

        timeout: 12000
      }

    );

    return response.data?.organic || [];

  } catch (error) {

    console.warn(
      '⚠️ Serper search failed:',
      error.message
    );

    return [];
  }
}

// ============================================================
// SCORE SEARCH RESULT
// ============================================================

function scoreSearchResult(
  company,
  title,
  result
) {

  if (!result?.link) {
    return -999;
  }

  const url = result.link;

  // Never use aggregators
  if (isBlocked(url)) {
    return -999;
  }

  // Never use generic careers homepage
  if (isGenericCareerPage(url)) {
    return -999;
  }

  const titleMatch = titleScore(
    title,
    result.title || ''
  );

  const snippetMatch = titleScore(
    title,
    result.snippet || ''
  );

  const companyMatch =
    companyMatches(company, result);

  const ats =
    isATS(url);

  const jobDetail =
    looksLikeJobDetail(url);

  // Exact job title is extremely important
  if (titleMatch < 0.50) {
    return -999;
  }

  // Company must also match
  if (!companyMatch) {
    return -999;
  }

  let score = 0;

  score += titleMatch * 60;

  score += snippetMatch * 15;

  if (companyMatch) {
    score += 15;
  }

  if (ats) {
    score += 10;
  }

  if (jobDetail) {
    score += 20;
  }

  return score;
}

// ============================================================
// SEARCH FOR EXACT JOB
// ============================================================

async function fromSearch(company, title) {

  const queries = [

    // Exact title first
    `"${title}" "${company}" apply`,

    `"${title}" "${company}" jobs`,

    `"${title}" "${company}" careers`,

    // Major ATS
    `site:myworkdayjobs.com "${title}" "${company}"`,

    `site:greenhouse.io "${title}" "${company}"`,

    `site:boards.greenhouse.io "${title}" "${company}"`,

    `site:jobs.lever.co "${title}" "${company}"`,

    `site:ashbyhq.com "${title}" "${company}"`,

    `site:smartrecruiters.com "${title}" "${company}"`,

    `site:icims.com "${title}" "${company}"`,

    `site:successfactors.com "${title}" "${company}"`,

    `site:oraclecloud.com "${title}" "${company}"`,

    `site:workable.com "${title}" "${company}"`,

    // Company website exact title
    `site:${slugify(company)}.com "${title}"`,

    `"${title}" "${company}" India`
  ];

  const allResults = [];

  for (const query of queries) {

    const results =
      await searchSerper(query);

    allResults.push(
      ...results
    );

    // Don't hammer Serper unnecessarily
    if (allResults.length >= 50) {
      break;
    }
  }

  // Remove duplicate URLs
  const unique = [];

  const seen = new Set();

  for (const result of allResults) {

    if (!result?.link) {
      continue;
    }

    const key =
      result.link
        .split('?')[0]
        .replace(/\/+$/, '');

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    unique.push(result);
  }

  // Score everything
  const scored = unique
    .map(result => ({
      ...result,
      _score: scoreSearchResult(
        company,
        title,
        result
      )
    }))
    .filter(result =>
      result._score > 0
    )
    .sort(
      (a, b) =>
        b._score - a._score
    );

  if (!scored.length) {
    return '';
  }

  const best = scored[0];

  console.log(
    `🔗 Official match: ${company} | ${title}`
  );

  console.log(
    `   → ${best.link}`
  );

  console.log(
    `   → score=${best._score}`
  );

  return best.link;
}

// ============================================================
// MAIN RESOLVER
// ============================================================

async function resolveOfficialLink(
  company,
  title
) {

  if (
    !company ||
    !title ||
    company === 'Unknown'
  ) {
    return '';
  }

  console.log(
    `🔎 Resolving official job: ${company} | ${title}`
  );

  // ----------------------------------------------------------
  // 1. Direct ATS lookup
  // ----------------------------------------------------------

  const atsUrl =
    await fromKnownATS(
      company,
      title
    );

  if (atsUrl) {

    console.log(
      `✅ ATS direct match: ${atsUrl}`
    );

    return atsUrl;
  }

  // ----------------------------------------------------------
  // 2. Exact Google/Serper discovery
  // ----------------------------------------------------------

  const searchUrl =
    await fromSearch(
      company,
      title
    );

  if (searchUrl) {

    console.log(
      `✅ Search exact match: ${searchUrl}`
    );

    return searchUrl;
  }

  // ----------------------------------------------------------
  // IMPORTANT:
  // DO NOT FALL BACK TO:
  // - Adzuna
  // - LinkedIn
  // - Naukri
  // - generic careers homepage
  // - generic company homepage
  // ----------------------------------------------------------

  console.log(
    `❌ No exact official job page found: ${company} | ${title}`
  );

  return '';
}

module.exports = {
  resolveOfficialLink
};