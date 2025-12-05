import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { hp, wp } from '../helpers/common'
import theme from '../constants/theme'

const AppHeader = ({
  title,
  rightAction,
  rightActionLabel,
  showBack = true,
  onBack,
  backgroundColor = '#FFFFFF',
}) => {
  const router = useRouter()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (router.canGoBack()) {
      router.back()
    }
  }

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {showBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={hp(2.2)} color="#000000" />
        </TouchableOpacity>
      )}
      
      {!showBack && <View style={styles.backButton} />}
      
      {title && (
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
      )}
      
      {rightAction ? (
        <TouchableOpacity
          style={styles.rightAction}
          onPress={rightAction}
          activeOpacity={0.6}
        >
          {rightActionLabel && (
            <Text style={styles.rightActionText}>{rightActionLabel}</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={styles.rightAction} />
      )}
    </View>
  )
}

export default AppHeader

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    height: hp(6),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(4),
  },
  title: {
    fontSize: hp(2.4),
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.3,
  },
  rightAction: {
    minWidth: hp(4),
    height: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(2),
  },
  rightActionText: {
    fontSize: hp(1.6),
    fontWeight: '600',
    color: theme.colors.bondedPurple,
  },
})

