import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import styles from './Landing.module.css'

const features = [
  { icon: '📄', title: 'PDF Resume Parser', desc: 'Upload any PDF resume — our NLP engine extracts skills, education, and experience automatically using spaCy NER.' },
  { icon: '🎯', title: 'TF-IDF Matching', desc: 'Cosine similarity algorithm converts your resume and JD into vectors and measures exact alignment in milliseconds.' },
  { icon: '📊', title: 'Fit Score Dashboard', desc: 'See your match percentage, skill gaps, and personalized suggestions like "Add Docker" or "Mention AWS".' },
  { icon: '📁', title: 'History & Tracking', desc: 'Compare your resume across multiple job descriptions. Track improvements over time with full history.' },
]

const steps = [
  { n: '01', label: 'Upload PDF', sub: 'Drop your resume' },
  { n: '02', label: 'Paste JD', sub: 'Any job description' },
  { n: '03', label: 'AI Analyzes', sub: 'NLP + TF-IDF' },
  { n: '04', label: 'Get Score', sub: 'Improve & apply' },
]

export default function Landing() {
  return (
    <div className={styles.page}>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.heroGlow} />
        <div className={styles.badge}>
          <span className={styles.badgeDot} /> AI-Powered · NLP + TF-IDF · Full-Stack
        </div>
        <h1 className={styles.heroTitle}>
          Know exactly how well<br />
          <span className={styles.gradient}>your resume fits</span><br />
          before you apply.
        </h1>
        <p className={styles.heroSub}>
          Upload your resume, paste any job description — get a fit score out of 100,<br />
          skill gap analysis, and personalized suggestions in seconds.
        </p>
        <div className={styles.heroCta}>
          <Link to="/upload" className="btn-primary" style={{fontSize:'15px',padding:'14px 36px'}}>
            Analyze My Resume →
          </Link>
          <a href="#how" className="btn-ghost" style={{fontSize:'15px',padding:'14px 32px'}}>
            See How It Works
          </a>
        </div>

        <div className={styles.scorePill}>
          <div className={styles.scoreRing}>
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#1a1a25" strokeWidth="8"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#6c63ff" strokeWidth="8"
                strokeDasharray="213.6" strokeDashoffset="53.4"
                strokeLinecap="round" transform="rotate(-90 40 40)"/>
            </svg>
            <span>87</span>
          </div>
          <div>
            <div className={styles.pillTitle}>Match Score</div>
            <div className={styles.pillSub}>Senior Frontend Engineer @ Stripe</div>
          </div>
        </div>
      </section>

      <section className={styles.steps} id="how">
        <div className={styles.sectionLabel}>HOW IT WORKS</div>
        <h2 className={styles.sectionTitle}>Four steps to clarity</h2>
        <div className={styles.stepsRow}>
          {steps.map((s, i) => (
            <div key={i} className={styles.step}>
              <div className={styles.stepNum}>{s.n}</div>
              <div className={styles.stepLabel}>{s.label}</div>
              <div className={styles.stepSub}>{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.sectionLabel}>CORE FEATURES</div>
        <h2 className={styles.sectionTitle}>Built to impress — recruiters and<br />hiring managers alike</h2>
        <div className={styles.featGrid}>
          {features.map((f, i) => (
            <div key={i} className={`card ${styles.featCard}`}>
              <div className={styles.featIcon}>{f.icon}</div>
              <h3 className={styles.featTitle}>{f.title}</h3>
              <p className={styles.featDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.stack}>
        <div className={styles.sectionLabel}>TECH STACK</div>
        <div className={styles.stackRow}>
          {['Python + spaCy','HuggingFace','Node.js + Express','React + Vite','MongoDB','REST API','TF-IDF','Oracle Cloud'].map(t => (
            <span key={t} className={styles.stackTag}>{t}</span>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.ctaGlow} />
        <h2>Ready to stop guessing?</h2>
        <p>Apply smarter. Know your fit score before you submit.</p>
        <Link to="/upload" className="btn-primary" style={{fontSize:'15px',padding:'14px 36px',marginTop:'8px'}}>
          Start For Free →
        </Link>
      </section>

      <footer className={styles.footer}>
        <span className={styles.footerLogo}>
          <span style={{color:'var(--accent)'}}>●</span> FitScore
        </span>
        <span style={{color:'var(--text3)',fontSize:'13px'}}>Built by a developer who got tired of guessing.</span>
      </footer>
    </div>
  )
}
