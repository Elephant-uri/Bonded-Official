import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Onboarding steps
export const ONBOARDING_STEPS = {
  PHOTOS: 'photos',              // Required: yearbook photo + additional photos
  BASIC_INFO: 'basic_info',      // Required: school, age, grade, gender
  INTERESTS: 'interests',        // Optional
  STUDY_HABITS: 'study_habits',  // Optional
  LIVING_HABITS: 'living_habits', // Optional
  PERSONALITY: 'personality',     // Optional (for roommates)
  CLASS_SCHEDULE: 'class_schedule', // Optional (eventually)
}

// Completion percentages per step
export const STEP_COMPLETION = {
  [ONBOARDING_STEPS.PHOTOS]: 15,         // Required - yearbook photo
  [ONBOARDING_STEPS.BASIC_INFO]: 20,    // Required - can leave after this
  [ONBOARDING_STEPS.INTERESTS]: 15,
  [ONBOARDING_STEPS.STUDY_HABITS]: 15,
  [ONBOARDING_STEPS.LIVING_HABITS]: 15,
  [ONBOARDING_STEPS.PERSONALITY]: 20,
  [ONBOARDING_STEPS.CLASS_SCHEDULE]: 15,
}

const initialState = {
  // Current state
  currentStep: ONBOARDING_STEPS.PHOTOS,
  completedSteps: [],
  
  // Form data (saved incrementally)
  formData: {
    // Step 1: Photos (Required)
    photos: [], // Array of photo objects: { uri, localUri, isYearbookPhoto, order, uploadedUrl }
    
    // Step 2: Basic Info (Required)
    school: null,
    age: null,
    grade: null, // Freshman, Sophomore, Junior, Senior, Graduate
    gender: null,
    major: null,
    
    // Step 2: Interests (Optional)
    interests: [],
    personalityTags: [],
    humorStyle: null,
    aesthetic: null,
    
    // Step 3: Study Habits (Optional)
    studyHabits: {
      preferredStudyTime: null, // Morning, Afternoon, Evening, Night
      studyLocation: null, // Library, Dorm, Coffee Shop, etc.
      studyStyle: null, // Solo, Group, Both
      noiseLevel: null, // Quiet, Moderate, Noisy
    },
    
    // Step 4: Living Habits (Optional)
    livingHabits: {
      sleepSchedule: null, // Early Bird, Night Owl, Flexible
      cleanliness: null, // Very Clean, Moderate, Relaxed
      socialLevel: null, // Very Social, Moderate, Private
      guests: null, // Often, Sometimes, Rarely
    },
    
    // Step 5: Personality Questions (Optional - for roommates)
    personalityAnswers: {},
    
    // Step 6: Class Schedule (Optional - eventually)
    classSchedule: null,
  },
  
  // Tracking
  completionPercentage: 0,
  lastSavedAt: null,
  canAccessApp: false, // True after basic info is complete
}

export const useOnboardingStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),

      updateFormData: (step, data) => {
        const state = get()
        const newFormData = {
          ...state.formData,
          ...data,
        }
        
        // Calculate completion
        const completedSteps = getCompletedSteps(newFormData)
        const completionPercentage = calculateCompletion(completedSteps)
        // Can access app after photos + basic info are complete
        const canAccessApp = completedSteps.includes(ONBOARDING_STEPS.PHOTOS) && 
                            completedSteps.includes(ONBOARDING_STEPS.BASIC_INFO)
        
        set({
          formData: newFormData,
          completedSteps,
          completionPercentage,
          canAccessApp,
          lastSavedAt: new Date().toISOString(),
        })
      },

      markStepComplete: (step) => {
        const state = get()
        if (!state.completedSteps.includes(step)) {
          const completedSteps = [...state.completedSteps, step]
          const completionPercentage = calculateCompletion(completedSteps)
          
          set({
            completedSteps,
            completionPercentage,
            lastSavedAt: new Date().toISOString(),
          })
        }
      },

      // Check if step is complete
      isStepComplete: (step) => {
        return get().completedSteps.includes(step)
      },

      // Get next incomplete step
      getNextIncompleteStep: () => {
        const { completedSteps } = get()
        const allSteps = Object.values(ONBOARDING_STEPS)
        
        for (const step of allSteps) {
          if (!completedSteps.includes(step)) {
            return step
          }
        }
        return null // All steps complete
      },

      // Reset onboarding (for testing or restart)
      resetOnboarding: () => set(initialState),

      // Clear onboarding data (after successful completion)
      clearOnboarding: () => set(initialState),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Don't persist everything - only essential data
      partialize: (state) => ({
        formData: state.formData,
        completedSteps: state.completedSteps,
        completionPercentage: state.completionPercentage,
        canAccessApp: state.canAccessApp,
        lastSavedAt: state.lastSavedAt,
      }),
    }
  )
)

// Helper: Calculate which steps are complete based on form data
function getCompletedSteps(formData) {
  const completed = []
  
  // Photos (Required - at least 1 photo)
  if (formData.photos && formData.photos.length > 0) {
    completed.push(ONBOARDING_STEPS.PHOTOS)
  }
  
  // Basic Info (Required)
  if (formData.school && formData.age && formData.grade && formData.gender && formData.major) {
    completed.push(ONBOARDING_STEPS.BASIC_INFO)
  }
  
  // Interests
  if (formData.interests && formData.interests.length > 0) {
    completed.push(ONBOARDING_STEPS.INTERESTS)
  }
  
  // Study Habits
  if (formData.studyHabits && Object.values(formData.studyHabits).every(v => v !== null)) {
    completed.push(ONBOARDING_STEPS.STUDY_HABITS)
  }
  
  // Living Habits
  if (formData.livingHabits && Object.values(formData.livingHabits).every(v => v !== null)) {
    completed.push(ONBOARDING_STEPS.LIVING_HABITS)
  }
  
  // Personality
  if (formData.personalityAnswers && Object.keys(formData.personalityAnswers).length > 0) {
    completed.push(ONBOARDING_STEPS.PERSONALITY)
  }
  
  // Class Schedule
  if (formData.classSchedule) {
    completed.push(ONBOARDING_STEPS.CLASS_SCHEDULE)
  }
  
  return completed
}

// Helper: Calculate completion percentage
function calculateCompletion(completedSteps) {
  return completedSteps.reduce((total, step) => {
    return total + (STEP_COMPLETION[step] || 0)
  }, 0)
}

