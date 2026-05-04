import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  const loc = useLocation()
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('fituser') || '{}')
  const plan = user.plan || 'free'
  const planColor = plan === 'pro' ? 'var(--accent3)' : plan === 'plus' ? 'var(--accent)' : 'var(--text3)'

  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        <span className={styles.dot} />
        FitScore
      </Link>
      <div className={styles.links}>
        <Link to="/upload" className={loc.pathname === '/upload' ? styles.active : ''}>Analyze</Link>
        <Link to="/history" className={loc.pathname === '/history' ? styles.active : ''}>History</Link>
        <Link to="/pricing" className={loc.pathname === '/pricing' ? styles.active : ''}>
          Pricing
          {plan !== 'free' && (
            <span className={styles.planBadge} style={{color: planColor, borderColor: planColor}}>
              {plan.toUpperCase()}
            </span>
          )}
        </Link>
        {token ? (
          <button
            className="btn-ghost"
            style={{padding:'8px 18px',fontSize:'13px'}}
            onClick={() => {
              localStorage.removeItem('token')
              localStorage.removeItem('fituser')
              window.location.href = '/'
            }}
          >
            Logout
          </button>
        ) : (
          <Link to="/login" className="btn-ghost" style={{padding:'8px 18px',fontSize:'13px'}}>Sign In</Link>
        )}
      </div>
    </nav>
  )
}
