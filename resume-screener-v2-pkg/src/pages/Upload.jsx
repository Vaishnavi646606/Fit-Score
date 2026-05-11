import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDropzone } from 'react-dropzone'
import Navbar from '../components/Navbar'
import styles from './Upload.module.css'

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [jd, setJd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [usageKey, setUsageKey] = useState(0)

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

  const fituser = JSON.parse(localStorage.getItem('fituser') || '{}')
  const planLimits = { free: 10, plus: 50, pro: 100 }
  const userPlan = fituser.plan || 'free'
  const analysesLeft = fituser.analyses_left ?? planLimits[userPlan]
  if (analysesLeft <= 0) {
    setError('You have used all your analyses. Please upgrade your plan.')
    return
  }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('resume', file)
      formData.append('jd', jd)

      const API_URL = import.meta.env.VITE_API_URL || 'https://fit-score-1.onrender.com'
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      })

      let data = {}
      try {
        data = await res.json()
      } catch {
        data = {}
      }

      console.log(data)

      if (!res.ok) {
        throw new Error(data?.message || data?.error || 'Failed to analyze resume')
      }

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
        jobs: Array.isArray(data.jobs) ? data.jobs : [],
        matched: Array.isArray(data?.matchedSkills)
          ? data.matchedSkills
          : Array.isArray(data?.matched_skills)
            ? data.matched_skills
            : Array.isArray(data?.matched)
              ? data.matched
              : Array.isArray(data?.skills)
                ? data.skills
                : [],
        missing: Array.isArray(data.missing) ? data.missing : [],
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        experience_match: typeof data.experience_match === 'number' ? data.experience_match : 0,
        skills_match: typeof data.skills_match === 'number' ? data.skills_match : 0,
        education_match: typeof data.education_match === 'number' ? data.education_match : 0,
        timestamp: new Date().toISOString(),
      }

      setResult(normalizedResult)
      sessionStorage.setItem('fitresult', JSON.stringify(normalizedResult))
      navigate('/results')

      // Deduct one analysis from user's quota
      const updatedUser = JSON.parse(localStorage.getItem('fituser') || '{}')
      const planLimits = { free: 10, plus: 50, pro: 100 }
      const currentPlan = updatedUser.plan || 'free'
      const currentLeft = updatedUser.analyses_left ?? planLimits[currentPlan]
      updatedUser.analyses_left = Math.max(0, currentLeft - 1)
      localStorage.setItem('fituser', JSON.stringify(updatedUser))
      setUsageKey(k => k + 1)

      const history = JSON.parse(localStorage.getItem('fithistory') || '[]')
      history.unshift(normalizedResult)
      localStorage.setItem('fithistory', JSON.stringify(history.slice(0, 20)))
    } catch (err) {
      setError(err?.message || 'Something went wrong while analyzing your resume.')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const score = result?.score ?? null
  const matchedSkills = result?.matched || []

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.step}>STEP 1 OF 2</div>
          <h1 className={styles.title}>Upload & Analyze</h1>
          <p className={styles.sub}>Drop your resume PDF and paste the job description below.</p>
        </div>

        {(() => {
  const _ = usageKey
  const fituser = JSON.parse(localStorage.getItem('fituser') || '{}')
  const planLimits = { free: 10, plus: 50, pro: 100 }
  const userPlan = fituser.plan || 'free'
  const analysesLeft = fituser.analyses_left ?? planLimits[userPlan]
  const total = planLimits[userPlan]
  const used = total - analysesLeft
  const pct = Math.min((used / total) * 100, 100)
  const color = pct > 80 ? '#ff6584' : '#43e97b'
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      padding: '14px 20px',
      marginBottom: '24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1px', color: 'var(--text3)' }}>
            {userPlan.toUpperCase()} PLAN
          </span>
          <span style={{ fontSize: '12px', fontWeight: 600, color }}>
            {used} / {total} analyses used
          </span>
        </div>
        <div style={{ height: '4px', borderRadius: '4px', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '4px', transition: 'width 0.3s' }} />
        </div>
      </div>
    </div>
  )
})()}
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
