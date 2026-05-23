import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfiles } from '../hooks/useProfiles.js'

export default function OnboardingScreen() {
  const { profileId } = useParams()
  const { updateProfile } = useProfiles()
  const navigate = useNavigate()

  // Placeholder — full wizard built next
  function skip() {
    updateProfile(profileId, { onboardingComplete: true })
    navigate('/scan')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100dvh', gap: '1rem', padding: '2rem' }}>
      <h2 style={{ color: 'var(--gold)', fontWeight: 300 }}>Build your taste profile</h2>
      <p style={{ color: 'var(--smoke)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'center' }}>
        Onboarding wizard — coming next
      </p>
      <button onClick={skip} style={{ marginTop: '2rem', color: 'var(--gold-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textDecoration: 'underline' }}>
        Skip for now →
      </button>
    </div>
  )
}
