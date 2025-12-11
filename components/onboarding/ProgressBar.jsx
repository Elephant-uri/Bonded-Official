import { Text, StyleSheet } from 'react-native'
import React from 'react'
// Onboarding always uses light mode
import { hp, wp } from '../../helpers/common'
import { ONBOARDING_STEPS } from '../../stores/onboardingStore'

const ProgressBar = ({ currentStep, completionPercentage }) => {
  const styles = createStyles()
  const steps = Object.values(ONBOARDING_STEPS)
  const currentStepIndex = steps.indexOf(currentStep)
  const currentStepNumber = currentStepIndex + 1
  const totalSteps = steps.length
  
  return (
    <Text style={styles.stepIndicator}>
      Step {currentStepNumber}/{totalSteps}
    </Text>
  )
}

export default ProgressBar

const createStyles = () => StyleSheet.create({
  stepIndicator: {
    fontSize: hp(1.8),
    color: '#8E8E8E',
    fontFamily: 'System',
    textAlign: 'center',
    opacity: 0.7,
  },
})

