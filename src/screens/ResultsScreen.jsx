import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfile } from '../App.jsx'
import { useProfiles } from '../hooks/useProfiles.js'
import styles from './ResultsScreen.module.css'

const MOODS = [
  { id: 'surprise', label: 'Surprise Me' },
  { id: 'rich', label: 'Rich & Spirit-Forward' },
  { id: 'light', label: 'Light & Refreshing' },
]

const SPIRIT_FORWARD_SIGNALS = [
  'spirit-forward', 'spirit forward', 'stirred', 'whiskey', 'bourbon', 'rye',
  'mezcal', 'scotch', 'cognac', 'aged rum', 'rich', 'amaro', 'bitter',
  'herbal', 'smoky', 'boozy', 'strong', 'neat', 'robust',
]

const LIGHT_SIGNALS = [
  'refreshing', 'citrus', 'light', 'effervescent', 'sparkling', 'spritz',
  'soda', 'low abv', 'bright', 'bubbly', 'tart', 'crisp', 'floral',
  'fruity', 'delicate', 'easy', 'sessionable',
]

export default function ResultsScreen() {
  const { visitId } = useParams()
  const navigate = useNavigate()
  const { activeProfile } = useProfile()
  const { profiles } = useProfiles()

  const [visit, setVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState(null) // 'me' | 'partner' | 'us'
  const [mood, setMood] = useState('surprise') // 'surprise' | 'rich' | 'light'
  const [expandedId, setExpandedId] = useState(null)
  const [ingredientPopup, setIngredientPopup] = useState(null) // { name, flavorDesc }

  useEffect(() => {
    async function loadVisit() {
      // Try Turso first
      try {
        const res = await fetch(`/api/visit/${visitId}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setVisit(data)
          setView(data.createdBy || 'me')
          setLoading(false)
          return
        }
      } catch (err) {
        console.warn('Turso fetch failed, falling back to sessionStorage', err)
      }

      // Fall back to sessionStorage
      const cached = sessionStorage.getItem(`visit_${visitId}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        setVisit(parsed)
        setView(parsed.profileId || 'me')
      }

      setLoading(false)
    }

    loadVisit()
  }, [visitId])

  if (loading) {
    return (
      <div className={styles.empty}>
        <p>Loading results…</p>
      </div>
    )
  }

  if (!visit) {
    return (
      <div className={styles.empty}>
        <p>No results found.</p>
        <button onClick={() => navigate('/scan')}>← Back to scan</button>
      </div>
    )
  }

  const meProfile = profiles.me
  const partnerProfile = profiles.partner

  const viewLabels = {
    me: meProfile?.name || 'Me',
    partner: partnerProfile?.name || 'Partner',
    us: 'Us',
  }

  function getScore(cocktail) {
    if (view === 'me') return cocktail.score1
    if (view === 'partner') return cocktail.score2
    return cocktail.scoreUs
  }

  function getExplanation(cocktail) {
    if (view === 'me') return cocktail.explanation1
    if (view === 'partner') return cocktail.explanation2
    return cocktail.explanation1 // us view shows primary profile explanation
  }

  // How strongly does this cocktail match the selected mood?
  // Returns a number — higher means stronger match.
  // Only used as a tiebreaker within the same score tier.
  function moodBoost(cocktail) {
    if (mood === 'surprise') return 0
    const text = [
      cocktail.flavorSummary || '',
      ...(cocktail.ingredients || []).map(i => i.flavorDesc || ''),
    ].join(' ').toLowerCase()
    const signals = mood === 'rich' ? SPIRIT_FORWARD_SIGNALS : LIGHT_SIGNALS
    return signals.filter(s => text.includes(s)).length
  }

  // Sort: score tier first (high → medium → low),
  // then within each tier boost by mood signal count
  const scoreOrder = { high: 0, medium: 1, low: 2 }
  const sorted = [...(visit.cocktails || [])].sort((a, b) => {
    const scoreDiff = (scoreOrder[getScore(a)] ?? 1) - (scoreOrder[getScore(b)] ?? 1)
    if (scoreDiff !== 0) return scoreDiff
    return moodBoost(b) - moodBoost(a)
  })

  return (
    <div className={styles.screen}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/scan')}>←</button>
          <div className={styles.barName}>{visit.barName}</div>
          <div style={{ width: 32 }} />
        </div>

        {/* Mood toggle */}
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

        {/* You / Partner / Us toggle */}
        <div className={styles.viewToggle}>
          {['me', 'partner', 'us'].map(v => (
            <button
              key={v}
              className={`${styles.viewBtn} ${view === v ? styles.viewBtnOn : ''}`}
              onClick={() => setView(v)}
            >
              {viewLabels[v]}
            </button>
          ))}
        </div>
      </div>

      {/* Cocktail cards */}
      <div className={`${styles.cards} scroll-area`}>
        {sorted.map((cocktail, i) => {
          const score = getScore(cocktail)
          const explanation = getExplanation(cocktail)
          const isExpanded = expandedId === i
          const flagged = cocktail.flaggedIngredients?.length > 0

          return (
            <div
              key={i}
              className={`${styles.card} ${styles[`card_${score}`]}`}
              onClick={() => setExpandedId(isExpanded ? null : i)}
            >
              {/* Card header */}
              <div className={styles.cardHeader}>
                <div className={styles.cardLeft}>
                  <div className={styles.cocktailName}>{cocktail.name}</div>
                  <div className={styles.flavorSummary}>{cocktail.flavorSummary}</div>
                </div>
                <div className={styles.cardRight}>
                  <span className={`${styles.scorePill} ${styles[`score_${score}`]}`}>
                    {score?.toUpperCase()}
                  </span>
                  {flagged && <span className={styles.flagIcon}>⚑</span>}
                </div>
              </div>

              {/* Explanation — always visible */}
              <div className={styles.explanation}>{explanation}</div>

              {/* Flagged ingredients alert */}
              {flagged && (
                <div className={styles.flaggedAlert}>
                  ⚑ Contains: {cocktail.flaggedIngredients.join(', ')}
                </div>
              )}

              {/* Expanded: ingredient list */}
              {isExpanded && cocktail.ingredients?.length > 0 && (
                <div className={styles.ingredients}>
                  <div className={styles.ingredientsLabel}>Ingredients</div>
                  <div className={styles.ingredientList}>
                    {cocktail.ingredients.map((ing, j) => (
                      <button
                        key={j}
                        className={styles.ingredientChip}
                        onClick={e => {
                          e.stopPropagation()
                          setIngredientPopup(ing)
                        }}
                      >
                        {ing.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Expand/collapse hint */}
              <div className={styles.expandHint}>
                {isExpanded ? '↑ less' : '↓ ingredients'}
              </div>
            </div>
          )
        })}

        <div style={{ height: '2rem' }} />
      </div>

      {/* Ingredient popup */}
      {ingredientPopup && (
        <div className={styles.popupOverlay} onClick={() => setIngredientPopup(null)}>
          <div className={styles.popup} onClick={e => e.stopPropagation()}>
            <div className={styles.popupName}>{ingredientPopup.name}</div>
            <div className={styles.popupDesc}>{ingredientPopup.flavorDesc}</div>
            <button className={styles.popupClose} onClick={() => setIngredientPopup(null)}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
