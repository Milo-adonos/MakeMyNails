import { Navigate } from 'react-router-dom'
import { getAdminToken } from '../../lib/adminApi'
import AdminLogin from './AdminLogin'
import AdminPanel from './AdminPanel'

export function AdminGate() {
  if (getAdminToken()) return <Navigate to="/admin/dashboard" replace />
  return <AdminLogin />
}

export function AdminDashboardGate() {
  if (!getAdminToken()) return <Navigate to="/admin" replace />
  return <AdminPanel />
}
