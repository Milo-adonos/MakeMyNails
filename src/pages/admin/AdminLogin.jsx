import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { adminApi, setAdminToken } from '../../lib/adminApi'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await adminApi.login(password)
      setAdminToken(token)
      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-offwhite to-nude-light/40 flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-10">
          <img
            src="/logo.webp"
            alt="MakeMyNails"
            className="w-20 h-20 rounded-2xl object-cover mx-auto mb-6 shadow-lg shadow-nude-dark/20"
          />
          <h1 className="font-heading text-3xl font-bold text-brown">Admin</h1>
          <p className="text-brown-light/60 text-sm mt-2">Accès réservé</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 shadow-sm shadow-brown/10 border border-nude/30 space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brown-light/40" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3.5 bg-offwhite border border-nude/50 rounded-2xl text-sm text-brown outline-none focus:ring-2 focus:ring-nude-dark/30"
            />
          </div>
          {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brown text-offwhite py-4 rounded-2xl font-semibold hover:bg-brown-light transition-colors disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
