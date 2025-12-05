import { Text, StyleSheet } from 'react-native'
import React from 'react'
import theme from '../../constants/theme'
import { hp, wp } from '../../helpers/common'
import { ONBOARDING_STEPS } from '../../stores/onboardingStore'

const ProgressBar = ({ currentStep, completionPercentage }) => {
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

const styles = StyleSheet.create({
  stepIndicator: {
    fontSize: hp(1.8),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    opacity: 0.7,
  },
})

