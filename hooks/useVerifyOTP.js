import { useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

/**
 * Hook to verify OTP code
 * Updates auth store on success
 */
export const useVerifyOTP = () => {
  const { setUser, setSession, setEmail, setIsNewUser, setVerificationStatus } = useAuthStore()

  return useMutation({
    mutationFn: async ({ email, token }) => {
      if (!email || !token) {
        throw new Error('Email and token are required')
      }

      try {
        // Verify OTP with Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          email: email.toLowerCase().trim(),
          token,
          type: 'email',
        })

        if (error) {
          throw error
        }

        // Get user data from profiles table
        let userData = null
        try {
          const { data: user, error: userError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()

          if (!userError && user) {
            userData = user
          }
        } catch (err) {
          // Profile might not exist yet (will be created by trigger)
          console.log('Could not fetch profile data:', err.message)
        }

        return {
          user: data.user,
          session: data.session,
          userData, // Additional user data from users table
        }
      } catch (error) {
        console.error('Error verifying OTP:', error)
        throw error
      }
    },
    onSuccess: (data) => {
      // Update auth store with user and session
      setUser(data.user)
      setSession(data.session)
      setEmail(data.user.email)

      // If we have userData, update additional info
      if (data.userData) {
        setIsNewUser(false) // They exist in users table
        setVerificationStatus(data.userData.is_verified ? 'verified' : 'unverified')
      } else {
        // New user - will be set when we check email
        setIsNewUser(true)
      }
    },
    onError: (error) => {
      console.error('OTP verification failed:', error)
      // Don't update store on error
    },
    retry: 1, // Retry once on failure
  })
}

