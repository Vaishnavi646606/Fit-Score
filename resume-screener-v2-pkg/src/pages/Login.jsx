import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './Login.module.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.logo}>
        <span className={styles.dot} /> FitScore
      </Link>

      <div className={styles.box}>
        <div className={styles.tabs}>
          <button
            className={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => setMode('login')}
          >Sign In</button>
          <button
            className={mode === 'register' ? styles.tabActive : styles.tab}
            onClick={() => setMode('register')}
          >Create Account</button>
        </div>

        <h2 className={styles.title}>
          {mode === 'login' ? 'Welcome back' : 'Get started free'}
        </h2>
        <p className={styles.sub}>
          {mode === 'login'
            ? 'Sign in to access your resume history and reports.'
            : 'Create an account to save your analyses and track progress.'}
        </p>

        <div className={styles.form}>
          {mode === 'register' && (
            <div className={styles.field}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          )}
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input
              className={styles.input}
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <input
              className={styles.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div style={{
              background: 'rgba(255,101,132,0.1)',
              border: '1px solid rgba(255,101,132,0.3)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              color: '#ff6584',
              marginBottom: '4px',
            }}>
              {error}
            </div>
          )}
          <button
            className={`btn-primary ${styles.submitBtn}`}
            disabled={loading}
            onClick={async () => {
              setError('')
              if (!email) { setError('Please enter your email'); return }
              if (!password) { setError('Please enter your password'); return }
              if (mode === 'register' && !name) { setError('Please enter your name'); return }
              if (password.length < 6) { setError('Password must be at least 6 characters'); return }

              setLoading(true)
              try {
                const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
                const body = mode === 'login' ? { email, password } : { email, password, name }
                const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(body),
                })
                const data = await res.json()
                if (!res.ok) {
                  setError(data.message || 'Something went wrong')
                  return
                }
                localStorage.setItem('fittoken', data.token)
                const fituser = { email: data.user.email, name: data.user.name, plan: 'free', analyses_left: 10 }
                localStorage.setItem('fituser', JSON.stringify(fituser))
                window.location.href = '/upload'
              } catch (err) {
                setError('Server error. Please try again.')
              } finally {
                setLoading(false)
              }
            }}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In →' : 'Create Account →'}
          </button>
        </div>

        <div className={styles.divider}><span>or continue with</span></div>

        <div className={styles.oauthRow}>
          <button
            className={styles.oauthBtn}
            onClick={() => {
              window.location.href = `${BACKEND_URL}/auth/google`
            }}
          >
            Continue with Google
          </button>

          <button
            className={styles.oauthBtn}
            onClick={() => {
              window.location.href = `${BACKEND_URL}/auth/github`
            }}
          >
            Continue with GitHub
          </button>
        </div>
      </div>
    </div>
  )
}
