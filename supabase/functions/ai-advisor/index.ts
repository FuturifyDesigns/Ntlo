import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT =
  'You are Ntlo Advisor, a helpful assistant for student housing in Botswana. Be concise, practical, and honest. Use Pula (P) for prices. Never invent listing details not in the data. Max 120 words. Write in plain English unless the user data suggests Setswana is preferred.'

async function askGemini(apiKey: string, userPrompt: string) {
  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-2.0-flash'
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 280,
      },
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(err)
  }

  const json = await response.json()
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
  if (!text) throw new Error('Gemini returned empty response')
  return text
}

function buildPrompt(type: string, payload: Record<string, unknown>, local: Record<string, unknown>) {
  if (type === 'listing') {
    const listing = payload?.listing as Record<string, unknown> | undefined
    const analysis = local?.analysis as Record<string, unknown> | undefined
    const pros = (analysis?.pros as Array<{ key: string }>) || []
    const cons = (analysis?.cons as Array<{ key: string }>) || []

    return `A student is viewing this room near campus in Botswana.
Title: ${listing?.title}
Price: P${listing?.price}/month
Room type: ${listing?.room_type}
Distance to campus: ${analysis?.distanceKm ?? 'unknown'} km
Verified: ${listing?.is_verified ? 'yes' : 'no'}
Amenities: ${((listing?.amenities as string[]) || []).join(', ') || 'none'}
Match score: ${analysis?.overall}/100
Strengths: ${pros.map((p) => p.key).join(', ') || 'none'}
Watch outs: ${cons.map((c) => c.key).join(', ') || 'none'}

Write a short, friendly paragraph helping the student decide whether to contact the landlord. Mention distance and value for money.`
  }

  if (type === 'compare') {
    const ranked = (local?.comparison as { ranked?: Array<{ listing: { title: string; price: number }; analysis: { overall: number; distanceKm?: number } }> })?.ranked || []
    return `Compare these saved student rooms in Botswana and recommend which to prioritize:
${ranked.map((r, i) => `${i + 1}. ${r.listing.title} — P${r.listing.price}, score ${r.analysis.overall}/100, ${r.analysis.distanceKm ?? '?'} km`).join('\n')}

Explain trade-offs (price vs distance vs trust) in plain language.`
  }

  if (type === 'landlord') {
    const form = payload?.form as Record<string, unknown> | undefined
    const options = payload?.options as { photoCount?: number } | undefined
    return `A landlord in Botswana is creating a listing:
Title: ${form?.title}
Price: P${form?.price}
Room type: ${form?.room_type}
City: ${form?.city}
Has map pin: ${form?.lat && form?.lng ? 'yes' : 'no'}
Photo count: ${options?.photoCount ?? 0}
Amenities: ${((form?.amenities as string[]) || []).join(', ') || 'none'}

Give 3 actionable tips to attract more student tenants and build trust.`
  }

  return null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Gemini not configured — add GEMINI_API_KEY secret' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { type, payload, local } = await req.json()
    const userPrompt = buildPrompt(type, payload ?? {}, local ?? {})

    if (!userPrompt) {
      return new Response(JSON.stringify({ error: 'Unknown type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const text = await askGemini(apiKey, userPrompt)

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
