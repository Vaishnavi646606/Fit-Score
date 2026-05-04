import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import styles from './History.module.css'

export default function History() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])

  useEffect(() => {
    const h = JSON.parse(localStorage.getItem('fithistory') || '[]')
    setHistory(h)
  }, [])

  const scoreColor = s => s >= 80 ? 'var(--accent3)' : s >= 60 ? 'var(--accent)' : 'var(--accent2)'
  const scoreLabel = s => s >= 80 ? 'Strong' : s >= 60 ? 'Good' : 'Weak'

  const loadResult = (item) => {
    sessionStorage.setItem('fitresult', JSON.stringify(item))
    navigate('/results')
  }

  const clearHistory = () => {
    localStorage.removeItem('fithistory')
    setHistory([])
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Analysis History</h1>
            <p className={styles.sub}>{history.length} resume{history.length !== 1 ? 's' : ''} analyzed</p>
          </div>
          <div className={styles.actions}>
            {history.length > 0 && (
              <button className="btn-ghost" onClick={clearHistory} style={{fontSize:'13px'}}>
                Clear All
              </button>
            )}
            <Link to="/upload" className="btn-primary">New Analysis →</Link>
          </div>
        </div>

        {history.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📂</div>
            <h3>No analyses yet</h3>
            <p>Upload your resume and a job description to get started.</p>
            <Link to="/upload" className="btn-primary" style={{marginTop:'20px'}}>Analyze My Resume →</Link>
          </div>
        ) : (
          <div className={styles.list}>
            {history.map((item, i) => (
              <div key={i} className={styles.row} onClick={() => loadResult(item)}>
                <div className={styles.rowLeft}>
                  <div className={styles.rowScore} style={{color: scoreColor(item.score)}}>
                    <span className={styles.scoreNum}>{item.score}</span>
                    <span className={styles.scoreLabel}>{scoreLabel(item.score)}</span>
                  </div>
                  <div>
                    <div className={styles.rowFile}>{item.fileName}</div>
                    <div className={styles.rowJd}>{item.jdSnippet}</div>
                    <div className={styles.rowDate}>
                      {new Date(item.timestamp).toLocaleDateString('en-IN', {
                        day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className={styles.rowRight}>
                  <div className={styles.skillCount}>
                    <span style={{color:'var(--accent3)'}}>✓ {item.matched.length}</span> matched
                    <span style={{margin:'0 6px', color:'var(--text3)'}}>·</span>
                    <span style={{color:'var(--accent2)'}}>✗ {item.missing.length}</span> missing
                  </div>
                  <span className={styles.viewLink}>View Report →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
