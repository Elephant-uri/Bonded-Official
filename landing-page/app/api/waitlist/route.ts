import { supabaseAdmin } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, school } = await request.json()

    if (!email || !school) {
      return NextResponse.json(
        { error: 'Email and school are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Use service role client (bypasses RLS) — never exposed to client
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Waitlist service is temporarily unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert([
        {
          email: email.trim().toLowerCase(),
          school: school.trim(),
        },
      ])
      .select()
      .single()

    if (error) {
      // Handle duplicate email error (unique constraint)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This email is already on the waitlist' },
          { status: 409 }
        )
      }
      // Handle "relation does not exist" - table not created yet
      if (error.code === '42P01') {
        console.error('Waitlist table missing. Run database/create-waitlist.sql in Supabase SQL Editor.')
        return NextResponse.json(
          { error: 'Waitlist is not set up yet. Please try again later.' },
          { status: 503 }
        )
      }
      // RLS policy violation
      if (error.code === '42501') {
        console.error('Waitlist RLS blocking insert:', error.message)
        return NextResponse.json(
          { error: 'Unable to join waitlist. Please try again.' },
          { status: 403 }
        )
      }

      console.error('Supabase waitlist insert error:', error.code, error.message)
      throw error
    }

    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error: any) {
    console.error('Waitlist submission error:', error)
    return NextResponse.json(
      { error: 'Failed to join waitlist. Please try again.' },
      { status: 500 }
    )
  }
}












