import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'

// Get from environment variables or use fallback
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wmlklvlnxftedtylgxsc.supabase.co'
const supabasePublishableKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_YppByb96gYCa3bMLBdgWKg_xRfMcdXb'

// Validate that we have the required values
if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Supabase configuration. Please check your .env file or app.config.js')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})