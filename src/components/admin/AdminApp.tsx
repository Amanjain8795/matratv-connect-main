import React from 'react'
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext'
import { AdminLogin } from './AdminLogin'
import { AdminDashboard } from './AdminDashboard'

const AdminContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAdminAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <div className="text-lg font-medium">Loading Admin Panel...</div>
          <div className="text-sm text-gray-600">Please wait while we verify your credentials</div>
        </div>
      </div>
    )
  }

  return isAuthenticated ? <AdminDashboard /> : <AdminLogin />
}

export const AdminApp: React.FC = () => {
  return (
    <AdminAuthProvider>
      <AdminContent />
    </AdminAuthProvider>
  )
}
