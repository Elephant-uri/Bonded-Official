import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

/**
 * GET /api/waitlist/check
 * Diagnostic endpoint: verifies Supabase connection and waitlist table access.
 * Remove or protect in production.
 */
export async function GET() {
  const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL)
  const hasKey = !!(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY)

  if (!supabase) {
    return NextResponse.json({
      ok: false,
      error: 'Supabase client not initialized',
      env: { hasUrl, hasKey },
      hint: 'Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env (or EXPO_PUBLIC_* from root .env)',
    }, { status: 503 })
  }

  try {
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({
        ok: false,
        error: error.message,
        code: error.code,
        hint: error.code === '42501' ? 'RLS may be blocking. Add policy: INSERT TO anon WITH CHECK (true)' : undefined,
      }, { status: 500 })
    }

    return NextResponse.json({ ok: true, count: count ?? 0 })
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err?.message ?? 'Unknown error',
    }, { status: 500 })
  }
}
