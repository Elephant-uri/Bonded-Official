import React from 'react'
import { View, StyleSheet, Platform } from 'react-native'
import { hp, wp } from '../helpers/common'

const AppCard = ({ children, style, radius = 'lg', padding = true }) => {
  const radiusValue = radius === 'lg' ? hp(1.8) : hp(1.2)

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radiusValue,
          padding: padding ? wp(4) : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export default AppCard

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
})

