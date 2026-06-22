import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KIE_AI_API = 'https://api.kie.ai'
const KIE_AI_MODEL = 'nano-banana-2'

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

function parseBase64Image(dataUrl: string): { bytes: Uint8Array; mime: string; ext: string } {
  const match = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
  const mime = match?.[1] ?? 'image/jpeg'
  const raw = match?.[2] ?? dataUrl.split(',')[1] ?? dataUrl
  const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  return { bytes, mime, ext }
}

async function submitGeneration(
  apiKey: string,
  imageUrls: string[],
  prompt: string,
  aspectRatio: string,
): Promise<string> {
  const res = await fetch(`${KIE_AI_API}/api/v1/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIE_AI_MODEL,
      input: {
        prompt,
        image_input: imageUrls,
        aspect_ratio: aspectRatio || 'auto',
        resolution: '2K',
        output_format: 'png',
      },
    }),
  })

  const json = await res.json()
  if (json.code !== 200) throw new Error(json.msg || json.message || 'Generation failed')
  return json.data.taskId
}

async function pollTaskResult(apiKey: string, taskId: string): Promise<string> {
  for (let i = 0; i < 90; i++) {
    await new Promise((r) => setTimeout(r, 2000))

    const res = await fetch(
      `${KIE_AI_API}/api/v1/jobs/recordInfo?taskId=${taskId}`,
      { headers: { 'Authorization': `Bearer ${apiKey}` } },
    )

    const json = await res.json()
    if (json.code !== 200) continue

    const { state, resultJson, failMsg } = json.data

    if (state === 'success') {
      const result = JSON.parse(resultJson)
      const url = result.resultUrls?.[0]
      if (!url) throw new Error('No result image URL')
      return url
    }
    if (state === 'fail') {
      throw new Error(failMsg || 'Generation failed')
    }
  }
  throw new Error('Generation timed out')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const kieAiKey = Deno.env.get('KIE_AI_API_KEY')
    if (!kieAiKey) throw new Error('KIE_AI_API_KEY not configured')

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const uploadImage = async (b64: string, prefix: string): Promise<string> => {
      const { bytes, mime, ext } = parseBase64Image(b64)
      const filename = `temp/${prefix}-${crypto.randomUUID()}.${ext}`
      const { error } = await supabase.storage
        .from('nail-images')
        .upload(filename, bytes, { contentType: mime, upsert: true })
      if (error) throw new Error(`Upload failed: ${error.message}`)
      const { data } = supabase.storage.from('nail-images').getPublicUrl(filename)
      return data.publicUrl
    }

    const photoUrl = await uploadImage(photoBase64, 'hand')
    const imageUrls = [photoUrl]

    if (mode === 'inspiration' && inspirationBase64) {
      imageUrls.push(await uploadImage(inspirationBase64, 'inspo'))
    }

    if (outfitBase64) {
      imageUrls.push(await uploadImage(outfitBase64, 'outfit'))
    }

    const prompt = buildPrompt(mode, shape, style, occasion, occasionLabel)
    const taskId = await submitGeneration(kieAiKey, imageUrls, prompt, aspectRatio)
    const resultImageUrl = await pollTaskResult(kieAiKey, taskId)

    return new Response(
      JSON.stringify({ resultImageUrl, taskId, mode }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
