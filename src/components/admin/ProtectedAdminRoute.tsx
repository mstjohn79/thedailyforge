import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { AdminPanel } from './AdminPanel'
import { DatabaseManager } from '../../lib/database'

interface ProtectedAdminRouteProps {
  dbManager: DatabaseManager
}

export function ProtectedAdminRoute({ dbManager }: ProtectedAdminRouteProps) {
  const { user, isAuthenticated } = useAuthStore()

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect to dashboard if not admin
  if (!user?.is_admin) {
    return <Navigate to="/" replace />
  }

  // Show admin panel if user is admin
  return <AdminPanel dbManager={dbManager} />
}
