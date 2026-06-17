import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/contexts/SupabaseContext";

export const useProductStock = (productId) => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["product-stock", productId],
    queryFn: async () => {
      if (!productId || !supabase) {
        return {
          id: productId,
          stock: 0,
          available: 0,
          inStock: false,
        };
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, stock")
        .eq("id", productId)
        .single();

      if (error) {
        console.error(`Error fetching stock for product ${productId}:`, error);
        return {
          id: productId,
          stock: 0,
          available: 0,
          inStock: false,
        };
      }

      if (!data) {
        return {
          id: productId,
          stock: 0,
          available: 0,
          inStock: false,
        };
      }

      const available = data.stock || 0;

      return {
        id: data.id,
        stock: data.stock || 0,
        available,
        inStock: available > 0,
      };
    },
    enabled: !!productId && !!supabase,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

/**
 * Batch stock check for multiple products
 */
export const useProductsStock = (productIds = []) => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["products-stock", productIds],
    queryFn: async () => {
      if (!productIds || productIds.length === 0 || !supabase) {
        return {};
      }

      const { data, error } = await supabase
        .from("products")
        .select("id, stock")
        .in("id", productIds);

      if (error) {
        console.error("Error fetching stock for products:", error);
        return {};
      }

      const stockMap = {};
      (data || []).forEach((product) => {
        const available = product.stock || 0;
        stockMap[product.id] = {
          id: product.id,
          stock: product.stock || 0,
          available,
          inStock: available > 0,
        };
      });

      return stockMap;
    },
    enabled: !!productIds && productIds.length > 0 && !!supabase,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};
