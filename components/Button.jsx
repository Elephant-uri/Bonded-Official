import { StyleSheet, Text, View, Pressable } from 'react-native'
import React from 'react'
import theme from '../constants/theme'
import { hp, wp } from '../helpers/common'

const Button = ({
    buttonStyle,
    textStyle,
    title = '',
    onPress = () => {},
    loading = false,
    hasShadow = true,
}) => {
    const shadowStyle = {
        
    }
  return (
    <Pressable onPress={onPress} style={[styles.button, buttonStyle, hasShadow && shadowStyle]}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </Pressable>
  )
}

export default Button

const styles = StyleSheet.create({
    button: {
        backgroundColor: theme.colors.bondedPurple,
        paddingVertical: hp(2),
        paddingHorizontal: wp(6),
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: theme.colors.white,
        fontSize: hp(2),
        fontWeight: '600',
        fontFamily: theme.typography.fontFamily.heading,
    },
})