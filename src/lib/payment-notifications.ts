import { supabase } from './supabase'

export interface PaymentNotification {
  id: string
  order_id: string
  user_id: string
  amount: number
  upi_id: string
  transaction_reference?: string
  status: 'pending' | 'verified' | 'rejected'
  user_message?: string
  admin_notes?: string
  created_at: string
  verified_at?: string
  verified_by?: string
}

// Create payment notification
export const createPaymentNotification = async (
  orderId: string,
  userId: string,
  amount: number,
  upiId: string,
  transactionReference?: string,
  userMessage?: string
): Promise<PaymentNotification> => {
  try {
    const { data, error } = await supabase
      .from('upi_payment_notifications')
      .insert({
        order_id: orderId,
        user_id: userId,
        amount,
        upi_id: upiId,
        transaction_reference: transactionReference,
        user_message: userMessage,
        status: 'pending'
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error: any) {
    console.error('Error creating payment notification:', error)
    throw error
  }
}

// Get payment notifications (admin)
export const getPaymentNotifications = async (): Promise<PaymentNotification[]> => {
  try {
    const { data, error } = await supabase
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

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching payment notifications:', error)
    throw error
  }
}

// Verify payment notification (admin)
export const verifyPaymentNotification = async (
  notificationId: string,
  adminId: string,
  status: 'verified' | 'rejected',
  adminNotes?: string
): Promise<void> => {
  try {
    // First check if admin exists in admins table
    const { data: adminExists } = await supabase
      .from('admins')
      .select('id')
      .eq('id', adminId)
      .single()

    const updateData: any = {
      status,
      verified_at: new Date().toISOString(),
      admin_notes: adminNotes
    }

    // Only set verified_by if admin exists in the table
    if (adminExists) {
      updateData.verified_by = adminId
    }

    const { error } = await supabase
      .from('upi_payment_notifications')
      .update(updateData)
      .eq('id', notificationId)

    if (error) throw error
  } catch (error: any) {
    console.error('Error verifying payment notification:', error)
    throw error
  }
}

// Get user's payment notifications
export const getUserPaymentNotifications = async (userId: string): Promise<PaymentNotification[]> => {
  try {
    const { data, error } = await supabase
      .from('upi_payment_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error: any) {
    console.error('Error fetching user payment notifications:', error)
    return []
  }
}
