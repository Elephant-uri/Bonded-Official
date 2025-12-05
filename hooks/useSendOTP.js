import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

/**
 * Hook to send OTP to user's email
 * Uses Supabase Auth's signInWithOtp method
 */
export const useSendOTP = () => {
  return useMutation({
    mutationFn: async (email) => {
      if (!email) {
        throw new Error('Email is required')
      }

      try {
        const { data, error } = await supabase.auth.signInWithOtp({
          email: email.toLowerCase().trim(),
          options: {
            // Optional: customize email template
            emailRedirectTo: undefined, // We're using OTP, not magic link
          },
        })

        if (error) {
          throw error
        }

        return data
      } catch (error) {
        console.error('Error sending OTP:', error)
        throw error
      }
    },
    retry: 1, // Retry once on failure
  })
}

