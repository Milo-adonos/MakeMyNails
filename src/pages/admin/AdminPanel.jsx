import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, BarChart3, Wallet, Settings, RefreshCw, LogOut, EyeOff,
} from 'lucide-react'
import { adminApi, clearAdminToken, getAdminToken } from '../../lib/adminApi'

const TABS = [
  { id: 'overview', label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'analytics', label: 'Analyses', icon: BarChart3 },
  { id: 'finances', label: 'Finances', icon: Wallet },
  { id: 'settings', label: 'Paramètres', icon: Settings },
]

function fmt(n) {
  return `${Number(n || 0).toFixed(2)} €`
}

function fmtPct(n) {
  return `${Number(n || 0).toFixed(1)} %`
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-nude/30 shadow-sm">
      <p className="text-xs text-brown-light/60 uppercase tracking-wide mb-1">{label}</p>
      <p className="font-heading text-2xl font-bold text-brown">{value}</p>
      {sub && <p className="text-xs text-brown-light/50 mt-1">{sub}</p>}
    </div>
  )
}

function MiniChart({ data, label, color = 'bg-nude-dark' }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="bg-white rounded-2xl p-5 border border-nude/30 shadow-sm">
      <p className="text-sm font-semibold text-brown mb-4">{label}</p>
      <div className="flex items-end gap-1 h-32">
        {data.map((d) => (
          <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div
              className={`w-full rounded-t ${color} opacity-80`}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              title={`${d.date}: ${d.value}`}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[9px] text-brown-light/40">
        <span>{data[0]?.date?.slice(5)}</span>
        <span>{data[data.length - 1]?.date?.slice(5)}</span>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [logs, setLogs] = useState([])
  const [finances, setFinances] = useState(null)
  const [settings, setSettings] = useState(null)
  const [userFilters, setUserFilters] = useState({ plan: 'all', status: 'all', search: '' })
  const [settingsForm, setSettingsForm] = useState({
    generationCostEur: '0.08',
    notificationEmail: '',
    maintenanceMode: false,
    newPassword: '',
  })
  const [saveMsg, setSaveMsg] = useState('')

  const load = useCallback(async () => {
    if (!getAdminToken()) {
      navigate('/admin', { replace: true })
      return
    }
    try {
      if (tab === 'overview') {
        const data = await adminApi.overview()
        setOverview(data)
        setUpdatedAt(data.updatedAt)
      } else if (tab === 'users') {
        const data = await adminApi.users(userFilters)
        setUsers(data.users)
        setUpdatedAt(data.updatedAt)
      } else if (tab === 'analytics') {
        const data = await adminApi.analytics()
        setLogs(data.logs)
        setUpdatedAt(data.updatedAt)
      } else if (tab === 'finances') {
        const data = await adminApi.finances()
        setFinances(data)
        setUpdatedAt(data.updatedAt)
      } else if (tab === 'settings') {
        const data = await adminApi.getSettings()
        setSettings(data)
        setSettingsForm({
          generationCostEur: String(data.settings?.generation_cost_eur ?? 0.08),
          notificationEmail: String(data.settings?.admin_notification_email ?? ''),
          maintenanceMode: data.settings?.maintenance_mode === true,
          newPassword: '',
        })
        setUpdatedAt(data.updatedAt)
      }
    } catch {
      clearAdminToken()
      navigate('/admin', { replace: true })
    } finally {
      setLoading(false)
    }
  }, [tab, userFilters, navigate])

  useEffect(() => {
    setLoading(true)
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  const handleLogout = () => {
    clearAdminToken()
    navigate('/admin', { replace: true })
  }

  const handleSaveSettings = async () => {
    setSaveMsg('')
    try {
      await adminApi.updateSettings({
        generationCostEur: parseFloat(settingsForm.generationCostEur),
        notificationEmail: settingsForm.notificationEmail,
        maintenanceMode: settingsForm.maintenanceMode,
        newPassword: settingsForm.newPassword || undefined,
      })
      setSaveMsg('Paramètres enregistrés')
      setSettingsForm((f) => ({ ...f, newPassword: '' }))
      load()
    } catch (err) {
      setSaveMsg(err.message)
    }
  }

  const subDelta = overview
    ? overview.newSubs30 - overview.newSubsPrev
    : 0

  return (
    <div className="min-h-screen bg-offwhite">
      <header className="sticky top-0 z-50 glass-strong border-b border-nude/30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.webp" alt="" className="w-8 h-8 rounded-xl" />
            <span className="font-heading text-xl font-semibold text-brown">MakeMyNails Admin</span>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-[10px] text-brown-light/50 hidden sm:block">
                MAJ {fmtDate(updatedAt)}
              </span>
            )}
            <button
              type="button"
              onClick={() => { setLoading(true); load() }}
              className="flex items-center gap-1.5 text-sm text-brown bg-nude/40 px-3 py-1.5 rounded-xl hover:bg-nude/60 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Rafraîchir
            </button>
            <button type="button" onClick={handleLogout} className="p-2 text-brown-light/60 hover:text-brown">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <nav className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                tab === id ? 'bg-brown text-offwhite' : 'text-brown-light hover:bg-nude/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="CA Total (30j)" value={fmt(overview.revenue30)} />
              <StatCard
                label="Bénéfice net"
                value={fmt(overview.netProfit)}
                sub={`Marge ${fmtPct(overview.marginPct)}`}
              />
              <StatCard label="Coût IA total (30j)" value={fmt(overview.aiCost30)} />
              <StatCard label="Abonnées actives" value={overview.activeSubscribers} />
              <StatCard label="Total abonnées" value={overview.totalSubscribers} sub="actives + annulées" />
              <StatCard
                label="Nouvelles abonnées (30j)"
                value={overview.newSubs30}
                sub={subDelta >= 0 ? `+${subDelta} vs mois précédent` : `${subDelta} vs mois précédent`}
              />
              <StatCard
                label="Nouvelles inscriptions (30j)"
                value={overview.newUsers30}
                sub={`${overview.newUsers30 - overview.newUsersPrev >= 0 ? '+' : ''}${overview.newUsers30 - overview.newUsersPrev} vs mois précédent`}
              />
              <StatCard
                label="Churn (30j)"
                value={fmtPct(overview.churnPct)}
                sub={`${overview.churnCount} annulation(s)`}
              />
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <MiniChart data={overview.revenueChart} label="Revenus quotidiens (30j)" color="bg-beige-dark" />
              <MiniChart data={overview.generationsChart} label="Générations quotidiennes (30j)" color="bg-nude-dark" />
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <select
                value={userFilters.plan}
                onChange={(e) => setUserFilters((f) => ({ ...f, plan: e.target.value }))}
                className="text-sm bg-white border border-nude/50 rounded-xl px-3 py-2 text-brown"
              >
                <option value="all">Tous les plans</option>
                <option value="premium">Premium</option>
                <option value="exclusif_ia">Exclusif IA</option>
              </select>
              <select
                value={userFilters.status}
                onChange={(e) => setUserFilters((f) => ({ ...f, status: e.target.value }))}
                className="text-sm bg-white border border-nude/50 rounded-xl px-3 py-2 text-brown"
              >
                <option value="all">Tous statuts</option>
                <option value="active">Actif</option>
                <option value="canceled">Annulé</option>
              </select>
              <input
                type="search"
                placeholder="Rechercher par email..."
                value={userFilters.search}
                onChange={(e) => setUserFilters((f) => ({ ...f, search: e.target.value }))}
                className="flex-1 min-w-[200px] text-sm bg-white border border-nude/50 rounded-xl px-4 py-2 text-brown"
              />
            </div>
            <div className="bg-white rounded-2xl border border-nude/30 overflow-x-auto shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-nude/20 text-left text-xs text-brown-light/60 uppercase">
                    <th className="p-3">Email</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Inscription</th>
                    <th className="p-3">Générations</th>
                    <th className="p-3">Coût IA</th>
                    <th className="p-3">CA</th>
                    <th className="p-3">Net</th>
                    <th className="p-3" />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-nude/10 hover:bg-nude/10">
                      <td className="p-3 text-brown">{u.email}</td>
                      <td className="p-3">{u.plan}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          u.statusKey === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-brown-light/60">{fmtDate(u.registeredAt)}</td>
                      <td className="p-3">{u.generations}</td>
                      <td className="p-3">{fmt(u.aiCost)}</td>
                      <td className="p-3">{fmt(u.revenue)}</td>
                      <td className="p-3 font-medium">{fmt(u.net)}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => adminApi.hideUser(u.id).then(load)}
                          className="text-xs text-brown-light/50 hover:text-brown flex items-center gap-1"
                        >
                          <EyeOff className="w-3 h-3" /> Masquer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="bg-white rounded-2xl border border-nude/30 overflow-x-auto shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-nude/20 text-left text-xs text-brown-light/60 uppercase">
                  <th className="p-3">Aperçu</th>
                  <th className="p-3">Utilisateur</th>
                  <th className="p-3">Prompt</th>
                  <th className="p-3">Format</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Coût</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-nude/10 hover:bg-nude/10">
                    <td className="p-3">
                      {log.result_image_url ? (
                        <img src={log.result_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-nude/30" />
                      )}
                    </td>
                    <td className="p-3 text-xs">{log.user_email || '—'}</td>
                    <td className="p-3 max-w-xs truncate text-xs text-brown-light/70" title={log.prompt}>{log.prompt}</td>
                    <td className="p-3 text-xs capitalize">{log.format || `${log.mode} · ${log.aspect_ratio || '—'}`}</td>
                    <td className="p-3 text-xs text-brown-light/60">{fmtDate(log.created_at)}</td>
                    <td className="p-3">{fmt(log.estimated_cost_eur)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'finances' && finances && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Revenus (30j)" value={fmt(finances.revenue30)} />
              <StatCard label="Revenus (7j)" value={fmt(finances.revenue7)} />
              <StatCard label="Coûts fal.ai (30j)" value={fmt(finances.aiCost30)} />
              <StatCard label="Bénéfice net (30j)" value={fmt(finances.net30)} />
            </div>
            <div className="bg-white rounded-2xl border border-nude/30 overflow-x-auto shadow-sm">
              <h3 className="p-4 font-semibold text-brown border-b border-nude/20">Paiements Stripe</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-nude/20 text-left text-xs text-brown-light/60 uppercase">
                    <th className="p-3">Date</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {finances.payments.map((p) => (
                    <tr key={p.id} className="border-b border-nude/10">
                      <td className="p-3 text-xs">{fmtDate(p.created_at)}</td>
                      <td className="p-3 text-xs">{p.user_email || '—'}</td>
                      <td className="p-3 text-xs">{p.event_type}</td>
                      <td className="p-3">{p.plan || '—'}</td>
                      <td className="p-3 font-medium">{fmt(p.amount_eur)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'settings' && settings && (
          <div className="max-w-lg space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-nude/30 shadow-sm space-y-4">
              <div>
                <label className="text-xs text-brown-light/60 block mb-1">Coût par génération (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={settingsForm.generationCostEur}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, generationCostEur: e.target.value }))}
                  className="w-full bg-offwhite border border-nude/50 rounded-xl px-4 py-3 text-sm text-brown"
                />
              </div>
              <div>
                <label className="text-xs text-brown-light/60 block mb-1">Email de notification admin</label>
                <input
                  type="email"
                  value={settingsForm.notificationEmail}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, notificationEmail: e.target.value }))}
                  className="w-full bg-offwhite border border-nude/50 rounded-xl px-4 py-3 text-sm text-brown"
                />
              </div>
              <div>
                <label className="text-xs text-brown-light/60 block mb-1">Nouveau mot de passe admin</label>
                <input
                  type="password"
                  placeholder="Laisser vide pour ne pas changer"
                  value={settingsForm.newPassword}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, newPassword: e.target.value }))}
                  className="w-full bg-offwhite border border-nude/50 rounded-xl px-4 py-3 text-sm text-brown"
                />
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm text-brown">Mode maintenance</span>
                <input
                  type="checkbox"
                  checked={settingsForm.maintenanceMode}
                  onChange={(e) => setSettingsForm((f) => ({ ...f, maintenanceMode: e.target.checked }))}
                  className="w-5 h-5 accent-brown"
                />
              </label>
              <p className="text-xs text-brown-light/50">
                Désactive les nouvelles inscriptions quand activé.
              </p>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="w-full bg-brown text-offwhite py-3 rounded-xl font-semibold text-sm hover:bg-brown-light transition-colors"
              >
                Enregistrer
              </button>
              {saveMsg && <p className="text-xs text-center text-brown-light/60">{saveMsg}</p>}
            </div>
            <div className="bg-white rounded-2xl p-6 border border-nude/30 shadow-sm space-y-4">
              <div>
                <p className="text-sm font-semibold text-brown mb-2">Remise à zéro des compteurs</p>
                <p className="text-xs text-brown-light/50 mb-3">
                  Efface générations, paiements, annulations et connexions loguées. Les utilisateurs et abonnements ne sont pas touchés.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm('Réinitialiser tous les compteurs et stats du dashboard ?')) return
                    await adminApi.resetStats()
                    load()
                  }}
                  className="w-full border border-red-200 text-red-500 py-3 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Réinitialiser tous les compteurs
                </button>
              </div>
              <div className="border-t border-nude/20 pt-4">
                <p className="text-sm text-brown mb-1">
                  Annulations churn (30j) : <strong>{settings.cancellationCount}</strong>
                </p>
                <button
                  type="button"
                  onClick={() => adminApi.resetChurn().then(load)}
                  className="mt-3 text-xs text-brown-light/50 hover:text-brown underline"
                >
                  Réinitialiser le compteur churn uniquement
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
