/**
 * Service for updating order status via Edge Function
 * Handles stock updates automatically on the backend
 */

const SUPABASE_URL = 'https://ykyzviqwscrjjkucorlp.supabase.co';
const UPDATE_ORDER_STATUS_FUNCTION = `${SUPABASE_URL}/functions/v1/update_order_status`;

/**
 * Update order status via Edge Function
 * Backend automatically updates inventory stock based on status change
 *
 * @param {string} orderId - UUID of the order
 * @param {string} newStatus - New status ('pending', 'reviewing', 'accepted', 'preparing', 'shipped', 'delivered', 'cancelled')
 * @returns {Promise<Object>} - Updated order data { id, order_status, updated_at }
 */
export const updateOrderStatus = async (orderId, newStatus) => {
  try {
    if (!orderId || !newStatus) {
      throw new Error('Missing required parameters: orderId and newStatus');
    }

    const response = await fetch(UPDATE_ORDER_STATUS_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_id: orderId,
        new_status: newStatus,
      }),
    });

    // ✅ Robust error handling: Use res.text() to prevent crashes
    // This handles cases where server returns 404, 500, or non-JSON responses
    const text = await response.text();
    let data;

    try {
      data = text ? JSON.parse(text) : null;
    } catch (parseError) {
      console.error('Failed to parse JSON response from server:', parseError);
      console.error('Response status:', response.status);
      console.error('Response text:', text);

      // Throw a descriptive error if JSON parsing fails
      throw new Error(`Invalid response from server: ${response.status} ${response.statusText}`);
    }

    // Check if request was successful
    if (!response.ok) {
      throw new Error(data?.error || `Request failed: ${response.status}`);
    }

    // Verify success flag
    if (!data || !data.success) {
      throw new Error(data?.error || 'Failed to update order status');
    }

    return data.order;
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

/**
 * Batch update order statuses
 * @param {Array<{orderId: string, newStatus: string}>} updates - Array of order updates
 * @returns {Promise<Object>} - Object with successful and failed updates
 */
export const batchUpdateOrderStatuses = async (updates) => {
  try {
    if (!Array.isArray(updates) || updates.length === 0) {
      throw new Error('Updates must be a non-empty array');
    }

    const results = await Promise.allSettled(
      updates.map(update =>
        updateOrderStatus(update.orderId, update.newStatus)
      )
    );

    const successful = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    const failed = results
      .filter(r => r.status === 'rejected')
      .map((r, index) => ({
        orderId: updates[index].orderId,
        error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      }));

    return {
      successful,
      failed,
      total: results.length,
      successCount: successful.length,
      failureCount: failed.length,
    };
  } catch (error) {
    console.error('Error in batch update:', error);
    throw error;
  }
};

export default {
  updateOrderStatus,
  batchUpdateOrderStatuses,
};
