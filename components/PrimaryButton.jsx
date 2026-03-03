import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Animated, Pressable, StyleSheet, Text } from 'react-native'
import { useAppTheme } from '../app/theme'
import { usePressScale } from '../utils/animations'

const PrimaryButton = ({
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
          { backgroundColor: theme.colors.brand, borderRadius: theme.radius.pill },
          disabled && styles.disabled,
        ]}
      >
        {icon && iconPosition === 'left' && (
          <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginRight: theme.spacing.sm }} />
        )}
        <Text style={[styles.label, { fontFamily: theme.typography.fontFamily.semibold }, textStyle]}>{label}</Text>
        {icon && iconPosition === 'right' && (
          <Ionicons name={icon} size={18} color="#FFFFFF" style={{ marginLeft: theme.spacing.sm }} />
        )}
      </Pressable>
    </Animated.View>
  )
}

export default PrimaryButton

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
})
