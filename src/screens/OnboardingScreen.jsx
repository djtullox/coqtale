import React, { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useProfiles } from '../hooks/useProfiles.js'
import styles from './OnboardingScreen.module.css'

// ─── Data ────────────────────────────────────────────────────────────────────

const SPIRITS = [
  { id: 'bourbon', label: 'Bourbon' },
  { id: 'rye', label: 'Rye' },
  { id: 'scotch', label: 'Scotch' },
  { id: 'gin', label: 'Gin' },
  { id: 'mezcal', label: 'Mezcal' },
  { id: 'tequila', label: 'Tequila' },
  { id: 'rum', label: 'Rum' },
  { id: 'cognac', label: 'Cognac' },
  { id: 'vodka', label: 'Vodka' },
  { id: 'amaro', label: 'Amaro' },
  { id: 'sherry', label: 'Sherry' },
  { id: 'aquavit', label: 'Aquavit' },
  { id: 'apple_brandy', label: 'Apple Brandy' },
  { id: 'irish_whiskey', label: 'Irish Whiskey' },
]

const FLAVORS = [
  { id: 'bitter', label: 'Bitter', desc: 'Campari, amaro, Cynar' },
  { id: 'smoky', label: 'Smoky', desc: 'Mezcal, Laphroaig, char' },
  { id: 'herbal', label: 'Herbal', desc: 'Chartreuse, vermouth, gin' },
  { id: 'citrus', label: 'Citrus', desc: 'Lemon, lime, orange peel' },
  { id: 'sweet', label: 'Sweet', desc: 'Liqueurs, syrups, fruit' },
  { id: 'sour', label: 'Sour', desc: 'Tart, acidic, bright' },
  { id: 'spicy', label: 'Spicy', desc: 'Ginger, chili, pepper' },
  { id: 'floral', label: 'Floral', desc: 'Elderflower, violet, rose' },
  { id: 'nutty', label: 'Nutty', desc: 'Walnut, almond, orgeat' },
  { id: 'fruity', label: 'Fruity', desc: 'Berry, tropical, stone fruit' },
  { id: 'rich', label: 'Rich', desc: 'Full-bodied, dense, warming' },
  { id: 'dry', label: 'Dry', desc: 'Bone dry, austere, clean' },
]

const FLAGGED = [
  { id: 'amaro', label: 'Amaro' },
  { id: 'mezcal', label: 'Mezcal' },
  { id: 'vermouth', label: 'Vermouth' },
  { id: 'sherry', label: 'Sherry' },
  { id: 'chartreuse', label: 'Chartreuse' },
  { id: 'campari', label: 'Campari' },
  { id: 'fernet', label: 'Fernet' },
  { id: 'absinthe', label: 'Absinthe' },
  { id: 'aquavit', label: 'Aquavit' },
  { id: 'cynar', label: 'Cynar' },
  { id: 'benedictine', label: 'Bénédictine' },
  { id: 'maraschino', label: 'Maraschino' },
]

const CLASSICS = [
  { id: 'negroni', label: 'Negroni', desc: 'Bitter, herbal, spirit-forward' },
  { id: 'old_fashioned', label: 'Old Fashioned', desc: 'Boozy, sweet, spirit-forward' },
  { id: 'manhattan', label: 'Manhattan', desc: 'Rich, warming, stirred' },
  { id: 'daiquiri', label: 'Daiquiri', desc: 'Tart, clean, citrus-forward' },
  { id: 'margarita', label: 'Margarita', desc: 'Bright, citrusy, balanced' },
  { id: 'martini', label: 'Martini', desc: 'Dry, clean, spirit-forward' },
  { id: 'whiskey_sour', label: 'Whiskey Sour', desc: 'Tart, balanced, approachable' },
  { id: 'penicillin', label: 'Penicillin', desc: 'Smoky, ginger, citrus' },
  { id: 'paper_plane', label: 'Paper Plane', desc: 'Equal parts, bitter, bright' },
  { id: 'last_word', label: 'Last Word', desc: 'Herbal, tart, equal parts' },
  { id: 'boulevardier', label: 'Boulevardier', desc: 'Bitter, rich, whiskey Negroni' },
  { id: 'sidecar', label: 'Sidecar', desc: 'Citrusy, cognac, elegant' },
  { id: 'spritz', label: 'Spritz / Aperol', desc: 'Light, bubbly, aperitivo' },
  { id: 'moscow_mule', label: 'Moscow Mule', desc: 'Ginger, citrus, refreshing' },
]

const AVOIDS = [
  { id: 'cream', label: 'Cream' },
  { id: 'egg_white', label: 'Egg White' },
  { id: 'coconut', label: 'Coconut' },
  { id: 'anise', label: 'Anise / Licorice' },
  { id: 'falernum', label: 'Falernum' },
  { id: 'blue_curacao', label: 'Blue Curaçao' },
  { id: 'grenadine', label: 'Grenadine' },
  { id: 'triple_sec', label: 'Triple Sec (cheap)' },
  { id: 'very_sweet', label: 'Very Sweet' },
  { id: 'very_sour', label: 'Very Sour' },
]

const STEPS = [
  'name',
  'spirits',
  'flavors',
  'flagged',
  'classics',
  'avoids',
  'done',
]

// ─── Component ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const { profileId } = useParams()
  const { updateProfile } = useProfiles()
  const navigate = useNavigate()
  const scrollRef = useRef(null)

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')

  // spirits: { id: 'love' | 'avoid' }
  const [spirits, setSpirits] = useState({})
  // flavors: Set of loved flavor ids
  const [lovedFlavors, setLovedFlavors] = useState(new Set())
  const [avoidedFlavors, setAvoidedFlavors] = useState(new Set())
  // flagged: Set of ingredient ids to highlight
  const [flagged, setFlagged] = useState(new Set())
  // classics: Set of loved cocktail ids
  const [classics, setClassics] = useState(new Set())
  // avoids: Set of hard avoid ids
  const [hardAvoids, setHardAvoids] = useState(new Set())

  // Custom add fields
  const [customSpirit, setCustomSpirit] = useState('')
  const [customFlagged, setCustomFlagged] = useState('')
  const [customAvoid, setCustomAvoid] = useState('')
  const [extraSpirits, setExtraSpirits] = useState([])
  const [extraFlagged, setExtraFlagged] = useState([])
  const [extraAvoids, setExtraAvoids] = useState([])

  const currentStep = STEPS[step]
  const totalSteps = STEPS.length - 1 // exclude 'done'
  const progress = Math.min(step / (totalSteps - 1), 1)

  function scrollTop() {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = 0
    }, 50)
  }

  function goNext() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
      scrollTop()
    }
  }

  function goBack() {
    if (step > 0) {
      setStep(s => s - 1)
      scrollTop()
    }
  }

  function toggleSpirit(id, state) {
    setSpirits(prev => {
      const next = { ...prev }
      if (next[id] === state) {
        delete next[id]
      } else {
        next[id] = state
      }
      return next
    })
  }

  function toggleSet(setter, id) {
    setter(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleFlavor(id, type) {
    if (type === 'love') {
      setLovedFlavors(prev => {
        const next = new Set(prev)
        if (next.has(id)) { next.delete(id); return next }
        next.add(id)
        setAvoidedFlavors(p => { const n = new Set(p); n.delete(id); return n })
        return next
      })
    } else {
      setAvoidedFlavors(prev => {
        const next = new Set(prev)
        if (next.has(id)) { next.delete(id); return next }
        next.add(id)
        setLovedFlavors(p => { const n = new Set(p); n.delete(id); return n })
        return next
      })
    }
  }

  function addCustomSpirit() {
    const val = customSpirit.trim()
    if (!val) return
    const id = 'custom_' + val.toLowerCase().replace(/\s+/g, '_')
    setExtraSpirits(prev => [...prev, { id, label: val }])
    setCustomSpirit('')
  }

  function addCustomFlagged() {
    const val = customFlagged.trim()
    if (!val) return
    const id = 'custom_' + val.toLowerCase().replace(/\s+/g, '_')
    setExtraFlagged(prev => [...prev, { id, label: val }])
    setCustomFlagged('')
  }

  function addCustomAvoid() {
    const val = customAvoid.trim()
    if (!val) return
    const id = 'custom_' + val.toLowerCase().replace(/\s+/g, '_')
    setExtraAvoids(prev => [...prev, { id, label: val }])
    setCustomAvoid('')
  }

  function finish() {
    const preferences = {
      name: name.trim() || (profileId === 'me' ? 'Me' : 'Partner'),
      spirits,
      lovedFlavors: [...lovedFlavors],
      avoidedFlavors: [...avoidedFlavors],
      flagged: [...flagged],
      classics: [...classics],
      hardAvoids: [...hardAvoids],
    }

    // Build flavor fingerprint string
    const loved = [...lovedFlavors].join(', ')
    const avoided = [...avoidedFlavors].join(', ')
    const lovedSpirits = Object.entries(spirits).filter(([,v]) => v === 'love').map(([k]) => k).join(', ')
    const avoidedSpirits = Object.entries(spirits).filter(([,v]) => v === 'avoid').map(([k]) => k).join(', ')
    const flaggedList = [...flagged].join(', ')

    const fingerprint = [
      loved && `Loves: ${loved}`,
      avoided && `Avoids: ${avoided}`,
      lovedSpirits && `Preferred spirits: ${lovedSpirits}`,
      avoidedSpirits && `Avoided spirits: ${avoidedSpirits}`,
      flaggedList && `Flag these ingredients: ${flaggedList}`,
      `Based on onboarding. Confidence: low — no ratings yet.`,
    ].filter(Boolean).join('. ')

    updateProfile(profileId, {
      name: preferences.name,
      onboardingComplete: true,
      preferences,
      fingerprint,
    })

    navigate('/scan')
  }

  // ─── Render steps ──────────────────────────────────────────────────────────

  return (
    <div className={styles.screen}>
      {/* Progress bar */}
      {currentStep !== 'done' && (
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progress * 100}%` }} />
        </div>
      )}

      <div className={styles.scrollArea} ref={scrollRef}>

        {/* ── STEP: Name ── */}
        {currentStep === 'name' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 1 of 6</p>
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

        {/* ── STEP: Spirits ── */}
        {currentStep === 'spirits' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 2 of 6</p>
              <h2 className={styles.stepTitle}>Your spirits</h2>
              <p className={styles.stepSub}>Tap once to love it. Tap twice to avoid it. Tap again to clear.</p>
            </div>
            <div className={styles.chipGrid}>
              {[...SPIRITS, ...extraSpirits].map(s => {
                const state = spirits[s.id]
                return (
                  <button
                    key={s.id}
                    className={`${styles.chip} ${state === 'love' ? styles.chipLove : ''} ${state === 'avoid' ? styles.chipAvoid : ''}`}
                    onClick={() => {
                      if (!state) toggleSpirit(s.id, 'love')
                      else if (state === 'love') toggleSpirit(s.id, 'avoid')
                      else toggleSpirit(s.id, null)
                    }}
                  >
                    {state === 'love' && <span className={styles.chipIcon}>✓</span>}
                    {state === 'avoid' && <span className={styles.chipIcon}>✕</span>}
                    {s.label}
                  </button>
                )
              })}
              <div className={styles.addChipRow}>
                <input
                  className={styles.addInput}
                  placeholder="Add spirit…"
                  value={customSpirit}
                  onChange={e => setCustomSpirit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSpirit()}
                />
                <button className={styles.addBtn} onClick={addCustomSpirit}>+</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Flavors ── */}
        {currentStep === 'flavors' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 3 of 6</p>
              <h2 className={styles.stepTitle}>Flavor profile</h2>
              <p className={styles.stepSub}>
                <span className={styles.legendLove}>Green = love it.</span>
                {'  '}
                <span className={styles.legendAvoid}>Red = avoid it.</span>
              </p>
            </div>
            <div className={styles.flavorGrid}>
              {FLAVORS.map(f => {
                const loved = lovedFlavors.has(f.id)
                const avoided = avoidedFlavors.has(f.id)
                return (
                  <div key={f.id} className={styles.flavorCard}>
                    <div className={styles.flavorLabel}>{f.label}</div>
                    <div className={styles.flavorDesc}>{f.desc}</div>
                    <div className={styles.flavorBtns}>
                      <button
                        className={`${styles.flavorBtn} ${loved ? styles.flavorBtnLove : ''}`}
                        onClick={() => toggleFlavor(f.id, 'love')}
                      >Love</button>
                      <button
                        className={`${styles.flavorBtn} ${avoided ? styles.flavorBtnAvoid : ''}`}
                        onClick={() => toggleFlavor(f.id, 'avoid')}
                      >Avoid</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP: Flagged ingredients ── */}
        {currentStep === 'flagged' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 4 of 6</p>
              <h2 className={styles.stepTitle}>Flag these</h2>
              <p className={styles.stepSub}>These ingredients get highlighted on any menu — not a hard filter, just a heads up.</p>
            </div>
            <div className={styles.chipGrid}>
              {[...FLAGGED, ...extraFlagged].map(f => (
                <button
                  key={f.id}
                  className={`${styles.chip} ${flagged.has(f.id) ? styles.chipFlag : ''}`}
                  onClick={() => toggleSet(setFlagged, f.id)}
                >
                  {flagged.has(f.id) && <span className={styles.chipIcon}>⚑</span>}
                  {f.label}
                </button>
              ))}
              <div className={styles.addChipRow}>
                <input
                  className={styles.addInput}
                  placeholder="Add ingredient…"
                  value={customFlagged}
                  onChange={e => setCustomFlagged(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomFlagged()}
                />
                <button className={styles.addBtn} onClick={addCustomFlagged}>+</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Classics ── */}
        {currentStep === 'classics' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 5 of 6</p>
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

        {/* ── STEP: Hard avoids ── */}
        {currentStep === 'avoids' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 6 of 6</p>
              <h2 className={styles.stepTitle}>Hard avoids</h2>
              <p className={styles.stepSub}>These tank a score immediately, regardless of anything else.</p>
            </div>
            <div className={styles.chipGrid}>
              {[...AVOIDS, ...extraAvoids].map(a => (
                <button
                  key={a.id}
                  className={`${styles.chip} ${hardAvoids.has(a.id) ? styles.chipAvoid : ''}`}
                  onClick={() => toggleSet(setHardAvoids, a.id)}
                >
                  {hardAvoids.has(a.id) && <span className={styles.chipIcon}>✕</span>}
                  {a.label}
                </button>
              ))}
              <div className={styles.addChipRow}>
                <input
                  className={styles.addInput}
                  placeholder="Add avoid…"
                  value={customAvoid}
                  onChange={e => setCustomAvoid(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomAvoid()}
                />
                <button className={styles.addBtn} onClick={addCustomAvoid}>+</button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP: Done ── */}
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
            <p className={styles.doneSub}>
              Your taste profile is ready. It'll get sharper every time you rate a drink.
            </p>
            <button className={styles.doneBtn} onClick={finish}>
              Start scanning menus →
            </button>
          </div>
        )}

      </div>

      {/* Bottom nav */}
      {currentStep !== 'done' && (
        <div className={styles.bottomNav}>
          {step > 0 ? (
            <button className={styles.backBtn} onClick={goBack}>← Back</button>
          ) : (
            <div />
          )}
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
