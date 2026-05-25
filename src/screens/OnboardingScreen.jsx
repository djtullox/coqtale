import React, { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useProfiles } from '../hooks/useProfiles.js'
import styles from './OnboardingScreen.module.css'

// ─── Master ingredient list for auto-suggest ─────────────────────────────────
// Used across all custom-add fields. Sourced from cocktail_recipes.md +
// common bar staples. Bitters, syrups, citrus excluded — those aren't
// things people flag or love/avoid at the ingredient level.

const ALL_INGREDIENTS = [
  // Base spirits
  'Bourbon', 'Rye', 'Scotch', 'Blended Scotch', 'Peated Scotch', 'Irish Whiskey',
  'Gin', 'London Dry Gin', 'Old Tom Gin', 'Genever', 'Sloe Gin',
  'Mezcal', 'Tequila', 'Blanco Tequila', 'Reposado Tequila', 'Añejo Tequila',
  'Rum', 'Aged Rum', 'White Rum', 'Cachaça',
  'Cognac', 'Armagnac', 'Calvados', 'Apple Brandy', 'Applejack',
  'Vodka', 'Aquavit', 'Pisco', 'Sotol',
  // Vermouths & fortified
  'Sweet Vermouth', 'Dry Vermouth', 'Blanc Vermouth', 'Bianco Vermouth',
  'Cocchi Americano', 'Lillet Blanc', 'Lillet Rouge',
  'Amontillado Sherry', 'Oloroso Sherry', 'Manzanilla Sherry', 'Fino Sherry',
  'Madeira', 'Port', 'Carpano Antica', 'Punt e Mes',
  // Amaros
  'Amaro', 'Campari', 'Aperol', 'Cynar', 'Fernet-Branca', 'Fernet',
  'Averna', 'Meletti', 'Montenegro Amaro', 'Amaro Nonino', 'Sfumato',
  'Zucca', 'Braulio', 'Gran Classico', 'Forthave Red',
  'Barolo Chinato', 'Amaro Sibilla',
  // Liqueurs
  'Chartreuse', 'Green Chartreuse', 'Yellow Chartreuse',
  'Maraschino', 'Luxardo Maraschino',
  'Bénédictine', 'Cointreau', 'Curaçao', 'Dry Curaçao',
  'Apricot Liqueur', 'Peach Liqueur', 'Cherry Liqueur',
  'Crème de Banane', 'Banana Liqueur',
  'Ancho Reyes', 'Ancho Verde',
  'Suze', 'Gentian Liqueur',
  'Swedish Punsch', 'Bonal', 'Byrrh',
  'China-China', 'Bigallet China-China',
  'Absinthe', 'Herbsaint',
  'Nux Alpina', 'Walnut Liqueur',
  'Sloe Gin', 'Elderflower Liqueur', 'St-Germain',
  'Falernum', 'Allspice Dram',
  'Triple Sec', 'Blue Curaçao',
  'Chambord', 'Crème de Cassis',
  'Frangelico', 'Amaretto',
  'Kahlúa', 'Coffee Liqueur',
  'Baileys', 'Irish Cream',
]

// ─── Data ────────────────────────────────────────────────────────────────────

const SPIRITS = [
  { id: 'bourbon', label: 'Bourbon' },
  { id: 'rye', label: 'Rye' },
  { id: 'scotch', label: 'Scotch' },
  { id: 'irish_whiskey', label: 'Irish Whiskey' },
  { id: 'gin', label: 'Gin' },
  { id: 'sloe_gin', label: 'Sloe Gin' },
  { id: 'mezcal', label: 'Mezcal' },
  { id: 'tequila', label: 'Tequila' },
  { id: 'rum', label: 'Rum' },
  { id: 'cognac', label: 'Cognac' },
  { id: 'calvados', label: 'Calvados' },
  { id: 'apple_brandy', label: 'Apple Brandy' },
  { id: 'vodka', label: 'Vodka' },
  { id: 'aquavit', label: 'Aquavit' },
  { id: 'amaro', label: 'Amaro' },
  { id: 'campari', label: 'Campari' },
  { id: 'cynar', label: 'Cynar' },
  { id: 'fernet', label: 'Fernet' },
  { id: 'sweet_vermouth', label: 'Sweet Vermouth' },
  { id: 'dry_vermouth', label: 'Dry Vermouth' },
  { id: 'sherry', label: 'Sherry' },
  { id: 'cocchi_americano', label: 'Cocchi Americano' },
  { id: 'absinthe', label: 'Absinthe' },
  { id: 'chartreuse', label: 'Chartreuse' },
  { id: 'benedictine', label: 'Bénédictine' },
  { id: 'maraschino', label: 'Maraschino' },
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
  { id: 'sfumato', label: 'Sfumato' },
  { id: 'sloe_gin', label: 'Sloe Gin' },
  { id: 'suze', label: 'Suze' },
  { id: 'cocchi_americano', label: 'Cocchi Americano' },
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
  { id: 'sazerac', label: 'Sazerac', desc: 'Rye, anise, spirit-forward' },
  { id: 'toronto', label: 'Toronto', desc: 'Rye, Fernet, bitter edge' },
  { id: 'vieux_carre', label: 'Vieux Carré', desc: 'Cognac, rye, complex' },
  { id: 'bamboo', label: 'Bamboo', desc: 'Sherry, vermouth, low ABV' },
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
  { id: 'banana', label: 'Banana' },
  { id: 'coffee', label: 'Coffee / Espresso' },
]

const STEPS = ['name', 'spirits', 'flavors', 'flagged', 'classics', 'avoids', 'done']

// ─── AutoSuggest input ────────────────────────────────────────────────────────

function AutoSuggestInput({ value, onChange, onAdd, placeholder, suggestions }) {
  const [showSuggestions, setShowSuggestions] = useState(false)

  const filtered = useMemo(() => {
    if (!value.trim() || value.length < 2) return []
    const lower = value.toLowerCase()
    return suggestions
      .filter(s => s.toLowerCase().includes(lower))
      .slice(0, 5)
  }, [value, suggestions])

  function pick(s) {
    onChange(s)
    setShowSuggestions(false)
    setTimeout(() => onAdd(s), 0)
  }

  return (
    <div className={styles.suggestWrap}>
      <div className={styles.addChipRow}>
        <input
          className={styles.addInput}
          placeholder={placeholder}
          value={value}
          onChange={e => { onChange(e.target.value); setShowSuggestions(true) }}
          onKeyDown={e => {
            if (e.key === 'Enter') { onAdd(value); setShowSuggestions(false) }
            if (e.key === 'Escape') setShowSuggestions(false)
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        />
        <button className={styles.addBtn} onClick={() => { onAdd(value); setShowSuggestions(false) }}>+</button>
      </div>
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
  const [spirits, setSpirits] = useState(existingPrefs?.spirits || {})
  const [lovedFlavors, setLovedFlavors] = useState(new Set(existingPrefs?.lovedFlavors || []))
  const [avoidedFlavors, setAvoidedFlavors] = useState(new Set(existingPrefs?.avoidedFlavors || []))
  const [flagged, setFlagged] = useState(new Set(existingPrefs?.flagged || []))
  const [classics, setClassics] = useState(new Set(existingPrefs?.classics || []))
  const [hardAvoids, setHardAvoids] = useState(new Set(existingPrefs?.hardAvoids || []))

  const [customSpirit, setCustomSpirit] = useState('')
  const [customFlagged, setCustomFlagged] = useState('')
  const [customAvoid, setCustomAvoid] = useState('')
  const [extraSpirits, setExtraSpirits] = useState([])
  const [extraFlagged, setExtraFlagged] = useState([])
  const [extraAvoids, setExtraAvoids] = useState([])

  const currentStep = STEPS[step]
  const totalSteps = STEPS.length - 1
  const progress = Math.min(step / (totalSteps - 1), 1)

  function scrollTop() {
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0 }, 50)
  }
  function goNext() { if (step < STEPS.length - 1) { setStep(s => s + 1); scrollTop() } }
  function goBack() { if (step > 0) { setStep(s => s - 1); scrollTop() } }

  function toggleSpirit(id) {
    setSpirits(prev => {
      const next = { ...prev }
      if (!next[id]) next[id] = 'love'
      else if (next[id] === 'love') next[id] = 'avoid'
      else delete next[id]
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

  function addCustomEntry(val, setExtra, setValue) {
    const trimmed = val.trim()
    if (!trimmed) return
    const id = 'custom_' + trimmed.toLowerCase().replace(/\s+/g, '_')
    setExtra(prev => {
      if (prev.find(x => x.id === id)) return prev
      return [...prev, { id, label: trimmed }]
    })
    setValue('')
  }

  function finish() {
    const displayName = name.trim() || (profileId === 'me' ? 'Me' : 'Partner')
    const preferences = {
      name: displayName,
      spirits,
      lovedFlavors: [...lovedFlavors],
      avoidedFlavors: [...avoidedFlavors],
      flagged: [...flagged],
      classics: [...classics],
      hardAvoids: [...hardAvoids],
    }

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

        {/* ── Spirits ── */}
        {currentStep === 'spirits' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 2 of 6</p>
              <h2 className={styles.stepTitle}>Your spirits</h2>
              <p className={styles.stepSub}>Tap once to love it. Tap twice to avoid it. Tap again to clear.</p>
            </div>
            <div className={styles.chipGrid}>
              <AutoSuggestInput
                value={customSpirit}
                onChange={setCustomSpirit}
                onAdd={val => addCustomEntry(val, setExtraSpirits, setCustomSpirit)}
                placeholder="Add spirit…"
                suggestions={ALL_INGREDIENTS}
              />
              {[...SPIRITS, ...extraSpirits].map(s => {
                const state = spirits[s.id]
                return (
                  <button
                    key={s.id}
                    className={`${styles.chip} ${state === 'love' ? styles.chipLove : ''} ${state === 'avoid' ? styles.chipAvoid : ''}`}
                    onClick={() => toggleSpirit(s.id)}
                  >
                    {state === 'love' && <span className={styles.chipIcon}>✓</span>}
                    {state === 'avoid' && <span className={styles.chipIcon}>✕</span>}
                    {s.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Flavors ── */}
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
                      <button className={`${styles.flavorBtn} ${loved ? styles.flavorBtnLove : ''}`} onClick={() => toggleFlavor(f.id, 'love')}>Love</button>
                      <button className={`${styles.flavorBtn} ${avoided ? styles.flavorBtnAvoid : ''}`} onClick={() => toggleFlavor(f.id, 'avoid')}>Avoid</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Flagged ── */}
        {currentStep === 'flagged' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 4 of 6</p>
              <h2 className={styles.stepTitle}>Flag these</h2>
              <p className={styles.stepSub}>These get highlighted on any menu — not a hard filter, just a heads up.</p>
            </div>
            <div className={styles.chipGrid}>
              <AutoSuggestInput
                value={customFlagged}
                onChange={setCustomFlagged}
                onAdd={val => addCustomEntry(val, setExtraFlagged, setCustomFlagged)}
                placeholder="Add ingredient…"
                suggestions={ALL_INGREDIENTS}
              />
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
            </div>
          </div>
        )}

        {/* ── Classics ── */}
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

        {/* ── Avoids ── */}
        {currentStep === 'avoids' && (
          <div className={styles.stepWrap}>
            <div className={styles.stepHeader}>
              <p className={styles.stepEyebrow}>Step 6 of 6</p>
              <h2 className={styles.stepTitle}>Hard avoids</h2>
              <p className={styles.stepSub}>These tank a score immediately, no matter what else is in the drink.</p>
            </div>
            <div className={styles.chipGrid}>
              <AutoSuggestInput
                value={customAvoid}
                onChange={setCustomAvoid}
                onAdd={val => addCustomEntry(val, setExtraAvoids, setCustomAvoid)}
                placeholder="Add avoid…"
                suggestions={ALL_INGREDIENTS}
              />
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
