import { View, StyleSheet } from 'react-native'
import React from 'react'
import Button from '../Button'
import { ONBOARDING_THEME } from '../../constants/onboardingTheme'
import { hp, wp } from '../../helpers/common'

const OnboardingNavigation = ({
  isFirstStep,
  canContinue,
  onContinue,
  onBack,
  onFinishLater,
  isSaving,
  stepIndicator,
}) => {
  const styles = createStyles(ONBOARDING_THEME)
  return (
    <View style={styles.container}>
      {/* Step Indicator */}
      {stepIndicator}

      {/* Continue and Finish Later Buttons */}
      <View style={styles.primaryButtons}>
        {/* Finish Later - Only show if past first step */}
        {!isFirstStep && (
          <Button
            title="Finish Later"
            onPress={onFinishLater}
            buttonStyle={[styles.button, styles.finishLaterButton]}
            textStyle={styles.finishLaterText}
            theme={ONBOARDING_THEME}
            hasShadow={false}
          />
        )}

        {/* Continue Button */}
        <Button
          title={isSaving ? "Saving..." : "Continue"}
          onPress={onContinue}
          buttonStyle={[
            styles.button,
            styles.continueButton,
            !canContinue && styles.buttonDisabled,
          ]}
          textStyle={!canContinue && styles.buttonDisabledText}
          theme={ONBOARDING_THEME}
          hasShadow={false}
        />
      </View>
    </View>
  )
}

export default OnboardingNavigation

const createStyles = () => StyleSheet.create({
  container: {
    paddingBottom: hp(4),
    gap: hp(1.5),
  },
  primaryButtons: {
    flexDirection: 'row',
    gap: wp(3),
  },
  button: {
    flex: 1,
  },
  finishLaterButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#A45CFF',
  },
  finishLaterText: {
    color: '#A45CFF',
  },
  continueButton: {
    backgroundColor: '#A45CFF', // Purple color - this should override Button's default
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    opacity: 0.5,
  },
  buttonDisabledText: {
    color: '#8E8E8E',
  },
})

