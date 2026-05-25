import { getDb } from './_db.js'
import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { photos, profileId, fingerprint, partnerFingerprint } = req.body

  if (!photos?.length) {
    return res.status(400).json({ error: 'No photos provided' })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const imageBlocks = photos.map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: p.mediaType, data: p.base64 },
  }))

  const prompt = `You are a cocktail sommelier reading a menu and scoring drinks for a guest. Be fast and concise.

Profile 1 (${profileId}):
${fingerprint || 'No profile data yet — score neutrally.'}

${partnerFingerprint ? `Profile 2 (partner):\n${partnerFingerprint}` : 'Profile 2: not set — score neutrally.'}

ONLY process cocktails. Skip entirely: beer, wine, spirits lists, non-alcoholic drinks, food, and any section that is not a cocktail menu.

For each cocktail you can read:
1. Extract the name and translate ingredients to plain flavor language
2. Score against both profiles

Return ONLY a JSON object, no markdown, no preamble:
{
  "barName": "Name of the bar if visible, otherwise null",
  "unreadableCount": 0,
  "cocktails": [
    {
      "name": "Cocktail name exactly as written",
      "flavorSummary": "One sentence flavor description, no brand names",
      "ingredients": [
        { "name": "ingredient as written", "flavorDesc": "plain English taste description" }
      ],
      "score1": "high",
      "explanation1": "One sentence why this matches or doesn't match Profile 1",
      "score2": "high",
      "explanation2": "One sentence why for Profile 2",
      "scoreUs": "high",
      "flaggedIngredients": [],
      "readable": true
    }
  ]
}

Scoring rules:
- score values: "high" | "medium" | "low"
- scoreUs is the more conservative of score1 and score2 — only "high" if both profiles would genuinely enjoy it
- If a hard avoid ingredient is present for a profile, that profile gets "low" automatically
- Set readable:false only if you truly cannot make out a cocktail name or ingredients
- Count unreadable cocktails in unreadableCount but do not include them in the cocktails array
- Never use brand names in flavorSummary
- Keep explanations short — one sentence maximum`

  let result
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          { type: 'text', text: prompt }
        ]
      }]
    })

    const raw = response.content[0].text.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    result = JSON.parse(clean)
  } catch (err) {
    console.error('Scan error:', err)
    return res.status(500).json({ error: "Couldn't read this menu. Try better lighting or get closer." })
  }

  if (!result.cocktails?.length) {
    return res.status(422).json({ error: "No cocktails found. Make sure you're photographing a cocktail menu." })
  }

  // ── Build visitId and response payload ───────────────────────────────────

  const visitId = crypto.randomUUID()

  const responsePayload = {
    visitId,
    barName: result.barName || 'Unknown Bar',
    profileId,
    cocktails: result.cocktails,
    unreadableCount: result.unreadableCount || 0,
  }

  // ── Respond to client immediately ────────────────────────────────────────
  // Turso writes happen after — client is unblocked as soon as Claude finishes

  res.status(200).json(responsePayload)

  // ── Persist to Turso in background (batched) ─────────────────────────────

  try {
    const db = getDb()

    // Build all statements as a single batched transaction
    const statements = [
      {
        sql: `INSERT INTO visits (id, bar_name, scanned_at, created_by) VALUES (?, ?, ?, ?)`,
        args: [visitId, result.barName || 'Unknown Bar', Date.now(), profileId]
      }
    ]

    for (const cocktail of result.cocktails) {
      const cocktailId = crypto.randomUUID()

      statements.push({
        sql: `INSERT INTO cocktails (id, visit_id, name, description, flavor_tags, ingredients, readable)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          cocktailId, visitId, cocktail.name, cocktail.flavorSummary,
          JSON.stringify([]), JSON.stringify(cocktail.ingredients || []),
          cocktail.readable !== false ? 1 : 0,
        ]
      })

      statements.push({
        sql: `INSERT INTO scores (id, cocktail_id, profile_id, score, explanation, flagged_ingredients)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(), cocktailId, profileId,
          cocktail.score1, cocktail.explanation1,
          JSON.stringify(cocktail.flaggedIngredients || [])
        ]
      })

      statements.push({
        sql: `INSERT INTO scores (id, cocktail_id, profile_id, score, explanation, flagged_ingredients)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          crypto.randomUUID(), cocktailId, 'partner',
          cocktail.score2, cocktail.explanation2,
          JSON.stringify(cocktail.flaggedIngredients || [])
        ]
      })
    }

    // Execute all inserts in one batch — far fewer round trips than sequential awaits
    await db.batch(statements, 'write')

  } catch (err) {
    console.error('DB write error (background):', err)
    // Non-fatal — client already has their results via sessionStorage
  }
}
