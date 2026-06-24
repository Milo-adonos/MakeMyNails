import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import ScrollToTop from './components/layout/ScrollToTop'
import Landing from './pages/Landing'
import { useAuth } from './contexts/AuthContext'
import { FUNNEL_PATHS, ROUTES } from './lib/routes'

const Navbar = lazy(() => import('./components/layout/Navbar'))
const GenerationBanner = lazy(() => import('./components/dashboard/GenerationBanner'))

const Login = lazy(() => import('./pages/Login'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const Profile = lazy(() => import('./pages/Profile'))
const Purchase = lazy(() => import('./pages/Purchase'))
const PurchaseSuccess = lazy(() => import('./pages/PurchaseSuccess'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Result = lazy(() => import('./pages/Result'))
const AdminGate = lazy(() => import('./pages/admin/AdminRoutes').then((m) => ({ default: m.AdminGate })))
const AdminDashboardGate = lazy(() => import('./pages/admin/AdminRoutes').then((m) => ({ default: m.AdminDashboardGate })))

function PageFallback() {
  return <div className="min-h-screen bg-offwhite" aria-hidden="true" />
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageFallback />
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />
  return children
}

function LegacyResultRedirect() {
  const { id } = useParams()
  return <Navigate to={ROUTES.dashboardResult(id)} replace />
}

export default function App() {
  const location = useLocation()
  const isApp = location.pathname.startsWith(ROUTES.dashboard)

  return (
    <div className="min-h-screen bg-offwhite">
      <ScrollToTop />
      {isApp && (
        <Suspense fallback={null}>
          <Navbar />
          <GenerationBanner />
        </Suspense>
      )}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Navigate to={ROUTES.landing} replace />} />
          <Route path={ROUTES.landing} element={<Landing />} />
          <Route path={ROUTES.login} element={<Login />} />
          <Route path={ROUTES.authCallback} element={<AuthCallback />} />
          {FUNNEL_PATHS.map((path) => (
            <Route key={path} path={path} element={<Onboarding />} />
          ))}
          <Route path={ROUTES.result} element={<Result />} />
          <Route path={ROUTES.admin} element={<AdminGate />} />
          <Route path={ROUTES.adminDashboard} element={<AdminDashboardGate />} />
          <Route path={ROUTES.dashboard} element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path={ROUTES.dashboardHistory} element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path={ROUTES.dashboardProfile} element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path={ROUTES.dashboardPurchase} element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
          <Route path={ROUTES.dashboardPurchaseSuccess} element={<ProtectedRoute><PurchaseSuccess /></ProtectedRoute>} />
          <Route path="/dashboard/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />

          {/* Anciennes URLs → redirections */}
          <Route path="/onboarding" element={<Navigate to={ROUTES.welcome} replace />} />
          <Route path="/onboarding/pricing" element={<Navigate to={ROUTES.pricing} replace />} />
          <Route path="/onboarding/signup" element={<Navigate to={ROUTES.signup} replace />} />
          <Route path="/onboarding/checkout" element={<Navigate to={ROUTES.stripeCheckout} replace />} />
          <Route path="/preview" element={<Navigate to={ROUTES.pricing} replace />} />
          <Route path="/app" element={<Navigate to={ROUTES.dashboard} replace />} />
          <Route path="/app/history" element={<Navigate to={ROUTES.dashboardHistory} replace />} />
          <Route path="/app/profile" element={<Navigate to={ROUTES.dashboardProfile} replace />} />
          <Route path="/app/purchase" element={<Navigate to={ROUTES.dashboardPurchase} replace />} />
          <Route path="/app/purchase/success" element={<Navigate to={ROUTES.dashboardPurchaseSuccess} replace />} />
          <Route path="/app/result/:id" element={<LegacyResultRedirect />} />
        </Routes>
      </Suspense>
    </div>
  )
}
