import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import CreditCounter from '../components/dashboard/CreditCounter'
import UploadZone from '../components/dashboard/UploadZone'
import RecommendationCard from '../components/dashboard/RecommendationCard'
import RecommendationChat from '../components/dashboard/RecommendationChat'
import NewVisualizationFlow from '../components/dashboard/NewVisualizationFlow'
import HistoryList from '../components/dashboard/HistoryList'
import { useCredits } from '../contexts/CreditContext'
import { getFunnelResult, clearFunnelResult, clearSelectedPlan } from '../lib/funnelSession'

function UnlockedDesignCard({ result, onView }) {
  const resultImg = result?.result_image_url || result?.resultImage

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl overflow-hidden shadow-lg shadow-brown/10 border border-nude/30"
    >
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs font-semibold text-beige-dark uppercase tracking-wide mb-1">Ton design est débloqué ✨</p>
        <h2 className="font-heading text-2xl font-bold text-brown">Tes ongles parfaits t&apos;attendent</h2>
      </div>
      {resultImg && (
        <button type="button" onClick={onView} className="block w-full aspect-[4/3] overflow-hidden">
          <img src={resultImg} alt="Ton design" className="w-full h-full object-cover" />
        </button>
      )}
      <div className="p-5">
        <button
          type="button"
          onClick={onView}
          className="w-full bg-brown text-offwhite py-3.5 rounded-2xl font-semibold text-sm hover:bg-brown-light transition-colors"
        >
          Voir mon design en détail →
        </button>
      </div>
    </motion.div>
  )
}

export default function Dashboard() {
  const location = useLocation()
  const navigate = useNavigate()
  const [chatOpen, setChatOpen] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const { addToHistory } = useCredits()
  const [unlockedResult, setUnlockedResult] = useState(location.state?.result || null)

  useEffect(() => {
    if (location.state?.result) {
      addToHistory(location.state.result)
      setUnlockedResult(location.state.result)
      return
    }

    const pending = getFunnelResult()
    if (pending) {
      addToHistory(pending)
      setUnlockedResult(pending)
      clearFunnelResult()
      clearSelectedPlan()
    }
  }, [addToHistory, location.state?.result])

  const handleViewDesign = () => {
    if (!unlockedResult) return
    navigate(`/app/result/${unlockedResult.id}`, { state: { result: unlockedResult } })
  }

  return (
    <>
      <div className="pt-20 pb-24 px-4">
        <div className="max-w-lg mx-auto space-y-6">
          {unlockedResult && (
            <UnlockedDesignCard result={unlockedResult} onView={handleViewDesign} />
          )}
          <CreditCounter />
          <UploadZone onStart={() => setFlowOpen(true)} />
          <RecommendationCard onClick={() => setChatOpen(true)} />
          <HistoryList limit={3} />
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && <RecommendationChat open={chatOpen} onClose={() => setChatOpen(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {flowOpen && <NewVisualizationFlow open={flowOpen} onClose={() => setFlowOpen(false)} />}
      </AnimatePresence>
    </>
  )
}
