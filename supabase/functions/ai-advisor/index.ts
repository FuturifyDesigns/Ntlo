import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { type, payload, local } = await req.json()

    let systemPrompt =
      'You are Ntlo Advisor, a helpful assistant for student housing in Botswana. Be concise, practical, and honest. Use Pula (P) for prices. Never invent listing details not in the data. Max 120 words.'

    let userPrompt = ''

    if (type === 'listing') {
      const listing = payload?.listing
      const analysis = local?.analysis
      userPrompt = `A student is viewing this room near campus in Botswana.
Title: ${listing?.title}
Price: P${listing?.price}/month
Room type: ${listing?.room_type}
Distance to campus: ${analysis?.distanceKm ?? 'unknown'} km
Verified: ${listing?.is_verified ? 'yes' : 'no'}
Amenities: ${(listing?.amenities || []).join(', ') || 'none'}
Match score: ${analysis?.overall}/100
Pros keys: ${(analysis?.pros || []).map((p) => p.key).join(', ')}
Cons keys: ${(analysis?.cons || []).map((c) => c.key).join(', ')}

Write a short, friendly paragraph helping the student decide whether to contact the landlord. Mention distance and value for money.`
    } else if (type === 'compare') {
      const ranked = local?.comparison?.ranked || []
      userPrompt = `Compare these saved student rooms in Botswana and recommend which to prioritize:
${ranked.map((r, i) => `${i + 1}. ${r.listing.title} — P${r.listing.price}, score ${r.analysis.overall}/100, ${r.analysis.distanceKm ?? '?'} km`).join('\n')}

Explain trade-offs (price vs distance vs trust) in plain language.`
    } else if (type === 'landlord') {
      const form = payload?.form
      userPrompt = `A landlord in Botswana is creating a listing:
Title: ${form?.title}
Price: P${form?.price}
Room type: ${form?.room_type}
City: ${form?.city}
Has map pin: ${form?.lat && form?.lng ? 'yes' : 'no'}
Photo count: ${payload?.options?.photoCount ?? 0}
Amenities: ${(form?.amenities || []).join(', ') || 'none'}

Give 3 actionable tips to attract more student tenants and build trust.`
    } else {
      return new Response(JSON.stringify({ error: 'Unknown type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 220,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(err)
    }

    const json = await response.json()
    const text = json.choices?.[0]?.message?.content?.trim() || ''

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
