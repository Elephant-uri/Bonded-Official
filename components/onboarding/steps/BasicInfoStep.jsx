import { View, Text, StyleSheet, ScrollView } from 'react-native'
import React, { useState, useMemo } from 'react'
import Picker from '../../Picker'
import Button from '../../Button'
import { ONBOARDING_STEPS } from '../../../stores/onboardingStore'
import { US_SCHOOLS } from '../../../constants/schools'
import theme from '../../../constants/theme'
import { hp, wp } from '../../../helpers/common'

const BasicInfoStep = ({ formData, updateFormData, onScroll }) => {
  const [localData, setLocalData] = useState({
    school: formData.school || null,
    age: formData.age || null,
    grade: formData.grade || '',
    gender: formData.gender || '',
    major: formData.major || '',
  })

  const handleChange = (field, value) => {
    const newData = {
      ...localData,
      [field]: value,
    }
    setLocalData(newData)
    
    // Update store
    updateFormData(ONBOARDING_STEPS.BASIC_INFO, {
      school: newData.school,
      age: newData.age,
      grade: newData.grade,
      gender: newData.gender,
      major: newData.major,
    })
  }

  // Age options (17-30, typical college age range)
  const ageOptions = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const age = i + 17
      return { value: age, label: age.toString() }
    })
  }, [])

  const gradeOptions = [
    { value: 'incoming-freshman', label: 'Incoming Freshman' },
    { value: 'freshman', label: 'Freshman' },
    { value: 'sophomore', label: 'Sophomore' },
    { value: 'junior', label: 'Junior' },
    { value: 'senior', label: 'Senior' },
    { value: 'graduate', label: 'Graduate' },
  ]
  
  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ]

  const majorOptions = [
    { value: 'undecided', label: 'Undecided' },
    { value: 'computer-science', label: 'Computer Science' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'business', label: 'Business' },
    { value: 'medicine', label: 'Medicine' },
    { value: 'psychology', label: 'Psychology' },
    { value: 'biology', label: 'Biology' },
    { value: 'economics', label: 'Economics' },
    { value: 'political-science', label: 'Political Science' },
    { value: 'history', label: 'History' },
    { value: 'philosophy', label: 'Philosophy' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'mathematics', label: 'Mathematics' },
    { value: 'physics', label: 'Physics' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'english', label: 'English' },
    { value: 'communications', label: 'Communications' },
    { value: 'journalism', label: 'Journalism' },
    { value: 'education', label: 'Education' },
    { value: 'nursing', label: 'Nursing' },
    { value: 'pre-med', label: 'Pre-Med' },
    { value: 'pre-law', label: 'Pre-Law' },
    { value: 'art', label: 'Art' },
    { value: 'music', label: 'Music' },
    { value: 'theater', label: 'Theater' },
    { value: 'film', label: 'Film' },
    { value: 'design', label: 'Design' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'sociology', label: 'Sociology' },
    { value: 'anthropology', label: 'Anthropology' },
    { value: 'international-relations', label: 'International Relations' },
    { value: 'environmental-science', label: 'Environmental Science' },
    { value: 'neuroscience', label: 'Neuroscience' },
    { value: 'public-health', label: 'Public Health' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <Text style={styles.title}>Let's get started</Text>
      <Text style={styles.subtitle}>Tell us a bit about yourself</Text>

      {/* School Picker */}
      <Picker
        label="School"
        placeholder="Select your university"
        value={localData.school}
        options={US_SCHOOLS}
        onValueChange={(value) => handleChange('school', value)}
        searchable={true}
        containerStyle={styles.inputGroup}
      />

      {/* Age Picker */}
      <Picker
        label="Age"
        placeholder="Select your age"
        value={localData.age}
        options={ageOptions}
        onValueChange={(value) => handleChange('age', value)}
        containerStyle={styles.inputGroup}
      />

      {/* Grade Picker */}
      <Picker
        label="Grade"
        placeholder="Select your grade"
        value={localData.grade}
        options={gradeOptions}
        onValueChange={(value) => handleChange('grade', value)}
        containerStyle={styles.inputGroup}
      />

      {/* Gender Picker */}
      <Picker
        label="Gender"
        placeholder="Select your gender"
        value={localData.gender}
        options={genderOptions}
        onValueChange={(value) => handleChange('gender', value)}
        containerStyle={styles.inputGroup}
      />

      {/* Major Picker */}
      <Picker
        label="Major"
        placeholder="Select your major"
        value={localData.major}
        options={majorOptions}
        onValueChange={(value) => handleChange('major', value)}
        searchable={true}
        containerStyle={styles.inputGroup}
      />
    </ScrollView>
  )
}

export default BasicInfoStep

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: hp(2),
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
  inputGroup: {
    marginBottom: hp(3),
  },
})

