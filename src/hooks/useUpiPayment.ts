import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { logError, getUserFriendlyErrorMessage } from "@/lib/error-utils";

export interface UpiPaymentNotification {
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
}

export interface UpiConfig {
  upi_id: string;
  merchant_name: string;
  upi_ids: string[];
}

export function useUpiPayment() {
  const [loading, setLoading] = useState(false);
  const [upiConfig, setUpiConfig] = useState<UpiConfig | null>(null);

  // Test UPI configuration
  const testUpiConnection = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('get_active_upi_config');

      if (error) {
        console.error('UPI test failed:', error);
        return false;
      }

      if (!data || !data.upi_id) {
        console.error('No UPI configuration found');
        return false;
      }

      console.log('UPI test passed:', data);
      return true;
    } catch (error) {
      console.error('UPI test error:', error);
      return false;
    }
  }, []);

  // Get active UPI configuration from database
  const getActiveUpiConfig = useCallback(async (): Promise<UpiConfig> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_active_upi_config');

      if (error) {
        console.error('Error fetching UPI config:', error);
        throw new Error(error.message || 'Failed to get UPI configuration');
      }

      if (!data || !data.upi_id) {
        throw new Error('No active UPI configuration found. Please contact admin to configure UPI payment.');
      }

      const config: UpiConfig = {
        upi_id: data.upi_id,
        merchant_name: data.merchant_name || 'MATRATV CARE',
        upi_ids: data.upi_ids || []
      };

      setUpiConfig(config);
      return config;

    } catch (error: any) {
      console.error('Error in getActiveUpiConfig:', error);
      toast.error(error.message || "Failed to load UPI configuration. Please contact support.");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create payment notification
  const createPaymentNotification = useCallback(async (
    orderId: string,
    amount: number,
    upiId: string,
    userMessage?: string,
    transactionReference?: string
  ): Promise<UpiPaymentNotification | null> => {
    try {
      setLoading(true);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Validate inputs
      if (!orderId || !amount || amount <= 0 || !upiId) {
        throw new Error('Invalid payment details');
      }

      const { data, error } = await supabase
        .from('upi_payment_notifications')
        .insert({
          order_id: orderId,
          user_id: user.id,
          amount: Number(amount),
          upi_id: upiId,
          transaction_reference: transactionReference?.trim() || null,
          user_message: userMessage?.trim() || null,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Database error creating notification:', error);
        throw new Error('Failed to create payment notification');
      }

      // Note: Order linking happens through the order_id in payment notification
      // No need to update the orders table directly to avoid permission issues

      return data;
      
    } catch (error: any) {
      logError('UPI Payment - Create Notification', error);

      const userMessage = getUserFriendlyErrorMessage(error);
      toast.error(userMessage || "Failed to notify admin about payment");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get payment notifications for current user
  const getUserPaymentNotifications = useCallback(async (): Promise<UpiPaymentNotification[]> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.warn('User not authenticated');
        return [];
      }

      const { data, error } = await supabase
        .from('upi_payment_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserPaymentNotifications:', error);
      return [];
    }
  }, []);

  // Get payment notification by order ID
  const getPaymentNotificationByOrderId = useCallback(async (orderId: string): Promise<UpiPaymentNotification | null> => {
    try {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from('upi_payment_notifications')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching payment notification:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getPaymentNotificationByOrderId:', error);
      return null;
    }
  }, []);

  // Check if order has pending payment notification
  const hasOrderPendingPayment = useCallback(async (orderId: string): Promise<boolean> => {
    try {
      const notification = await getPaymentNotificationByOrderId(orderId);
      return notification?.status === 'pending';
    } catch (error) {
      console.error('Error checking pending payment:', error);
      return false;
    }
  }, [getPaymentNotificationByOrderId]);

  return {
    loading,
    upiConfig,
    testUpiConnection,
    getActiveUpiConfig,
    createPaymentNotification,
    getUserPaymentNotifications,
    getPaymentNotificationByOrderId,
    hasOrderPendingPayment
  };
}

// Admin-specific UPI management hook
export function useAdminUpiManagement() {
  const [loading, setLoading] = useState(false);

  // Add UPI ID
  const addUpiId = useCallback(async (adminEmail: string, upiId: string): Promise<boolean> => {
    try {
      setLoading(true);
      
      if (!upiId?.trim()) {
        throw new Error('UPI ID is required');
      }

      const { data, error } = await supabase.rpc('add_upi_id', {
        admin_email: adminEmail,
        new_upi_id: upiId.trim()
      });

      if (error) {
        throw new Error(error.message || 'Failed to add UPI ID');
      }

      toast.success("UPI ID has been added successfully");

      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Set active UPI ID
  const setActiveUpiId = useCallback(async (adminEmail: string, upiId: string): Promise<boolean> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('set_active_upi_id', {
        admin_email: adminEmail,
        upi_id: upiId
      });

      if (error) {
        throw new Error(error.message || 'Failed to set active UPI ID');
      }

      toast.success("Active UPI ID has been updated successfully");

      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to update active UPI ID");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Remove UPI ID
  const removeUpiId = useCallback(async (adminEmail: string, upiId: string): Promise<boolean> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('remove_upi_id', {
        admin_email: adminEmail,
        upi_id: upiId
      });

      if (error) {
        throw new Error(error.message || 'Failed to remove UPI ID');
      }

      toast.success("UPI ID has been removed successfully");

      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to remove UPI ID");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Verify payment notification
  const verifyPaymentNotification = useCallback(async (
    notificationId: string,
    adminEmail: string,
    status: 'verified' | 'rejected',
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      setLoading(true);

      const { data, error } = await supabase.rpc('verify_payment_notification', {
        notification_id: notificationId,
        admin_email: adminEmail,
        verification_status: status,
        admin_notes_text: adminNotes?.trim() || null
      });

      if (error) {
        throw new Error(error.message || 'Failed to verify payment');
      }

      toast.success(`Payment has been ${status} successfully`);

      return true;
    } catch (error: any) {
      toast.error(error.message || "Failed to verify payment");
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    addUpiId,
    setActiveUpiId,
    removeUpiId,
    verifyPaymentNotification
  };
}
