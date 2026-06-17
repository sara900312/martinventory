import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/contexts/SupabaseContext";

export const useSkinProblemsById = (problemIds = []) => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["skin-problems-by-id", problemIds],
    queryFn: async () => {
      if (!supabase || !problemIds || problemIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from("skin_problems")
        .select("id, name_ar, name_en, emoji, description")
        .in("id", problemIds);

      if (error) {
        console.error('Error fetching skin problems:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!supabase && !!problemIds && problemIds.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};
