import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import theme from '../../../constants/theme'
import { hp, wp } from '../../../helpers/common'

const ClassScheduleStep = ({ formData, updateFormData, onScroll }) => {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name="calendar-outline" 
          size={hp(12)} 
          color={theme.colors.bondedPurple + '40'} 
        />
      </View>
      
      <Text style={styles.title}>Class Schedule</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
      <Text style={styles.description}>
        We're working on a feature to help you find classmates and study partners based on your schedule. Stay tuned!
      </Text>
    </ScrollView>
  )
}

export default ClassScheduleStep

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(4),
    paddingHorizontal: wp(8),
  },
  iconContainer: {
    marginBottom: hp(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: hp(4),
    fontWeight: '800',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(2),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(3),
    fontWeight: '700',
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(3),
    textAlign: 'center',
  },
  description: {
    fontSize: hp(2.2),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    lineHeight: hp(3.2),
    opacity: 0.8,
  },
})

