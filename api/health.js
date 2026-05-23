import { getDb } from './_db.js'

export default async function handler(req, res) {
  const checks = {
    db: false,
    anthropic_key: false,
  }

  // Check DB
  try {
    const db = getDb()
    await db.execute('SELECT 1')
    checks.db = true
  } catch (err) {
    checks.db_error = err.message
  }

  // Check Anthropic key exists (don't call the API — just verify it's set)
  checks.anthropic_key = !!process.env.ANTHROPIC_API_KEY

  const ok = checks.db && checks.anthropic_key
  return res.status(ok ? 200 : 500).json({ ok, checks })
}
