import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import styles from './Results.module.css'

function ScoreRing({ score, size = 160 }) {
  const r = (size - 20) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 80 ? '#43e97b' : score >= 60 ? '#6c63ff' : '#ff6584'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a1a25" strokeWidth={12} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={12}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
      <text x={size/2} y={size/2+6} textAnchor="middle" fill={color}
        fontSize="32" fontFamily="Syne, sans-serif" fontWeight="800">{score}</text>
      <text x={size/2} y={size/2+24} textAnchor="middle" fill="#5a5a7a"
        fontSize="11" fontFamily="DM Sans, sans-serif">out of 100</text>
    </svg>
  )
}

function Bar({ label, value, color }) {
  return (
    <div className={styles.barRow}>
      <span className={styles.barLabel}>{label}</span>
      <div className={styles.barTrack}>
        <div className={styles.barFill} style={{ width: `${value}%`, background: color }} />
      </div>
      <span className={styles.barVal}>{value}%</span>
    </div>
  )
}

function UsageBar() {
  const user = JSON.parse(localStorage.getItem('fituser') || '{}')
  const plan = user.plan || 'free'
  const limits = { free: 10, plus: 50, pro: 100 }
  const total = limits[plan]
  const left = user.analyses_left ?? total
  const used = total - left
  const pct = Math.min((used / total) * 100, 100)
  const color = pct > 80 ? 'var(--accent2)' : 'var(--accent3)'
  return (
    <div className={styles.usageBox}>
      <div className={styles.usageTop}>
        <span className={styles.usagePlan}>{plan.toUpperCase()} PLAN</span>
        <span className={styles.usageCount} style={{color}}>{used}/{total} analyses used</span>
      </div>
      <div className={styles.usageTrack}>
        <div className={styles.usageFill} style={{width:`${pct}%`, background: color}} />
      </div>
      {pct > 70 && (
        <Link to="/pricing" className={styles.upgradeNudge}>
          ⚡ Running low — Upgrade your plan →
        </Link>
      )}
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const [r, setR] = useState(null)
  const [user] = useState(() => JSON.parse(localStorage.getItem('fituser') || '{}'))

  useEffect(() => {
    const data = sessionStorage.getItem('fitresult')
    if (!data) navigate('/upload')
    else {
      setR(JSON.parse(data))
    }
  }, [])

  if (!r) return null

  // Debug: log full analysis payload for runtime inspection
  console.log('ANALYSIS RESPONSE (Results):', r)

  const label = r.score >= 80 ? 'Strong Match' : r.score >= 60 ? 'Good Match' : 'Needs Work'
  const labelColor = r.score >= 80 ? 'var(--accent3)' : r.score >= 60 ? 'var(--accent)' : 'var(--accent2)'
  const isPaid = true

 
  const rankedJobs = r.ranked_jobs || r.jobs || []

  const radarData = Array.isArray(r.radarData) && r.radarData.length > 0
    ? r.radarData
    : [
        { subject: 'Skills', A: r.skillsScore ?? r.skills_match ?? 0 },
        { subject: 'Experience', A: r.experienceScore ?? r.experience_match ?? 0 },
        { subject: 'Education', A: r.educationScore ?? r.education_match ?? 0 },
        { subject: 'Keywords', A: Math.round(r.score * 0.95) },
        { subject: 'ATS', A: Math.round(r.score * 0.88) },
      ]

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <div className={styles.topRow}>
          <div>
            <Link to="/upload" className={styles.back}>← New Analysis</Link>
            <h1 className={styles.title}>Your Fit Score Report</h1>
            <p className={styles.fileLine}>{r.fileName}</p>
          </div>
          <div className={styles.topActions}>
            <Link to="/history" className="btn-ghost">View History</Link>
            
          </div>
        </div>

        

        <div className={styles.scoreRow}>
          <div className={`card ${styles.scoreCard}`}>
            <div className={styles.scoreLabel} style={{ color: labelColor }}>{label}</div>
            <ScoreRing score={r.score} />
            <div className={styles.scoreSub}>Match against job description</div>
            <div className={styles.breakdowns}>
              <Bar label="Skills" value={r.skillsScore ?? r.skills_match ?? 0} color="var(--accent)" />
              <Bar label="Experience" value={r.experienceScore ?? r.experience_match ?? 0} color="var(--accent3)" />
              <Bar label="Education" value={r.educationScore ?? r.education_match ?? 0} color="var(--accent2)" />
            </div>
          </div>
          <div className={`card ${styles.radarCard}`}>
            <h3 className={styles.cardTitle}>Skill Radar</h3>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#2a2a3a" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#9090b0', fontSize: 12 }} />
                <Radar dataKey="A" stroke="#6c63ff" fill="#6c63ff" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.skillsRow}>
          <div className={`card ${styles.skillCard}`}>
            <h3 className={styles.cardTitle}>
              <span style={{color:'var(--accent3)'}}>✓</span> Matched Skills
              <span className={styles.badge} style={{background:'rgba(67,233,123,0.1)',color:'var(--accent3)'}}>
                {(r.matchedSkills || r.matched || []).length}
              </span>
            </h3>
            <div className={styles.tagCloud}>
              {(r.matchedSkills || r.matched || []).map(s => <span key={s} className={styles.matchedTag}>{s}</span>)}
            </div>
          </div>
          <div className={`card ${styles.skillCard}`}>
            <h3 className={styles.cardTitle}>
              <span style={{color:'var(--accent2)'}}>✗</span> Missing Skills
              <span className={styles.badge} style={{background:'rgba(255,101,132,0.1)',color:'var(--accent2)'}}>
                {(r.missingSkills || r.missing || []).length}
              </span>
            </h3>
            <div className={styles.tagCloud}>
              {(r.missingSkills || r.missing || []).map(s => <span key={s} className={styles.missingTag}>{s}</span>)}
            </div>
          </div>
        </div>

        <div className={`card ${styles.suggestCard}`}>
          <h3 className={styles.cardTitle}>💡 Personalized Suggestions</h3>
          <div className={styles.suggestions}>
            {r.suggestions.map((s, i) => (
              <div key={i} className={styles.suggestion}>
                <div className={styles.suggNum}>{String(i+1).padStart(2,'0')}</div>
                <div className={styles.suggText}>{s}</div>
              </div>
            ))}
          </div>
        </div>

                {/* ===== AI EXPLANATION ===== */}
        {r.llm_explanation && (
          <div
            className="card"
            style={{
              marginTop: 24,
              padding: 24,
              border: '1px solid rgba(108,99,255,0.25)',
              background: 'linear-gradient(135deg, rgba(108,99,255,0.08), rgba(67,233,123,0.04))'
            }}
          >
            <h3
              className={styles.cardTitle}
              style={{ marginBottom: 20 }}
            >
              🤖 AI Resume Analysis
            </h3>

            {/* Why Fit */}
            {r.llm_explanation.why_fit?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 10 }}>
                  💡 Why this is a good match
                </h4>

                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                  {r.llm_explanation.why_fit.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Strengths */}
            {r.llm_explanation.strengths?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 10 }}>
                  💪 Your Strengths
                </h4>

                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                  {r.llm_explanation.strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Missing Skills */}
            {r.llm_explanation.missing_skills?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 10 }}>
                  ⚠️ Skills to Work On
                </h4>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8
                  }}
                >
                  {r.llm_explanation.missing_skills.map((skill) => (
                    <span
                      key={skill}
                      className={styles.missingTag}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resume Improvements */}
            {r.llm_explanation.resume_improvements?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <h4 style={{ marginBottom: 10 }}>
                  📝 Resume Improvements
                </h4>

                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
                  {r.llm_explanation.resume_improvements.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Overall Explanation */}
            {r.llm_explanation.overall_explanation && (
              <div
                style={{
                  padding: 16,
                  borderRadius: 10,
                  background: 'rgba(0,0,0,0.15)',
                  lineHeight: 1.7
                }}
              >
                <strong>🔍 Overall Analysis</strong>

                <p style={{ margin: '8px 0 0' }}>
                  {r.llm_explanation.overall_explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ===== JOB RECOMMENDATIONS ===== */}

        {/* ===== JOB RECOMMENDATIONS ===== */}
        {/* ===== INTELLIGENT JOB RECOMMENDATIONS ===== */}
<div className={`card ${styles.jobsCard}`}>
  <div className={styles.jobsHeader}>
    <div>
      <h3 className={styles.cardTitle} style={{ marginBottom: 6 }}>
        🎯 Top Jobs For You
      </h3>

      <p className={styles.jobsSub}>
        Jobs ranked using your resume, skills and semantic similarity
      </p>
    </div>
  </div>

  {rankedJobs.length > 0 ? (
    <div className={styles.jobsList}>

      {rankedJobs.map((job, i) => (
        <div key={job.job_id || i} className={styles.jobRow}>

          {/* Rank */}
          <div style={{
            width: 42,
            height: 42,
            borderRadius: '50%',
            background: 'rgba(108,99,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: 800,
            flexShrink: 0
          }}>
            #{job.rank || i + 1}
          </div>

          {/* Job information */}
          <div className={styles.jobInfo}>

            <div className={styles.jobTitle}>
              {job.title}
            </div>

            <div className={styles.jobMeta}>
            {job.company} · {job.location}
            {job.source && <span style={{ marginLeft: 8, opacity: 0.7 }}>via {job.source}</span>}
            </div>
              

            {/* FitScore */}
            <div style={{
              marginTop: 8,
              fontWeight: 800,
              color: job.score >= 80
                ? 'var(--accent3)'
                : job.score >= 60
                  ? 'var(--accent)'
                  : 'var(--accent2)'
            }}>
              FitScore: {job.score}/100
            </div>

            {/* Score breakdown */}
            {job.score_breakdown && (
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                marginTop: 8,
                fontSize: 11
              }}>
                <span>
                  Skills: {job.score_breakdown.skills_match}%
                </span>

                <span>
                  Semantic: {job.score_breakdown.semantic_similarity}%
                </span>

                <span>
                  TF-IDF: {job.score_breakdown.tfidf_similarity}%
                </span>

                <span>
                  Experience: {job.score_breakdown.experience_match}%
                </span>

                <span>
                  Education: {job.score_breakdown.education_match}%
                </span>
              </div>
            )}

            {/* Matched skills */}
            {job.matched_skills?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong style={{ fontSize: 12 }}>
                  ✓ Matched:
                </strong>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 5
                }}>
                  {job.matched_skills.map(skill => (
                    <span
                      key={skill}
                      className={styles.matchedTag}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing skills */}
            {job.missing_skills?.length > 0 && (
              <div style={{ marginTop: 10 }}>
                <strong style={{ fontSize: 12 }}>
                  ✗ Missing:
                </strong>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  marginTop: 5
                }}>
                  {job.missing_skills.map(skill => (
                    <span
                      key={skill}
                      className={styles.missingTag}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Why this job */}
            {job.why_this_score && (
              <div style={{
                marginTop: 10,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(108,99,255,0.06)',
                fontSize: 12,
                lineHeight: 1.5
              }}>
                <strong>💡 Why this ranking?</strong>
                <div style={{ marginTop: 4 }}>
                  {job.why_this_score}
                </div>
              </div>
            )}

          </div>

          {/* Apply button */}
          {(job.applyUrl || job.url) && (
  <a
    href={job.applyUrl || job.url}
    target="_blank"
    rel="noopener noreferrer"
    style={{
      padding: '8px 16px',
      borderRadius: '6px',
      background: 'var(--accent)',
      color: '#fff',
      fontSize: '13px',
      fontWeight: 700,
      textDecoration: 'none',
      textAlign: 'center',
      flexShrink: 0,
      whiteSpace: 'nowrap'
    }}
  >
    Apply →
  </a>
)}

        </div>
      ))}

    </div>
  ) : (
    <div style={{
      padding: '24px',
      textAlign: 'center',
      color: 'var(--text3)',
      fontSize: '14px'
    }}>
      No ranked jobs available right now.
    </div>
  )}
</div>
        <div className={styles.bottomCta}>
          <Link to="/upload" className="btn-primary" style={{padding:'14px 32px'}}>Try Another Job →</Link>
          <Link to="/history" className="btn-ghost" style={{padding:'14px 28px'}}>View All Analyses</Link>
          <Link to="/pricing" className="btn-ghost" style={{padding:'14px 28px'}}>⚡ Upgrade Plan</Link>
        </div>
      </div>
    </div>
  )
}
