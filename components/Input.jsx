import React, { useState } from 'react'
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native'
import { useAppTheme } from '../app/theme'

/**
 * MergeFund Design System — Text Input
 *
 * Pill-shaped with subtle background fill and 1px border.
 * Focus ring uses brand color. Error state uses destructive red.
 */
const Input = ({
  value,
  onChangeText,
  placeholder = '',
  label,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoCorrect = false,
  editable = true,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  containerStyle,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
  ...props
}) => {
  const theme = useAppTheme()
  const [isFocused, setIsFocused] = useState(false)

  const handleFocus = (e) => {
    setIsFocused(true)
    onFocus?.(e)
  }
  const handleBlur = (e) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const baseInput = theme.inputVariants?.default || {}
  const focusStyle = isFocused ? theme.inputVariants?.focused : {}
  const errorStyle = error ? theme.inputVariants?.error : {}

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.heading }]}>
          {label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          baseInput,
          focusStyle,
          errorStyle,
          !editable && styles.inputDisabled,
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          style={[
            styles.input,
            { color: theme.colors.textPrimary, fontFamily: theme.typography.fontFamily.body },
            leftIcon && { marginLeft: theme.spacing.sm },
            rightIcon && { marginRight: theme.spacing.sm },
            multiline && { textAlignVertical: 'top', minHeight: 96, paddingTop: theme.spacing.sm },
            inputStyle,
          ]}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: theme.colors.destructive }]}>{error}</Text>
      )}
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
    ...Platform.select({
      android: { textAlignVertical: 'center' },
    }),
  },
  inputDisabled: {
    opacity: 0.5,
  },
  iconLeft: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconRight: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
})
