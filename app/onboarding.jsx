import { View, StyleSheet, ImageBackground, TouchableWithoutFeedback, Keyboard } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { useRouter } from 'expo-router'
import ScreenWrapper from '../components/ScreenWrapper'
import { StatusBar } from 'expo-status-bar'
import { useOnboardingStore, ONBOARDING_STEPS } from '../stores/onboardingStore'
import { useSaveOnboarding } from '../hooks/useSaveOnboarding'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'
import BackButton from '../components/BackButton'
import ProgressBar from '../components/onboarding/ProgressBar'
import PhotoSelectionStep from '../components/onboarding/steps/PhotoSelectionStep'
import BasicInfoStep from '../components/onboarding/steps/BasicInfoStep'
import InterestsStep from '../components/onboarding/steps/InterestsStep'
import StudyHabitsStep from '../components/onboarding/steps/StudyHabitsStep'
import LivingHabitsStep from '../components/onboarding/steps/LivingHabitsStep'
import PersonalityStep from '../components/onboarding/steps/PersonalityStep'
import ClassScheduleStep from '../components/onboarding/steps/ClassScheduleStep'
import OnboardingNavigation from '../components/onboarding/OnboardingNavigation'

export default function Onboarding() {
  const router = useRouter()
  const { 
    currentStep, 
    formData, 
    completedSteps, 
    completionPercentage,
    canAccessApp,
    setCurrentStep,
    updateFormData,
    markStepComplete,
    getNextIncompleteStep,
  } = useOnboardingStore()
  
  const { mutate: saveOnboarding, isPending: isSaving } = useSaveOnboarding()
  const [isScrollingDown, setIsScrollingDown] = useState(false)
  const lastScrollY = useRef(0)

  // Auto-save when form data changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (canAccessApp) {
        saveOnboarding({
          formData,
          completedSteps,
          completionPercentage,
        })
      }
    }, 1000) // Debounce: save 1 second after last change

    return () => clearTimeout(timer)
  }, [formData, completedSteps, completionPercentage])

  const handleContinue = async () => {
    // If on photos step, upload photos before continuing
    if (currentStep === ONBOARDING_STEPS.PHOTOS && formData.photos?.length > 0) {
      try {
        // Upload photos via saveOnboarding
        await new Promise((resolve, reject) => {
          saveOnboarding(
            { formData, completedSteps, completionPercentage },
            {
              onSuccess: () => {
                markStepComplete(currentStep)
                resolve()
              },
              onError: (error) => {
                console.error('Error uploading photos:', error)
                reject(error)
              },
            }
          )
        })
      } catch (error) {
        console.error('Failed to upload photos:', error)
        // Continue anyway - photos will be uploaded on next save
      }
    } else {
      // Mark current step as complete
      markStepComplete(currentStep)
    }
    
    // Get next step in sequence (not just next incomplete)
    const steps = Object.values(ONBOARDING_STEPS)
    const currentStepIndex = steps.indexOf(currentStep)
    
    if (currentStepIndex < steps.length - 1) {
      // Go to next step in sequence
      const nextStep = steps[currentStepIndex + 1]
      setCurrentStep(nextStep)
      // Reset scroll state when changing steps
      setIsScrollingDown(false)
      lastScrollY.current = 0
    } else {
      // All steps complete - navigate to Yearbook (home)
      router.replace('/yearbook')
    }
  }

  const handleBack = () => {
    const steps = Object.values(ONBOARDING_STEPS)
    const stepIndex = steps.indexOf(currentStep)
    
    if (stepIndex > 0) {
      // Go to previous step in sequence
      const prevStep = steps[stepIndex - 1]
      setCurrentStep(prevStep)
      // Reset scroll state when changing steps
      setIsScrollingDown(false)
      lastScrollY.current = 0
    } else {
      // If on first step, go back to previous screen (OTP/Login)
      router.back()
    }
  }

  const handleFinishLater = () => {
    // Save current progress
    saveOnboarding({
      formData,
      completedSteps,
      completionPercentage,
    }, {
      onSuccess: () => {
        // Navigate to Yearbook (home)
        router.replace('/yearbook')
      }
    })
  }

  // Handle scroll to show/hide back button
  const handleScroll = (event) => {
    const currentScrollY = event.nativeEvent.contentOffset.y
    const scrollingDown = currentScrollY > lastScrollY.current && currentScrollY > 50
    
    if (scrollingDown !== isScrollingDown) {
      setIsScrollingDown(scrollingDown)
    }
    
    lastScrollY.current = currentScrollY
  }

  // Render current step component with scroll handler
  const renderStepContent = () => {
    const commonProps = {
      formData,
      updateFormData,
      onScroll: handleScroll,
    }
    
    switch (currentStep) {
      case ONBOARDING_STEPS.PHOTOS:
        return <PhotoSelectionStep {...commonProps} />
      case ONBOARDING_STEPS.BASIC_INFO:
        return <BasicInfoStep {...commonProps} />
      case ONBOARDING_STEPS.INTERESTS:
        return <InterestsStep {...commonProps} />
      case ONBOARDING_STEPS.STUDY_HABITS:
        return <StudyHabitsStep {...commonProps} />
      case ONBOARDING_STEPS.LIVING_HABITS:
        return <LivingHabitsStep {...commonProps} />
      case ONBOARDING_STEPS.PERSONALITY:
        return <PersonalityStep {...commonProps} />
      case ONBOARDING_STEPS.CLASS_SCHEDULE:
        return <ClassScheduleStep {...commonProps} />
      default:
        return <PhotoSelectionStep {...commonProps} />
    }
  }

  const isFirstStep = currentStep === ONBOARDING_STEPS.PHOTOS
  // Can continue if: photos step has at least 1 photo, or other steps are complete
  const canContinue = 
    (currentStep === ONBOARDING_STEPS.PHOTOS && formData.photos?.length > 0) ||
    (currentStep !== ONBOARDING_STEPS.PHOTOS && canAccessApp)

  return (
    <ImageBackground
      source={require('../assets/images/bonded-gradient.jpg')}
      style={styles.background}
      resizeMode='cover'
    >
      <ScreenWrapper bg='transparent'>
        <StatusBar style='light' />
        <BackButton onPress={handleBack} visible={!isScrollingDown} />
        
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>
            {/* Step Content - Conditional rendering */}
            <View style={styles.stepContainer}>
              {renderStepContent()}
            </View>

            {/* Navigation Buttons - Fixed at bottom with step indicator */}
            <OnboardingNavigation
              isFirstStep={isFirstStep}
              canContinue={canContinue}
              onContinue={handleContinue}
              onBack={handleBack}
              onFinishLater={handleFinishLater}
              isSaving={isSaving}
              stepIndicator={
                <ProgressBar 
                  currentStep={currentStep}
                  completionPercentage={completionPercentage}
                />
              }
            />
          </View>
        </TouchableWithoutFeedback>
      </ScreenWrapper>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: hp(6), // Increased top padding to start content lower
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: hp(2), // Additional padding for content
  },
})

