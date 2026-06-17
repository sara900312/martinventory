import React, { createContext, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SupabaseContext = createContext();

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
};

export const SupabaseProvider = ({ children }) => {
  useEffect(() => {
    // Log Supabase initialization status
    if (supabase) {
      console.debug('Supabase client initialized successfully');

      // Test basic connectivity when the app loads
      const testConnection = async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.warn('Supabase auth check failed:', error?.message);
          } else {
            console.debug('Supabase connection verified');
          }
        } catch (err) {
          console.warn('Failed to verify Supabase connection:', err?.message || err);
          console.info('App will continue with degraded functionality - local data only');
        }
      };

      testConnection();
    } else {
      console.error('Supabase client is not initialized!');
    }
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};
