import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  XCircle, 
  Clock,
  Truck,
  Check,
  X
} from 'lucide-react'
import { Order, OrderItem, UserProfile, updateOrderStatus, getOrderDetails } from '@/lib/supabase'

interface OrderDetailDialogProps {
  order: Order | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdated: () => void
}

interface OrderWithDetails extends Order {
  order_items?: OrderItem[]
  user_profile?: UserProfile
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending':
      return <Clock className="w-4 h-4 text-orange-500" />
    case 'confirmed':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'processing':
      return <Package className="w-4 h-4 text-blue-500" />
    case 'shipped':
      return <Truck className="w-4 h-4 text-purple-500" />
    case 'delivered':
      return <CheckCircle className="w-4 h-4 text-green-600" />
    case 'cancelled':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'payment_failed':
      return <XCircle className="w-4 h-4 text-red-600" />
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

const getStatusBadge = (status: string) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
  
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className={`${baseClasses} border-orange-200 text-orange-700`}>
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    case 'confirmed':
      return <Badge variant="outline" className={`${baseClasses} border-green-200 text-green-700`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Confirmed
      </Badge>
    case 'processing':
      return <Badge variant="outline" className={`${baseClasses} border-blue-200 text-blue-700`}>
        <Package className="w-3 h-3 mr-1" />
        Processing
      </Badge>
    case 'shipped':
      return <Badge variant="outline" className={`${baseClasses} border-purple-200 text-purple-700`}>
        <Truck className="w-3 h-3 mr-1" />
        Shipped
      </Badge>
    case 'delivered':
      return <Badge variant="outline" className={`${baseClasses} border-green-200 text-green-700`}>
        <CheckCircle className="w-3 h-3 mr-1" />
        Delivered
      </Badge>
    case 'cancelled':
      return <Badge variant="outline" className={`${baseClasses} border-red-200 text-red-700`}>
        <XCircle className="w-3 h-3 mr-1" />
        Cancelled
      </Badge>
    case 'payment_failed':
      return <Badge variant="outline" className={`${baseClasses} border-red-200 text-red-700`}>
        <XCircle className="w-3 h-3 mr-1" />
        Payment Failed
      </Badge>
    default:
      return <Badge variant="outline" className={`${baseClasses} border-gray-200 text-gray-700`}>
        <Clock className="w-3 h-3 mr-1" />
        {status}
      </Badge>
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const OrderDetailDialog: React.FC<OrderDetailDialogProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdated
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [newStatus, setNewStatus] = useState<string>('')
  const [statusNotes, setStatusNotes] = useState('')

  useEffect(() => {
    if (order && isOpen) {
      loadOrderDetails()
      setNewStatus(order.status)
    }
  }, [order, isOpen])

  const loadOrderDetails = async () => {
    if (!order) return

    try {
      setIsLoading(true)
      
      const { order: orderData, orderItems, userProfile } = await getOrderDetails(order.id)
      
      if (orderData) {
        setOrderDetails({
          ...orderData,
          order_items: orderItems,
          user_profile: userProfile
        })
      }
    } catch (error: any) {
      console.error('Error loading order details:', error)
      toast.error('Failed to load order details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!order || !newStatus || newStatus === order.status) {
      onClose()
      return
    }

    try {
      setIsLoading(true)
      await updateOrderStatus(order.id, newStatus as any, statusNotes)
      
      toast.success(`Order status updated to ${newStatus}`)
      onOrderUpdated()
      onClose()
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error(`Failed to update order status: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const canUpdateStatus = order && newStatus && newStatus !== order.status

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-2" />
            Order Details - #{order?.id.substring(0, 8)}
          </DialogTitle>
          <DialogDescription>
            View complete order information and update status
          </DialogDescription>
        </DialogHeader>

        {isLoading && !orderDetails ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : orderDetails ? (
          <div className="space-y-6">
            {/* Order Status Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(orderDetails.status)}
                    <span className="font-medium">Current Status:</span>
                    {getStatusBadge(orderDetails.status)}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <Label htmlFor="status">Update Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="payment_failed">Payment Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div>
                    <Label htmlFor="notes">Status Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Add notes about this status change..."
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Customer Name</Label>
                    <p className="font-medium">{orderDetails.user_profile?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Email</Label>
                    <p className="font-medium">{orderDetails.user_profile?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Phone</Label>
                    <p className="font-medium">{orderDetails.user_profile?.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Customer ID</Label>
                    <p className="font-mono text-sm">{orderDetails.user_id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <Package className="w-4 h-4 mr-2" />
                  Order Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-500">Order ID</Label>
                    <p className="font-mono text-sm">{orderDetails.id}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Total Amount</Label>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(orderDetails.total_amount)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Created At</Label>
                    <p className="font-medium">{formatDate(orderDetails.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Last Updated</Label>
                    <p className="font-medium">{formatDate(orderDetails.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            {orderDetails.shipping_address && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{orderDetails.shipping_address.full_name}</p>
                    <p className="text-sm">{orderDetails.shipping_address.address_line_1}</p>
                    {orderDetails.shipping_address.address_line_2 && (
                      <p className="text-sm">{orderDetails.shipping_address.address_line_2}</p>
                    )}
                    <p className="text-sm">
                      {orderDetails.shipping_address.city}, {orderDetails.shipping_address.state} {orderDetails.shipping_address.postal_code}
                    </p>
                    <p className="text-sm">{orderDetails.shipping_address.country}</p>
                    <p className="text-sm font-medium">Phone: {orderDetails.shipping_address.phone}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Order Items */}
            {orderDetails.order_items && orderDetails.order_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderDetails.order_items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {item.product?.image_url && (
                            <img 
                              src={item.product.image_url} 
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div>
                            <p className="font-medium">{item.product?.name || 'Product'}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.price)}</p>
                          <p className="text-sm text-gray-500">Total: {formatCurrency(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {orderDetails.payment_id && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label className="text-sm text-gray-500">Payment ID</Label>
                    <p className="font-mono text-sm">{orderDetails.payment_id}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No order details available</p>
          </div>
        )}

        <DialogFooter className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          {canUpdateStatus && (
            <Button onClick={handleStatusUpdate} disabled={isLoading}>
              <Check className="w-4 h-4 mr-2" />
              {isLoading ? 'Updating...' : 'Update Status'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
