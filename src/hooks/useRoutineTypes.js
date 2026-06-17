import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/contexts/SupabaseContext";

export const useRoutineTypes = (selectedProblem) => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["routine-types", selectedProblem],
    queryFn: async () => {
      if (!selectedProblem || !supabase) {
        return [];
      }

      const { data, error } = await supabase
        .from("products")
        .select("routine_type, routine_type_secondary")
        .contains("skin_problems", [selectedProblem])
        .eq("published", true);

      if (error) {
        console.error('Error fetching routine types:', error);
        throw error;
      }

      // Analyze products to determine which routines have available products
      let hasMorningOnly = false;  // Morning products without both
      let hasNightOnly = false;    // Night products without both
      let hasProductsWithBoth = false;  // Products with both morning and night

      (data || []).forEach(item => {
        const hasMorning = item.routine_type === "morning" || item.routine_type_secondary === "morning";
        const hasNight = item.routine_type === "night" || item.routine_type_secondary === "night";
        const hasBoth = hasMorning && hasNight;

        if (hasBoth) {
          hasProductsWithBoth = true;
        } else if (hasMorning) {
          hasMorningOnly = true;
        } else if (hasNight) {
          hasNightOnly = true;
        }
      });

      const uniqueRoutines = [];

      // Only add routine types if they have products that will be displayed
      if (hasMorningOnly) {
        uniqueRoutines.push("morning");
      }
      if (hasNightOnly) {
        uniqueRoutines.push("night");
      }
      if (hasProductsWithBoth) {
        uniqueRoutines.push("both");
      }

      return uniqueRoutines;
    },
    enabled: !!selectedProblem && !!supabase,
  });
};
