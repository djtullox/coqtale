import { getDb } from './_db.js'

export default async function handler(req, res) {
  const db = getDb()

  try {
    const result = await db.execute({
      sql: `SELECT * FROM visits ORDER BY scanned_at DESC`,
      args: []
    })

    const visits = result.rows.map(row => ({
      visitId: row.id,
      barName: row.bar_name,
      scannedAt: row.scanned_at,
      createdBy: row.created_by,
    }))

    return res.status(200).json({ visits })
  } catch (err) {
    console.error('Visits fetch error:', err)
    return res.status(500).json({ error: 'Having trouble connecting. Give it a moment and try again.' })
  }
}
