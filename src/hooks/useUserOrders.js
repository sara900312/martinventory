import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSupabase } from '@/contexts/SupabaseContext';
import { fetchUserOrdersWithItems, getUserOrdersStatistics } from '@/lib/userOrdersService';

/**
 * Custom hook for fetching and managing user orders with realtime updates
 * Automatically fetches orders when user is authenticated
 * Subscribes to realtime updates for automatic order status changes
 * @returns {Object} Object with orders, loading state, error state, and refetch function
 */
export const useUserOrders = () => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      setStats(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userOrders = await fetchUserOrdersWithItems(supabase, user.id);
      setOrders(userOrders);

      // Fetch statistics
      const orderStats = await getUserOrdersStatistics(supabase, user.id);
      setStats(orderStats);
    } catch (err) {
      console.error('Error fetching user orders:', err);
      setError(err.message || 'Failed to fetch orders');
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, supabase]);

  // Fetch orders when user changes
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Setup realtime subscription for order updates
  useEffect(() => {
    if (!user || !supabase) {
      return;
    }

    console.log(`🔄 Setting up realtime subscription for user orders: ${user.id}`);

    // Subscribe to all order changes for this user
    const subscription = supabase
      .channel(`user_orders:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE', // Only listen to updates
          schema: 'public',
          table: 'orders',
          filter: `user_id=eq.${user.id}`, // Only orders for this user
        },
        (payload) => {
          console.log('✅ Order update received via realtime:', payload);

          // Update the specific order in the list
          setOrders((prevOrders) =>
            prevOrders.map((order) =>
              order.id === payload.new.id
                ? {
                    ...order,
                    order_status: payload.new.order_status,
                    updated_at: payload.new.updated_at,
                    order_items: order.order_items, // Keep existing items
                  }
                : order
            )
          );

          console.log(`✨ Order ${payload.new.order_code} status updated to ${payload.new.order_status}`);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ Successfully subscribed to user orders: ${user.id}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ Channel error for user orders: ${user.id}`);
        } else if (status === 'TIMED_OUT') {
          console.error(`⏱️ Subscription timed out for user orders: ${user.id}`);
        }
      });

    // Cleanup subscription on unmount
    return () => {
      console.log(`🔕 Unsubscribing from user orders: ${user.id}`);
      supabase.removeChannel(subscription);
    };
  }, [user, supabase]);

  return {
    orders,
    isLoading,
    error,
    stats,
    refetch: fetchOrders,
  };
};

/**
 * Custom hook for fetching a single user order
 * @param {string} orderId - The order ID to fetch
 * @returns {Object} Object with order, loading state, error state, and refetch function
 */
export const useUserOrder = (orderId) => {
  const { user } = useAuth();
  const { supabase } = useSupabase();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!user || !orderId) {
      setOrder(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { fetchUserOrderById } = await import('@/lib/userOrdersService');
      const userOrder = await fetchUserOrderById(supabase, user.id, orderId);
      setOrder(userOrder);
    } catch (err) {
      console.error('Error fetching user order:', err);
      setError(err.message || 'Failed to fetch order');
      setOrder(null);
    } finally {
      setIsLoading(false);
    }
  }, [user, orderId, supabase]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    isLoading,
    error,
    refetch: fetchOrder,
  };
};
