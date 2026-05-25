import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfiles } from '../hooks/useProfiles.js'
import styles from './ProfileScreen.module.css'

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

function timeAgo(ts) {
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(diff / 86400000)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function ProfileScreen() {
  const { profileId } = useParams()
  const { getProfile } = useProfiles()
  const navigate = useNavigate()
  const profile = getProfile(profileId)

  const [visits, setVisits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showRetune, setShowRetune] = useState(false)

  useEffect(() => {
    async function loadVisits() {
      try {
        const res = await fetch('/api/visits', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setVisits(data.visits || [])
        }
      } catch (err) {
        console.warn('Could not load visit history', err)
      } finally {
        setLoading(false)
      }
    }
    loadVisits()
  }, [])

  const returnTo = `/profile/${profileId}`
  const now = Date.now()

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.name}>{profile?.name || profileId}</div>
        <div className={styles.subtitle}>Taste profile</div>
      </div>

      {/* Fingerprint */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Flavor fingerprint</div>
        {profile?.fingerprint ? (
          <p className={styles.fingerprint}>{profile.fingerprint}</p>
        ) : (
          <p className={styles.empty}>No profile data yet.</p>
        )}
      </div>

      {/* Retune */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Preferences</div>
        <button className={styles.retuneBtn} onClick={() => setShowRetune(true)}>
          Retune profile
        </button>
      </div>

      {/* Visit History */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Visit history</div>

        {loading && (
          <p className={styles.empty}>Loading…</p>
        )}

        {!loading && visits.length === 0 && (
          <p className={styles.empty}>No visits yet. Scan a menu to get started.</p>
        )}

        {!loading && visits.length > 0 && (
          <div className={styles.visitList}>
            {visits.map(visit => {
              const isRecent = now - visit.scannedAt < THREE_HOURS_MS
              return (
                <button
                  key={visit.visitId}
                  className={`${styles.visitCard} ${isRecent ? styles.visitCardActive : ''}`}
                  onClick={() => navigate(`/results/${visit.visitId}`)}
                >
                  <div className={styles.visitTop}>
                    <div className={styles.visitBar}>{visit.barName}</div>
                    {isRecent && <span className={styles.activeBadge}>active</span>}
                  </div>
                  <div className={styles.visitMeta}>
                    <span>{formatDate(visit.scannedAt)}</span>
                    <span>·</span>
                    <span>{timeAgo(visit.scannedAt)}</span>
                    <span>·</span>
                    <span>by {visit.createdBy === 'me' ? (getProfile('me')?.name || 'Me') : (getProfile('partner')?.name || 'Partner')}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Retune action sheet */}
      {showRetune && (
        <div className={styles.sheetOverlay} onClick={() => setShowRetune(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <div className={styles.sheetTitle}>Retune profile</div>
            <button
              className={styles.sheetOption}
              onClick={() => navigate(`/onboarding/${profileId}?returnTo=${encodeURIComponent(returnTo)}`)}
            >
              <div className={styles.sheetOptionLabel}>Start fresh</div>
              <div className={styles.sheetOptionDesc}>Re-run the full wizard from scratch</div>
            </button>
            <button
              className={styles.sheetOption}
              onClick={() => navigate(`/onboarding/${profileId}?returnTo=${encodeURIComponent(returnTo)}&prefill=true`)}
            >
              <div className={styles.sheetOptionLabel}>Adjust preferences</div>
              <div className={styles.sheetOptionDesc}>Edit your existing answers</div>
            </button>
            <button className={styles.sheetCancel} onClick={() => setShowRetune(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}