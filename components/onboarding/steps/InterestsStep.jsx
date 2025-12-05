import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { ONBOARDING_STEPS } from '../../../stores/onboardingStore'
import { ALL_INTERESTS } from '../../../constants/interests'
import theme from '../../../constants/theme'
import { hp, wp } from '../../../helpers/common'

const InterestsStep = ({ formData, updateFormData, onScroll }) => {
  const [localData, setLocalData] = useState({
    interests: formData.interests || [],
  })

  const handleInterestToggle = (interest) => {
    const newInterests = localData.interests.includes(interest)
      ? localData.interests.filter(i => i !== interest)
      : [...localData.interests, interest]
    
    const newData = { ...localData, interests: newInterests }
    setLocalData(newData)
    updateFormData(ONBOARDING_STEPS.INTERESTS, newData)
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.title}>What are you interested in?</Text>
      <Text style={styles.subtitle}>Help us find your people (optional)</Text>

      {/* Interests Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interests</Text>
        <Text style={styles.sectionSubtitle}>Select as many as you like</Text>
        <View style={styles.tagsContainer}>
          {ALL_INTERESTS.map((interest) => {
            const isSelected = localData.interests.includes(interest)
            return (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.tag,
                  isSelected && styles.tagSelected,
                ]}
                onPress={() => handleInterestToggle(interest)}
              >
                <Text
                  style={[
                    styles.tagText,
                    isSelected && styles.tagTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>
    </ScrollView>
  )
}

export default InterestsStep

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: hp(2),
    paddingBottom: hp(6),
  },
  title: {
    fontSize: hp(4),
    fontWeight: '800',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(1),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: hp(2.2),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(4),
    textAlign: 'center',
  },
  section: {
    marginBottom: hp(4),
  },
  sectionTitle: {
    fontSize: hp(2.5),
    fontWeight: '700',
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.heading,
    marginBottom: hp(0.5),
  },
  sectionSubtitle: {
    fontSize: hp(1.8),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    marginBottom: hp(2),
    opacity: 0.7,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(2),
  },
  tag: {
    backgroundColor: theme.colors.offWhite,
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagSelected: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
  tagText: {
    fontSize: hp(1.8),
    color: theme.colors.charcoal,
    fontFamily: theme.typography.fontFamily.body,
  },
  tagTextSelected: {
    color: theme.colors.white,
    fontWeight: '600',
  },
})
