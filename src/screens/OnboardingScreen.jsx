import React, { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useProfiles } from '../hooks/useProfiles.js'
import styles from './OnboardingScreen.module.css'

// ─── Suggest list: most commonly encountered ingredients on craft bar menus ──
// Used for autocomplete in manual-add fields. Not exhaustive — just the
// ingredients a guest is most likely to encounter at a serious cocktail bar.

const SUGGEST_INGREDIENTS = [
  // Base spirits
  'Bourbon', 'Rye', 'Scotch', 'Irish Whiskey', 'Gin', 'Mezcal', 'Tequila',
  'Rum', 'Aged Rum', 'Cognac', 'Calvados', 'Apple Brandy', 'Vodka', 'Aquavit',
  // Vermouths & fortified
  'Sweet Vermouth', 'Dry Vermouth', 'Blanc Vermouth',
  'Amontillado Sherry', 'Oloroso Sherry', 'Fino Sherry',
  'Cocchi Americano', 'Lillet Blanc',
  // Amaros & bitters-forward
  'Amaro', 'Campari', 'Aperol', 'Cynar', 'Fernet', 'Fernet-Branca',
  'Averna', 'Montenegro Amaro', 'Amaro Nonino', 'Sfumato',
  // Liqueurs
  'Chartreuse', 'Green Chartreuse', 'Yellow Chartreuse',
  'Maraschino', 'Bénédictine', 'Cointreau', 'Dry Curaçao',
  'Elderflower Liqueur', 'St-Germain', 'Suze', 'Absinthe',
  'Ancho Reyes', 'Falernum', 'Allspice Dram',
  'Sloe Gin', 'Apricot Liqueur', 'Peach Liqueur',
  // Texture / format
  'Egg White', 'Cream', 'Coconut Cream', 'Coconut',
  // Flavor descriptors (plain language avoids)
  'Overwhelmingly Sweet', 'Overwhelmingly Sour', 'Anise', 'Licorice',
]

// ─── Data ─────────────────────────────────────────────────────────────────────

const CLASSICS = [
  { id: 'negroni',        label: 'Negroni',        desc: 'Bitter, herbal, spirit-forward' },
  { id: 'old_fashioned',  label: 'Old Fashioned',  desc: 'Boozy, sweet, spirit-forward' },
  { id: 'manhattan',      label: 'Manhattan',      desc: 'Rich, warming, stirred' },
  { id: 'daiquiri',       label: 'Daiquiri',       desc: 'Tart, clean, citrus-forward' },
  { id: 'margarita',      label: 'Margarita',      desc: 'Bright, citrusy, balanced' },
  { id: 'martini',        label: 'Martini',        desc: 'Dry, clean, spirit-forward' },
  { id: 'whiskey_sour',   label: 'Whiskey Sour',   desc: 'Tart, balanced, approachable' },
  { id: 'penicillin',     label: 'Penicillin',     desc: 'Smoky, ginger, citrus' },
  { id: 'paper_plane',    label: 'Paper Plane',    desc: 'Equal parts, bitter, bright' },
  { id: 'last_word',      label: 'Last Word',      desc: 'Herbal, tart, equal parts' },
  { id: 'boulevardier',   label: 'Boulevardier',   desc: 'Bitter, rich, whiskey Negroni' },
  { id: 'sidecar',        label: 'Sidecar',        desc: 'Citrusy, cognac, elegant' },
  { id: 'moscow_mule',    label: 'Moscow Mule',    desc: 'Ginger, citrus, refreshing' },
  { id: 'sazerac',        label: 'Sazerac',        desc: 'Rye, anise, spirit-forward' },
  { id: 'toronto',        label: 'Toronto',        desc: 'Rye, Fernet, bitter edge' },
  { id: 'vieux_carre',    label: 'Vieux Carré',    desc: 'Cognac, rye, complex' },
  { id: 'bamboo',         label: 'Bamboo',         desc: 'Sherry, vermouth, low ABV' },
  { id: 'spritz',         label: 'Spritz / Aperol',desc: 'Light, bubbly, aperitivo' },
]

const FLAGGED = [
  { id: 'amaro',            label: 'Amaro' },
  { id: 'chartreuse',       label: 'Chartreuse' },
  { id: 'mezcal',           label: 'Mezcal' },
  { id: 'vermouth',         label: 'Vermouth' },
  { id: 'sherry',           label: 'Sherry' },
  { id: 'campari',          label: 'Campari' },
  { id: 'fernet',           label: 'Fernet' },
  { id: 'absinthe',         label: 'Absinthe' },
  { id: 'aquavit',          label: 'Aquavit' },
  { id: 'cynar',            label: 'Cynar' },
  { id: 'aperol',           label: 'Aperol' },
  { id: 'benedictine',      label: 'Bénédictine' },
  { id: 'maraschino',       label: 'Maraschino' },
  { id: 'sfumato',          label: 'Sfumato' },
  { id: 'sloe_gin',         label: 'Sloe Gin' },
  { id: 'suze',             label: 'Suze' },
  { id: 'cocchi_americano', label: 'Cocchi Americano' },
  { id: 'elderflower',      label: 'Elderflower' },
  { id: 'falernum',         label: 'Falernum' },
]

const AVOIDS = [
  { id: 'cream',                label: 'Cream' },
  { id: 'egg_white',            label: 'Egg White' },
  { id: 'coconut',              label: 'Coconut' },
  { id: 'anise',                label: 'Anise / Licorice' },
  { id: 'banana',               label: 'Banana' },
  { id: 'coffee',               label: 'Coffee / Espresso' },
  { id: 'blue_curacao',         label: 'Blue Curaçao' },
  { id: 'grenadine',            label: 'Grenadine' },
  { id: 'overwhelmingly_sweet', label: 'Overwhelmingly Sweet' },
  { id: 'overwhelmingly_sour',  label: 'Overwhelmingly Sour' },
]

const STEPS = ['name', 'classics', 'flagged', 'avoids', 'done']

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEntry(val, existingIds) {
  const trimmed = val.trim()
  if (trimmed.length < 2) return 'Too short — at least 2 characters.'
  if (trimmed.length > 40) return 'Too long — keep it under 40 characters.'
  if (/[^a-zA-Z0-9\s\-'éàüöäñçèêëîïôùûüÿæœ\/]/.test(trimmed)) return 'Letters, hyphens, and apostrophes only.'
  const id = 'custom_' + trimmed.toLowerCase().replace(/\s+/g, '_')
  if (existingIds.has(id)) return 'Already in the list.'
  return null
}

// ─── AutoSuggest input ────────────────────────────────────────────────────────

function AutoSuggestInput({ value, onChange, onAdd, placeholder, existingIds, error, onError }) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = useMemo(() => {
    if (!value.trim() || value.length < 2) return []
    const lower = value.toLowerCase()
    return SUGGEST_INGREDIENTS
      .filter(s => s.toLowerCase().includes(lower))
      .slice(0, 5)
  }, [value])

  function attempt(val) {
    const err = validateEntry(val, existingIds)
    if (err) { onError(err); return }
    onError(null)
    onAdd(val.trim())
  }

  function pick(s) {
    onChange(s)
    setShowSuggestions(false)
    const err = validateEntry(s, existingIds)
    if (err) { onError(err); return }
    onError(null)
    onAdd(s.trim())
  }

  return (
    <div className={styles.suggestWrap}>
      <div className={styles.addChipRow}>
        <input
          className={`${styles.addInput} ${error ? styles.addInputError : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); onError(null) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { attempt(value); setShowSuggestions(false) }
            if (e.key === 'Escape') setShowSuggestions(false)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        <button className={styles.addBtn} onClick={() => attempt(value)}>+</button>
      </div>
      {error && <div className={styles.addError}>{error}</div>}
      {showSuggestions && filtered.length > 0 && (
        <div className={styles.suggestions}>
          {filtered.map(s => (
            <button key={s} className={styles.suggestionItem} onMouseDown={() => pick(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { profileId } = useParams()
  const { updateProfile, getProfile } = useProfiles()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const scrollRef = useRef(null)

  const returnTo = searchParams.get('returnTo') || null
  const prefill = searchParams.get('prefill') === 'true'
  const existingPrefs = prefill ? getProfile(profileId)?.preferences : null

  const [step, setStep] = useState(prefill ? 1 : 0)
  const [name, setName] = useState(existingPrefs?.name || '')
  const [classics, setClassics] = useState(new Set(existingPrefs?.classics || []))
  const [flagged, setFlagged] = useState(new Set(existingPrefs?.flagged || []))
  const [hardAvoids, setHardAvoids] = useState(new Set(existingPrefs?.hardAvoids || []))

  const [extraFlagged, setExtraFlagged] = useState(existingPrefs?.extraFlagged || [])
  const [extraAvoids, setExtraAvoids] = useState(existingPrefs?.extraAvoids || [])

  const [flaggedInput, setFlaggedInput] = useState('')
  const [flaggedError, setFlaggedError] = useState(null)
  const [avoidsInput, setAvoidsInput] = useState('')
  const [avoidsError, setAvoidsError] = useState(null)

  const currentStep = STEPS[step]
  const totalSteps = STEPS.length - 1
  const progress = Math.min(step / (totalSteps - 1), 1)

  function scrollTop() {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0 }, 50)
  }
  function goNext() { if (step < STEPS.length - 1) { setStep(s => s + 1); scrollTop() } }
  function goBack() { if (step > (prefill ? 1 : 0)) { setStep(s => s - 1); scrollTop() } }

  function toggleSet(setter, id) {
    setter(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function addCustomFlagged(val) {
    const trimmed = val.trim()
    const id = 'custom_' + trimmed.toLowerCase().replace(/\s+/g, '_')
    setExtraFlagged(prev => [...prev, { id, label: trimmed }])
    setFlagged(prev => { const n = new Set(prev); n.add(id); return n })
    setFlaggedInput('')
  }

  function addCustomAvoid(val) {
    const trimmed = val.trim()
    const id = 'custom_' + trimmed.toLowerCase().replace(/\s+/g, '_')
    setExtraAvoids(prev => [...prev, { id, label: trimmed }])
    setHardAvoids(prev => { const n = new Set(prev); n.add(id); return n })
    setAvoidsInput('')
  }

  const allFlaggedIds = useMemo(() => {
    return new Set([...FLAGGED.map(f => f.id), ...extraFlagged.map(f => f.id)])
  }, [extraFlagged])

  const allAvoidIds = useMemo(() => {
    return new Set([...AVOIDS.map(a => a.id), ...extraAvoids.map(a => a.id)])
  }, [extraAvoids])

  function finish() {
    const displayName = name.trim() || (profileId === 'me' ? 'Me' : 'Partner')
    const preferences = {
      name: displayName,
      classics: [...classics],
      flagged: [...flagged],
      hardAvoids: [...hardAvoids],
      extraFlagged,
      extraAvoids,
    }

    const classicList = CLASSICS.filter(c => classics.has(c.id)).map(c => c.label).join(', ')
    const flaggedList = [...flagged].map(id => {
      const found = [...FLAGGED, ...extraFlagged].find(f => f.id === id)
      return found?.label || id
    }).join(', ')
    const avoidList = [...hardAvoids].map(id => {
      const found = [...AVOIDS, ...extraAvoids].find(a => a.id === id)
      return found?.label || id
    }).join(', ')

    const fingerprint = [
      classicList && `Loves these classics: ${classicList}`,
      flaggedList && `Flag these ingredients: ${flaggedList}`,
      avoidList && `Hard avoids: ${avoidList}`,
      `Based on onboarding. Confidence: low — no ratings yet.`,
    ].filter(Boolean).join('. ')

    updateProfile(profileId, {
      name: displayName,
      onboardingComplete: true,
      preferences,
      fingerprint,
    })

    navigate(returnTo || '/scan')
  }

  return (
    <div className={styles.screen}>
      {currentStep !== 'done' && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <div className={styles.scrollArea} ref={scrollRef}>

        {/* ── Name ── */}
        {currentStep === 'name' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 1 of 4</p>
              <h2 className={styles.stepTitle}>What's your name?</h2>
              <p className={styles.stepSub}>This is how you'll appear in the app.</p>
            </div>
            <div className={styles.nameInputWrap}>
              <input
                className={styles.nameInput}
                type="text"
                placeholder="Your name"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                maxLength={30}
              />
              <div className={styles.nameUnderline} />
            </div>
          </div>
        )}

        {/* ── Classics ── */}
        {currentStep === 'classics' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>{prefill ? 'Step 1 of 3' : 'Step 2 of 4'}</p>
              <h2 className={styles.stepTitle}>Cocktails you love</h2>
              <p className={styles.stepSub}>Tap any you'd order without thinking twice.</p>
            </div>
            <div className={styles.classicGrid}>
              {CLASSICS.map(c => (
                <button
                  key={c.id}
                  className={`${styles.classicCard} ${classics.has(c.id) ? styles.classicCardOn : ''}`}
                  onClick={() => toggleSet(setClassics, c.id)}
                >
                  <div className={styles.classicName}>{c.label}</div>
                  <div className={styles.classicDesc}>{c.desc}</div>
                  {classics.has(c.id) && <div className={styles.classicCheck}>✓</div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Flagged ── */}
        {currentStep === 'flagged' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>{prefill ? 'Step 2 of 3' : 'Step 3 of 4'}</p>
              <h2 className={styles.stepTitle}>Flag these</h2>
              <p className={styles.stepSub}>These get highlighted on any menu — not a hard filter, just a heads up.</p>
            </div>
            <AutoSuggestInput
              value={flaggedInput}
              onChange={setFlaggedInput}
              onAdd={addCustomFlagged}
              placeholder="Add ingredient…"
              existingIds={allFlaggedIds}
              error={flaggedError}
              onError={setFlaggedError}
            />
            <div className={styles.chipGrid}>
              {[...FLAGGED, ...extraFlagged].map(f => (
                <button
                  key={f.id}
                  className={`${styles.chip} ${flagged.has(f.id) ? styles.chipOn : ''}`}
                  onClick={() => toggleSet(setFlagged, f.id)}
                >
                  <span className={`${styles.chipDot} ${flagged.has(f.id) ? styles.chipDotOn : ''}`}>⚑</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Avoids ── */}
        {currentStep === 'avoids' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>{prefill ? 'Step 3 of 3' : 'Step 4 of 4'}</p>
              <h2 className={styles.stepTitle}>Hard avoids</h2>
              <p className={styles.stepSub}>These tank a score immediately, no matter what else is in the drink.</p>
            </div>
            <AutoSuggestInput
              value={avoidsInput}
              onChange={setAvoidsInput}
              onAdd={addCustomAvoid}
              placeholder="Add avoid…"
              existingIds={allAvoidIds}
              error={avoidsError}
              onError={setAvoidsError}
            />
            <div className={styles.chipGrid}>
              {[...AVOIDS, ...extraAvoids].map(a => (
                <button
                  key={a.id}
                  className={`${styles.chip} ${hardAvoids.has(a.id) ? styles.chipAvoid : ''}`}
                  onClick={() => toggleSet(setHardAvoids, a.id)}
                >
                  <span className={`${styles.chipDot} ${hardAvoids.has(a.id) ? styles.chipDotAvoid : ''}`}>✕</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {currentStep === 'done' && (
          <div className={styles.doneWrap}>
            <div className={styles.doneGlass}>
              <svg viewBox="0 0 60 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 8 L50 8 L34 42 L34 62 L40 62 L40 68 L20 68 L20 62 L26 62 L26 42 Z" fill="#c9a96e" opacity="0.9"/>
                <line x1="18" y1="68" x2="42" y2="68" stroke="#c9a96e" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className={styles.doneTitle}>
              {name.trim() ? `You're set, ${name.trim()}.` : "You're set."}
            </h2>
            <p className={styles.doneSub}>Your taste profile is ready. It gets sharper every time you rate a drink.</p>
            <button className={styles.doneBtn} onClick={finish}>Start scanning menus →</button>
          </div>
        )}

      </div>

      {currentStep !== 'done' && (
        <div className={styles.bottomNav}>
          {step > (prefill ? 1 : 0)
            ? <button className={styles.backBtn} onClick={goBack}>← Back</button>
            : <div />
          }
          <button
            className={styles.nextBtn}
            onClick={currentStep === 'avoids' ? () => setStep(STEPS.indexOf('done')) : goNext}
            disabled={currentStep === 'name' && !name.trim()}
          >
            {currentStep === 'avoids' ? 'Finish' : 'Continue →'}
          </button>
        </div>
      )}
    </div>
  )
}
