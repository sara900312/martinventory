import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

// Fetch all popups for admin
export const useAllPopups = () => {
  return useQuery({
    queryKey: ['popups', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('popup_hero')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Fetch popup with view stats
export const usePopupsWithStats = () => {
  return useQuery({
    queryKey: ['popups', 'with-stats'],
    queryFn: async () => {
      try {
        const { data: popups, error: popupsError } = await supabase
          .from('popup_hero')
          .select('*')
          .order('created_at', { ascending: false });

        if (popupsError) throw popupsError;

        // Return popups without view stats (simplified)
        return popups || [];
      } catch (error) {
        console.error('Error fetching popups:', error);
        throw error;
      }
    },
    refetchInterval: 5000,
  });
};

// Fetch active popup for public display
export const useActivePopup = () => {
  return useQuery({
    queryKey: ['popups', 'active'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('popup_hero')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

// Fetch all active popups for queue system
export const useActivePopupQueue = () => {
  return useQuery({
    queryKey: ['popups', 'queue'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('popup_hero')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 5000,
  });
};

// Create popup
export const useCreatePopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (popup) => {
      const { data, error } = await supabase
        .from('popup_hero')
        .insert(popup)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] });
      toast({
        title: 'Success',
        description: 'Popup created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create popup: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Update popup
export const useUpdatePopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...popup }) => {
      const { data, error } = await supabase
        .from('popup_hero')
        .update(popup)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] });
      toast({
        title: 'Success',
        description: 'Popup updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update popup: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

// Delete popup
export const useDeletePopup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('popup_hero')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['popups'] });
      toast({
        title: 'Success',
        description: 'Popup deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete popup: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};
