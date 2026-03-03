import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useAppTheme } from '../app/theme'

/**
 * MergeFund Design System — Card / Surface
 *
 * Flat design with subtle 1px low-opacity borders. No heavy drop shadows.
 * Uses `variant` prop: "default" | "elevated" | "flat"
 */
const AppCard = ({
  children,
  style,
  variant = 'default',
  radius = 'md',
  padding = true,
}) => {
  const theme = useAppTheme()
  const variantStyle = theme.cardVariants?.[variant] || theme.cardVariants?.default || {}
  const radiusValue = theme.radius[radius] ?? theme.radius.md

  return (
    <View
      style={[
        variantStyle,
        {
          borderRadius: radiusValue,
          padding: padding ? theme.spacing.md : 0,
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}

export default AppCard
