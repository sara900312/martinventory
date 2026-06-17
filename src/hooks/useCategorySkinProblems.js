import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/contexts/SupabaseContext";

/**
 * Hook to fetch skin problems based on product category
 * Maps category to appropriate tool_title:
 * - 'hair' → 'العناية بالشعر'
 * - 'skincare' → 'العناية بالبشرة'
 */
export const useCategorySkinProblems = (productCategory) => {
  const { supabase } = useSupabase();

  // Map product category to tool_title in skin_problems table
  const getCategoryMapping = (category) => {
    const mapping = {
      'hair': 'العناية بالشعر',
      'hair_care': 'العناية بالشعر',
      'skincare': 'العناية بالبشرة',
      'skin_care': 'العناية بالبشرة',
    };
    return mapping[category] || null;
  };

  return useQuery({
    queryKey: ["category-skin-problems", productCategory],
    queryFn: async () => {
      if (!supabase || !productCategory) {
        return [];
      }

      const toolTitle = getCategoryMapping(productCategory);
      if (!toolTitle) {
        console.debug(`No tool title mapping found for category: ${productCategory}`);
        return [];
      }

      try {
        const { data, error } = await supabase
          .from("skin_problems")
          .select(
            `id,
             name_ar,
             name_en,
             emoji,
             description,
             tool_title`
          )
          .eq("tool_title", toolTitle)
          .order("name_ar", { ascending: true });

        if (error) {
          console.error('Error fetching category skin problems:', error);
          return [];
        }

        return data || [];
      } catch (err) {
        console.error('Unexpected error in useCategorySkinProblems:', err);
        return [];
      }
    },
    enabled: !!supabase && !!productCategory,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
};
