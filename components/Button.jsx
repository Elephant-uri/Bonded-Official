import React from 'react'
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text } from 'react-native'
import { useAppTheme } from '../app/theme'
import { usePressScale } from '../utils/animations'

/**
 * MergeFund Design System — Primary Button
 *
 * Variants:
 *   "primary"     — Brand purple bg, white text, pill
 *   "linear"      — Foreground bg, background text, pill (high-contrast)
 *   "secondary"   — Transparent bg, 1px border, pill
 *   "ghost"       — No bg, no border, rounded
 *   "destructive" — Red bg, white text, pill
 */
const Button = ({
  title = '',
  onPress = () => {},
  variant = 'primary',
  loading = false,
  disabled = false,
  buttonStyle,
  textStyle,
  hasShadow = false,
  theme: customTheme,
}) => {
  const appTheme = useAppTheme()
  const theme = customTheme || appTheme
  const { scaleStyle, onPressIn, onPressOut } = usePressScale(
    theme.motion.pressScale,
    theme.motion.duration.fast
  )

  const variantStyle = theme.buttonVariants?.[variant] || theme.buttonVariants?.primary || {}

  const textColor = (() => {
    switch (variant) {
      case 'primary':
      case 'destructive':
        return '#FFFFFF'
      case 'linear':
        return theme.colors.background
      case 'secondary':
      case 'ghost':
      default:
        return theme.colors.textPrimary
    }
  })()

  return (
    <Animated.View style={[scaleStyle, buttonStyle]}>
      <Pressable
        onPress={disabled || loading ? undefined : onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || loading}
        style={[
          styles.base,
          variantStyle,
          hasShadow && theme.shadows?.sm,
          disabled && styles.disabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={textColor} size="small" />
        ) : (
          <Text
            style={[
              styles.text,
              { color: textColor, fontFamily: theme.typography.fontFamily.semibold },
              textStyle,
            ]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  )
}

export default Button

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  text: {
    fontSize: 15,
    letterSpacing: -0.1,
  },
  disabled: {
    opacity: 0.45,
  },
})
