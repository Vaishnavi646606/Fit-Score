import { Link, useLocation } from 'react-router-dom'
import styles from './Navbar.module.css'
import { clearAuth, getToken } from '../auth'

export default function Navbar() {
  const loc = useLocation()
  const token = getToken()
  //const user = JSON.parse(localStorage.getItem('fituser') || '{}')
 
  return (
    <nav className={styles.nav}>
      <Link to="/" className={styles.logo}>
        <span className={styles.dot} />
        FitScore
      </Link>
      <div className={styles.links}>
        <Link to="/upload" className={loc.pathname === '/upload' ? styles.active : ''}>Analyze</Link>
        <Link to="/history" className={loc.pathname === '/history' ? styles.active : ''}>History</Link>
        
        {token ? (
          <button
            className="btn-ghost"
            style={{padding:'8px 18px',fontSize:'13px'}}
            onClick={() => {
              clearAuth()
              //localStorage.removeItem('fithistory')
              sessionStorage.removeItem('fitresult')
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
