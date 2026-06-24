export const ROUTES = {
  landing: '/landing',
  welcome: '/welcome',
  takepicture: '/takepicture',
  inspo: '/inspo',
  shape: '/shape',
  style: '/style',
  length: '/length',
  loading: '/loading',
  pricing: '/pricing',
  signup: '/signup',
  stripeCheckout: '/stripe-checkout',
  login: '/login',
  authCallback: '/auth/callback',
  result: '/result',
  dashboard: '/dashboard',
  dashboardHistory: '/dashboard/history',
  dashboardProfile: '/dashboard/profile',
  dashboardPurchase: '/dashboard/purchase',
  dashboardPurchaseSuccess: '/dashboard/purchase/success',
  dashboardResult: (id) => `/dashboard/result/${id}`,
  admin: '/admin',
  adminDashboard: '/admin/dashboard',
}

/** Funnel step id → URL path */
export const FUNNEL_STEP_PATH = {
  welcome: ROUTES.welcome,
  photo: ROUTES.takepicture,
  inspiration: ROUTES.inspo,
  shape: ROUTES.shape,
  style: ROUTES.style,
  length: ROUTES.length,
  processing: ROUTES.loading,
  pricing: ROUTES.pricing,
  signup: ROUTES.signup,
  checkout: ROUTES.stripeCheckout,
}

/** URL path → funnel step id */
export const PATH_TO_FUNNEL_STEP = Object.fromEntries(
  Object.entries(FUNNEL_STEP_PATH).map(([step, path]) => [path, step]),
)

export const FUNNEL_PATHS = Object.values(FUNNEL_STEP_PATH)

export function funnelStepFromPath(pathname) {
  return PATH_TO_FUNNEL_STEP[pathname] || null
}
