import React from 'react'
import { Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { hp, wp } from '../helpers/common'

const SecondaryButton = ({
  label,
  onPress,
  icon,
  iconPosition = 'left',
  disabled = false,
  style,
  textStyle,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[styles.button, style, disabled && styles.buttonDisabled]}
    >
      {icon && iconPosition === 'left' && (
        <Ionicons
          name={icon}
          size={hp(2)}
          color="#000000"
          style={{ marginRight: wp(2) }}
        />
      )}
      <Text style={[styles.label, textStyle]}>{label}</Text>
      {icon && iconPosition === 'right' && (
        <Ionicons
          name={icon}
          size={hp(2)}
          color="#000000"
          style={{ marginLeft: wp(2) }}
        />
      )}
    </TouchableOpacity>
  )
}

export default SecondaryButton

const styles = StyleSheet.create({
  button: {
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: hp(1.2),
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  label: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: '#000000',
  },
})

