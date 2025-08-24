import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { Lock, Mail, Home, Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAdminAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your admin email address')
      return
    }

    if (!password) {
      toast.error('Please enter your password')
      return
    }

    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Welcome to Admin Panel!')
    } catch (error: any) {
      console.error('Login error:', error)
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        email: email,
        passwordLength: password.length
      })
      toast.error(error.message || 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">

        

        <Card className="shadow-xl">
          <CardHeader className="text-center">
            {/* Back to Home Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <Home className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>
            <CardTitle className="text-xl">Administrator Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the management console
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Verifying...' : 'Access Admin Panel'}
              </Button>
              
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Lock className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">Secure Access</span>
              </div>
              <p className="text-sm text-blue-700">
                Enter your registered email and password to access the admin panel.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
