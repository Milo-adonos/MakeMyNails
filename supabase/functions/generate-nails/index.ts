import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FAL_MODEL = 'fal-ai/nano-banana-2/edit'
const FAL_QUEUE = `https://queue.fal.run/${FAL_MODEL}`
const FAL_RUN = `https://fal.run/${FAL_MODEL}`

const KIE_AI_API = 'https://api.kie.ai/api/v1'
const KIE_GPT_IMAGE_2_MODEL = 'gpt-image-2-image-to-image'

function mapAspectRatio(aspectRatio: string): string {
  const map: Record<string, string> = {
    '1:1': '1:1',
    '2:3': '2:3',
    '3:2': '3:2',
    '3:4': '3:4',
    '4:3': '4:3',
    '9:16': '9:16',
    '16:9': '16:9',
    auto: 'auto',
  }
  return map[aspectRatio] || 'auto'
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type GenerationMode = 'inspiration' | 'onboarding' | 'emma'
type GenerationSource = 'post_payment' | string

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

const LENGTH_LABELS: Record<string, string> = {
  short: 'short',
  medium: 'medium',
  long: 'long',
}

const PROMPT_INTRO =
  'I am provided with a base image (Image 1) showing a real hand with natural nails. Apply nail art to this hand following one of these three cases:'

const CASE_1_INSPIRATION = `CASE 1 — INSPIRATION IMAGE: A second image (Image 2) is provided as nail art reference. Reproduce the exact nail design from Image 2 onto Image 1 with pixel-perfect accuracy: exact colors, exact patterns, exact decorations (flowers, gems, pearls, stars, glitter, french tips), exact finish (glossy, matte, chrome, gradient), exact nail length and shape from Image 2. Analyze each nail individually before generating.`

const PROMPT_RULES = `ABSOLUTE RULES FOR ALL 3 CASES:

— Only modify the nails. Zero other changes.

— Keep 100% identical: skin tone, skin texture, veins, wrinkles, knuckles, hand shape, fingers, background, lighting, shadows, angle, framing, photo grain, bracelets, rings, jewelry.

— The nail design must be applied with maximum photorealism — same lighting conditions as Image 1, natural nail gloss, realistic depth and texture.

— Final result must be completely indistinguishable from a real unedited iPhone photo.

— No AI artifacts, no skin smoothing, no background changes.

— Ultra realistic, 2K quality, same format as Image 1.`

function buildCase2Prompt(
  shape: string,
  style: string,
  length: string,
  customNote?: string,
): string {
  const shapeLabel = SHAPE_LABELS[shape.toLowerCase()] || shape
  const styleLabel = STYLE_LABELS[style.toLowerCase()] || style
  const lengthLabel = LENGTH_LABELS[length.toLowerCase()] || length
  const details = customNote?.trim() || 'none specified'
  const color = customNote?.trim()
    ? `as described in Details (${customNote.trim()})`
    : `harmonious with the ${styleLabel} style`

  return `CASE 2 — CUSTOM DESIGN: No reference image. Apply nail art based on these specifications: Shape: ${shapeLabel}, Length: ${lengthLabel}, Style: ${styleLabel}, Color: ${color}, Details: ${details}. Create a photorealistic nail design matching these exact specifications.`
}

function buildCase3Prompt(
  occasion?: string,
  occasionLabel?: string,
  hasOutfit?: boolean,
): string {
  const occasionText = occasionLabel?.trim()
    || (occasion ? OCCASION_LABELS[occasion.toLowerCase()] : null)
    || 'the chosen occasion'
  const outfitDescription = hasOutfit
    ? 'the outfit shown in Image 2'
    : 'an outfit appropriate for the occasion'

  return `CASE 3 — EMMA AI: No reference image. The user is wearing ${outfitDescription} for ${occasionText}. Select the most complementary and elegant nail design for this outfit and occasion. Consider the colors, style and formality of the outfit.`
}

function buildFinalPrompt(
  mode: GenerationMode,
  shape?: string,
  style?: string,
  length?: string,
  customNote?: string,
  occasion?: string,
  occasionLabel?: string,
  hasOutfit?: boolean,
): string {
  let activeCase: string
  if (mode === 'inspiration') {
    activeCase = CASE_1_INSPIRATION
  } else if (mode === 'emma') {
    activeCase = buildCase3Prompt(occasion, occasionLabel, hasOutfit)
  } else {
    if (!shape || !style || !length) {
      throw new Error('shape, style and length are required for onboarding mode')
    }
    activeCase = buildCase2Prompt(shape, style, length, customNote)
  }

  return `${PROMPT_INTRO}\n${activeCase}\n${PROMPT_RULES}`
}

function buildFormat(
  source: GenerationSource,
  mode: string,
  aspectRatio: string,
  shape?: string,
  style?: string,
  length?: string,
): string {
  const ar = mapAspectRatio(aspectRatio)
  const sizeLabel = source === 'post_payment'
    ? `gpt-image-2 · 2K · ${ar}`
    : `nano-banana-2 · 2K · ${ar}`

  if (mode === 'onboarding' && shape && style && length) {
    return `${mode} · ${shape}/${style}/${length} · ${sizeLabel}`
  }
  return `${mode} · ${sizeLabel}`
}

function toDataUri(base64: string): string {
  if (base64.startsWith('data:')) return base64
  return `data:image/jpeg;base64,${base64}`
}

function parseDataUri(dataUri: string): { mime: string; bytes: Uint8Array; ext: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
  if (!match) throw new Error('Invalid image data URI')
  const mime = match[1]
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg'
  const binary = atob(match[2])
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return { mime, bytes, ext }
}

async function uploadDataUriToStorage(
  supabase: ReturnType<typeof createClient>,
  dataUri: string,
  label: string,
): Promise<string> {
  const { mime, bytes, ext } = parseDataUri(dataUri)
  const path = `kie-input/${label}-${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('nail-images').upload(path, bytes, {
    contentType: mime,
    upsert: true,
  })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  const { data } = supabase.storage.from('nail-images').getPublicUrl(path)
  return data.publicUrl
}

async function getGenerationCost(supabase: ReturnType<typeof createClient>): Promise<number> {
  const { data } = await supabase.from('admin_settings').select('value').eq('key', 'generation_cost_eur').maybeSingle()
  const v = data?.value
  return typeof v === 'number' ? v : Number(v) || 0.08
}

async function logGeneration(
  supabase: ReturnType<typeof createClient>,
  entry: Record<string, unknown>,
) {
  try {
    await supabase.from('generation_logs').insert(entry)
  } catch (e) {
    console.error('generation log error:', e)
  }
}

function extractFalResultUrl(json: { images?: Array<{ url?: string }> }): string {
  const url = json.images?.[0]?.url
  if (!url) throw new Error('No result image URL')
  return url
}

function extractKieResultUrl(resultJson: string | undefined): string {
  if (!resultJson) throw new Error('Kie.ai returned no result')
  const parsed = JSON.parse(resultJson)
  const url = parsed?.resultUrls?.[0] || parsed?.images?.[0]?.url || parsed?.images?.[0]
  if (!url || typeof url !== 'string') throw new Error('No result image URL from Kie.ai')
  return url
}

async function pollKieTask(apiKey: string, taskId: string, maxAttempts: number, intervalMs: number): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, intervalMs))

    const statusRes = await fetch(`${KIE_AI_API}/jobs/recordInfo?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })
    const statusJson = await statusRes.json()
    const state = statusJson.data?.state

    if (state === 'success') {
      return extractKieResultUrl(statusJson.data?.resultJson)
    }

    if (state === 'fail') {
      throw new Error(statusJson.data?.failMsg || statusJson.msg || 'Kie.ai generation failed')
    }
  }

  throw new Error('Kie.ai generation timed out')
}

async function uploadImagesForKie(
  supabase: ReturnType<typeof createClient>,
  imageDataUris: string[],
  prefix: string,
): Promise<string[]> {
  const urls: string[] = []
  for (let i = 0; i < imageDataUris.length; i++) {
    urls.push(await uploadDataUriToStorage(supabase, imageDataUris[i], `${prefix}-${i + 1}`))
  }
  return urls
}

async function generateWithKieGptImage2(
  apiKey: string,
  supabase: ReturnType<typeof createClient>,
  imageDataUris: string[],
  prompt: string,
): Promise<string> {
  const inputUrls = await uploadImagesForKie(supabase, imageDataUris, 'final')

  const createRes = await fetch(`${KIE_AI_API}/jobs/createTask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: KIE_GPT_IMAGE_2_MODEL,
      input: {
        prompt,
        input_urls: inputUrls,
        aspect_ratio: 'auto',
        resolution: '2K',
      },
    }),
  })

  const createJson = await createRes.json()
  if (createJson.code !== 200) {
    throw new Error(createJson.msg || createJson.message || 'Kie.ai createTask failed')
  }

  const taskId = createJson.data?.taskId
  if (!taskId) throw new Error('Kie.ai did not return a taskId')

  return pollKieTask(apiKey, taskId, 90, 2000)
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
    aspect_ratio: mapAspectRatio(aspectRatio),
    resolution: '2K',
    output_format: 'png',
    num_images: 1,
    limit_generations: true,
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
    return extractFalResultUrl(await directRes.json())
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

  for (let i = 0; i < 45; i++) {
    await new Promise((r) => setTimeout(r, 800))

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
      return extractFalResultUrl(await resultRes.json())
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

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const started = Date.now()
  let pendingLog: Record<string, unknown> | null = null

  try {
    const body = await req.json()
    const {
      photoBase64,
      mode = 'onboarding',
      shape,
      style,
      length,
      customNote,
      inspirationBase64,
      outfitBase64,
      occasion,
      occasionLabel,
      aspectRatio = 'auto',
      userId,
      userEmail,
      visualizationId,
      source,
    } = body as {
      photoBase64: string
      mode?: GenerationMode
      shape?: string
      style?: string
      length?: string
      customNote?: string
      inspirationBase64?: string
      outfitBase64?: string
      occasion?: string
      occasionLabel?: string
      aspectRatio?: string
      userId?: string
      userEmail?: string
      visualizationId?: string
      source?: GenerationSource
    }

    const isPostPayment = source === 'post_payment'
    const effectiveAspectRatio = isPostPayment ? 'auto' : aspectRatio

    const costEur = await getGenerationCost(supabase)

    const logBase = {
      user_id: userId || null,
      visualization_id: visualizationId || null,
      user_email: userEmail || null,
      mode,
      shape: shape || null,
      style: style || null,
      length: length || null,
      custom_note: customNote || null,
      aspect_ratio: effectiveAspectRatio,
      format: buildFormat(source || mode, mode, effectiveAspectRatio, shape, style, length),
      estimated_cost_eur: costEur,
      source: source || mode,
    }
    pendingLog = logBase

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

    const imageDataUris = [toDataUri(photoBase64)]

    if (mode === 'inspiration' && inspirationBase64) {
      imageDataUris.push(toDataUri(inspirationBase64))
    }

    if (outfitBase64) {
      imageDataUris.push(toDataUri(outfitBase64))
    }

    let prompt: string
    let resultImageUrl: string
    let provider: string

    if (isPostPayment) {
      const kieKey = Deno.env.get('KIE_AI_API_KEY')
      if (!kieKey) throw new Error('KIE_AI_API_KEY not configured')
      prompt = buildFinalPrompt(
        mode,
        shape,
        style,
        length,
        customNote,
        occasion,
        occasionLabel,
        !!outfitBase64,
      )
      resultImageUrl = await generateWithKieGptImage2(kieKey, supabase, imageDataUris, prompt)
      provider = 'kie-final'
    } else {
      const falKey = Deno.env.get('FAL_KEY')
      if (!falKey) throw new Error('FAL_KEY not configured')
      prompt = buildFinalPrompt(
        mode,
        shape,
        style,
        length,
        customNote,
        occasion,
        occasionLabel,
        !!outfitBase64,
      )
      resultImageUrl = await generateWithFal(
        falKey,
        imageDataUris,
        prompt,
        effectiveAspectRatio,
      )
      provider = 'fal'
    }

    await logGeneration(supabase, {
      ...logBase,
      prompt,
      result_image_url: resultImageUrl,
      status: 'success',
      latency_ms: Date.now() - started,
    })

    return new Response(
      JSON.stringify({ resultImageUrl, mode, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    await logGeneration(supabase, {
      ...(pendingLog || {}),
      mode: pendingLog?.mode || 'unknown',
      prompt: '—',
      format: pendingLog?.format || '—',
      status: 'failed',
      error_message: err.message,
      estimated_cost_eur: 0,
      latency_ms: Date.now() - started,
    })
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
