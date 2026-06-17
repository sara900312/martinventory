import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/contexts/SupabaseContext";

export const useSkinProblems = (toolTitle = null) => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["skin-problems", toolTitle],
    queryFn: async () => {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return [];
      }

      let query = supabase
        .from("skin_problems")
        .select(
          `id,
           name_ar,
           name_en,
           description,
           card_image_url,
           tool_title,
           morning_image_url,
           evening_image_url,
           special_care_image_url`
        );

      // Filter by tool_title if provided
      if (toolTitle) {
        query = query.eq("tool_title", toolTitle);
      }

      const { data, error } = await query.order("name_ar", { ascending: true });

      if (error) {
        console.error('Error fetching skin problems:', error);
        throw error;
      }
      return data || [];
    },
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};
