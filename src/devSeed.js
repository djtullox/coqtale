// DEV ONLY — pre-filled profiles so localStorage wipes don't cost rebuild time.
// Loaded automatically when localStorage is empty AND import.meta.env.VITE_DEV_SEED === 'true'.
// Never set VITE_DEV_SEED in Vercel production env vars.

export const DEV_SEED_PROFILES = {
  me: {
    id: 'me',
    name: 'David',
    onboardingComplete: true,
    ratingCount: 0,
    preferences: {
      name: 'David',
      spirits: {
        bourbon: 'love', rye: 'love', mezcal: 'love', gin: 'love',
        amaro: 'love', scotch: 'love', cognac: 'love', apple_brandy: 'love',
        sweet_vermouth: 'love', dry_vermouth: 'love', sherry: 'love',
        campari: 'love', cynar: 'love', fernet: 'love', chartreuse: 'love',
        aquavit: 'love', absinthe: 'love', maraschino: 'love',
        vodka: 'avoid',
      },
      lovedFlavors: ['bitter', 'smoky', 'herbal', 'citrus', 'rich', 'dry'],
      avoidedFlavors: ['sweet', 'creamy', 'fruity'],
      flagged: ['amaro', 'mezcal', 'vermouth', 'sherry', 'chartreuse', 'campari', 'fernet', 'absinthe', 'aquavit', 'cynar', 'sfumato'],
      classics: ['negroni', 'old_fashioned', 'manhattan', 'penicillin', 'last_word', 'boulevardier', 'sazerac', 'toronto', 'vieux_carre'],
      hardAvoids: ['cream', 'egg_white', 'coconut', 'anise', 'very_sweet'],
    },
    fingerprint: 'Loves: bitter, smoky, herbal, citrus, rich, dry. Avoids: sweet, creamy, fruity. Preferred spirits: bourbon, rye, mezcal, gin, amaro, scotch, cognac, apple brandy, sweet vermouth, sherry, campari, cynar, fernet, chartreuse, aquavit, absinthe, maraschino. Avoided spirits: vodka. Flag these ingredients: amaro, mezcal, vermouth, sherry, chartreuse, campari, fernet, absinthe, aquavit, cynar, sfumato. Hard avoids: cream, egg white, coconut, anise, very sweet. Based on dev seed. Confidence: low — no ratings yet.',
  },
  partner: {
    id: 'partner',
    name: 'Lauren',
    onboardingComplete: true,
    ratingCount: 0,
    preferences: {
      name: 'Lauren',
      spirits: {
        gin: 'love', tequila: 'love', mezcal: 'love', bourbon: 'love',
        sweet_vermouth: 'love', campari: 'love', vodka: 'love',
        fernet: 'avoid', aquavit: 'avoid', absinthe: 'avoid',
      },
      lovedFlavors: ['citrus', 'herbal', 'floral', 'fruity', 'bitter'],
      avoidedFlavors: ['smoky', 'creamy', 'very_sweet'],
      flagged: ['amaro', 'mezcal', 'vermouth', 'campari', 'chartreuse'],
      classics: ['negroni', 'daiquiri', 'margarita', 'spritz', 'paper_plane', 'last_word'],
      hardAvoids: ['cream', 'egg_white', 'coconut', 'anise'],
    },
    fingerprint: 'Loves: citrus, herbal, floral, fruity, bitter. Avoids: smoky, creamy, very sweet. Preferred spirits: gin, tequila, mezcal, bourbon, sweet vermouth, campari, vodka. Avoided spirits: fernet, aquavit, absinthe. Flag these ingredients: amaro, mezcal, vermouth, campari, chartreuse. Hard avoids: cream, egg white, coconut, anise. Based on dev seed. Confidence: low — no ratings yet.',
  },
}
