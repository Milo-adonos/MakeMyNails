import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import ScrollToTop from './components/layout/ScrollToTop'
import Landing from './pages/Landing'
import { useAuth } from './contexts/AuthContext'

const Navbar = lazy(() => import('./components/layout/Navbar'))

const Login = lazy(() => import('./pages/Login'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const Profile = lazy(() => import('./pages/Profile'))
const Purchase = lazy(() => import('./pages/Purchase'))
const PurchaseSuccess = lazy(() => import('./pages/PurchaseSuccess'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const Result = lazy(() => import('./pages/Result'))

function PageFallback() {
  return <div className="min-h-screen bg-offwhite" aria-hidden="true" />
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <PageFallback />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const location = useLocation()
  const isApp = location.pathname.startsWith('/app')

  return (
    <div className="min-h-screen bg-offwhite">
      <ScrollToTop />
      {isApp && (
        <Suspense fallback={null}>
          <Navbar />
        </Suspense>
      )}
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/onboarding/pricing" element={<Onboarding />} />
          <Route path="/onboarding/signup" element={<Onboarding />} />
          <Route path="/onboarding/checkout" element={<Onboarding />} />
          <Route path="/result" element={<Result />} />
          <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/app/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/app/purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
          <Route path="/app/purchase/success" element={<ProtectedRoute><PurchaseSuccess /></ProtectedRoute>} />
          <Route path="/app/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </div>
  )
}
