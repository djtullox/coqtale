import { getDb } from './_db.js'

export default async function handler(req, res) {
  // Only allow in non-production or with a secret header
  const secret = req.headers['x-migrate-secret']
  if (process.env.NODE_ENV === 'production' && secret !== process.env.MIGRATE_SECRET) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const db = getDb()

  const statements = [
    // Visits — one per menu scan
    `CREATE TABLE IF NOT EXISTS visits (
      id          TEXT PRIMARY KEY,
      bar_name    TEXT NOT NULL,
      scanned_at  INTEGER NOT NULL,
      raw_menu    TEXT,
      created_by  TEXT NOT NULL
    )`,

    // Cocktail cards extracted from a scan
    `CREATE TABLE IF NOT EXISTS cocktails (
      id          TEXT PRIMARY KEY,
      visit_id    TEXT NOT NULL REFERENCES visits(id),
      name        TEXT NOT NULL,
      description TEXT,
      flavor_tags TEXT,      -- JSON array of flavor strings
      ingredients TEXT,      -- JSON array of {name, flavor_desc} objects
      readable    INTEGER DEFAULT 1,
      FOREIGN KEY (visit_id) REFERENCES visits(id)
    )`,

    // Per-profile scores for each cocktail
    `CREATE TABLE IF NOT EXISTS scores (
      id           TEXT PRIMARY KEY,
      cocktail_id  TEXT NOT NULL REFERENCES cocktails(id),
      profile_id   TEXT NOT NULL,
      score        TEXT NOT NULL,   -- 'high' | 'medium' | 'low'
      explanation  TEXT,
      flagged_ingredients TEXT       -- JSON array
    )`,

    // Post-visit ratings
    `CREATE TABLE IF NOT EXISTS ratings (
      id           TEXT PRIMARY KEY,
      cocktail_id  TEXT NOT NULL REFERENCES cocktails(id),
      profile_id   TEXT NOT NULL,
      rating       INTEGER NOT NULL, -- 1-5
      rated_at     INTEGER NOT NULL,
      flavor_tags  TEXT              -- JSON, snapshot at time of rating
    )`,
  ]

  try {
    for (const sql of statements) {
      await db.execute(sql)
    }
    return res.status(200).json({ ok: true, tables: ['visits', 'cocktails', 'scores', 'ratings'] })
  } catch (err) {
    console.error('Migration error:', err)
    return res.status(500).json({ error: err.message })
  }
}
