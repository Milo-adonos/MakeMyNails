import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const FAL_MODEL = 'fal-ai/nano-banana-2/edit'
const FAL_QUEUE = `https://queue.fal.run/${FAL_MODEL}`
const FAL_RUN = `https://fal.run/${FAL_MODEL}`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type GenerationMode = 'inspiration' | 'onboarding' | 'emma'

const SHAPE_LABELS: Record<string, string> = {
  almond: 'almond',
  square: 'square',
  stiletto: 'stiletto',
  coffin: 'coffin',
  oval: 'oval',
  ballerina: 'ballerina',
}

const STYLE_LABELS: Record<string, string> = {
  french: 'French tip',
  color: 'solid color',
  nailart: 'nail art',
  gradient: 'gradient ombre',
  minimalist: 'minimalist',
  chrome: 'chrome mirror',
}

const OCCASION_LABELS: Record<string, string> = {
  wedding: 'a wedding',
  work: 'a professional work setting',
  party: 'a party or night out',
  vacation: 'a vacation',
  date: 'a romantic date',
  everyday: 'everyday wear',
  other: 'a special occasion',
}

const PROMPT_INSPIRATION =
  'Keep absolutely everything from image 1 unchanged — skin tone, hand shape, fingers, rings, background, lighting, shadows. Only replace the nails with the nail art design from image 2. Do not alter any other detail. Preserve the exact same framing, angle, and quality as image 1.'

function buildOnboardingPrompt(shape: string, style: string): string {
  const shapeLabel = SHAPE_LABELS[shape.toLowerCase()] || shape
  const styleLabel = STYLE_LABELS[style.toLowerCase()] || style
  return `Keep absolutely everything from image 1 unchanged — skin tone, hand shape, fingers, rings, background, lighting, shadows. Only replace the nails with ${shapeLabel} shaped nails in ${styleLabel} style. Do not alter any other detail. Preserve the exact same framing, angle, and quality as image 1.`
}

function buildEmmaPrompt(occasion?: string, occasionLabel?: string): string {
  const label = occasionLabel?.trim()
    || (occasion ? OCCASION_LABELS[occasion.toLowerCase()] : null)
    || 'the chosen occasion'
  return `Keep absolutely everything from image 1 unchanged. Only replace the nails with a design perfectly suited for ${label}, adapted to the skin tone visible in the image. Do not alter any other detail.`
}

function buildPrompt(
  mode: GenerationMode,
  shape?: string,
  style?: string,
  occasion?: string,
  occasionLabel?: string,
): string {
  if (mode === 'inspiration') return PROMPT_INSPIRATION
  if (mode === 'emma') return buildEmmaPrompt(occasion, occasionLabel)
  if (!shape || !style) throw new Error('shape and style are required for onboarding mode')
  return buildOnboardingPrompt(shape, style)
}

function toDataUri(base64: string): string {
  if (base64.startsWith('data:')) return base64
  return `data:image/jpeg;base64,${base64}`
}

function extractResultUrl(json: { images?: Array<{ url?: string }> }): string {
  const url = json.images?.[0]?.url
  if (!url) throw new Error('No result image URL')
  return url
}

async function generateWithFal(
  apiKey: string,
  imageUrls: string[],
  prompt: string,
  aspectRatio: string,
): Promise<string> {
  const input = {
    prompt,
    image_urls: imageUrls,
    aspect_ratio: aspectRatio || 'auto',
    resolution: '2K',
    output_format: 'png',
    limit_generations: true,
    num_images: 1,
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Key ${apiKey}`,
  }

  const directRes = await fetch(FAL_RUN, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  if (directRes.ok) {
    return extractResultUrl(await directRes.json())
  }

  const queueRes = await fetch(FAL_QUEUE, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  })

  const queueJson = await queueRes.json()
  if (!queueRes.ok) {
    throw new Error(queueJson.detail || queueJson.error || 'Fal generation failed')
  }

  const requestId = queueJson.request_id
  if (!requestId) throw new Error('Fal did not return a request_id')

  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 1000))

    const statusRes = await fetch(
      `${FAL_QUEUE}/requests/${requestId}/status`,
      { headers: { 'Authorization': `Key ${apiKey}` } },
    )
    const statusJson = await statusRes.json()

    if (statusJson.status === 'COMPLETED') {
      const resultRes = await fetch(
        `${FAL_QUEUE}/requests/${requestId}`,
        { headers: { 'Authorization': `Key ${apiKey}` } },
      )
      if (!resultRes.ok) throw new Error('Failed to fetch Fal result')
      return extractResultUrl(await resultRes.json())
    }

    if (statusJson.status === 'FAILED') {
      throw new Error(statusJson.error || 'Generation failed')
    }
  }

  throw new Error('Generation timed out')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const falKey = Deno.env.get('FAL_KEY')
    if (!falKey) throw new Error('FAL_KEY not configured')

    const body = await req.json()
    const {
      photoBase64,
      mode = 'onboarding',
      shape,
      style,
      length,
      inspirationBase64,
      outfitBase64,
      occasion,
      occasionLabel,
      aspectRatio = 'auto',
    } = body as {
      photoBase64: string
      mode?: GenerationMode
      shape?: string
      style?: string
      length?: string
      inspirationBase64?: string
      outfitBase64?: string
      occasion?: string
      occasionLabel?: string
      aspectRatio?: string
    }

    if (!photoBase64) {
      return new Response(JSON.stringify({ error: 'Missing hand photo' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (mode === 'inspiration' && !inspirationBase64) {
      return new Response(JSON.stringify({ error: 'Missing inspiration image' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (mode === 'onboarding' && (!shape || !style || !length)) {
      return new Response(JSON.stringify({ error: 'Missing shape, style or length' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (mode === 'emma' && !occasion && !occasionLabel) {
      return new Response(JSON.stringify({ error: 'Missing occasion' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const imageUrls = [toDataUri(photoBase64)]

    if (mode === 'inspiration' && inspirationBase64) {
      imageUrls.push(toDataUri(inspirationBase64))
    }

    if (outfitBase64) {
      imageUrls.push(toDataUri(outfitBase64))
    }

    const prompt = buildPrompt(mode, shape, style, occasion, occasionLabel)
    const resultImageUrl = await generateWithFal(falKey, imageUrls, prompt, aspectRatio)

    return new Response(
      JSON.stringify({ resultImageUrl, mode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
