import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../App.jsx'
import { useProfiles } from '../hooks/useProfiles.js'
import styles from './HomeScreen.module.css'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { setActiveProfile } = useProfile()
  const { profiles } = useProfiles()

  function enterAs(profileId) {
    setActiveProfile(profileId)
    const profile = profiles[profileId]
    if (!profile.onboardingComplete) {
      navigate(`/onboarding/${profileId}`)
    } else {
      navigate('/scan')
    }
  }

  function resetAll() {
    localStorage.removeItem('coqtale_profiles')
    window.location.reload()
  }

  return (
    <div className={styles.home}>
      <header className={styles.header}>
        <div className={styles.glassIcon}>
          <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M10 8 L50 8 L34 42 L34 62 L40 62 L40 68 L20 68 L20 62 L26 62 L26 42 Z" fill="#c9a96e" opacity="0.9"/>
            <line x1="18" y1="68" x2="42" y2="68" stroke="#c9a96e" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className={styles.title}>Coqtale</h1>
        <p className={styles.tagline}>Know what to order before you ask</p>
      </header>

      <div className={styles.profiles}>
        <button className={styles.profileBtn} onClick={() => enterAs('me')}>
          <span className={styles.profileName}>
            {profiles.me.onboardingComplete ? profiles.me.name : 'Me'}
          </span>
          {!profiles.me.onboardingComplete && (
            <span className={styles.profileHint}>Set up your taste profile →</span>
          )}
        </button>

        <button className={styles.profileBtn} onClick={() => enterAs('partner')}>
          <span className={styles.profileName}>
            {profiles.partner.onboardingComplete ? profiles.partner.name : 'Partner'}
          </span>
          {!profiles.partner.onboardingComplete && (
            <span className={styles.profileHint}>Set up your taste profile →</span>
          )}
        </button>
      </div>

      {/* DEV ONLY — remove before sharing with partner */}
      <button onClick={resetAll} style={{
        position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--burgundy-light)',
        background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.05em'
      }}>
        reset all profiles
      </button>
    </div>
  )
}
