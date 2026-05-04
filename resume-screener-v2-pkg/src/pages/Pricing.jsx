import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import styles from './Pricing.module.css'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    analyses: 10,
    color: '#9090b0',
    glow: 'rgba(144,144,176,0.1)',
    border: 'rgba(144,144,176,0.2)',
    features: [
  '10 resume analyses total',
  'Fit score out of 100',
  'Matched & missing skills',
  'Basic suggestions',
  'Analysis history (7 days)',
  '🎯 Job recommendations engine',],
nope: ['Priority support', 'Export PDF reports'],
    cta: 'Get Started Free',
    popular: false,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 500,
    analyses: 50,
    color: '#6c63ff',
    glow: 'rgba(108,99,255,0.15)',
    border: 'rgba(108,99,255,0.35)',
    features: [
      '50 resume analyses / month',
      'Fit score out of 100',
      'Matched & missing skills',
      'Personalized suggestions',
      'Analysis history (30 days)',
      '🎯 Job recommendations engine',
      'Export PDF reports',
    ],
    nope: ['Priority support'],
    cta: 'Upgrade to Plus',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 1000,
    analyses: 100,
    color: '#43e97b',
    glow: 'rgba(67,233,123,0.12)',
    border: 'rgba(67,233,123,0.3)',
    features: [
      '100 resume analyses / month',
      'Fit score out of 100',
      'Matched & missing skills',
      'Personalized suggestions',
      'Unlimited history',
      '🎯 Job recommendations engine',
      'Export PDF reports',
      '⚡ Priority support',
      'Early access to new features',
    ],
    nope: [],
    cta: 'Upgrade to Pro',
    popular: false,
  },
]

export default function Pricing() {
  const [current] = useState(() => {
  const u = JSON.parse(localStorage.getItem('fituser') || '{}')
  return u.plan || 'free'
})
const fituser = JSON.parse(localStorage.getItem('fituser') || '{}')
const analysesLeft = fituser.analyses_left ?? 10
const currentPlanObj = plans.find(p => p.id === current)
const analysesTotal = currentPlanObj?.analyses ?? 10
const analysesUsed = analysesTotal - analysesLeft
  const [success, setSuccess] = useState(null)

  const handleUpgrade = (planId) => {
    if (planId === 'free') return
    // Simulate payment — replace with Razorpay integration
    const user = JSON.parse(localStorage.getItem('fituser') || '{}')
    const plan = plans.find(p => p.id === planId)
    const updated = {
      ...user,
      plan: planId,
      analyses_left: plan.analyses,
      plan_expiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      plan_activated: new Date().toISOString(),
    }
    localStorage.setItem('fituser', JSON.stringify(updated))
    setSuccess(planId)
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleRenew = (planId) => {
    handleUpgrade(planId)
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.sectionLabel}>PRICING</div>
          <h1 className={styles.title}>Simple, transparent pricing</h1>
          <p className={styles.sub}>
            Start free. Upgrade when you need more power.<br />
            All plans renew monthly. Cancel anytime.
          </p>
        </div>

        {success && (
          <div className={styles.successBanner}>
            ✅ Plan activated! You now have {plans.find(p=>p.id===success)?.analyses} analyses this month.
          </div>
        )}

        <div className={styles.grid}>
          {plans.map(plan => (
            <div
              key={plan.id}
              className={`${styles.card} ${plan.popular ? styles.popular : ''}`}
              style={{
                '--plan-color': plan.color,
                '--plan-glow': plan.glow,
                '--plan-border': plan.border,
                borderColor: plan.popular ? plan.color : undefined,
                boxShadow: plan.popular ? `0 0 40px ${plan.glow}` : undefined,
              }}
            >
              {plan.popular && <div className={styles.popularBadge}>MOST POPULAR</div>}

              <div className={styles.planName} style={{ color: plan.color }}>{plan.name}</div>

              <div className={styles.priceRow}>
                {plan.price === 0 ? (
                  <span className={styles.price}>Free</span>
                ) : (
                  <>
                    <span className={styles.rupee}>₹</span>
                    <span className={styles.price}>{plan.price}</span>
                    <span className={styles.per}>/month</span>
                  </>
                )}
              </div>

              <div className={styles.analysesCount} style={{ color: plan.color }}>
  {plan.analyses} resume analyses
  {plan.price > 0 ? ' / month' : ' total'}
</div>
<div style={{
  fontSize: '12px',
  color: 'var(--text3)',
  marginBottom: '12px',
  background: 'rgba(255,255,255,0.04)',
  borderRadius: '8px',
  padding: '8px 12px',
}}>
  {current === plan.id ? (
    <>
      <span style={{ color: plan.color, fontWeight: 700 }}>{analysesUsed}</span>
      {' used out of '}
      <span style={{ fontWeight: 600 }}>{plan.analyses}</span>
      {' analyses'}
      <div style={{
        marginTop: '6px',
        height: '4px',
        borderRadius: '4px',
        background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${Math.min((analysesUsed / plan.analyses) * 100, 100)}%`,
          background: plan.color,
          borderRadius: '4px',
          transition: 'width 0.3s',
        }} />
      </div>
    </>
  ) : (
    <>
      <span style={{ color: plan.color, fontWeight: 700 }}>0</span>
      {' used out of '}
      <span style={{ fontWeight: 600 }}>{plan.analyses}</span>
      {' analyses'}
      <div style={{
        marginTop: '6px',
        height: '4px',
        borderRadius: '4px',
        background: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: '0%',
          background: plan.color,
          borderRadius: '4px',
        }} />
      </div>
    </>
  )}
</div>

              <div className={styles.divider} style={{ background: plan.border }} />

              <div className={styles.features}>
                {plan.features.map(f => (
                  <div key={f} className={styles.feature}>
                    <span className={styles.check} style={{ color: plan.color }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
                {plan.nope.map(f => (
                  <div key={f} className={styles.feature} style={{ opacity: 0.35 }}>
                    <span className={styles.check}>✗</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <div className={styles.ctaArea}>
                {current === plan.id ? (
                  <div className={styles.currentPlan}>
                    <div className={styles.currentBadge} style={{ color: plan.color }}>
                      ● Current Plan
                    </div>
                    {plan.price > 0 && (
                      <button
                        className={styles.renewBtn}
                        style={{ borderColor: plan.color, color: plan.color }}
                        onClick={() => handleRenew(plan.id)}
                      >
                        Renew for ₹{plan.price}
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    className={styles.ctaBtn}
                    style={{
                      background: plan.popular ? plan.color : 'transparent',
                      borderColor: plan.color,
                      color: plan.popular ? '#fff' : plan.color,
                    }}
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={plan.id === 'free'}
                  >
                    {plan.cta}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className={styles.faq}>
          <h2 className={styles.faqTitle}>Common Questions</h2>
          <div className={styles.faqGrid}>
            {[
              { q: 'When does my plan renew?', a: 'All paid plans renew automatically every 30 days from activation date.' },
              { q: 'Can I cancel anytime?', a: 'Yes, cancel before renewal and you won\'t be charged again. Access continues till end of period.' },
              { q: 'What payment methods?', a: 'We accept UPI, cards, net banking via Razorpay — all major Indian payment methods.' },
              { q: 'What if I run out of analyses?', a: 'You\'ll see a prompt to upgrade. Your history stays safe.' },
            ].map(item => (
              <div key={item.q} className={styles.faqItem}>
                <div className={styles.faqQ}>{item.q}</div>
                <div className={styles.faqA}>{item.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
