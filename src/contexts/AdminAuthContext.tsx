import React, { createContext, useContext, useState, useEffect } from 'react'
import { Admin, authenticateAdmin } from '@/lib/supabase'

interface AdminAuthContextType {
  admin: Admin | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}

interface AdminAuthProviderProps {
  children: React.ReactNode
}

export const AdminAuthProvider: React.FC<AdminAuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check if admin is already logged in (from localStorage)
    const storedAdmin = localStorage.getItem('admin_session')
    if (storedAdmin) {
      try {
        const adminData = JSON.parse(storedAdmin)
        setAdmin(adminData)
      } catch (error) {
        console.error('Error parsing stored admin data:', error)
        localStorage.removeItem('admin_session')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const adminData = await authenticateAdmin(email, password)
      setAdmin(adminData)
      localStorage.setItem('admin_session', JSON.stringify(adminData))
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setAdmin(null)
    localStorage.removeItem('admin_session')
  }

  const isAuthenticated = !!admin

  const value: AdminAuthContextType = {
    admin,
    isLoading,
    login,
    logout,
    isAuthenticated
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}
