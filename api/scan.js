import { getDb } from './_db.js'
import Anthropic from '@anthropic-ai/sdk'

function uuid() {
  return crypto.randomUUID()
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { photos, mood, profileId, fingerprint, partnerFingerprint } = req.body

  if (!photos?.length) {
    return res.status(400).json({ error: 'No photos provided' })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const imageBlocks = photos.map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: p.mediaType, data: p.base64 },
  }))

  const moodDesc = {
    boozy: 'boozy and spirit-forward — strong, stirred or shaken, not diluted or light',
    light: 'light and refreshing — lower ABV, citrus-forward, effervescent, or easy-drinking',
    surprise: 'open to anything — mood is neutral, just find the best match overall',
  }[mood] || 'open to anything'

  // ── Single API call: read menu + score in one pass ───────────────────────

  const prompt = `You are a cocktail sommelier reading a menu photo and scoring drinks for a guest.

Mood tonight: ${moodDesc}

Profile 1 (${profileId}):
${fingerprint || 'No profile data yet — score neutrally.'}

${partnerFingerprint ? `Profile 2 (partner):\n${partnerFingerprint}` : 'Profile 2: not set — score neutrally.'}

Look at the menu photo(s) and do the following in one step:
1. Read every cocktail you can make out
2. Score each one against both profiles
3. Return the results

Return ONLY a JSON object with this exact structure, no markdown, no preamble:
{
  "barName": "Name of the bar if visible, otherwise null",
  "unreadableCount": 0,
  "cocktails": [
    {
      "name": "Cocktail name exactly as written on menu",
      "flavorSummary": "One sentence plain-English flavor description — no brand names, translate everything to taste",
      "ingredients": [
        { "name": "ingredient as written on menu", "flavorDesc": "what it tastes like in plain English" }
      ],
      "score1": "high",
      "explanation1": "One sentence why this matches or doesn't match Profile 1 — be specific about flavors",
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
- Set readable:false only if you truly cannot make out a cocktail's name or ingredients
- Count unreadable cocktails in unreadableCount but do not include them in the cocktails array
- Never use brand names in flavorSummary`

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

  // ── Persist to Turso ─────────────────────────────────────────────────────

  const visitId = uuid()
  const db = getDb()

  try {
    await db.execute({
      sql: `INSERT INTO visits (id, bar_name, scanned_at, created_by) VALUES (?, ?, ?, ?)`,
      args: [visitId, result.barName || 'Unknown Bar', Date.now(), profileId]
    })

    for (const cocktail of result.cocktails) {
      const cocktailId = uuid()

      await db.execute({
        sql: `INSERT INTO cocktails (id, visit_id, name, description, flavor_tags, ingredients, readable)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          cocktailId, visitId, cocktail.name, cocktail.flavorSummary,
          JSON.stringify([]), JSON.stringify(cocktail.ingredients || []),
          cocktail.readable !== false ? 1 : 0,
        ]
      })

      await db.execute({
        sql: `INSERT INTO scores (id, cocktail_id, profile_id, score, explanation, flagged_ingredients)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuid(), cocktailId, profileId, cocktail.score1, cocktail.explanation1,
          JSON.stringify(cocktail.flaggedIngredients || [])]
      })

      await db.execute({
        sql: `INSERT INTO scores (id, cocktail_id, profile_id, score, explanation, flagged_ingredients)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuid(), cocktailId, 'partner', cocktail.score2, cocktail.explanation2,
          JSON.stringify(cocktail.flaggedIngredients || [])]
      })
    }
  } catch (err) {
    console.error('DB error:', err)
  }

  return res.status(200).json({
    visitId,
    barName: result.barName || 'Unknown Bar',
    profileId,
    mood,
    cocktails: result.cocktails,
    unreadableCount: result.unreadableCount || 0,
  })
}
