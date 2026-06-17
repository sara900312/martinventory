import { useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';

/**
 * Hook for subscribing to real-time order updates from Supabase
 * Automatically updates the order when any changes are made to the database
 * 
 * This implementation is clean and resistant to React Strict Mode
 * 
 * @param {string} orderId - Order UUID to subscribe to
 * @param {function} onUpdate - Callback when order is updated
 * 
 * @example
 * const [order, setOrder] = useState(null);
 * useOrderRealtimeSubscription(order.id, (updatedOrder) => {
 *   setOrder(updatedOrder);
 * });
 */
export default function useOrderRealtimeSubscription(orderId, onUpdate) {
  const { supabase } = useSupabase();

  useEffect(() => {
    if (!orderId) return;

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          onUpdate?.(payload.new);
        }
      )
      .subscribe();

    // ✅ Proper cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, supabase, onUpdate]);
}
