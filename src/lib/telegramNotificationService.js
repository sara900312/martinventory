/**
 * Telegram Notification Service
 * 
 * RESPONSIBILITY: Order Cancellation Only
 * - Cancel pending orders
 * - Validate 6-hour cancellation window
 * - Update order status to "cancelled" in database
 * - Send Telegram notifications about cancellations
 * 
 * NOTE: Order creation is handled by orderNotificationService.js
 * This maintains separation of concerns and reduces complexity.
 */

const SUPABASE_URL = 'https://ykyzviqwscrjjkucorlp.supabase.co';
const TELEGRAM_NOTIFICATIONS_FUNCTION = `${SUPABASE_URL}/functions/v1/telegram_notifications`;

/**
 * Send order cancellation notification to Telegram
 * Cancels a pending order and notifies admins via Telegram
 * 
 * @param {object} params - Cancellation parameters
 * @param {string} params.orderId - Order UUID (must be valid UUID format)
 * @param {string} params.cancellationReason - Reason for cancellation (optional)
 * @returns {Promise<object>} - Response with success status and updated order
 * 
 * @example
 * const result = await sendOrderCancellationNotification({
 *   orderId: "550e8400-e29b-41d4-a716-446655440000",
 *   cancellationReason: "العميل غير مهتم بالمنتج"
 * });
 */
export const sendOrderCancellationNotification = async ({
  orderId,
  cancellationReason = 'Cancelled by customer',
}) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      console.error('Invalid UUID format for orderId:', orderId);
      throw new Error(`Invalid order ID format. Expected UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`);
    }

    const requestBody = {
      action: 'cancel_order',
      order_id: orderId,
      cancellation_reason: cancellationReason || 'Cancelled by customer',
    };

    console.log('📢 Sending order cancellation notification:', requestBody);

    const response = await fetch(TELEGRAM_NOTIFICATIONS_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // ✅ Robust error handling: Use res.text() to prevent crashes
    const text = await response.text();
    let result;

    try {
      result = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error('Failed to parse JSON response from server:', parseError);
      console.error('Response status:', response.status);
      console.error('Response text:', text);

      return {
        success: false,
        message: `رد غير صحيح من السيرفر: ${response.status}`,
        error: 'INVALID_SERVER_RESPONSE',
      };
    }

    if (!response.ok) {
      console.error('Telegram cancellation error:', {
        status: response.status,
        body: result,
      });

      if (response.status === 400) {
        return {
          success: false,
          message: result?.message || 'البيانات المرسلة غير صحيحة',
          error: 'INVALID_REQUEST_DATA',
        };
      }

      if (response.status === 403) {
        return {
          success: false,
          message: result?.message || 'انتهت مهلة إلغاء الطلب (6 ساعات)',
          error: 'CANCELLATION_WINDOW_EXPIRED',
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          message: 'الطلب غير موجود',
          error: 'ORDER_NOT_FOUND',
        };
      }

      if (response.status === 409) {
        return {
          success: false,
          message: result?.message || 'حالة الطلب لا تسمح بالإلغاء',
          error: 'INVALID_ORDER_STATUS',
        };
      }

      throw new Error(result?.message || `Server error: ${response.status}`);
    }

    console.log('✅ Order cancellation notification sent successfully');
    return {
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      order: result?.order,
    };
  } catch (error) {
    console.error('Error sending order cancellation notification:', error.message);
    return {
      success: false,
      message: error.message || 'حدث خطأ أثناء محاولة إلغاء الطلب',
      error: 'CANCEL_REQUEST_FAILED',
    };
  }
};
