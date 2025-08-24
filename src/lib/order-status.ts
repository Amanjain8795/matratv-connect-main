// Order status constants for UPI payment flow
export const ORDER_STATUS = {
  // Initial states
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  
  // Payment states
  PAYMENT_PENDING: 'payment_pending',
  PAID: 'paid',
  PAYMENT_FAILED: 'payment_failed',
  
  // Fulfillment states
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  
  // Final states
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Status descriptions for display
export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'Order is being processed',
  [ORDER_STATUS.CONFIRMED]: 'Order has been confirmed',
  [ORDER_STATUS.PAYMENT_PENDING]: 'Waiting for payment verification',
  [ORDER_STATUS.PAID]: 'Payment verified and confirmed',
  [ORDER_STATUS.PAYMENT_FAILED]: 'Payment verification failed',
  [ORDER_STATUS.PROCESSING]: 'Order is being prepared',
  [ORDER_STATUS.SHIPPED]: 'Order has been shipped',
  [ORDER_STATUS.DELIVERED]: 'Order has been delivered',
  [ORDER_STATUS.COMPLETED]: 'Order completed successfully',
  [ORDER_STATUS.CANCELLED]: 'Order has been cancelled',
  [ORDER_STATUS.REFUNDED]: 'Order has been refunded'
};

// Status colors for UI
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  [ORDER_STATUS.PENDING]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  [ORDER_STATUS.CONFIRMED]: 'text-blue-600 bg-blue-50 border-blue-200',
  [ORDER_STATUS.PAYMENT_PENDING]: 'text-orange-600 bg-orange-50 border-orange-200',
  [ORDER_STATUS.PAID]: 'text-green-600 bg-green-50 border-green-200',
  [ORDER_STATUS.PAYMENT_FAILED]: 'text-red-600 bg-red-50 border-red-200',
  [ORDER_STATUS.PROCESSING]: 'text-purple-600 bg-purple-50 border-purple-200',
  [ORDER_STATUS.SHIPPED]: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  [ORDER_STATUS.DELIVERED]: 'text-green-700 bg-green-100 border-green-300',
  [ORDER_STATUS.COMPLETED]: 'text-green-800 bg-green-100 border-green-400',
  [ORDER_STATUS.CANCELLED]: 'text-gray-600 bg-gray-50 border-gray-200',
  [ORDER_STATUS.REFUNDED]: 'text-red-700 bg-red-100 border-red-300'
};

// Helper function to get display badge for status
export const getOrderStatusBadge = (status: OrderStatus) => {
  return {
    text: ORDER_STATUS_DESCRIPTIONS[status],
    className: ORDER_STATUS_COLORS[status]
  };
};

// Check if order can be cancelled
export const canCancelOrder = (status: OrderStatus): boolean => {
  return [
    ORDER_STATUS.PENDING,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PAYMENT_PENDING,
    ORDER_STATUS.PAID
  ].includes(status);
};

// Check if order is in a final state
export const isOrderFinal = (status: OrderStatus): boolean => {
  return [
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.COMPLETED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REFUNDED
  ].includes(status);
};

// Check if order needs payment action
export const needsPaymentAction = (status: OrderStatus): boolean => {
  return status === ORDER_STATUS.PAYMENT_PENDING;
};

// Get next possible statuses for admin actions
export const getNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  switch (currentStatus) {
    case ORDER_STATUS.PENDING:
      return [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED];
    
    case ORDER_STATUS.CONFIRMED:
      return [ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.CANCELLED];
    
    case ORDER_STATUS.PAYMENT_PENDING:
      return [ORDER_STATUS.PAID, ORDER_STATUS.PAYMENT_FAILED, ORDER_STATUS.CANCELLED];
    
    case ORDER_STATUS.PAID:
      return [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED];
    
    case ORDER_STATUS.PROCESSING:
      return [ORDER_STATUS.SHIPPED, ORDER_STATUS.CANCELLED];
    
    case ORDER_STATUS.SHIPPED:
      return [ORDER_STATUS.DELIVERED];
    
    case ORDER_STATUS.DELIVERED:
      return [ORDER_STATUS.COMPLETED, ORDER_STATUS.REFUNDED];
    
    case ORDER_STATUS.PAYMENT_FAILED:
      return [ORDER_STATUS.PAYMENT_PENDING, ORDER_STATUS.CANCELLED];
    
    default:
      return [];
  }
};
