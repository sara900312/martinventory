import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/contexts/SupabaseContext";

export const useToolCategories = () => {
  const { supabase } = useSupabase();

  return useQuery({
    queryKey: ["tool-categories"],
    queryFn: async () => {
      if (!supabase) {
        console.warn('Supabase client not initialized');
        return [];
      }

      try {
        const { data, error } = await supabase
          .from("skin_problems")
          .select(
            `tool_title,
             tool_description,
             tool_media_url`
          );

        if (error) {
          console.error('Error fetching tool categories:', error);
          throw error;
        }

        // Group by tool_title to eliminate duplicates and create a unique list
        const uniqueCategories = {};
        (data || []).forEach((item) => {
          if (item.tool_title && !uniqueCategories[item.tool_title]) {
            uniqueCategories[item.tool_title] = {
              tool_title: item.tool_title,
              tool_description: item.tool_description,
              tool_media_url: item.tool_media_url,
            };
          }
        });

        const categories = Object.values(uniqueCategories);
        console.log('Tool categories loaded:', categories);
        return categories;
      } catch (err) {
        console.error('Unexpected error in useToolCategories:', err);
        throw err;
      }
    },
    enabled: !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};
