import { AdminApp } from '@/components/admin/AdminApp'
import { seedDefaultAdmin } from '@/lib/admin-setup'
import { useEffect } from 'react'

const Admin = () => {
  useEffect(() => {
    // Initialize admin table and seed default admin
    seedDefaultAdmin().catch(console.error)
  }, [])

  return <AdminApp />
}

export default Admin
