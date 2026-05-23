import React from 'react'
import { useParams } from 'react-router-dom'
import { useProfiles } from '../hooks/useProfiles.js'

export default function ProfileScreen() {
  const { profileId } = useParams()
  const { getProfile } = useProfiles()
  const profile = getProfile(profileId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', padding: '2rem' }}>
      <h2 style={{ color: 'var(--gold)', fontWeight: 300 }}>{profile?.name || profileId}</h2>
      <p style={{ color: 'var(--smoke)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'center' }}>
        Profile screen — coming next
      </p>
    </div>
  )
}
