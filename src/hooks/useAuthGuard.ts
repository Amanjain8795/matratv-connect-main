import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export const useAuthGuard = (redirectOnUnauthenticated = true) => {
  const { isAuthenticated, loading, requestLogin } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated && redirectOnUnauthenticated) {
      requestLogin()
    }
  }, [isAuthenticated, loading, redirectOnUnauthenticated, requestLogin])

  return {
    isAuthenticated,
    loading,
    canAccess: !loading && isAuthenticated
  }
}

export const useRequireAuth = () => {
  const { isAuthenticated, loading, requestLogin } = useAuth()

  const requireAuth = (callback: () => void) => {
    if (!isAuthenticated) {
      requestLogin()
      return false
    }
    callback()
    return true
  }

  return {
    isAuthenticated,
    loading,
    requireAuth
  }
}

export default useAuthGuard
