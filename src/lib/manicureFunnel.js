export const INSPO_DEFAULTS = { shape: 'oval', style: 'nailart', length: 'medium' }

export const MANICURE_SELECTION_STEPS = ['photo', 'inspiration', 'shape', 'style', 'length']

export function buildGenPayload(data, overrides = {}) {
  const hasInspo = !!data.inspirationPhoto
  return {
    photo: data.photo,
    mode: hasInspo ? 'inspiration' : 'onboarding',
    shape: data.shape,
    style: data.style,
    length: data.length,
    customNote: data.customNote,
    inspirationPhoto: data.inspirationPhoto,
    outfitPhoto: data.outfitPhoto,
    ...overrides,
  }
}

export function getManicureProgressSteps(skipStyleSteps) {
  return skipStyleSteps
    ? ['photo', 'inspiration']
    : MANICURE_SELECTION_STEPS
}

export function getManicureProgressPercent(step, skipStyleSteps) {
  const steps = getManicureProgressSteps(skipStyleSteps)
  if (!steps.includes(step)) return 0
  return ((steps.indexOf(step) + 1) / steps.length) * 100
}

export const EMPTY_MANICURE_DATA = {
  photo: null,
  shape: null,
  style: null,
  length: null,
  customNote: '',
  inspirationPhoto: null,
  outfitPhoto: null,
}
