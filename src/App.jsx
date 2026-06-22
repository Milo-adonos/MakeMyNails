import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import ScrollToTop from './components/layout/ScrollToTop'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import HistoryPage from './pages/HistoryPage'
import Profile from './pages/Profile'
import Purchase from './pages/Purchase'
import PurchaseSuccess from './pages/PurchaseSuccess'
import AuthCallback from './pages/AuthCallback'
import Result from './pages/Result'
import { useAuth } from './contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  if (!isAuthenticated) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <div className="min-h-screen bg-offwhite">
      <ScrollToTop />
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/onboarding/pricing" element={<Onboarding />} />
        <Route path="/result" element={<Result />} />
        <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/app/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
        <Route path="/app/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/app/purchase" element={<ProtectedRoute><Purchase /></ProtectedRoute>} />
        <Route path="/app/purchase/success" element={<ProtectedRoute><PurchaseSuccess /></ProtectedRoute>} />
        <Route path="/app/result/:id" element={<ProtectedRoute><Result /></ProtectedRoute>} />
      </Routes>
    </div>
  )
}
