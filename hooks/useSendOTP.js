import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Logger } from '../utils/logger'

/**
 * Hook to send 6-digit email OTP
 * For testing in Expo Go (magic links don't work in Expo Go)
 */
export const useSendOTP = () => {
  return useMutation({
    mutationFn: async (email) => {
      if (!email) {
        throw new Error('Email is required')
      }

      const cleanEmail = email.toLowerCase().trim()

      Logger.info('Sending OTP to:', cleanEmail)

      const { data, error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          shouldCreateUser: true,
        },
      })

      if (error) {
        Logger.error('Error sending OTP:', error)
        throw error
      }

      Logger.info('OTP sent successfully to:', cleanEmail)
      return data
    },
    retry: 1,
  })
}
