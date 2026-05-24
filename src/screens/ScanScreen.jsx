import React, { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProfile } from '../App.jsx'
import { useProfiles } from '../hooks/useProfiles.js'
import styles from './ScanScreen.module.css'

const MOODS = [
  { id: 'boozy', label: 'Boozy & Spirit-Forward' },
  { id: 'light', label: 'Light & Refreshing' },
  { id: 'surprise', label: 'Surprise Me' },
]

const STATUS_MESSAGES = [
  'Reading the menu…',
  'Translating flavors…',
  'Almost there…',
]

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ScanScreen() {
  const navigate = useNavigate()
  const { activeProfile } = useProfile()
  const { getProfile } = useProfiles()

  const [mood, setMood] = useState('boozy')
  const [photos, setPhotos] = useState([])  // { file, previewUrl, base64 }
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [statusMsg, setStatusMsg] = useState(0)
  const [error, setError] = useState(null)
  const [canCancel, setCanCancel] = useState(false)

  const fileInputRef = useRef(null)
  const cancelRef = useRef(false)
  const statusIntervalRef = useRef(null)

  async function handleFileChange(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    const newPhotos = await Promise.all(files.map(async file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      base64: await fileToBase64(file),
      mediaType: file.type || 'image/jpeg',
    })))

    setPhotos(prev => [...prev, ...newPhotos])
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  function removePhoto(index) {
    setPhotos(prev => {
      const next = [...prev]
      URL.revokeObjectURL(next[index].previewUrl)
      next.splice(index, 1)
      return next
    })
  }

  function startStatusCycle() {
    setStatusMsg(0)
    let i = 0
    statusIntervalRef.current = setInterval(() => {
      i = Math.min(i + 1, STATUS_MESSAGES.length - 1)
      setStatusMsg(i)
    }, 5000)
    // Enable cancel after 15 seconds
    setTimeout(() => setCanCancel(true), 15000)
  }

  function stopStatusCycle() {
    if (statusIntervalRef.current) clearInterval(statusIntervalRef.current)
    setCanCancel(false)
    cancelRef.current = false
  }

  function cancel() {
    cancelRef.current = true
    stopStatusCycle()
    setStatus('idle')
    setError(null)
  }

  async function translate() {
    if (!photos.length) return

    const profile = getProfile(activeProfile)
    if (!profile) return

    cancelRef.current = false
    setStatus('loading')
    setError(null)
    startStatusCycle()

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photos: photos.map(p => ({ base64: p.base64, mediaType: p.mediaType })),
          mood,
          profileId: activeProfile,
          fingerprint: profile.fingerprint,
          partnerFingerprint: getProfile(activeProfile === 'me' ? 'partner' : 'me')?.fingerprint || null,
        }),
      })

      if (cancelRef.current) return

      stopStatusCycle()

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.error || `Server error ${response.status}`)
      }

      const data = await response.json()

      if (cancelRef.current) return

      // Store visit data in sessionStorage for results screen
      sessionStorage.setItem(`visit_${data.visitId}`, JSON.stringify(data))

      navigate(`/results/${data.visitId}`)
    } catch (err) {
      if (cancelRef.current) return
      stopStatusCycle()
      setStatus('error')
      setError(err.message || 'Something went wrong.')
    }
  }

  const hasPhotos = photos.length > 0

  return (
    <div className={styles.screen}>

      {/* Mood selector */}
      <div className={styles.moodRow}>
        {MOODS.map(m => (
          <button
            key={m.id}
            className={`${styles.moodBtn} ${mood === m.id ? styles.moodBtnOn : ''}`}
            onClick={() => setMood(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className={styles.main}>

        {status === 'loading' ? (
          /* Loading state */
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p className={styles.loadingMsg}>{STATUS_MESSAGES[statusMsg]}</p>
            {canCancel && (
              <button className={styles.cancelBtn} onClick={cancel}>Cancel</button>
            )}
          </div>
        ) : (
          <>
            {/* Photo previews */}
            {hasPhotos && (
              <div className={styles.previews}>
                {photos.map((p, i) => (
                  <div key={i} className={styles.previewWrap}>
                    <img src={p.previewUrl} className={styles.preview} alt={`Menu page ${i + 1}`} />
                    <button className={styles.removeBtn} onClick={() => removePhoto(i)}>✕</button>
                    <span className={styles.pageLabel}>p.{i + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div className={styles.errorCard}>
                <p className={styles.errorText}>{error}</p>
                <p className={styles.errorHint}>Try better lighting or get closer to the menu.</p>
              </div>
            )}

            {/* Empty state */}
            {!hasPhotos && status !== 'error' && (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>
                  <CameraIcon />
                </div>
                <p className={styles.emptyText}>Take a photo of a cocktail menu</p>
                <p className={styles.emptyHint}>Add more photos for multi-page menus</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom actions */}
      {status !== 'loading' && (
        <div className={styles.actions}>
          {/* Hidden file input — capture=environment opens rear camera on iOS */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            className={styles.scanBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            <CameraIcon size={20} />
            {hasPhotos ? 'Add Another Page' : 'Scan Menu'}
          </button>

          {hasPhotos && (
            <button className={styles.translateBtn} onClick={translate}>
              Translate Menu →
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function CameraIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}
