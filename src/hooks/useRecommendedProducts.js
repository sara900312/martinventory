import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/contexts/SupabaseContext";

export const useRecommendedProducts = (selectedProblem, selectedRoutine) => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["recommended-products", selectedProblem, selectedRoutine],
    queryFn: async () => {
      if (!selectedProblem || !selectedRoutine || !supabase) {
        return [];
      }

      // Fetch products that have the selected problem
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, discounted_price, is_discounted, main_image_url, category, subcategory_id, slug, published, short_description, short_description_en, routine_type, routine_type_secondary, stock, skin_problems")
        .contains("skin_problems", [selectedProblem])
        .eq("published", true)
        .limit(50);

      if (error) {
        console.error('Error fetching recommended products:', error);
        throw error;
      }

      // Filter products based on selected routine
      const filteredProducts = (data || []).filter(product => {
        // Check if product has morning routine (primary or secondary)
        const hasMorning = product.routine_type === "morning" || product.routine_type_secondary === "morning";
        // Check if product has night routine (primary or secondary)
        const hasNight = product.routine_type === "night" || product.routine_type_secondary === "night";
        // Check if product has BOTH morning and night
        const hasBoth = hasMorning && hasNight;

        // If user selected "both", show only products that have BOTH routines
        if (selectedRoutine === "both") {
          return hasBoth;
        }

        // For morning: show products that have morning but NOT products with both
        if (selectedRoutine === "morning") {
          return hasMorning && !hasBoth;
        }

        // For night: show products that have night but NOT products with both
        if (selectedRoutine === "night") {
          return hasNight && !hasBoth;
        }

        // For other routines (special, etc.)
        return product.routine_type === selectedRoutine || product.routine_type_secondary === selectedRoutine;
      });

      // Shuffle products for variety and limit to 12
      const shuffled = filteredProducts
        .sort(() => Math.random() - 0.5)
        .slice(0, 12);

      return shuffled;
    },
    enabled: !!selectedProblem && !!selectedRoutine && !!supabase,
  });
};
