import { getDb } from '../_db.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (!id) return res.status(400).json({ error: 'Missing visit ID' })

  const db = getDb()

  try {
    const visitRow = await db.execute({
      sql: `SELECT * FROM visits WHERE id = ?`,
      args: [id]
    })

    if (!visitRow.rows.length) {
      return res.status(404).json({ error: 'Visit not found' })
    }

    const visit = visitRow.rows[0]

    const cocktailRows = await db.execute({
      sql: `SELECT * FROM cocktails WHERE visit_id = ?`,
      args: [id]
    })

    const cocktails = []

    for (const cocktail of cocktailRows.rows) {
      const scoreRows = await db.execute({
        sql: `SELECT * FROM scores WHERE cocktail_id = ?`,
        args: [cocktail.id]
      })

      const scores = {}
      for (const s of scoreRows.rows) {
        scores[s.profile_id] = {
          score: s.score,
          explanation: s.explanation,
          flaggedIngredients: JSON.parse(s.flagged_ingredients || '[]')
        }
      }

      cocktails.push({
        id: cocktail.id,
        name: cocktail.name,
        flavorSummary: cocktail.description,
        ingredients: JSON.parse(cocktail.ingredients || '[]'),
        readable: cocktail.readable === 1,
        score1: scores['me']?.score,
        explanation1: scores['me']?.explanation,
        flaggedIngredients1: scores['me']?.flaggedIngredients || [],
        score2: scores['partner']?.score,
        explanation2: scores['partner']?.explanation,
        flaggedIngredients2: scores['partner']?.flaggedIngredients || [],
        scoreUs: deriveUsScore(scores['me']?.score, scores['partner']?.score),
      })
    }

    return res.status(200).json({
      visitId: visit.id,
      barName: visit.bar_name,
      scannedAt: visit.scanned_at,
      createdBy: visit.created_by,
      cocktails,
    })

  } catch (err) {
    console.error('Visit fetch error:', err)
    return res.status(500).json({ error: 'Having trouble connecting. Give it a moment and try again.' })
  }
}

function deriveUsScore(score1, score2) {
  const rank = { high: 3, medium: 2, low: 1 }
  const s1 = rank[score1] || 2
  const s2 = rank[score2] || 2
  const min = Math.min(s1, s2)
  return Object.keys(rank).find(k => rank[k] === min)
}