import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const KIE_AI_API = 'https://api.kie.ai'
const KIE_AI_MODEL = 'nano-banana-2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const baseStyleDescriptions: Record<string, string> = {
  french: 'classic French tip manicure: apply a sheer natural pink or nude gel base coat on every nail, then add a perfectly crisp opaque white smile line at the free edge of each nail tip, with a smooth curve separating the two tones, finished with a high-gloss top coat',
  color: 'solid-color gel polish manicure: apply one single uniform opaque color evenly on every nail, zero streaks, ultra-glossy mirror-like top coat, smooth flawless surface',
  nailart: 'artistic designer nail art manicure: hand-painted motifs, delicate line work, micro details on every nail, editorial high-fashion look',
  gradient: 'seamless ombre gradient manicure: two harmonious colors blended with an airbrush-smooth transition from cuticle to free edge on every nail, no visible demarcation line, glossy top coat',
  minimalist: 'minimalist modern manicure: clean understated elegance on every nail, subtle accents, negative-space detail, refined finish',
  chrome: 'liquid chrome mirror manicure: flawless high-shine metallic reflective surface on every nail, zero brush marks, mirror-ball reflectivity, smooth seamless chrome pigment application over gel base',
}

const shapeDescriptions: Record<string, string> = {
  almond: 'almond shape: sides filed inward symmetrically tapering to a soft rounded peak at the tip center',
  square: 'square shape: free edge filed perfectly straight across at 90 degrees with sharp clean corners',
  stiletto: 'stiletto shape: sides filed into a dramatic long narrow taper converging to a sharp point',
  coffin: 'coffin/ballerina shape: long nail tapered inward then filed flat straight across at the tip',
  oval: 'oval shape: free edge filed into a smooth elliptical curve with a symmetrical rounded tip',
  ballerina: 'ballerina shape: long elegant nail with sides tapering gradually inward, filed flat across at the free edge tip',
}

const lengthDescriptions: Record<string, string> = {
  short: 'short length (nails extend only 1-2mm past fingertip)',
  medium: 'medium length (nails extend approximately 4-6mm past fingertip)',
  long: 'long length (nails extend approximately 8-12mm past fingertip)',
}

function buildPrompt(
  shape: string,
  style: string,
  length: string,
  customNote?: string,
  hasInspirationPhoto?: boolean,
  hasOutfitPhoto?: boolean,
): string {
  const baseStyle = baseStyleDescriptions[style.toLowerCase()] || `${style} style professional manicure on every nail`
  const shapeDesc = shapeDescriptions[shape.toLowerCase()] || `${shape}-shaped nails`
  const lengthDesc = lengthDescriptions[length.toLowerCase()] || `${length} length nails`

  const hasCustom = customNote && customNote.trim().length > 0
  const custom = hasCustom ? customNote!.trim() : ''

  const globalConstraints = [
    `CRITICAL RULES — FOLLOW ALL OF THESE:`,
    `1. The OUTPUT must be an edited version of IMAGE 1 (the hand photo). Do NOT generate a new image. Do NOT output any other image.`,
    `2. Apply the manicure to EVERY SINGLE visible nail on EVERY visible hand. If two hands are visible, both hands must have the manicure. No nail should be left untouched.`,
    `3. Every nail must have the SAME style, SAME shape, SAME length, SAME finish. Perfect uniformity across all nails.`,
    `4. Preserve EXACTLY: hand position, finger placement, skin color, skin texture, wrinkles, jewelry, rings, background, lighting, shadows, and camera angle. Change NOTHING except the nails.`,
    `5. The result must be 100% photorealistic — indistinguishable from a real photo taken after a premium salon visit. Sharp focus on nails, natural lighting.`,
  ]

  if (hasInspirationPhoto) {
    const imageCount = hasOutfitPhoto ? 3 : 2
    const parts: string[] = [
      `You are given ${imageCount} reference images.`,
      `IMAGE 1 = the client's real hand photo. This is the ONLY image you must edit and output.`,
      `IMAGE 2 = a nail design inspiration photo. Use it ONLY as visual reference for the decorative design: the painted patterns, artwork, colors, textures, and artistic motifs visible on the nails in that photo.`,
    ]

    if (hasOutfitPhoto) {
      parts.push(`IMAGE ${imageCount} = the client's outfit. Analyze its dominant colors and style, then choose nail colors that complement and harmonize with the outfit.`)
    }

    parts.push(
      `YOUR TASK: Reproduce the EXACT same nail design from IMAGE 2 onto the nails in IMAGE 1.`,
      `Copy PRECISELY from IMAGE 2: the same patterns, same colors, same motifs, same artistic details, same color placement, same decorative elements. The result must look like the same nail artist applied the exact same design on the client's real hands.`,
      `IMPORTANT: Do NOT output IMAGE 2 as the result. The output must be IMAGE 1 (the client's hand) with the design from IMAGE 2 painted onto its nails.`,
      `IGNORE from IMAGE 2: the hand, the skin, the fingers, the nail shape, and the nail length. Only copy the painted design.`,
      `NAIL SHAPE (use this, NOT the shape in IMAGE 2): ${shapeDesc}.`,
      `NAIL LENGTH (use this, NOT the length in IMAGE 2): ${lengthDesc}.`,
    )

    if (hasCustom) {
      parts.push(`CLIENT REQUEST (highest priority): "${custom}". Apply this on top of everything else.`)
    }

    parts.push(...globalConstraints)
    return parts.join('\n')
  }

  // Standard flow
  const imageCountStd = hasOutfitPhoto ? 2 : 1
  const parts: string[] = []

  if (hasOutfitPhoto) {
    parts.push(
      `You are given ${imageCountStd} images.`,
      `IMAGE 1 = the client's hand photo. This is the ONLY image you must edit and output.`,
      `IMAGE 2 = the client's outfit. Analyze its dominant colors and style, then choose nail polish colors that complement and harmonize with the outfit perfectly.`,
    )
  } else {
    parts.push(`Edit the provided hand photo to show a flawless professional manicure.`)
  }

  if (hasCustom) {
    parts.push(
      `CLIENT REQUEST (highest priority): "${custom}". This OVERRIDES any default color or detail below. Apply this request exactly as described.`,
    )
  }

  parts.push(
    `MANICURE STYLE: ${baseStyle}.`,
    `NAIL SHAPE: ${shapeDesc}. Apply this exact shape to every nail.`,
    `NAIL LENGTH: ${lengthDesc}. Apply this exact length to every nail.`,
  )

  if (hasCustom) {
    parts.push(`Adapt the style above to incorporate the client's request ("${custom}"). The client's wish overrides default colors and details.`)
  }

  parts.push(...globalConstraints)
  return parts.join('\n')
}

async function submitGeneration(apiKey: string, imageUrls: string[], prompt: string): Promise<string> {
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
        aspect_ratio: '3:4',
        resolution: '2K',
        output_format: 'jpg',
      },
    }),
  })

  const json = await res.json()
  if (json.code !== 200) throw new Error(json.msg || json.message || 'Generation failed')
  return json.data.taskId
}

async function pollTaskResult(apiKey: string, taskId: string): Promise<string> {
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 3000))

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

    const { photoBase64, shape, style, length, customNote, inspirationBase64, outfitBase64 } = await req.json()

    if (!photoBase64 || !shape || !style || !length) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const uploadImage = async (b64: string, prefix: string): Promise<string> => {
      const filename = `temp/${prefix}-${crypto.randomUUID()}.jpg`
      const raw = b64.split(',')[1] || b64
      const binary = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0))
      const { error } = await supabase.storage
        .from('nail-images')
        .upload(filename, binary, { contentType: 'image/jpeg', upsert: true })
      if (error) throw new Error(`Upload failed: ${error.message}`)
      const { data } = supabase.storage.from('nail-images').getPublicUrl(filename)
      return data.publicUrl
    }

    const photoUrl = await uploadImage(photoBase64, 'hand')
    const imageUrls = [photoUrl]

    if (inspirationBase64) {
      const inspoUrl = await uploadImage(inspirationBase64, 'inspo')
      imageUrls.push(inspoUrl)
    }

    if (outfitBase64) {
      const outfitUrl = await uploadImage(outfitBase64, 'outfit')
      imageUrls.push(outfitUrl)
    }

    const prompt = buildPrompt(shape, style, length, customNote, !!inspirationBase64, !!outfitBase64)
    const taskId = await submitGeneration(kieAiKey, imageUrls, prompt)
    const resultImageUrl = await pollTaskResult(kieAiKey, taskId)

    return new Response(
      JSON.stringify({ resultImageUrl, taskId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
