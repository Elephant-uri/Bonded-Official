import { View, StyleSheet } from 'react-native'
import React from 'react'
import Button from '../Button'
import theme from '../../constants/theme'
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
            buttonStyle={[styles.finishLaterButton, styles.button]}
            textStyle={styles.finishLaterText}
          />
        )}

        {/* Continue Button */}
        <Button
          title={isSaving ? "Saving..." : "Continue"}
          onPress={onContinue}
          buttonStyle={[
            styles.continueButton,
            styles.button,
            !canContinue && styles.buttonDisabled,
          ]}
          textStyle={!canContinue && styles.buttonDisabledText}
        />
      </View>
    </View>
  )
}

export default OnboardingNavigation

const styles = StyleSheet.create({
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
    borderColor: theme.colors.bondedPurple,
  },
  finishLaterText: {
    color: theme.colors.bondedPurple,
  },
  continueButton: {
    backgroundColor: theme.colors.bondedPurple,
  },
  buttonDisabled: {
    backgroundColor: theme.colors.offWhite,
    opacity: 0.5,
  },
  buttonDisabledText: {
    color: theme.colors.softBlack,
  },
})

