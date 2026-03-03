import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'
import { useAppTheme } from '../app/theme'
import { usePressScale } from '../utils/animations'

const SecondaryButton = ({
  label,
  onPress,
  icon,
  iconPosition = 'left',
  disabled = false,
  style,
  textStyle,
}) => {
  const theme = useAppTheme()
  const { scaleStyle, onPressIn, onPressOut } = usePressScale(
    theme.motion.pressScale,
    theme.motion.duration.fast
  )

  return (
    <Animated.View style={[scaleStyle, style]}>
      <Pressable
        onPress={disabled ? undefined : onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[
          styles.button,
          {
            borderRadius: theme.radius.pill,
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.background,
          },
          disabled && styles.disabled,
        ]}
      >
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={18} color={theme.colors.textPrimary} style={{ marginRight: theme.spacing.sm }} />
        )}
        <Text style={[styles.label, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.semibold }, textStyle]}>{label}</Text>
        {icon && iconPosition === 'right' && (
          <Ionicons name={icon} size={18} color={theme.colors.textPrimary} style={{ marginLeft: theme.spacing.sm }} />
        )}
      </Pressable>
    </Animated.View>
  )
}

export default SecondaryButton

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    letterSpacing: -0.1,
  },
})
