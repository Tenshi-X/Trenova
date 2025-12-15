import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
// Polyfill window for Supabase in strict environments
if (typeof window === 'undefined') {
  (global as any).window = {};
}


const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

if (supabaseUrl === 'https://placeholder.supabase.co' || supabaseAnonKey === 'placeholder-key') {
  console.warn(
    'Missing Supabase configuration. Authentication and database features will NOT work. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file.'
  );
}

// Safe storage adapter to handle environments where AsyncStorage might fail (SSR/Node)
const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (typeof AsyncStorage !== 'undefined' && AsyncStorage.getItem) {
        return await AsyncStorage.getItem(key);
      }
    } catch (e) {
      console.warn('AsyncStorage unavailable, using memory fallback:', e);
    }
    return null; // Fallback to memory/null
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (typeof AsyncStorage !== 'undefined' && AsyncStorage.setItem) {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      // Ignore write errors in strict environments
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (typeof AsyncStorage !== 'undefined' && AsyncStorage.removeItem) {
        await AsyncStorage.removeItem(key);
      }
    } catch (e) {
      // Ignore errors
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SafeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
