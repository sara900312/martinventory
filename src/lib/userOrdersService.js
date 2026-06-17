/**
 * Service for fetching orders for authenticated users
 * Retrieves all orders associated with a specific user ID
 */

/**
 * Fetch all orders for a specific user with their items
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Array>} Array of orders with their items
 */
export async function fetchUserOrdersWithItems(supabase, userId) {
  try {
    if (!userId) {
      console.warn('No user ID provided');
      return [];
    }

    // Fetch all orders for this user, ordered by most recent first
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Error fetching user orders:', ordersError);
      throw new Error(`خطأ في جلب الطلبات: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      console.log('No orders found for user:', userId);
      return [];
    }

    // Fetch items for each order in parallel
    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id)
          .order('created_at', { ascending: true });

        if (itemsError) {
          console.error(
            `Error fetching items for order ${order.id}:`,
            itemsError
          );
          return { ...order, order_items: [] };
        }

        return { ...order, order_items: items || [] };
      })
    );

    console.log(
      `✅ جلب ${ordersWithItems.length} طلب للمستخدم ${userId}`
    );
    return ordersWithItems;
  } catch (error) {
    console.error('Unexpected error in fetchUserOrdersWithItems:', error);
    throw error;
  }
}

/**
 * Fetch a single order for a user
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The authenticated user's ID
 * @param {string} orderId - The order ID (UUID)
 * @returns {Promise<Object|null>} Order with items or null if not found
 */
export async function fetchUserOrderById(supabase, userId, orderId) {
  try {
    if (!userId || !orderId) {
      throw new Error('User ID and Order ID are required');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw new Error(`خطأ في جلب الطلب: ${orderError.message}`);
    }

    if (!order) {
      return null;
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error(`Error fetching items for order ${order.id}:`, itemsError);
      return { ...order, order_items: [] };
    }

    return { ...order, order_items: items || [] };
  } catch (error) {
    console.error('Error in fetchUserOrderById:', error);
    throw error;
  }
}

/**
 * Get statistics about user's orders
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The authenticated user's ID
 * @returns {Promise<Object>} Statistics about the user's orders
 */
export async function getUserOrdersStatistics(supabase, userId) {
  try {
    if (!userId) {
      return {
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
      };
    }

    const orders = await fetchUserOrdersWithItems(supabase, userId);

    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      pendingOrders: orders.filter(
        (o) => o.order_status === 'pending'
      ).length,
      reviewingOrders: orders.filter(
        (o) => o.order_status === 'reviewing'
      ).length,
      acceptedOrders: orders.filter(
        (o) => o.order_status === 'accepted'
      ).length,
      preparingOrders: orders.filter(
        (o) => o.order_status === 'preparing'
      ).length,
      shippedOrders: orders.filter(
        (o) => o.order_status === 'shipped'
      ).length,
      deliveredOrders: orders.filter(
        (o) => o.order_status === 'delivered'
      ).length,
      cancelledOrders: orders.filter(
        (o) => o.order_status === 'cancelled'
      ).length,
      averageOrderValue:
        orders.length > 0
          ? orders.reduce((sum, order) => sum + (order.total_amount || 0), 0) /
            orders.length
          : 0,
    };

    return stats;
  } catch (error) {
    console.error('Error getting user orders statistics:', error);
    throw error;
  }
}

/**
 * Search for user's order by order code
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The authenticated user's ID
 * @param {string} orderCode - The order code to search for
 * @returns {Promise<Object|null>} Order with items or null if not found
 */
export async function searchUserOrderByCode(supabase, userId, orderCode) {
  try {
    if (!userId || !orderCode) {
      throw new Error('User ID and Order Code are required');
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .eq('order_code', orderCode.toUpperCase())
      .single();

    if (orderError) {
      if (orderError.code === 'PGRST116') {
        return null;
      }
      throw new Error(`خطأ في البحث: ${orderError.message}`);
    }

    if (!order) {
      return null;
    }

    // Fetch order items
    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    if (itemsError) {
      console.error(`Error fetching items for order ${order.id}:`, itemsError);
      return { ...order, order_items: [] };
    }

    return { ...order, order_items: items || [] };
  } catch (error) {
    console.error('Error in searchUserOrderByCode:', error);
    throw error;
  }
}

/**
 * Check if an order belongs to the authenticated user
 * @param {Object} supabase - Supabase client
 * @param {string} userId - The authenticated user's ID
 * @param {string} orderCode - The order code to verify
 * @returns {Promise<boolean>} True if order belongs to user, false otherwise
 */
export async function verifyUserOwnsOrder(supabase, userId, orderCode) {
  try {
    if (!userId || !orderCode) {
      return false;
    }

    const { count, error } = await supabase
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('order_code', orderCode.toUpperCase());

    if (error) {
      console.error('Error verifying order ownership:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Error in verifyUserOwnsOrder:', error);
    return false;
  }
}
