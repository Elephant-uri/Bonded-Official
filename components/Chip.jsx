import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'

const Chip = ({
  label,
  active = false,
  onPress,
  icon,
  iconPosition = 'left',
  style,
}) => {
  const content = (
    <>
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={hp(1.4)}
          color={active ? '#FFFFFF' : '#000000'}
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
          color={active ? '#FFFFFF' : '#000000'}
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
          colors={['#A855F7', '#7C3AED']}
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

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  gradient: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: hp(1.4),
    fontWeight: '500',
    color: '#000000',
  },
  labelActive: {
    color: '#FFFFFF',
  },
})

