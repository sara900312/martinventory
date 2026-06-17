import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ykyzviqwscrjjkucorlp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlreXp2aXF3c2NyamprdWNvcmxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2NzA1NjcsImV4cCI6MjA3OTI0NjU2N30.sXpyumNFfZ_bqqZt28LOQQjDM040y7R-9-jIXy_KIps';

// Validate Supabase configuration
const validateSupabaseConfig = () => {
  const missingConfig = [];

  if (!supabaseUrl) missingConfig.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingConfig.push('VITE_SUPABASE_ANON_KEY');

  if (missingConfig.length > 0) {
    console.warn(
      `⚠️  Missing Supabase configuration: ${missingConfig.join(', ')}\n` +
      'The app will work with limited functionality. Some features requiring database access will not be available.'
    );
    return false;
  }

  return true;
};

// Validate before creating client
const isConfigValid = validateSupabaseConfig();

export const supabase = isConfigValid ? createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: 'public',
  },
}) : null;

// Add error listener for fetch errors
if (supabase) {
  // Patch the fetch to provide better error messages
  const originalFetch = fetch;
  window.fetch = function(...args) {
    const url = args[0] instanceof Request ? args[0].url : args[0];

    return originalFetch.apply(this, args)
      .catch(error => {
        if (url?.includes('supabase.co')) {
          console.warn(
            `Unable to connect to Supabase (${url}). ` +
            'Possible causes: Network is offline, Supabase service is unreachable, or CORS issue.'
          );
        }
        throw error;
      });
  };
}
