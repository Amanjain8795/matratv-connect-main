import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import QRCode from 'react-qr-code'
import { useAdminAuth } from '@/contexts/AdminAuthContext'
import { RewardConfigManager } from './RewardConfigManager'
import { OrderDetailDialog } from './OrderDetailDialog'
import {
  getAllWithdrawalRequests,
  updateWithdrawalRequestStatus,
  addNewAdmin,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  updateProductStock,
  getAdminAnalytics,
  getAllUsers,
  updateUserByAdmin,
  deleteUserByAdmin,
  getAllOrders,
  updateOrderStatus,
  getAdminUPIs,
  addAdminUPI,
  updateAdminUPI,
  deleteAdminUPI,
  setPrimaryAdminUPI,
  setDefaultUPI,
  getAllSubscriptionRequests,
  updateSubscriptionRequestStatus,
  updateUserSubscriptionStatus,
  getPaymentProofUrl,
  WithdrawalRequest,
  Product,
  UserProfile,
  Order,
  AdminUPI,
  SubscriptionRequest,
  supabase,
  testSupabaseConnection,
  isSupabaseAvailable
} from '@/lib/supabase'
import { hasAdminAccess, supabaseAdmin } from '@/lib/supabase-admin'
import { validatePasswordStrength, generateSecurePassword } from '@/lib/password-utils'
import {
  LogOut,
  RefreshCw,
  Check,
  X,
  Eye,
  EyeOff,
  QrCode,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  ShoppingBag,
  IndianRupee,
  Package,
  Wallet,
  TrendingUp,
  Settings,
  Bell,
  BarChart3,
  DollarSign,
  ArrowUpIcon,
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  Menu,
  AlertCircle,
  Crown,
  CreditCard,
  Copy,
  Shield,
  Home,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Activity,
  User,
  Zap,
  Target,
  Briefcase,
  Filter,
  MoreVertical,
  Lock
} from 'lucide-react'

interface WithdrawalRequestWithUser extends WithdrawalRequest {
  user_profiles: {
    full_name: string
    email: string
    phone?: string
  } | null
}

interface SubscriptionRequestWithProfile extends SubscriptionRequest {
  user_profile?: {
    full_name: string;
    phone?: string;
  };
}

interface DashboardStats {
  totalUsers: number
  totalOrders: number
  totalRevenue: number
  totalProducts: number
  pendingWithdrawals: number
  monthlyRevenue: number
  weeklyOrders: number
  activeUsers: number
  pendingSubscriptions: number
}

interface UpiPaymentNotification {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  upi_id: string;
  transaction_reference?: string;
  status: 'pending' | 'verified' | 'rejected';
  user_message?: string;
  admin_notes?: string;
  created_at: string;
  verified_at?: string;
  verified_by?: string;
  user_email?: string;
  user_name?: string;
  order_total?: number;
}

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: Home, description: 'Dashboard overview' },
  { id: 'withdrawals', label: 'Withdrawals', icon: Wallet, description: 'Manage withdrawals' },
  { id: 'subscriptions', label: 'Subscriptions', icon: Crown, description: 'Subscription management' },
  { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Payment verification' },
  { id: 'products', label: 'Products', icon: Package, description: 'Product catalog' },
  { id: 'orders', label: 'Orders', icon: ShoppingBag, description: 'Order management' },
  { id: 'users', label: 'Users', icon: Users, description: 'User management' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, description: 'Analytics & reports' },
  { id: 'settings', label: 'Settings', icon: Settings, description: 'System settings' },
]

export const AdminDashboard: React.FC = () => {
  const { admin, logout } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'disconnected'>('testing')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    pendingWithdrawals: 0,
    monthlyRevenue: 0,
    weeklyOrders: 0,
    activeUsers: 0,
    pendingSubscriptions: 0
  })

  // Withdrawals
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequestWithUser[]>([])
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequestWithUser | null>(null)
  const [actionDialog, setActionDialog] = useState<'approve' | 'reject' | 'payment' | 'add-admin' | null>(null)
  const [adminNotes, setAdminNotes] = useState('')

  // Admin management
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminPassword, setNewAdminPassword] = useState('')
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])

  // Products
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [productDialog, setProductDialog] = useState<'add' | 'edit' | 'delete' | null>(null)
  const [productFormData, setProductFormData] = useState({
    name: '',
    description: '',
    price: 0,
    category: 'sanitary-pads',
    stock_quantity: 0,
    is_active: true,
    image_url: ''
  })

  // Users and Orders
  const [users, setUsers] = useState<UserProfile[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetailDialogOpen, setOrderDetailDialogOpen] = useState(false)
  const [userDialog, setUserDialog] = useState<'edit' | 'delete' | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [editUser, setEditUser] = useState({ full_name: '', email: '', phone: '' })

  const handleEditUserSubmit = async () => {
    if (!selectedUser) return
    try {
      const updated = await updateUserByAdmin(selectedUser.user_id, {
        full_name: editUser.full_name,
        email: editUser.email,
        phone: editUser.phone
      })
      setUsers((prev) => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))
      toast.success('User updated successfully')
      setUserDialog(null)
    } catch (error: any) {
      toast.error(error?.message || 'Failed to update user')
    }
  }

  // UPI Management
  const [adminUPIs, setAdminUPIs] = useState<AdminUPI[]>([])
  const [selectedUPI, setSelectedUPI] = useState<AdminUPI | null>(null)
  const [upiDialog, setUpiDialog] = useState<'add' | 'edit' | 'delete' | 'qr' | null>(null)
  const [upiLoading, setUpiLoading] = useState(false)
  const [upiFormData, setUpiFormData] = useState({
    upi_id: '',
    upi_name: '',
    is_primary: false
  })

  // Subscriptions
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequestWithProfile[]>([])
  const [selectedSubscriptionRequest, setSelectedSubscriptionRequest] = useState<SubscriptionRequestWithProfile | null>(null)
  const [subscriptionDialog, setSubscriptionDialog] = useState<'approve' | 'reject' | 'view' | null>(null)
  const [subscriptionNotes, setSubscriptionNotes] = useState('')
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null)

  // Payment Notifications
  const [paymentNotifications, setPaymentNotifications] = useState<UpiPaymentNotification[]>([])
  const [selectedNotification, setSelectedNotification] = useState<UpiPaymentNotification | null>(null)
  const [notificationDialog, setNotificationDialog] = useState<'verify' | 'reject' | 'details' | null>(null)
  const [verificationAction, setVerificationAction] = useState<'verified' | 'rejected'>('verified')

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    const initializeDashboard = async () => {
      const isConnected = await testSupabaseConnection()
      setConnectionStatus(isConnected ? 'connected' : 'disconnected')
      await loadDashboardData()
    }
    initializeDashboard()
  }, [admin])

  // Auto-collapse sidebar on mobile and handle resize
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)

      if (isMobileView) {
        setSidebarCollapsed(true)
        // Don't force close mobile menu on resize, let user control it
      } else if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
        setMobileMenuOpen(false) // Close mobile menu when switching to desktop
      } else {
        setSidebarCollapsed(false)
        setMobileMenuOpen(false) // Close mobile menu when switching to desktop
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu when clicking outside or swiping
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mobileMenuOpen && isMobile) {
        // Check if the click target is outside the sidebar
        const sidebar = document.querySelector('[data-sidebar]')
        const mobileMenuButton = document.querySelector('[data-mobile-menu-button]')
        
        if (sidebar && !sidebar.contains(e.target as Node) && 
            mobileMenuButton && !mobileMenuButton.contains(e.target as Node)) {
          setMobileMenuOpen(false)
        }
      }
    }

    const handleSwipe = (e: TouchEvent) => {
      if (mobileMenuOpen && isMobile) {
        const touch = e.touches[0]
        const startX = touch.clientX
        
        const handleTouchMove = (moveEvent: TouchEvent) => {
          const currentX = moveEvent.touches[0].clientX
          const diff = startX - currentX
          
          if (diff > 50) { // Swipe left to close
            setMobileMenuOpen(false)
            document.removeEventListener('touchmove', handleTouchMove)
          }
        }
        
        document.addEventListener('touchmove', handleTouchMove, { passive: true })
        document.addEventListener('touchend', () => {
          document.removeEventListener('touchmove', handleTouchMove)
        }, { once: true })
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('touchstart', handleSwipe, { passive: true })
      return () => {
        document.removeEventListener('click', handleClickOutside)
        document.removeEventListener('touchstart', handleSwipe)
      }
    }
  }, [mobileMenuOpen, isMobile])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      // Load data first
      await Promise.all([
        loadWithdrawalRequests(),
        loadProducts(),
        loadUsers(),
        loadOrders(),
        loadAdminUPIs(),
        loadSubscriptionRequests(),
        loadPaymentNotifications()
      ])
      // Then load stats after other data is loaded
      await loadStats()
    } catch (error: any) {
      console.error('Error loading dashboard data:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error('Failed to load dashboard data')
    } finally {
      setIsLoading(false)
    }
  }

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await getAllWithdrawalRequests()
      setWithdrawalRequests(requests)
    } catch (error: any) {
      console.error('Error loading withdrawal requests:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
    }
  }

  const loadStats = async () => {
    try {
      const analytics = await getAdminAnalytics()
      const pendingWithdrawals = withdrawalRequests.filter(r => r.status === 'pending').length
      const pendingSubscriptions = subscriptionRequests.filter(r => r.status === 'pending').length

      setStats({
        totalUsers: analytics.totalUsers || users.length,
        totalOrders: analytics.totalOrders || orders.length,
        totalRevenue: analytics.totalRevenue || 0,
        totalProducts: analytics.totalProducts || products.length,
        pendingWithdrawals: analytics.pendingWithdrawals || pendingWithdrawals,
        monthlyRevenue: analytics.monthlyRevenue || 0,
        weeklyOrders: analytics.weeklyOrders || 0,
        activeUsers: analytics.activeUsers || users.length,
        pendingSubscriptions
      })
    } catch (error: any) {
      console.error('Error loading stats:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      // Use current loaded data as fallback
      setStats({
        totalUsers: users.length,
        totalOrders: orders.length,
        totalRevenue: 0,
        totalProducts: products.length,
        pendingWithdrawals: withdrawalRequests.filter(r => r.status === 'pending').length,
        monthlyRevenue: 0,
        weeklyOrders: 0,
        activeUsers: users.length,
        pendingSubscriptions: subscriptionRequests.filter(r => r.status === 'pending').length
      })
    }
  }

  const loadProducts = async () => {
    try {
      const productsData = await getAllProducts()
      setProducts(productsData)
    } catch (error: any) {
      console.error('Error loading products:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
    }
  }

  const loadUsers = async () => {
    setUsersLoading(true)
    try {
      const usersData = await getAllUsers()
      setUsers(usersData)
    } catch (error: any) {
      console.error('Error loading users:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error('Failed to load users')
    } finally {
      setUsersLoading(false)
    }
  }

  const loadOrders = async () => {
    setOrdersLoading(true)
    try {
      const ordersData = await getAllOrders()
      setOrders(ordersData)
    } catch (error: any) {
      console.error('Error loading orders:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error('Failed to load orders')
    } finally {
      setOrdersLoading(false)
    }
  }

  const loadAdminUPIs = async () => {
    if (!admin?.id) return
    setUpiLoading(true)
    try {
      const upiData = await getAdminUPIs(admin.id)
      setAdminUPIs(upiData)
    } catch (error: any) {
      console.error('Error loading admin UPIs:', error)
      setAdminUPIs([])
    } finally {
      setUpiLoading(false)
    }
  }

  const loadSubscriptionRequests = async () => {
    try {
      const requests = await getAllSubscriptionRequests()
      setSubscriptionRequests(requests)
    } catch (error: any) {
      console.error('Error loading subscription requests:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
    }
  }

  const loadPaymentNotifications = async () => {
    try {
      // Use admin client for admin operations
      const client = hasAdminAccess ? supabaseAdmin! : supabase
      
      console.log('🔧 Loading payment notifications...')
      console.log('Admin access available:', hasAdminAccess)
      console.log('Using client:', hasAdminAccess ? 'supabaseAdmin' : 'supabase')
      
      const { data, error } = await client
        .from('upi_payment_notifications')
        .select(`
          *,
          orders:order_id (
            id,
            total_amount,
            user_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === '42P01') {
          console.log('Payment notifications table does not exist yet')
          setPaymentNotifications([])
          return
        }
        throw error
      }

      // Get user details for each notification
      const notificationsWithUsers = await Promise.all(
        (data || []).map(async (notification) => {
          try {
            // Get user profile from user_profiles table
            const { data: userProfile } = await client
              .from('user_profiles')
              .select('full_name')
              .eq('user_id', notification.user_id)
              .single()

            return {
              ...notification,
              user_name: userProfile?.full_name || 'Unknown User',
              order_total: notification.orders?.total_amount || notification.amount
            }
          } catch (error) {
            return {
              ...notification,
              user_name: 'Unknown User',
              order_total: notification.orders?.total_amount || notification.amount
            }
          }
        })
      )

      console.log('✅ Payment notifications loaded:', notificationsWithUsers.length)
      setPaymentNotifications(notificationsWithUsers)
    } catch (error: any) {
      console.error('❌ Error loading payment notifications:', error?.message || 'Unknown error')
      console.error('Error details:', error)
      setPaymentNotifications([])
    }
  }

  // Withdrawal handlers
  const handleApprove = async () => {
    if (!selectedRequest || !admin) return

    try {
      await updateWithdrawalRequestStatus(
        selectedRequest.id,
        'approved',
        admin.id,
        adminNotes
      )
      
      toast.success('Withdrawal request approved!')
      setActionDialog('payment')
      loadWithdrawalRequests()
      loadStats()
    } catch (error: any) {
      console.error('Error approving request:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error(`Failed to approve request: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleReject = async () => {
    if (!selectedRequest || !admin) return

    try {
      await updateWithdrawalRequestStatus(
        selectedRequest.id,
        'rejected',
        admin.id,
        adminNotes
      )
      
      toast.success('Withdrawal request rejected')
      closeDialogs()
      loadWithdrawalRequests()
      loadStats()
    } catch (error: any) {
      console.error('Error rejecting request:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error(`Failed to reject request: ${error?.message || 'Unknown error'}`)
    }
  }

  // Admin management handlers
  const handleAddAdmin = async () => {
    if (!newAdminEmail || !newAdminName || !newAdminPassword || !admin) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate password
    const passwordValidation = validatePasswordStrength(newAdminPassword)
    if (!passwordValidation.valid) {
      setPasswordErrors(passwordValidation.errors)
      toast.error('Password does not meet requirements')
      return
    }

    try {
      await addNewAdmin(newAdminEmail, newAdminPassword, newAdminName, admin.id)
      toast.success(`Admin added successfully! ${newAdminEmail} can now access the admin panel.`)
      setNewAdminEmail('')
      setNewAdminName('')
      setNewAdminPassword('')
      setPasswordErrors([])
      setActionDialog(null)
    } catch (error: any) {
      console.error('Error adding admin:', error)
      toast.error(error.message || 'Failed to add admin')
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword(12)
    setNewAdminPassword(newPassword)
    setPasswordErrors([])
    toast.success('Secure password generated! Make sure to share it with the new admin.')
  }

  const handlePasswordChange = (password: string) => {
    setNewAdminPassword(password)
    if (password) {
      const validation = validatePasswordStrength(password)
      setPasswordErrors(validation.errors)
    } else {
      setPasswordErrors([])
    }
  }

  // Product handlers
  const handleCreateProduct = async () => {
    if (!admin || !productFormData.name || !productFormData.price) {
      toast.error('Please fill in required fields (name and price)')
      return
    }

    try {
      await createProduct(productFormData)
      toast.success('Product created successfully!')
      setProductDialog(null)
      resetProductForm()
      loadProducts()
      loadStats()
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Failed to create product')
    }
  }

  const handleUpdateProduct = async () => {
    if (!admin || !selectedProduct || !productFormData.name || !productFormData.price) {
      toast.error('Please fill in required fields')
      return
    }

    try {
      await updateProduct(selectedProduct.id, productFormData)
      toast.success('Product updated successfully!')
      setProductDialog(null)
      resetProductForm()
      loadProducts()
    } catch (error: any) {
      console.error('Error updating product:', error)
      toast.error(error.message || 'Failed to update product')
    }
  }

  const handleDeleteProduct = async () => {
    if (!admin || !selectedProduct) return

    try {
      await deleteProduct(selectedProduct.id)
      toast.success('Product deleted successfully!')
      setProductDialog(null)
      setSelectedProduct(null)
      loadProducts()
      loadStats()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      toast.error(error.message || 'Failed to delete product')
    }
  }

  const resetProductForm = () => {
    setProductFormData({
      name: '',
      description: '',
      price: 0,
      category: 'sanitary-pads',
      stock_quantity: 0,
      is_active: true,
      image_url: ''
    })
    setSelectedProduct(null)
  }

  const openProductDialog = (type: 'add' | 'edit' | 'delete', product?: Product) => {
    if (type === 'edit' && product) {
      setSelectedProduct(product)
      setProductFormData({
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.category || 'sanitary-pads',
        stock_quantity: product.stock_quantity,
        is_active: product.is_active,
        image_url: product.image_url || ''
      })
    } else if (type === 'delete' && product) {
      setSelectedProduct(product)
    } else {
      resetProductForm()
    }
    setProductDialog(type)
  }

  // UPI handlers
  const handleAddUPI = async () => {
    if (!admin?.id || !upiFormData.upi_id || !upiFormData.upi_name) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await addAdminUPI(admin.id, upiFormData.upi_id, upiFormData.upi_name, upiFormData.is_primary)
      toast.success('UPI added successfully!')
      resetUpiForm()
      setUpiDialog(null)
      loadAdminUPIs()
    } catch (error: any) {
      console.error('Error adding UPI:', error)
      toast.error(error.message || 'Failed to add UPI')
    }
  }

  const handleDeleteUPI = async () => {
    if (!admin?.id || !selectedUPI) return

    try {
      await deleteAdminUPI(admin.id, selectedUPI.upi_id)
      toast.success('UPI deleted successfully!')
      setUpiDialog(null)
      setSelectedUPI(null)
      loadAdminUPIs()
    } catch (error: any) {
      console.error('Error deleting UPI:', error)
      toast.error(error.message || 'Failed to delete UPI')
    }
  }

  const handleSetDefaultUPI = async (upiId: string) => {
    if (!admin?.id) return
    try {
      await setDefaultUPI(admin.id, upiId)
      toast.success('Default UPI set successfully!')
      loadAdminUPIs()
    } catch (error: any) {
      console.error('Error setting default UPI:', error)
      toast.error(error.message || 'Failed to set default UPI')
    }
  }

  const resetUpiForm = () => {
    setUpiFormData({
      upi_id: '',
      upi_name: '',
      is_primary: false
    })
    setSelectedUPI(null)
  }

  // Subscription handlers
  const handleApproveSubscription = async () => {
    if (!selectedSubscriptionRequest || !admin) return

    try {
      await updateSubscriptionRequestStatus(
        selectedSubscriptionRequest.id,
        'approved',
        admin.id,
        subscriptionNotes
      )
      
      toast.success('Subscription request approved!')
      closeSubscriptionDialogs()
      loadSubscriptionRequests()
      loadStats()
    } catch (error: any) {
      console.error('Error approving subscription:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error(`Failed to approve subscription: ${error?.message || 'Unknown error'}`)
    }
  }

  const handleRejectSubscription = async () => {
    if (!selectedSubscriptionRequest || !admin) return

    try {
      await updateSubscriptionRequestStatus(
        selectedSubscriptionRequest.id,
        'rejected',
        admin.id,
        subscriptionNotes
      )
      
      toast.success('Subscription request rejected')
      closeSubscriptionDialogs()
      loadSubscriptionRequests()
      loadStats()
    } catch (error: any) {
      console.error('Error rejecting subscription:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error(`Failed to reject subscription: ${error?.message || 'Unknown error'}`)
    }
  }

  const viewPaymentProof = async (request: SubscriptionRequestWithProfile) => {
    if (!request.payment_proof_url) {
      toast.error('No payment proof available')
      return
    }

    try {
      const url = await getPaymentProofUrl(request.payment_proof_url)
      if (url) {
        setPaymentProofUrl(url)
        setSelectedSubscriptionRequest(request)
        setSubscriptionDialog('view')
      } else {
        toast.error('Failed to load payment proof')
      }
    } catch (error: any) {
      console.error('Error viewing payment proof:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error
      })
      toast.error('Failed to load payment proof')
    }
  }

  const closeDialogs = () => {
    setActionDialog(null)
    setSelectedRequest(null)
    setAdminNotes('')
  }

  const closeSubscriptionDialogs = () => {
    setSubscriptionDialog(null)
    setSelectedSubscriptionRequest(null)
    setSubscriptionNotes('')
    setPaymentProofUrl(null)
  }

  const closeNotificationDialogs = () => {
    setNotificationDialog(null)
    setSelectedNotification(null)
    setAdminNotes('')
  }

  const openUPIApp = () => {
    if (!selectedRequest) return
    
    const upiUrl = `upi://pay?pa=${selectedRequest.upi_id}&pn=Withdrawal&am=${selectedRequest.amount}&cu=INR&tn=Withdrawal Payment`
    window.open(upiUrl, '_blank')
    toast.success('UPI app should open now. Complete the payment and mark as paid.')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
      case 'approved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>
      case 'verified':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN')
  }

  const filteredRequests = withdrawalRequests.filter(request => {
    const userProfile = request.user_profiles
    const matchesSearch = userProfile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userProfile?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.upi_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchTerm === ''
    const matchesFilter = filterStatus === 'all' || request.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const pendingNotifications = paymentNotifications.filter(n => n.status === 'pending')
  const pendingSubscriptions = subscriptionRequests.filter(req => req.status === 'pending')

  const totalPendingItems = stats.pendingWithdrawals + stats.pendingSubscriptions + pendingNotifications.length

  const currentSidebarItem = sidebarItems.find(item => item.id === activeTab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        data-sidebar
        className={`${
          isMobile
            ? mobileMenuOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : sidebarCollapsed
              ? 'w-16'
              : 'w-64'
        } ${isMobile ? 'fixed left-0 top-0 w-80' : 'relative'} h-full transition-all duration-300 ease-in-out bg-white border-r border-slate-200 shadow-lg flex flex-col z-50`}
        style={{
          transform: isMobile && !mobileMenuOpen ? 'translateX(-100%)' : 'translateX(0)'
        }}
      >

        
        {/* Sidebar Header */}
        <div className="p-3 md:p-4 border-b border-slate-200 flex items-center justify-between min-h-[60px]">
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-3 h-3 md:w-5 md:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm md:text-lg font-bold text-slate-900">Admin Panel</h1>
                <p className="text-xs text-slate-500 hidden md:block">Management Console</p>
              </div>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 hidden md:flex"
            >
              {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 md:hidden border border-slate-300 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              const hasBadge = (item.id === 'withdrawals' && stats.pendingWithdrawals > 0) ||
                             (item.id === 'subscriptions' && stats.pendingSubscriptions > 0) ||
                             (item.id === 'payments' && pendingNotifications.length > 0)
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center ${sidebarCollapsed && !isMobile ? 'justify-center px-2' : 'px-3'} py-3 md:py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`${sidebarCollapsed && !isMobile ? 'h-5 w-5' : 'h-5 w-5 md:h-4 md:w-4 mr-3'} flex-shrink-0`} />
                  {(!sidebarCollapsed || isMobile) && (
                    <>
                      <span className="flex-1 text-left text-base md:text-sm">{item.label}</span>
                      {hasBadge && (
                        <Badge variant="destructive" className="ml-2 text-xs md:text-xs px-2 py-1 md:px-1.5 md:py-0.5">
                          {item.id === 'withdrawals' ? stats.pendingWithdrawals :
                           item.id === 'subscriptions' ? stats.pendingSubscriptions :
                           item.id === 'payments' ? pendingNotifications.length : 0}
                        </Badge>
                      )}
                    </>
                  )}
                  
                  {/* Tooltip for collapsed sidebar */}
                  {sidebarCollapsed && !isMobile && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                      {hasBadge && (
                        <span className="ml-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                          {item.id === 'withdrawals' ? stats.pendingWithdrawals :
                           item.id === 'subscriptions' ? stats.pendingSubscriptions :
                           item.id === 'payments' ? pendingNotifications.length : 0}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar Footer */}
        <div className="p-3 md:p-4 border-t border-slate-200 space-y-2">
          {(!sidebarCollapsed || isMobile) && (
            <div className="bg-slate-50 rounded-lg p-3 mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-xs md:text-sm font-medium text-slate-900 truncate">{admin?.full_name || 'Admin'}</span>
              </div>
              <p className="text-xs text-slate-500 truncate">{admin?.email}</p>
            </div>
          )}
          
          <div className={`flex ${sidebarCollapsed && !isMobile ? 'flex-col' : 'flex-row'} gap-2`}>
            <Button
              variant="outline"
              onClick={() => setActionDialog('add-admin')}
              className={`${sidebarCollapsed && !isMobile ? 'w-full p-2' : 'flex-1'}`}
              size="sm"
            >
              <UserPlus className="w-3 h-4" />
              {(!sidebarCollapsed || isMobile) && <span className="ml-1">Add Admin</span>}
            </Button>
            <Button
              variant="outline"
              onClick={logout}
              className={`${sidebarCollapsed && !isMobile ? 'w-full p-1' : 'flex-1'} text-red-600 hover:text-red-700 hover:bg-red-50`}
              size="sm"
            >
              <LogOut className="w-3 h-4" />
              {(!sidebarCollapsed || isMobile) && <span className="">Logout</span>}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 shadow-sm">
          <div className="px-3 md:px-4 lg:px-6">
            <div className="flex justify-between items-center py-3 md:py-4">
              <div className="flex items-center space-x-2 md:space-x-3">
                <Button
                  data-mobile-menu-button
                  variant="outline"
                  size="sm"
                  className="md:hidden border-slate-300 hover:bg-slate-50"
                  onClick={() => {
                    setMobileMenuOpen(!mobileMenuOpen)
                  }}
                >
                  <Menu className="h-5 w-5" />
                  <span className="ml-2 text-sm font-medium">Menu</span>
                </Button>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-slate-900 flex items-center">
                    {currentSidebarItem && <currentSidebarItem.icon className="w-4 h-4 md:w-5 md:h-5 mr-2" />}
                    {currentSidebarItem?.label || 'Dashboard'}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-600 hidden sm:block">{currentSidebarItem?.description}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 md:space-x-3">
                <Button
                  variant="outline"
                  onClick={loadDashboardData}
                  disabled={isLoading}
                  size="sm"
                  className="relative"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline ml-2">Refresh</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="hidden sm:inline ml-2">Notifications</span>
                  {totalPendingItems > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 text-xs px-1.5 py-0.5"
                    >
                      {totalPendingItems}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Status Alerts */}
        {(connectionStatus === 'disconnected' || !hasAdminAccess || !isSupabaseAvailable) && (
          <div className="p-3 md:p-4 space-y-2">
            {connectionStatus === 'disconnected' && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 text-sm">
                  <strong>Database Connection Failed:</strong> Unable to connect to Supabase.
                </AlertDescription>
              </Alert>
            )}

            {!hasAdminAccess && connectionStatus === 'connected' && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 text-sm">
                  <strong>Limited Admin Access:</strong> Service role key not configured.
                </AlertDescription>
              </Alert>
            )}

            {!isSupabaseAvailable && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800 text-sm">
                  <strong>Configuration Required:</strong> Supabase environment variables not configured.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-3 md:p-4 lg:p-6">
            {/* Mobile Header Spacer */}
            <div className="h-4 md:hidden"></div>
            {activeTab === 'overview' && (
              <div className="space-y-4 md:space-y-6">
                {/* Welcome Card */}
                <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-lg md:text-2xl font-bold mb-2">Welcome back, {admin?.full_name || admin?.email}!</h2>
                        <p className="text-blue-100 text-sm md:text-base">Here's what's happening with your business today.</p>
                      </div>
                      <div className="hidden md:block">
                        <Activity className="w-12 h-12 md:w-16 md:h-16 text-blue-200" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-slate-600">Total Revenue</p>
                          <p className="text-lg md:text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
                          <p className="text-xs text-green-600 flex items-center mt-1 hidden md:flex">
                            <ArrowUpIcon className="w-3 h-3 mr-1" />
                            +20.1%
                          </p>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <DollarSign className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-slate-600">Total Users</p>
                          <p className="text-lg md:text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
                          <p className="text-xs text-blue-600 flex items-center mt-1 hidden md:flex">
                            <ArrowUpIcon className="w-3 h-3 mr-1" />
                            Active
                          </p>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Users className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-slate-600">Total Orders</p>
                          <p className="text-lg md:text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
                          <p className="text-xs text-purple-600 flex items-center mt-1 hidden md:flex">
                            <ArrowUpIcon className="w-3 h-3 mr-1" />
                            All time
                          </p>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <ShoppingBag className="w-4 h-4 md:w-6 md:h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-slate-600">Pending Items</p>
                          <p className="text-lg md:text-2xl font-bold text-slate-900">{totalPendingItems}</p>
                          <p className="text-xs text-orange-600 flex items-center mt-1 hidden md:flex">
                            <Clock className="w-3 h-3 mr-1" />
                            Attention
                          </p>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" 
                    onClick={() => setActiveTab('withdrawals')}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Wallet className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-lg text-slate-900">Pending Withdrawals</h3>
                          <p className="text-xs md:text-sm text-slate-600">Requests awaiting approval</p>
                          <p className="text-xl md:text-2xl font-bold text-orange-600 mt-1">{stats.pendingWithdrawals}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" 
                    onClick={() => setActiveTab('subscriptions')}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Crown className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-lg text-slate-900">Pending Subscriptions</h3>
                          <p className="text-xs md:text-sm text-slate-600">Subscription requests</p>
                          <p className="text-xl md:text-2xl font-bold text-purple-600 mt-1">{stats.pendingSubscriptions}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card 
                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105" 
                    onClick={() => setActiveTab('payments')}
                  >
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center space-x-3 md:space-x-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm md:text-lg text-slate-900">Payment Verifications</h3>
                          <p className="text-xs md:text-sm text-slate-600">Payments to verify</p>
                          <p className="text-xl md:text-2xl font-bold text-blue-600 mt-1">{pendingNotifications.length}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Recent Activity
                    </CardTitle>
                    <CardDescription className="text-sm">Latest activities across your platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      {withdrawalRequests.slice(0, 5).map((request) => (
                        <div key={request.id} className="flex items-center space-x-3 md:space-x-4 p-3 bg-slate-50 rounded-lg">
                          <div className="w-6 h-6 md:w-8 md:h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <Wallet className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs md:text-sm font-medium text-slate-900 truncate">
                              Withdrawal request from {request.user_profiles?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatCurrency(request.amount)} • {formatDate(request.requested_at)}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'withdrawals' && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
                    <div>
                      <CardTitle className="flex items-center text-base md:text-lg">
                        <Wallet className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Withdrawal Management
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Manage user withdrawal requests and UPI payments
                      </CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" className="h-8 md:h-9 text-xs md:text-sm">
                        <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Search and Filter */}
                  <div className="flex flex-col space-y-3 md:flex-row md:space-y-0 md:space-x-4 mb-4 md:mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search by name, email, or UPI ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 text-sm"
                        />
                      </div>
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full md:w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Withdrawal Requests */}
                  {isLoading ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 text-sm md:text-base">Loading withdrawal requests...</p>
                    </div>
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <Wallet className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No withdrawal requests found</h3>
                      <p className="text-slate-500 text-sm md:text-base">Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {filteredRequests.map((request) => (
                        <Card key={request.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 md:p-6">
                            <div className="space-y-4">
                              <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-start md:space-y-0">
                                <div className="flex-1 w-full">
                                  <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-3 mb-3 md:mb-4">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-100 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 md:w-5 md:h-5 text-slate-600" />
                                      </div>
                                      <h3 className="text-base md:text-lg font-semibold text-slate-900">
                                        {request.user_profiles?.full_name || 'Unknown User'}
                                      </h3>
                                    </div>
                                    {getStatusBadge(request.status)}
                                  </div>
                                  
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                                    <div>
                                      <Label className="text-slate-500 text-xs md:text-sm">Email</Label>
                                      <p className="font-medium text-slate-900 text-sm md:text-base break-all">{request.user_profiles?.email || 'No email available'}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500 text-xs md:text-sm">Amount</Label>
                                      <p className="font-semibold text-green-600 text-base md:text-lg">{formatCurrency(request.amount)}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500 text-xs md:text-sm">UPI ID</Label>
                                      <p className="font-mono text-xs md:text-sm text-slate-900 break-all">{request.upi_id}</p>
                                    </div>
                                    <div>
                                      <Label className="text-slate-500 text-xs md:text-sm">Requested</Label>
                                      <p className="font-medium text-slate-900 text-sm md:text-base">{formatDate(request.requested_at)}</p>
                                    </div>
                                  </div>
                                  
                                  {request.admin_notes && (
                                    <div className="mt-3 md:mt-4 p-3 bg-slate-50 rounded-lg">
                                      <Label className="text-slate-500 text-xs md:text-sm">Admin Notes</Label>
                                      <p className="text-xs md:text-sm text-slate-700 mt-1">{request.admin_notes}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 pt-2 border-t">
                                {request.status === 'pending' && (
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedRequest(request)
                                        setActionDialog('approve')
                                      }}
                                      className="bg-green-600 hover:bg-green-700 flex-1 md:flex-none"
                                    >
                                      <Check className="w-4 h-4 mr-2" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedRequest(request)
                                        setActionDialog('reject')
                                      }}
                                      className="border-red-200 text-red-600 hover:bg-red-50 flex-1 md:flex-none"
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Reject
                                    </Button>
                                  </div>
                                )}
                                {request.status === 'approved' && (
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedRequest(request)
                                      setActionDialog('payment')
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
                                  >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    Pay Now
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-4 md:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <Crown className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-600" />
                      Pending Subscription Requests ({pendingSubscriptions.length})
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Subscription requests waiting for admin approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingSubscriptions.length === 0 ? (
                      <div className="text-center py-8 md:py-12">
                        <Crown className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No pending subscription requests</h3>
                        <p className="text-slate-500 text-sm md:text-base">All subscription requests have been processed</p>
                      </div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        {pendingSubscriptions.map((request) => (
                          <Card key={request.id} className="border-l-4 border-l-purple-500">
                            <CardContent className="p-4 md:p-6">
                              <div className="space-y-4">
                                <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-start md:space-y-0">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3 md:mb-4">
                                      <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Crown className="w-4 h-4 md:w-5 md:h-5 text-purple-600" />
                                      </div>
                                      <h3 className="text-base md:text-lg font-semibold text-slate-900">
                                        {request.user_profile?.full_name || 'Unknown User'}
                                      </h3>
                                      {getStatusBadge(request.status)}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 text-sm">
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">Amount</Label>
                                        <p className="font-semibold text-green-600 text-base md:text-lg">₹{request.amount}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">Transaction ID</Label>
                                        <p className="font-mono text-xs md:text-sm text-slate-900 break-all">{request.upi_transaction_id}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">Phone</Label>
                                        <p className="font-medium text-slate-900 text-sm md:text-base">{request.user_profile?.phone || 'N/A'}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">Requested</Label>
                                        <p className="font-medium text-slate-900 text-sm md:text-base">{formatDate(request.requested_at)}</p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 pt-2 border-t">
                                  {request.payment_proof_url && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => viewPaymentProof(request)}
                                      className="w-full md:w-auto"
                                    >
                                      <Eye className="w-4 h-4 mr-2" />
                                      View Proof
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedSubscriptionRequest(request)
                                      setSubscriptionDialog('approve')
                                    }}
                                    className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedSubscriptionRequest(request)
                                      setSubscriptionDialog('reject')
                                    }}
                                    className="border-red-200 text-red-600 hover:bg-red-50 w-full md:w-auto"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-4 md:space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-slate-600">Pending Payments</p>
                          <p className="text-xl md:text-3xl font-bold text-orange-600">{pendingNotifications.length}</p>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-4 h-4 md:w-6 md:h-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-slate-600">Verified Today</p>
                          <p className="text-xl md:text-3xl font-bold text-green-600">
                            {paymentNotifications.filter(n => 
                              n.status === 'verified' && 
                              new Date(n.verified_at || '').toDateString() === new Date().toDateString()
                            ).length}
                          </p>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs md:text-sm font-medium text-slate-600">Pending Amount</p>
                          <p className="text-lg md:text-3xl font-bold text-blue-600">
                            {formatCurrency(pendingNotifications.reduce((sum, n) => sum + n.amount, 0))}
                          </p>
                        </div>
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IndianRupee className="w-4 h-4 md:w-6 md:h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Pending Payments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <AlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 text-orange-600" />
                      Pending Payment Verifications
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Payment notifications requiring verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingNotifications.length === 0 ? (
                      <div className="text-center py-8 md:py-12">
                        <CheckCircle className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No pending payment verifications</h3>
                        <p className="text-slate-500 text-sm md:text-base">All payments have been processed</p>
                      </div>
                    ) : (
                      <div className="space-y-3 md:space-y-4">
                        {pendingNotifications.map((notification) => (
                          <Card key={notification.id} className="border-l-4 border-l-orange-500">
                            <CardContent className="p-4 md:p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-3 flex-1">
                                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:space-y-0 md:space-x-3">
                                      <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                        <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-orange-600" />
                                      </div>
                                      {getStatusBadge(notification.status)}
                                      <span className="text-lg md:text-xl font-bold text-slate-900">
                                        {formatCurrency(notification.amount)}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">User</Label>
                                        <p className="font-medium text-slate-900 text-sm md:text-base break-all">{notification.user_name} ({notification.user_email})</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">Order ID</Label>
                                        <p className="font-mono text-xs md:text-sm text-slate-900 break-all">{notification.order_id}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">UPI ID</Label>
                                        <p className="font-mono text-xs md:text-sm text-slate-900 break-all">{notification.upi_id}</p>
                                      </div>
                                      <div>
                                        <Label className="text-slate-500 text-xs md:text-sm">Submitted</Label>
                                        <p className="font-medium text-slate-900 text-sm md:text-base">{formatDate(notification.created_at)}</p>
                                      </div>
                                    </div>
                                    
                                    {(notification.transaction_reference || notification.user_message) && (
                                      <div className="space-y-2">
                                        {notification.transaction_reference && (
                                          <div>
                                            <Label className="text-slate-500 text-xs md:text-sm">Transaction Reference</Label>
                                            <p className="text-xs md:text-sm font-mono text-slate-900 break-all">{notification.transaction_reference}</p>
                                          </div>
                                        )}
                                        {notification.user_message && (
                                          <div>
                                            <Label className="text-slate-500 text-xs md:text-sm">User Message</Label>
                                            <p className="text-xs md:text-sm text-slate-700">{notification.user_message}</p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2 pt-2 border-t">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setSelectedNotification(notification)
                                      setVerificationAction('verified')
                                      setNotificationDialog('verify')
                                    }}
                                    className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Verify
                                  </Button>
                                  
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedNotification(notification)
                                      setVerificationAction('rejected')
                                      setNotificationDialog('verify')
                                    }}
                                    className="border-red-200 text-red-600 hover:bg-red-50 w-full md:w-auto"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'products' && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
                    <div>
                      <CardTitle className="flex items-center text-base md:text-lg">
                        <Package className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        Product Management
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Manage your product catalog, inventory, and pricing
                      </CardDescription>
                    </div>
                    <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
                      <Button
                        onClick={() => openProductDialog('add')}
                        className="bg-green-600 hover:bg-green-700 w-full md:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                      <Button variant="outline" onClick={loadProducts} className="w-full md:w-auto">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 text-sm md:text-base">Loading products...</p>
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <Package className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No products found</h3>
                      <p className="text-slate-500 mb-4 text-sm md:text-base">Get started by adding your first product</p>
                      <Button onClick={() => openProductDialog('add')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Product
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {products.map((product) => (
                        <Card key={product.id} className="hover:shadow-lg transition-all">
                          <CardContent className="p-4 md:p-6">
                            <div className="space-y-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  {product.image_url && (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-12 h-12 md:w-16 md:h-16 rounded-lg object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 text-sm md:text-base line-clamp-1">{product.name}</h3>
                                    <p className="text-xs md:text-sm text-slate-600 line-clamp-2 mt-1">
                                      {product.description}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                                  {product.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-slate-500 text-xs">Price</Label>
                                  <p className="font-semibold text-base md:text-lg">��{product.price}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-xs">Stock</Label>
                                  <p className={`font-semibold ${product.stock_quantity < 10 ? 'text-red-600' : 'text-green-600'}`}>
                                    {product.stock_quantity}
                                  </p>
                                </div>
                              </div>

                              <div className="flex flex-col space-y-2 pt-2 border-t">
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openProductDialog('edit', product)}
                                    className="flex-1"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openProductDialog('delete', product)}
                                    className="flex-1 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    const newStock = prompt('Enter new stock quantity:', product.stock_quantity.toString())
                                    if (newStock && !isNaN(Number(newStock))) {
                                      updateProductStock(product.id, Number(newStock)).then(() => {
                                        toast.success('Stock updated successfully!')
                                        loadProducts()
                                      }).catch(() => {
                                        toast.error('Failed to update stock')
                                      })
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-700 w-full"
                                >
                                  Update Stock
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'users' && (
              <Card>
                <CardHeader>
                  <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0">
                    <div>
                      <CardTitle className="flex items-center text-base md:text-lg">
                        <Users className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        User Management
                      </CardTitle>
                      <CardDescription className="text-sm">View and manage registered users</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" onClick={loadUsers} disabled={usersLoading} className="text-xs md:text-sm">
                        <RefreshCw className={`w-4 h-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      <Button variant="outline" className="text-xs md:text-sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 text-sm md:text-base">Loading users...</p>
                    </div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <Users className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No users found</h3>
                      <p className="text-slate-500 text-sm md:text-base">Users will appear here once they register</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                      {users.slice(0, 50).map((user) => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4 md:p-6">
                            <div className="space-y-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-slate-900 text-sm md:text-base line-clamp-1">{user.full_name || 'N/A'}</h3>
                                  <p className="text-xs md:text-sm text-slate-500">{formatDate(user.created_at)}</p>
                                </div>
                              </div>
                              
                              <div className="space-y-2 text-sm">
                                <div>
                                  <Label className="text-slate-500 text-xs">Email</Label>
                                  <p className="font-medium text-slate-900 text-xs md:text-sm break-all">{user.email || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-xs">Phone</Label>
                                  <p className="font-medium text-slate-900 text-sm md:text-base">{user.phone || 'N/A'}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-xs">Registration No.</Label>
                                  <p className="font-medium text-slate-900 text-xs md:text-sm break-all">{user.registration_number || '—'}</p>
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center pt-2 text-sm border-t">
                                <div>
                                  <Label className="text-slate-500 text-xs">Earnings</Label>
                                  <p className="font-semibold text-green-600 text-sm md:text-base">₹{user.total_earnings || 0}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-500 text-xs">Available</Label>
                                  <p className="font-semibold text-blue-600 text-sm md:text-base">₹{user.available_balance || 0}</p>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUser(user)
                                    setEditUser({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '' })
                                    setUserDialog('edit')
                                  }}
                                  className="text-xs"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => { setSelectedUser(user); setUserDialog('delete') }}
                                  className="text-xs"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {users.length > 50 && (
                    <div className="text-center text-xs md:text-sm text-slate-500 py-4 mt-6 border-t">
                      Showing first 50 users. Use filters to find specific users.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'orders' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-base md:text-lg">
                    <ShoppingBag className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    Order Management
                  </CardTitle>
                  <CardDescription className="text-sm">View and manage customer orders</CardDescription>
                </CardHeader>
                <CardContent>
                  {ordersLoading ? (
                    <div className="text-center py-8 md:py-12">
                      <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-slate-600 text-sm md:text-base">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8 md:py-12">
                      <ShoppingBag className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No orders found</h3>
                      <p className="text-slate-500 text-sm md:text-base">Orders will appear here once customers start purchasing</p>
                    </div>
                  ) : (
                    <div className="space-y-3 md:space-y-4">
                      {orders.slice(0, 20).map((order) => (
                        <Card 
                          key={order.id} 
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => {
                            setSelectedOrder(order)
                            setOrderDetailDialogOpen(true)
                          }}
                        >
                          <CardContent className="p-4 md:p-6">
                            <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-start md:space-y-0">
                              <div className="space-y-2">
                                <h3 className="font-semibold text-slate-900 text-sm md:text-base">Order #{order.id.substring(0, 8)}</h3>
                                <p className="text-xs md:text-sm text-slate-600">
                                  {formatDate(order.created_at)} • Total: {formatCurrency(order.total_amount)}
                                </p>
                                {order.status && (
                                  <Badge variant="outline" className="text-xs">{order.status}</Badge>
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" className="text-xs">
                                  <Eye className="w-3 h-3 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-4 md:space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <BarChart3 className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Analytics & Reports
                    </CardTitle>
                    <CardDescription className="text-sm">Business insights and performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 md:py-12">
                      <BarChart3 className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">Analytics Dashboard</h3>
                      <p className="text-slate-500 text-sm md:text-base">Detailed analytics coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-4 md:space-y-6">
                {/* Account Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <User className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Admin Account
                    </CardTitle>
                    <CardDescription className="text-sm">Your admin account details and permissions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <Label className="text-slate-500 text-xs md:text-sm">Name</Label>
                        <p className="font-medium text-slate-900 text-sm md:text-base">{admin?.full_name || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500 text-xs md:text-sm">Email</Label>
                        <p className="font-medium text-slate-900 text-sm md:text-base break-all">{admin?.email}</p>
                      </div>
                      <div>
                        <Label className="text-slate-500 text-xs md:text-sm">Role</Label>
                        <Badge variant="outline" className="w-fit text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          {admin?.role || 'admin'}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-slate-500 text-xs md:text-sm">Member Since</Label>
                        <p className="font-medium text-slate-900 text-sm md:text-base">
                          {admin?.created_at ? formatDate(admin.created_at) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* UPI Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <CreditCard className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      UPI Payment Settings
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Manage UPI IDs for receiving payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {upiLoading ? (
                        <div className="text-center py-6 md:py-8">
                          <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-slate-600 text-sm md:text-base">Loading UPI settings...</p>
                        </div>
                      ) : adminUPIs.length === 0 ? (
                        <div className="text-center py-8 md:py-12">
                          <CreditCard className="w-8 h-8 md:w-12 md:h-12 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-base md:text-lg font-medium text-slate-900 mb-2">No UPI IDs configured</h3>
                          <p className="text-slate-500 mb-4 text-sm md:text-base">Add your first UPI ID to start receiving payments</p>
                          <Button onClick={() => setUpiDialog('add')}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add UPI ID
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {adminUPIs.map((upi) => (
                            <Card key={upi.id} className="border hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                      <CreditCard className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-mono text-xs md:text-sm text-slate-900 break-all">{upi.upi_id}</p>
                                      <p className="text-xs md:text-sm text-slate-600">{upi.upi_name}</p>
                                      {upi.is_primary && (
                                        <Badge variant="default" className="bg-green-100 text-green-800 mt-1 text-xs">
                                          <CheckCircle className="h-3 w-3 mr-1" />
                                          Primary
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        navigator.clipboard.writeText(upi.upi_id)
                                        toast.success('UPI ID copied to clipboard')
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUPI(upi)
                                        setUpiDialog('qr')
                                      }}
                                    >
                                      <QrCode className="h-4 w-4" />
                                    </Button>
                                    
                                    {!upi.is_primary && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSetDefaultUPI(upi.upi_id)}
                                        className="text-blue-600 hover:text-blue-700"
                                        title="Set as Default UPI"
                                      >
                                        <Target className="h-4 w-4" />
                                      </Button>
                                    )}
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedUPI(upi)
                                        setUpiDialog('delete')
                                      }}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          
                          <Button
                            variant="outline"
                            onClick={() => setUpiDialog('add')}
                            className="w-full"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add UPI ID
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* System Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base md:text-lg">
                      <Activity className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      System Status
                    </CardTitle>
                    <CardDescription className="text-sm">Current system configuration and health</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="font-medium text-slate-900 text-sm md:text-base">Database Connection</span>
                        </div>
                        <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="text-xs">
                          {connectionStatus === 'connected' ? 'Connected' : 'Failed'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${adminUPIs.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className="font-medium text-slate-900 text-sm md:text-base">UPI Integration</span>
                        </div>
                        <Badge variant={adminUPIs.length > 0 ? 'default' : 'secondary'} className="text-xs">
                          {adminUPIs.length > 0 ? 'Configured' : 'Not Configured'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${hasAdminAccess ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                          <span className="font-medium text-slate-900 text-sm md:text-base">Admin Access</span>
                        </div>
                        <Badge variant={hasAdminAccess ? 'default' : 'secondary'} className="text-xs">
                          {hasAdminAccess ? 'Full Access' : 'Limited'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-slate-900 text-sm md:text-base">Admin Panel</span>
                        </div>
                        <Badge variant="default" className="text-xs">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reward Configuration */}
                <RewardConfigManager />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* All Dialogs - Made mobile responsive */}

      {/* Edit User Dialog */}
      <Dialog open={userDialog === 'edit'} onOpenChange={() => setUserDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Edit User</DialogTitle>
            <DialogDescription className="text-sm">
              Update user details. Changes apply immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input value={editUser.full_name} onChange={(e) => setEditUser({ ...editUser, full_name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={editUser.phone} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={() => setUserDialog(null)} className="w-full md:w-auto">Cancel</Button>
            <Button onClick={handleEditUserSubmit} className="w-full md:w-auto">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={userDialog === 'delete'} onOpenChange={() => setUserDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Delete User</DialogTitle>
            <DialogDescription className="text-sm">
              This will permanently remove the user profile. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={() => setUserDialog(null)} className="w-full md:w-auto">Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!selectedUser) return
                try {
                  await deleteUserByAdmin(selectedUser.user_id)
                  setUsers((prev) => prev.filter(u => u.id !== selectedUser.id))
                  toast.success('User deleted successfully')
                  setUserDialog(null)
                } catch (error: any) {
                  toast.error(error?.message || 'Failed to delete user')
                }
              }}
              className="w-full md:w-auto"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Withdrawal Dialog */}
      <Dialog open={actionDialog === 'approve'} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Approve Withdrawal Request</DialogTitle>
            <DialogDescription className="text-sm">
              Approve withdrawal of {formatCurrency(selectedRequest?.amount || 0)} to {selectedRequest?.upi_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="admin-notes" className="text-sm">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add any notes about this approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={closeDialogs} className="w-full md:w-auto">Cancel</Button>
            <Button onClick={handleApprove} className="w-full md:w-auto">Approve Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Withdrawal Dialog */}
      <Dialog open={actionDialog === 'reject'} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Reject Withdrawal Request</DialogTitle>
            <DialogDescription className="text-sm">
              Reject withdrawal of {formatCurrency(selectedRequest?.amount || 0)} to {selectedRequest?.upi_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-notes" className="text-sm">Reason for Rejection *</Label>
              <Textarea
                id="reject-notes"
                placeholder="Please provide a reason for rejection..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                required
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={closeDialogs} className="w-full md:w-auto">Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!adminNotes} className="w-full md:w-auto">
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={actionDialog === 'payment'} onOpenChange={closeDialogs}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Process Payment</DialogTitle>
            <DialogDescription className="text-sm">
              Send {formatCurrency(selectedRequest?.amount || 0)} to {selectedRequest?.upi_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-center">
            <div className="p-4 md:p-6 border rounded-lg">
              <QrCode className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 text-blue-600" />
              <p className="text-base md:text-lg font-semibold">UPI Payment</p>
              <p className="text-xs md:text-sm text-gray-600 mb-4">Click below to open UPI app and complete payment</p>
              <div className="space-y-2 text-xs md:text-sm">
                <p><strong>Amount:</strong> {formatCurrency(selectedRequest?.amount || 0)}</p>
                <p className="break-all"><strong>UPI ID:</strong> {selectedRequest?.upi_id}</p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={closeDialogs} className="w-full md:w-auto">Close</Button>
            <Button onClick={openUPIApp} className="w-full md:w-auto">
              Open UPI App
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Admin Dialog */}
      <Dialog open={actionDialog === 'add-admin'} onOpenChange={() => setActionDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Add New Administrator</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new admin user to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-admin-email" className="text-sm">Email Address</Label>
              <Input
                id="new-admin-email"
                type="email"
                placeholder="admin@company.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="new-admin-name" className="text-sm">Full Name</Label>
              <Input
                id="new-admin-name"
                placeholder="Administrator Name"
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-admin-password" className="text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="new-admin-password"
                  type={showNewAdminPassword ? "text" : "password"}
                  placeholder="Enter secure password"
                  value={newAdminPassword}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="pl-10 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeneratePassword}
                className="w-full text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Generate Secure Password
              </Button>
              {passwordErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-2">
                  <p className="text-xs text-red-600 font-medium mb-1">Password requirements:</p>
                  <ul className="text-xs text-red-600 space-y-1">
                    {passwordErrors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        <X className="h-3 w-3 mr-1 flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {newAdminPassword && passwordErrors.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-md p-2">
                  <p className="text-xs text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Password meets all requirements
                  </p>
                </div>
              )}
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                The new admin will be able to access the panel using their email and password immediately after creation.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={() => setActionDialog(null)} className="w-full md:w-auto">Cancel</Button>
            <Button onClick={handleAddAdmin} className="w-full md:w-auto">Add Administrator</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialogs */}
      <Dialog open={productDialog === 'add' || productDialog === 'edit'} onOpenChange={() => setProductDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">{productDialog === 'add' ? 'Add New Product' : 'Edit Product'}</DialogTitle>
            <DialogDescription className="text-sm">
              {productDialog === 'add' ? 'Create a new product in your catalog' : 'Update product information'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-name" className="text-sm">Product Name *</Label>
                <Input
                  id="product-name"
                  placeholder="Enter product name"
                  value={productFormData.name}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="product-price" className="text-sm">Price *</Label>
                <Input
                  id="product-price"
                  type="number"
                  placeholder="0"
                  value={productFormData.price}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="product-description" className="text-sm">Description</Label>
              <Textarea
                id="product-description"
                placeholder="Enter product description"
                value={productFormData.description}
                onChange={(e) => setProductFormData(prev => ({ ...prev, description: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product-category" className="text-sm">Category</Label>
                <Select
                  value={productFormData.category}
                  onValueChange={(value) => setProductFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sanitary-pads">Sanitary Pads</SelectItem>
                    <SelectItem value="panty-liners">Panty Liners</SelectItem>
                    <SelectItem value="maternity-pads">Maternity Pads</SelectItem>
                    <SelectItem value="menstrual-cups">Menstrual Cups</SelectItem>
                    <SelectItem value="intimate-care">Intimate Care</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="product-stock" className="text-sm">Stock Quantity</Label>
                <Input
                  id="product-stock"
                  type="number"
                  placeholder="0"
                  value={productFormData.stock_quantity}
                  onChange={(e) => setProductFormData(prev => ({ ...prev, stock_quantity: Number(e.target.value) }))}
                  className="text-sm"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="product-image" className="text-sm">Image URL</Label>
              <Input
                id="product-image"
                placeholder="https://example.com/image.jpg"
                value={productFormData.image_url}
                onChange={(e) => setProductFormData(prev => ({ ...prev, image_url: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={() => setProductDialog(null)} className="w-full md:w-auto">Cancel</Button>
            <Button onClick={productDialog === 'add' ? handleCreateProduct : handleUpdateProduct} className="w-full md:w-auto">
              {productDialog === 'add' ? 'Add Product' : 'Update Product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Product Dialog */}
      <Dialog open={productDialog === 'delete'} onOpenChange={() => setProductDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Delete Product</DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={() => setProductDialog(null)} className="w-full md:w-auto">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteProduct} className="w-full md:w-auto">Delete Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI Add Dialog */}
      <Dialog open={upiDialog === 'add'} onOpenChange={() => setUpiDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Add New UPI ID</DialogTitle>
            <DialogDescription className="text-sm">
              Add a new UPI ID for receiving payments
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="upi-id" className="text-sm">UPI ID *</Label>
              <Input
                id="upi-id"
                placeholder="username@bank"
                value={upiFormData.upi_id}
                onChange={(e) => setUpiFormData(prev => ({ ...prev, upi_id: e.target.value }))}
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="upi-name" className="text-sm">UPI Name *</Label>
              <Input
                id="upi-name"
                placeholder="Account holder name"
                value={upiFormData.upi_name}
                onChange={(e) => setUpiFormData(prev => ({ ...prev, upi_name: e.target.value }))}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={() => setUpiDialog(null)} className="w-full md:w-auto">Cancel</Button>
            <Button onClick={handleAddUPI} className="w-full md:w-auto">Add UPI ID</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI Delete Dialog */}
      <Dialog open={upiDialog === 'delete'} onOpenChange={() => setUpiDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Delete UPI ID</DialogTitle>
            <DialogDescription className="text-sm break-all">
              Are you sure you want to remove the UPI ID "{selectedUPI?.upi_id}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={() => setUpiDialog(null)} className="w-full md:w-auto">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteUPI} className="w-full md:w-auto">Delete UPI ID</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* UPI QR Dialog */}
      <Dialog open={upiDialog === 'qr'} onOpenChange={() => setUpiDialog(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">UPI QR Code</DialogTitle>
            <DialogDescription className="text-sm break-all">
              QR code for UPI ID: {selectedUPI?.upi_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="bg-white p-3 md:p-4 rounded-lg border-2 border-dashed border-border inline-block">
                <QRCode
                  value={`upi://pay?pa=${selectedUPI?.upi_id}&pn=${selectedUPI?.upi_name}&am=100&cu=INR&tn=Sample Payment`}
                  size={window.innerWidth < 768 ? 150 : 200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-2">
                Sample QR code (Amount: ₹100 for testing)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setUpiDialog(null)} className="w-full md:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Approval Dialog */}
      <Dialog open={subscriptionDialog === 'approve'} onOpenChange={closeSubscriptionDialogs}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Approve Subscription Request</DialogTitle>
            <DialogDescription className="text-sm">
              Approve subscription for {selectedSubscriptionRequest?.user_profile?.full_name} - ₹{selectedSubscriptionRequest?.amount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subscription-notes" className="text-sm">Admin Notes (Optional)</Label>
              <Textarea
                id="subscription-notes"
                placeholder="Add any notes about this approval..."
                value={subscriptionNotes}
                onChange={(e) => setSubscriptionNotes(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={closeSubscriptionDialogs} className="w-full md:w-auto">Cancel</Button>
            <Button onClick={handleApproveSubscription} className="w-full md:w-auto">Approve Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subscription Rejection Dialog */}
      <Dialog open={subscriptionDialog === 'reject'} onOpenChange={closeSubscriptionDialogs}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Reject Subscription Request</DialogTitle>
            <DialogDescription className="text-sm">
              Reject subscription for {selectedSubscriptionRequest?.user_profile?.full_name} - ₹{selectedSubscriptionRequest?.amount}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subscription-reject-notes" className="text-sm">Reason for Rejection *</Label>
              <Textarea
                id="subscription-reject-notes"
                placeholder="Please provide a reason for rejection..."
                value={subscriptionNotes}
                onChange={(e) => setSubscriptionNotes(e.target.value)}
                required
                className="text-sm"
              />
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={closeSubscriptionDialogs} className="w-full md:w-auto">Cancel</Button>
            <Button variant="destructive" onClick={handleRejectSubscription} disabled={!subscriptionNotes} className="w-full md:w-auto">
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Proof Dialog */}
      <Dialog open={subscriptionDialog === 'view'} onOpenChange={closeSubscriptionDialogs}>
        <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">Payment Proof</DialogTitle>
            <DialogDescription className="text-sm break-all">
              Payment proof for {selectedSubscriptionRequest?.user_profile?.full_name} - Transaction: {selectedSubscriptionRequest?.upi_transaction_id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {paymentProofUrl && (
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={paymentProofUrl}
                  alt="Payment Proof"
                  className="w-full h-auto max-h-96 object-contain"
                  onError={(e) => {
                    console.error('Error loading image:', e);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSubscriptionDialogs} className="w-full md:w-auto">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Notification Verification Dialog */}
      <Dialog open={notificationDialog === 'verify'} onOpenChange={closeNotificationDialogs}>
        <DialogContent className="max-w-[95vw] md:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base md:text-lg">
              {verificationAction === 'verified' ? 'Verify Payment' : 'Reject Payment'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Are you sure you want to {verificationAction === 'verified' ? 'verify' : 'reject'} this payment of{' '}
              {selectedNotification && formatCurrency(selectedNotification.amount)}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="verification-notes" className="text-sm">Admin Notes (Optional)</Label>
            <Textarea
              id="verification-notes"
              placeholder="Add any notes about this verification..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="mt-2 text-sm"
            />
          </div>
          
          <DialogFooter className="flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-2">
            <Button variant="outline" onClick={closeNotificationDialogs} className="w-full md:w-auto">Cancel</Button>
            <Button 
              onClick={async () => {
                if (!selectedNotification || !admin) return

                console.log('🔧 Starting payment verification process...')
                console.log('Selected notification:', selectedNotification.id)
                console.log('Verification action:', verificationAction)

                try {
                  const updateData: any = {
                    status: verificationAction,
                    verified_at: new Date().toISOString(),
                    admin_notes: adminNotes.trim() || undefined
                  }

                  // Try to set verified_by, but don't fail if admin doesn't exist
                  try {
                    const { data: adminExists } = await supabase
                      .from('admins')
                      .select('id')
                      .eq('id', admin.id)
                      .single()

                    if (adminExists) {
                      updateData.verified_by = admin.id
                    }
                  } catch {
                    // If admin doesn't exist, just skip setting verified_by
                  }

                  // Use admin client for admin operations
                  const client = hasAdminAccess ? supabaseAdmin! : supabase
                  
                  const { error } = await client
                    .from('upi_payment_notifications')
                    .update(updateData)
                    .eq('id', selectedNotification.id)

                  if (error) throw error

                  // If payment is verified, update the corresponding order status
                  if (verificationAction === 'verified' && selectedNotification.order_id) {
                    try {
                      const { error: orderUpdateError } = await client
                        .from('orders')
                        .update({
                          status: 'confirmed',
                          status_notes: `Payment verified by admin. UPI ID: ${selectedNotification.upi_id}`,
                          status_updated_by: admin.id,
                          status_updated_at: new Date().toISOString()
                        })
                        .eq('id', selectedNotification.order_id)

                      if (orderUpdateError) {
                        console.warn('Failed to update order status:', orderUpdateError)
                      } else {
                        console.log('✅ Order status updated to confirmed')
                      }
                    } catch (orderError) {
                      console.warn('Error updating order status after payment verification:', orderError)
                    }
                  }

                  console.log('✅ Payment verification completed successfully')
                  toast.success(`Payment ${verificationAction === 'verified' ? 'verified' : 'rejected'} successfully! Refreshing data...`)
                  closeNotificationDialogs()
                  
                  // Refresh data with a small delay to ensure database updates are complete
                  setTimeout(() => {
                    console.log('🔄 Refreshing payment notifications and orders...')
                    loadPaymentNotifications()
                    loadOrders() // Refresh orders to show updated status
                  }, 500)
                } catch (error: any) {
                  console.error('Error updating payment notification:', error)
                  toast.error(error.message || `Failed to ${verificationAction} payment`)
                }
              }}
              className={`w-full md:w-auto ${verificationAction === 'verified' ? 
                'bg-green-600 hover:bg-green-700' : 
                'bg-destructive text-destructive-foreground hover:bg-destructive/90'
              }`}
            >
              {verificationAction === 'verified' ? 'Verify Payment' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        isOpen={orderDetailDialogOpen}
        onClose={() => {
          setOrderDetailDialogOpen(false)
          setSelectedOrder(null)
        }}
        onOrderUpdated={() => {
          loadOrders()
          loadStats()
        }}
      />
    </div>
  )
}
