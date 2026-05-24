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

  // ── Step 1: Extract bar name and cocktails from menu photos ──────────────

  const imageBlocks = photos.map(p => ({
    type: 'image',
    source: { type: 'base64', media_type: p.mediaType, data: p.base64 },
  }))

  let menuData
  try {
    const extractionResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20251001',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: [
          ...imageBlocks,
          {
            type: 'text',
            text: `You are reading a cocktail menu. Extract every cocktail you can read.

Return ONLY a JSON object with this exact structure, no markdown, no preamble:
{
  "barName": "Name of the bar if visible, otherwise null",
  "cocktails": [
    {
      "name": "Cocktail name exactly as written",
      "rawIngredients": "All ingredients listed, as written on the menu",
      "readable": true
    }
  ],
  "unreadableCount": 0
}

For cocktails you can partially read, include what you can. Set readable:false only if you truly cannot make out the name or any ingredients. Count those in unreadableCount.

If this is not a cocktail menu, return { "barName": null, "cocktails": [], "unreadableCount": 0 }.`
          }
        ]
      }]
    })

    const raw = extractionResponse.content[0].text.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    menuData = JSON.parse(clean)
  } catch (err) {
    console.error('Extraction error:', err)
    return res.status(500).json({ error: "Couldn't read this menu. Try better lighting or get closer." })
  }

  if (!menuData.cocktails?.length) {
    return res.status(422).json({ error: "No cocktails found. Make sure you're photographing a cocktail menu." })
  }

  // ── Step 2: Score each cocktail against both profiles ────────────────────

  const moodDesc = {
    boozy: 'boozy and spirit-forward — strong, stirred or shaken, not diluted or light',
    light: 'light and refreshing — lower ABV, citrus-forward, effervescent, or easy-drinking',
    surprise: 'open to anything — mood is neutral, just find the best match overall',
  }[mood] || 'open to anything'

  const scoringPrompt = `You are a cocktail sommelier helping someone pick a drink.

Mood tonight: ${moodDesc}

Profile 1 (${profileId}):
${fingerprint || 'No profile data yet — score neutrally.'}

${partnerFingerprint ? `Profile 2 (partner):
${partnerFingerprint}` : ''}

Here are the cocktails from the menu:
${menuData.cocktails.map((c, i) => `${i + 1}. ${c.name}: ${c.rawIngredients}`).join('\n')}

For each cocktail, return a JSON array. Each item:
{
  "name": "exact cocktail name",
  "flavorSummary": "one sentence, plain English flavor description — no jargon, translate all ingredients to what they taste like",
  "ingredients": [
    { "name": "ingredient as written on menu", "flavorDesc": "what it tastes like in plain English" }
  ],
  "score1": "high" | "medium" | "low",
  "explanation1": "one sentence why — be specific, reference actual flavors",
  "score2": "high" | "medium" | "low",
  "explanation2": "one sentence why for profile 2",
  "scoreUs": "high" | "medium" | "low",
  "flaggedIngredients": ["any flagged ingredients present"],
  "readable": true
}

scoreUs is the more conservative of score1 and score2. High only if both would genuinely enjoy it.

Hard rules:
- If a hard avoid ingredient is present, that profile gets "low" automatically
- Translate every ingredient name to plain flavor language in flavorDesc
- Never use brand names in flavorSummary — say what it tastes like

Return ONLY the JSON array, no markdown, no preamble.`

  let scores
  try {
    const scoringResponse = await client.messages.create({
      model: 'claude-sonnet-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: scoringPrompt }]
    })

    const raw = scoringResponse.content[0].text.trim()
    const clean = raw.replace(/```json|```/g, '').trim()
    scores = JSON.parse(clean)
  } catch (err) {
    console.error('Scoring error:', err)
    // Fall back — return cocktails without scores
    scores = menuData.cocktails.map(c => ({
      name: c.name,
      flavorSummary: 'Could not analyze this cocktail.',
      ingredients: [],
      score1: 'medium',
      explanation1: 'Analysis unavailable.',
      score2: 'medium',
      explanation2: 'Analysis unavailable.',
      scoreUs: 'medium',
      flaggedIngredients: [],
      readable: c.readable,
    }))
  }

  // ── Step 3: Persist to Turso ─────────────────────────────────────────────

  const visitId = uuid()
  const db = getDb()

  try {
    await db.execute({
      sql: `INSERT INTO visits (id, bar_name, scanned_at, created_by) VALUES (?, ?, ?, ?)`,
      args: [visitId, menuData.barName || 'Unknown Bar', Date.now(), profileId]
    })

    for (const cocktail of scores) {
      const cocktailId = uuid()

      await db.execute({
        sql: `INSERT INTO cocktails (id, visit_id, name, description, flavor_tags, ingredients, readable)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          cocktailId,
          visitId,
          cocktail.name,
          cocktail.flavorSummary,
          JSON.stringify([]),
          JSON.stringify(cocktail.ingredients || []),
          cocktail.readable !== false ? 1 : 0,
        ]
      })

      await db.execute({
        sql: `INSERT INTO scores (id, cocktail_id, profile_id, score, explanation, flagged_ingredients)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          uuid(), cocktailId, profileId,
          cocktail.score1, cocktail.explanation1,
          JSON.stringify(cocktail.flaggedIngredients || [])
        ]
      })

      await db.execute({
        sql: `INSERT INTO scores (id, cocktail_id, profile_id, score, explanation, flagged_ingredients)
              VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
          uuid(), cocktailId, 'partner',
          cocktail.score2, cocktail.explanation2,
          JSON.stringify(cocktail.flaggedIngredients || [])
        ]
      })
    }
  } catch (err) {
    console.error('DB error:', err)
    // Don't fail the request — return results even if DB write fails
  }

  // ── Step 4: Return everything the results screen needs ───────────────────

  return res.status(200).json({
    visitId,
    barName: menuData.barName || 'Unknown Bar',
    profileId,
    mood,
    cocktails: scores,
    unreadableCount: menuData.unreadableCount || 0,
  })
}
