import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import { ONBOARDING_THEME } from '../../../constants/onboardingTheme'
import { hp, wp } from '../../../helpers/common'

const ClassScheduleStep = ({ formData, updateFormData, onScroll }) => {
  const styles = createStyles(ONBOARDING_THEME)
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
          color="#A45CFF40" 
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

const createStyles = () => StyleSheet.create({
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
    color: '#1A1A1A',
    fontFamily: 'System',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(3),
    fontWeight: '700',
    color: '#A45CFF',
    fontFamily: 'System',
    marginBottom: hp(3),
    textAlign: 'center',
  },
  description: {
    fontSize: hp(2.2),
    color: '#8E8E8E',
    fontFamily: 'System',
    textAlign: 'center',
    lineHeight: hp(3.2),
    opacity: 0.8,
  },
})

