import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import Navbar from '../components/Navbar'
import styles from './Upload.module.css'
import { API_URL, getToken } from '../auth'

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
 // const [usageKey, setUsageKey] = useState(0)

  const onDrop = useCallback(accepted => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
  })

  const handleAnalyze = async () => {
  if (!file || !jd.trim()) {
    setError('Please upload a resume and paste a job description before analyzing.')
    return
  }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('jd', jd)
      

      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData,
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }

      console.log('Full /analyze response:', data)

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to analyze resume')
      }

      const analysisData = data?.data ?? data

      const rawScore =
        typeof data?.score === 'number'
          ? data.score
          : typeof data?.data?.score === 'number'
            ? data.data.score
            : null

      const normalizedResult = {
        score: rawScore,
        message: typeof data?.message === 'string' ? data.message : '',
        fileName: file.name,
        jdSnippet: jd.slice(0, 80) + (jd.length > 80 ? '...' : ''),
        //jobs: Array.isArray(analysisData.jobs) ? analysisData.jobs : [],
        jobs: Array.isArray(data?.jobs)
  ? data.jobs
  : Array.isArray(data?.ranked_jobs)
    ? data.ranked_jobs
    : Array.isArray(analysisData?.jobs)
      ? analysisData.jobs
      : [],
        llm_explanation: analysisData.llm_explanation || null,
        score_breakdown: analysisData.score_breakdown || null,
        matchedSkills: Array.isArray(data?.matchedSkills)
          ? data.matchedSkills
          : Array.isArray(data?.matched)
            ? data.matched
            : Array.isArray(data?.matched_skills)
              ? data.matched_skills
              : [],
        
        missingSkills: Array.isArray(analysisData?.missingSkills)
          ? data.missingSkills
          : Array.isArray(data?.missing)
            ? data.missing
            : Array.isArray(data?.missing_skills)
              ? data.missing_skills
              : [],
        suggestions: Array.isArray(analysisData.suggestions) ? analysisData.suggestions : [],
        educationScore: typeof analysisData.educationScore === 'number' ? analysisData.educationScore : (typeof analysisData.education_match === 'number' ? analysisData.education_match : 0),
       experienceScore: typeof analysisData.experienceScore === 'number' ? analysisData.experienceScore : (typeof analysisData.experience_match === 'number' ? analysisData.experience_match : 0),
                skillsScore: typeof analysisData.skillsScore === 'number'
          ? analysisData.skillsScore
          : (typeof analysisData.skills_match === 'number'
            ? analysisData.skills_match
            : 0),

        keywords: Array.isArray(analysisData.keywords)
          ? analysisData.keywords
          : [],

        radarData: Array.isArray(analysisData.radarData)
          ? analysisData.radarData
          : [],

        matchedSkills: Array.isArray(analysisData?.matchedSkills)
  ? analysisData.matchedSkills
  : Array.isArray(analysisData?.matched)
    ? analysisData.matched
    : [],

        missing: Array.isArray(analysisData?.missingSkills)
          ? analysisData.missingSkills
          : Array.isArray(analysisData?.missing)
            ? analysisData.missing
            : [],

        experience_match: typeof analysisData.experienceScore === 'number'
          ? analysisData.experienceScore
          : (typeof analysisData.experience_match === 'number'
            ? analysisData.experience_match
            : 0),

        skills_match: typeof analysisData.skillsScore === 'number'
          ? analysisData.skillsScore
          : (typeof analysisData.skills_match === 'number'
            ? analysisData.skills_match
            : 0),

        education_match: typeof analysisData.educationScore === 'number'
          ? analysisData.educationScore
          : (typeof analysisData.education_match === 'number'
            ? analysisData.education_match
            : 0),

        timestamp: new Date().toISOString(),
      }

      // Save user usage
const user = JSON.parse(localStorage.getItem('fituser') || '{}')
localStorage.setItem('fituser', JSON.stringify({
  ...user,
  plan: data.plan || user.plan || 'free',
  analyses_left: data.analyses_left ?? user.analyses_left,
}))

// Save analysis result
sessionStorage.setItem('fitresult', JSON.stringify(normalizedResult))

// Save to history BEFORE navigating
const history = JSON.parse(localStorage.getItem('fithistory') || '[]')

const historyItem = {
  ...normalizedResult,
  matched: normalizedResult.matchedSkills || [],
  missing: normalizedResult.missing || normalizedResult.missingSkills || [],
}

history.unshift(historyItem)

localStorage.setItem(
  'fithistory',
  JSON.stringify(history.slice(0, 20))
)

// Update UI
setResult(normalizedResult)
//setUsageKey(k => k + 1)

// Navigate only AFTER history is saved
navigate('/results')
    } catch (err) {
      setError(err?.message || 'Something went wrong while analyzing your resume.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const score = result?.score ?? null
  const matchedSkills = result?.matchedSkills || result?.matched || []

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.step}>STEP 1 OF 2</div>
          <h1 className={styles.title}>Upload & Analyze</h1>
          <p className={styles.sub}>Drop your resume PDF and paste the job description below.</p>
        </div>

        
  
{error && <div className={styles.errorBox}>{error}</div>}

        {result && (
          <div className={styles.resultCard}>
            <div>
              <div className={styles.resultLabel}>Analysis Complete</div>
              <h2 className={styles.resultScore}>
                {typeof score === 'number' ? `${Math.round(score)}%` : 'N/A'}
              </h2>
            </div>
            <div className={styles.resultMeta}>
              {result.message ? (
                <div className={styles.resultMetaLabel}>{result.message}</div>
              ) : (
                <span className={styles.resultMetaLabel}>Matched Skills</span>
              )}
              {matchedSkills.length > 0 ? (
                <div className={styles.resultTags}>
                  {matchedSkills.map(skill => (
                    <span key={skill} className={styles.resultTag}>
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className={styles.resultEmpty}>No matched skills were returned by the API.</div>
              )}
            </div>
          </div>
        )}

        <div className={styles.grid}>
          {/* LEFT — Resume Upload */}
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelNum}>01</span>
              <span className={styles.panelLabel}>Your Resume</span>
            </div>

            <div
              {...getRootProps()}
              className={`${styles.dropzone} ${isDragActive ? styles.active : ''} ${file ? styles.filled : ''}`}
            >
              <input {...getInputProps()} />
              {file ? (
                <div className={styles.fileReady}>
                  <div className={styles.fileIcon}>📄</div>
                  <div className={styles.fileName}>{file.name}</div>
                  <div className={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB · PDF ready</div>
                  <button
                    className={styles.changeBtn}
                    onClick={e => {
                      e.stopPropagation()
                      setFile(null)
                      setResult(null)
                      setError('')
                    }}
                  >
                    Change file
                  </button>
                </div>
              ) : (
                <div className={styles.dropInner}>
                  <div className={styles.dropIcon}>⬆</div>
                  <div className={styles.dropText}>
                    {isDragActive ? 'Drop it here!' : 'Drag & drop your PDF resume'}
                  </div>
                  <div className={styles.dropSub}>or click to browse · PDF only</div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — Job Description */}
          <div className={styles.panel}>
            <div className={styles.panelHead}>
              <span className={styles.panelNum}>02</span>
              <span className={styles.panelLabel}>Job Description</span>
            </div>
            
            <textarea
              className={styles.textarea}
              placeholder="Paste the full job description here…&#10;&#10;Include responsibilities, requirements, and tech stack for the most accurate score."
              value={jd}
              onChange={e => {
                setJd(e.target.value)
                if (error) setError('')
              }}
            />
            <div className={styles.charCount}>{jd.length} characters</div>
          </div>
        </div>

        {/* Analyze Button */}
        <div className={styles.actions}>
          <div className={styles.readyCheck}>
            <span className={file ? styles.checkDone : styles.checkPending}>●</span> Resume
            <span style={{margin:'0 8px',color:'var(--text3)'}}>·</span>
            <span className={jd.length > 50 ? styles.checkDone : styles.checkPending}>●</span> Job Description
          </div>
          <button
            className={`btn-primary ${styles.analyzeBtn}`}
            disabled={!file || jd.length < 50 || loading}
            onClick={handleAnalyze}
          >
            {loading ? (
              <span className={styles.loadRow}>
                <span className={styles.spinner} /> Analyzing with NLP…
              </span>
            ) : (
              'Analyze My Fit Score →'
            )}
          </button>
        </div>

        {loading && (
          <div className={styles.loadingBar}>
            <div className={styles.loadingFill} />
          </div>
        )}
      </div>
    </div>
  )
}
