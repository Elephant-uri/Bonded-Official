import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { uploadPhotosToSupabase } from '../helpers/uploadPhotos'

/**
 * Hook to save onboarding data to the profile
 * Supports partial updates - saves whatever data is provided
 */
export const useSaveOnboarding = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ formData, completedSteps, completionPercentage }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to save onboarding data')
      }

      // Upload photos if present and not already uploaded
      let uploadedPhotos = formData.photos || []
      if (formData.photos && formData.photos.length > 0) {
        const needsUpload = formData.photos.some(photo => !photo.uploadedUrl)
        if (needsUpload) {
          uploadedPhotos = await uploadPhotosToSupabase(formData.photos, user.id)
        }
      }

      // Prepare update object (only include fields that have values)
      const updateData = {
        last_onboarding_update: new Date().toISOString(),
        profile_completion_percentage: completionPercentage,
      }

      // Add photos if uploaded
      if (uploadedPhotos.length > 0) {
        updateData.photos = uploadedPhotos.map(photo => ({
          url: photo.uploadedUrl || photo.localUri,
          isYearbookPhoto: photo.isYearbookPhoto,
          order: photo.order,
        }))
        // Set yearbook photo URL (first photo)
        const yearbookPhoto = uploadedPhotos.find(p => p.isYearbookPhoto) || uploadedPhotos[0]
        if (yearbookPhoto) {
          updateData.yearbook_photo_url = yearbookPhoto.uploadedUrl || yearbookPhoto.localUri
        }
      }

      // Add basic info if present
      if (formData.school) updateData.university_id = formData.school // Assuming school maps to university_id
      if (formData.age) updateData.age = formData.age
      if (formData.grade) updateData.grade = formData.grade
      if (formData.gender) updateData.gender = formData.gender
      if (formData.major) updateData.major = formData.major

      // Add optional fields if present
      if (formData.interests?.length > 0) {
        updateData.interests = formData.interests
      }
      if (formData.personalityTags?.length > 0) {
        updateData.personality_tags = formData.personalityTags
      }
      if (formData.humorStyle) updateData.humor_style = formData.humorStyle
      if (formData.aesthetic) updateData.aesthetic = formData.aesthetic
      if (formData.studyHabits) updateData.study_habits = formData.studyHabits
      if (formData.livingHabits) updateData.living_habits = formData.livingHabits
      if (formData.personalityAnswers && Object.keys(formData.personalityAnswers).length > 0) {
        updateData.personality_answers = formData.personalityAnswers
      }
      if (formData.classSchedule) updateData.class_schedule = formData.classSchedule

      // Set onboarding step to the last completed step
      if (completedSteps?.length > 0) {
        updateData.onboarding_step = completedSteps[completedSteps.length - 1]
      }

      // Mark onboarding as complete if 100%
      if (completionPercentage >= 100) {
        updateData.onboarding_complete = true
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error saving onboarding data:', error)
        throw error
      }

      return data
    },
    onSuccess: (data) => {
      // Invalidate profile queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}

