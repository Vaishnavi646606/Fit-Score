import { useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./Login.module.css";

export default function AuthError() {
  const params = new URLSearchParams(window.location.search);
  const message = params.get("message") || "Authentication failed. Please try again.";

  return (
    <div className={styles.page}>
      <Link to="/" className={styles.logo}>
        <span className={styles.dot} /> FitScore
      </Link>

      <div className={styles.box}>
        <h2 className={styles.title}>Authentication Failed</h2>
        <p className={styles.sub}>
          {decodeURIComponent(message)}
        </p>

        <div style={{
          background: 'rgba(255,101,132,0.1)',
          border: '1px solid rgba(255,101,132,0.3)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '20px',
          fontSize: '14px',
          color: '#ff6584',
        }}>
          <p><strong>What went wrong:</strong></p>
          <ul style={{ marginTop: '8px', marginBottom: '0' }}>
            <li>Make sure you're using a supported account (Google or GitHub)</li>
            <li>Try clearing your browser cache and cookies</li>
            <li>If the problem persists, try signing up with email instead</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <Link
            to="/login"
            className="btn-primary"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px',
              textDecoration: 'none',
            }}
          >
            Try Again
          </Link>
          <Link
            to="/"
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '12px',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              textDecoration: 'none',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
