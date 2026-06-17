/**
 * Order Tracking & Cancellation Service
 * Handles searching for orders and managing cancellations with 6-hour window validation
 */

import { getOrderStatusLabel } from '@/lib/orderStatusConstants';

// Order tracking service - handles order search and status checking
// Order cancellation is handled by telegramNotificationService.js

/**
 * Calculate if an order can be cancelled based on creation time
 * @param {Date|string} createdAt - Order creation timestamp
 * @returns {object} - { canCancel: boolean, hoursRemaining: number, message: string }
 */
export const checkCancellationEligibility = (createdAt) => {
  try {
    const orderTime = new Date(createdAt);
    const now = new Date();
    const diffMs = now - orderTime;
    const diffHours = diffMs / (1000 * 60 * 60);

    const canCancel = diffHours <= 6;
    const hoursRemaining = Math.max(0, 6 - diffHours);

    return {
      canCancel,
      hoursRemaining: Math.round(hoursRemaining * 100) / 100,
      minutesRemaining: Math.round(hoursRemaining * 60),
      message: canCancel
        ? `يمكنك إلغاء هذا الطلب خلال ${Math.ceil(hoursRemaining)} ساعات`
        : 'لم يعد يمكن إلغاء هذا الطلب. يرجى التواصل مع دعم Cosmetik للمساعدة.',
    };
  } catch (error) {
    console.error('Error checking cancellation eligibility:', error);
    return {
      canCancel: false,
      hoursRemaining: 0,
      minutesRemaining: 0,
      message: 'خطأ في التحقق من حالة الإلغاء',
    };
  }
};

/**
 * Format time remaining for display
 * @param {number} hoursRemaining - Hours remaining
 * @returns {string} - Formatted time string
 */
export const formatTimeRemaining = (hoursRemaining) => {
  if (hoursRemaining <= 0) return 'انتهت مهلة الإلغاء';

  if (hoursRemaining < 1) {
    const minutes = Math.ceil(hoursRemaining * 60);
    return `${minutes} دقيقة متبقية`;
  }

  if (hoursRemaining < 24) {
    const hours = Math.floor(hoursRemaining);
    const minutes = Math.round((hoursRemaining - hours) * 60);
    if (minutes > 0) {
      return `${hours} ساعة و ${minutes} دقيقة`;
    }
    return `${hours} ساعة`;
  }

  const days = Math.floor(hoursRemaining / 24);
  return `${days} أيام`;
};

/**
 * Fetch order by code (preferred method)
 * @param {object} supabase - Supabase client
 * @param {string} orderCode - Order code to search for
 * @returns {Promise<object|null>} - Order data or null
 */
export const fetchOrderByCode = async (supabase, orderCode) => {
  if (!orderCode || orderCode.trim() === '') {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_code,
        order_status,
        created_at,
        updated_at,
        customer_name,
        customer_phone,
        customer_address,
        customer_city,
        customer_notes,
        main_store_name,
        total_amount,
        subtotal,
        delivery_cost,
        discounted_price,
        shipping_type,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          discounted_price,
          main_store_name
        )
      `
      )
      .eq('order_code', orderCode.trim().toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Error fetching order by code:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchOrderByCode:', error);
    return null;
  }
};

/**
 * Fetch order by order code and phone number (fallback method)
 * @param {object} supabase - Supabase client
 * @param {string} orderCode - Order code (e.g., "SO09DBWW")
 * @param {string} phoneNumber - Customer phone number
 * @returns {Promise<object|null>} - Order data or null
 */
export const fetchOrderByIdAndPhone = async (
  supabase,
  orderCode,
  phoneNumber
) => {
  if (
    !orderCode ||
    !phoneNumber ||
    orderCode.trim() === '' ||
    phoneNumber.trim() === ''
  ) {
    return null;
  }

  try {
    // Clean phone number: remove all non-numeric characters (matching database format)
    const cleanedPhone = phoneNumber.trim().replace(/\D/g, '');

    console.log('🔍 Searching for order:');
    console.log(`   Order Code: ${orderCode.trim().toUpperCase()}`);
    console.log(`   Phone: ${phoneNumber.trim()} → ${cleanedPhone}`);

    const { data, error } = await supabase
      .from('orders')
      .select(
        `
        id,
        order_code,
        order_status,
        created_at,
        updated_at,
        customer_name,
        customer_phone,
        customer_address,
        customer_city,
        customer_notes,
        main_store_name,
        total_amount,
        subtotal,
        delivery_cost,
        discounted_price,
        shipping_type,
        order_items (
          id,
          product_id,
          product_name,
          quantity,
          price,
          discounted_price,
          main_store_name
        )
      `
      )
      .eq('order_code', orderCode.trim().toUpperCase())
      .eq('customer_phone', cleanedPhone)
      .maybeSingle();

    if (error) {
      console.error('Error fetching order by code and phone:', error);
      return null;
    }

    if (data) {
      console.log('✅ Order found:', data.id);
    } else {
      console.log('❌ Order not found with provided details');
    }

    return data;
  } catch (error) {
    console.error('Error in fetchOrderByIdAndPhone:', error);
    return null;
  }
};

/**
 * Cancel an order - calls Telegram notification service for server-side validation
 * @param {object} params - Parameters
 * @param {string} params.orderId - Order ID (UUID)
 * @param {string} params.cancellationReason - Reason for cancellation
 * @returns {Promise<object>} - Response with success status and message
 */
export const cancelOrder = async ({
  orderId,
  cancellationReason = 'Cancelled by customer within allowed window',
}) => {
  try {
    // Import the Telegram notification service
    const { sendOrderCancellationNotification } = await import('./telegramNotificationService');

    return await sendOrderCancellationNotification({
      orderId,
      cancellationReason,
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return {
      success: false,
      message: error.message || 'حدث خطأ أثناء محاولة إلغاء الطلب',
      error: 'CANCEL_REQUEST_FAILED',
    };
  }
};

/**
 * Send pending notifications
 * Triggers the Edge Function to process and send all pending notifications
 * from the telegram_notifications table
 * @returns {Promise<object>} - Response with success status and message
 */
export const sendPendingNotifications = async () => {
  try {
    const requestBody = {
      action: 'send_notification',
    };

    const headers = {
      'Content-Type': 'application/json',
    };

    const response = await fetch(ORDER_OPERATIONS_FUNCTION, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending notifications:', result);
      return {
        success: false,
        message: result.error || 'فشل في إرسال الإشعارات',
        error: 'NOTIFICATION_SEND_FAILED',
      };
    }

    return {
      success: true,
      message: result.message || 'تم إرسال الإشعارات بنجاح',
      notificationsSent: result.notifications_sent || 0,
    };
  } catch (error) {
    console.error('Error in sendPendingNotifications:', error);
    return {
      success: false,
      message: error.message || 'خطأ في إرسال الإشعارات',
      error: 'NOTIFICATION_REQUEST_FAILED',
    };
  }
};

/**
 * Format order data for display
 * @param {object} order - Raw order data
 * @returns {object} - Formatted order data
 */
export const formatOrderForDisplay = (order) => {
  if (!order) return null;

  const createdDate = new Date(order.created_at);
  const eligibility = checkCancellationEligibility(order.created_at);

  return {
    ...order,
    formattedDate: createdDate.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    formattedTotal: formatPrice(order.total_amount),
    cancellationEligibility: eligibility,
    items: order.order_items || [],
  };
};

/**
 * Format price for display
 * @param {number} price - Price amount
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
  return `${Number(price).toLocaleString('ar-IQ')} د.ع`;
};

/**
 * Get order status label in Arabic
 * @param {string} status - Order status
 * @returns {string} - Arabic label
 */
export const getStatusLabel = (status) => {
  return getOrderStatusLabel(status);
};

export default {
  checkCancellationEligibility,
  formatTimeRemaining,
  fetchOrderByCode,
  fetchOrderByIdAndPhone,
  cancelOrder,
  formatOrderForDisplay,
  formatPrice,
  getStatusLabel,
};
