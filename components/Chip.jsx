import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { hp, wp } from '../helpers/common'
import { useAppTheme } from '../app/theme'

const Chip = ({
  label,
  active = false,
  onPress,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  
  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={hp(1.4)}
          color={active ? theme.colors.white : theme.colors.textPrimary}
          style={{ marginRight: wp(1) }}
        />
      )}
      <Text style={[styles.label, active && styles.labelActive]}>
        {label}
      </Text>
      {icon && iconPosition === 'right' && (
        <Ionicons
          name={icon}
          size={hp(1.4)}
          color={active ? theme.colors.white : theme.colors.textPrimary}
          style={{ marginLeft: wp(1) }}
        />
      )}
    </>
  )

  const chipStyle = [
    styles.chip,
    !active && styles.chipInactive,
    style,
  ]

  if (active) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={chipStyle}
      >
        <LinearGradient
          colors={[theme.colors.bondedPurple, '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={chipStyle}
    >
      {content}
    </TouchableOpacity>
  )
}

export default Chip

const createStyles = (theme) => StyleSheet.create({
  chip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInactive: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  gradient: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: theme.radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: theme.colors.textPrimary,
  },
  labelActive: {
    color: theme.colors.white,
  },
})

