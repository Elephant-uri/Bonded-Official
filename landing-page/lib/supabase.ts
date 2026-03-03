import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Support both Next.js and Expo env var names (for monorepo)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim()
const supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY)?.trim()

// Anon client (for client-side or RLS-respecting server use)
let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error)
  }
} else {
  if (typeof window === 'undefined') {
    console.warn('Supabase credentials not found. Waitlist will use local storage fallback.')
  }
}

// Service role client (server-only, bypasses RLS) — use for waitlist inserts
let supabaseAdmin: SupabaseClient | null = null
if (typeof window === 'undefined' && supabaseUrl && supabaseServiceKey) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  } catch (error) {
    console.warn('Failed to initialize Supabase admin client:', error)
  }
}

export { supabase, supabaseAdmin }







