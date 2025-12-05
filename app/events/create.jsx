import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Platform,
  Image,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as ImagePicker from 'expo-image-picker'
import { hp, wp } from '../../helpers/common'
import theme from '../../constants/theme'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import Picker from '../../components/Picker'
import { useEventsContext } from '../../contexts/EventsContext'

const CATEGORIES = [
  { value: 'social', label: 'Social' },
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'party', label: 'Party' },
  { value: 'club', label: 'Club' },
  { value: 'other', label: 'Other' },
]

export default function CreateEvent() {
  const router = useRouter()
  const { createEvent } = useEventsContext()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('social')
  
  // Date/Time states
  const [startDate, setStartDate] = useState(new Date())
  const [endDate, setEndDate] = useState(new Date())
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showStartTimePicker, setShowStartTimePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showEndTimePicker, setShowEndTimePicker] = useState(false)
  
  const [coverImage, setCoverImage] = useState(null)
  const [isPublic, setIsPublic] = useState(true)
  const [maxAttendees, setMaxAttendees] = useState('')
  const [requireApproval, setRequireApproval] = useState(false)
  const [allowPlusOnes, setAllowPlusOnes] = useState(true)
  const [link, setLink] = useState('')
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurringType, setRecurringType] = useState('weekly') // 'daily', 'weekly', 'monthly'
  const [recurringEndDate, setRecurringEndDate] = useState(new Date())
  const [showRecurringEndDatePicker, setShowRecurringEndDatePicker] = useState(false)

  // Forum selection (mock - will be replaced with real forum list)
  const [selectedForums, setSelectedForums] = useState([])
  const mockForums = [
    { id: 'forum-quad', name: 'Quad' },
    { id: 'forum-events', name: 'Campus Events' },
    { id: 'forum-academic', name: 'Academic' },
  ]

  const toggleForum = (forumId) => {
    setSelectedForums((prev) =>
      prev.includes(forumId)
        ? prev.filter((id) => id !== forumId)
        : [...prev, forumId]
    )
  }

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant photo library access')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Image,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        setCoverImage(result.assets[0].uri)
      }
    } catch (error) {
      console.log('Image picker error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const removeImage = () => {
    setCoverImage(null)
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleCreate = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title')
      return
    }

    // Ensure end date is after start date
    if (endDate <= startDate) {
      Alert.alert('Error', 'End date and time must be after start date and time')
      return
    }

    const eventData = {
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      category,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      isPublic,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : null,
      requireApproval,
      allowPlusOnes,
      coverImage,
      link: link.trim() || null,
      postedToForums: selectedForums,
      clubId: null, // TODO: If created from club
      isRecurring,
      recurringType: isRecurring ? recurringType : null,
      recurringEndDate: isRecurring ? recurringEndDate.toISOString() : null,
    }

    const eventId = createEvent(eventData)
    Alert.alert('Success', 'Event created!', [
      {
        text: 'OK',
        onPress: () => router.push(`/events/${eventId}`),
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="University of Rhode Island"
          onPressProfile={() => router.push('/profile')}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Create Event</Text>

          {/* Title */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Fall Hackathon 2025"
              placeholderTextColor={theme.colors.softBlack + '60'}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell people about your event..."
              placeholderTextColor={theme.colors.softBlack + '60'}
              multiline
              numberOfLines={4}
            />
          </View>

          {/* Date & Time */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Start Date & Time *</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={() => setShowStartDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeButton}>
                  <Ionicons
                    name="calendar-outline"
                    size={hp(2)}
                    color={theme.colors.bondedPurple}
                  />
                  <Text style={styles.dateTimeText}>
                    {formatDate(startDate)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.input, styles.timeInput]}
                onPress={() => setShowStartTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeButton}>
                  <Ionicons
                    name="time-outline"
                    size={hp(2)}
                    color={theme.colors.bondedPurple}
                  />
                  <Text style={styles.dateTimeText}>
                    {formatTime(startDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date & Time</Text>
            <View style={styles.dateTimeRow}>
              <TouchableOpacity
                style={[styles.input, styles.dateInput]}
                onPress={() => setShowEndDatePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeButton}>
                  <Ionicons
                    name="calendar-outline"
                    size={hp(2)}
                    color={theme.colors.bondedPurple}
                  />
                  <Text style={styles.dateTimeText}>
                    {formatDate(endDate)}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.input, styles.timeInput]}
                onPress={() => setShowEndTimePicker(true)}
                activeOpacity={0.7}
              >
                <View style={styles.dateTimeButton}>
                  <Ionicons
                    name="time-outline"
                    size={hp(2)}
                    color={theme.colors.bondedPurple}
                  />
                  <Text style={styles.dateTimeText}>
                    {formatTime(endDate)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Engineering Building, Room 201"
              placeholderTextColor={theme.colors.softBlack + '60'}
            />
          </View>

          {/* Link */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Link (optional)</Text>
            <TextInput
              style={styles.input}
              value={link}
              onChangeText={setLink}
              placeholder="https://example.com"
              placeholderTextColor={theme.colors.softBlack + '60'}
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Recurring Event */}
          <View style={styles.inputGroup}>
            <View style={styles.switchRow}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.label}>Recurring Event</Text>
                <Text style={styles.switchSubtext}>Repeat this event on a schedule</Text>
              </View>
              <Switch
                value={isRecurring}
                onValueChange={setIsRecurring}
                trackColor={{ false: theme.colors.offWhite, true: theme.colors.bondedPurple + '80' }}
                thumbColor={isRecurring ? theme.colors.bondedPurple : theme.colors.white}
              />
            </View>

            {isRecurring && (
              <View style={styles.recurringOptions}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Repeat</Text>
                  <View style={styles.recurringTypeRow}>
                    <TouchableOpacity
                      style={[
                        styles.recurringTypeButton,
                        recurringType === 'daily' && styles.recurringTypeButtonActive,
                      ]}
                      onPress={() => setRecurringType('daily')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.recurringTypeText,
                          recurringType === 'daily' && styles.recurringTypeTextActive,
                        ]}
                      >
                        Daily
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.recurringTypeButton,
                        recurringType === 'weekly' && styles.recurringTypeButtonActive,
                      ]}
                      onPress={() => setRecurringType('weekly')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.recurringTypeText,
                          recurringType === 'weekly' && styles.recurringTypeTextActive,
                        ]}
                      >
                        Weekly
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.recurringTypeButton,
                        recurringType === 'monthly' && styles.recurringTypeButtonActive,
                      ]}
                      onPress={() => setRecurringType('monthly')}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.recurringTypeText,
                          recurringType === 'monthly' && styles.recurringTypeTextActive,
                        ]}
                      >
                        Monthly
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Repeat Until</Text>
                  <TouchableOpacity
                    style={styles.input}
                    onPress={() => setShowRecurringEndDatePicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dateTimeButton}>
                      <Ionicons
                        name="calendar-outline"
                        size={hp(2)}
                        color={theme.colors.bondedPurple}
                      />
                      <Text style={styles.dateTimeText}>
                        {formatDate(recurringEndDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Cover Image/Flyer */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Event Flyer/Image (optional)</Text>
            {coverImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: coverImage }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={hp(2.5)} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={hp(3)} color={theme.colors.bondedPurple} />
                <Text style={styles.imagePickerText}>Add Flyer/Image</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <Picker
              options={CATEGORIES}
              value={category}
              onValueChange={setCategory}
              placeholder="Select category"
            />
          </View>

          {/* Privacy Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Public Event</Text>
                <Text style={styles.switchSubtext}>
                  Anyone can see and RSVP
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: theme.colors.offWhite,
                  true: theme.colors.bondedPurple + '50',
                }}
                thumbColor={isPublic ? theme.colors.bondedPurple : theme.colors.softBlack}
              />
            </View>

            {!isPublic && (
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchText}>Require Approval</Text>
                  <Text style={styles.switchSubtext}>
                    Approve RSVPs manually
                  </Text>
                </View>
                <Switch
                  value={requireApproval}
                  onValueChange={setRequireApproval}
                  trackColor={{
                    false: theme.colors.offWhite,
                    true: theme.colors.bondedPurple + '50',
                  }}
                  thumbColor={
                    requireApproval ? theme.colors.bondedPurple : theme.colors.softBlack
                  }
                />
              </View>
            )}

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Allow Plus-Ones</Text>
                <Text style={styles.switchSubtext}>
                  Attendees can bring guests
                </Text>
              </View>
              <Switch
                value={allowPlusOnes}
                onValueChange={setAllowPlusOnes}
                trackColor={{
                  false: theme.colors.offWhite,
                  true: theme.colors.bondedPurple + '50',
                }}
                thumbColor={allowPlusOnes ? theme.colors.bondedPurple : theme.colors.softBlack}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Max Attendees (optional)</Text>
              <TextInput
                style={styles.input}
                value={maxAttendees}
                onChangeText={setMaxAttendees}
                placeholder="Leave empty for unlimited"
                placeholderTextColor={theme.colors.softBlack + '60'}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Post to Forums */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Post to Forums</Text>
            <Text style={styles.sectionSubtext}>
              Event will appear in selected forums
            </Text>
            {mockForums.map((forum) => (
              <TouchableOpacity
                key={forum.id}
                style={styles.forumOption}
                onPress={() => toggleForum(forum.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    selectedForums.includes(forum.id) && styles.checkboxChecked,
                  ]}
                >
                  {selectedForums.includes(forum.id) && (
                    <Ionicons
                      name="checkmark"
                      size={hp(1.5)}
                      color={theme.colors.white}
                    />
                  )}
                </View>
                <Text style={styles.forumOptionText}>{forum.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create Event</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Date/Time Pickers - Android */}
        {Platform.OS === 'android' && (
          <>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(false)
                  if (selectedDate) {
                    const newDate = new Date(selectedDate)
                    newDate.setHours(startDate.getHours())
                    newDate.setMinutes(startDate.getMinutes())
                    setStartDate(newDate)
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {showStartTimePicker && (
              <DateTimePicker
                value={startDate}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowStartTimePicker(false)
                  if (selectedTime) {
                    const newDate = new Date(startDate)
                    newDate.setHours(selectedTime.getHours())
                    newDate.setMinutes(selectedTime.getMinutes())
                    setStartDate(newDate)
                  }
                }}
              />
            )}

            {showEndDatePicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(false)
                  if (selectedDate) {
                    const newDate = new Date(selectedDate)
                    newDate.setHours(endDate.getHours())
                    newDate.setMinutes(endDate.getMinutes())
                    setEndDate(newDate)
                  }
                }}
                minimumDate={startDate}
              />
            )}

            {showRecurringEndDatePicker && (
              <DateTimePicker
                value={recurringEndDate}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowRecurringEndDatePicker(false)
                  if (selectedDate) {
                    setRecurringEndDate(selectedDate)
                  }
                }}
                minimumDate={startDate}
              />
            )}

            {showEndTimePicker && (
              <DateTimePicker
                value={endDate}
                mode="time"
                display="default"
                onChange={(event, selectedTime) => {
                  setShowEndTimePicker(false)
                  if (selectedTime) {
                    const newDate = new Date(endDate)
                    newDate.setHours(selectedTime.getHours())
                    newDate.setMinutes(selectedTime.getMinutes())
                    setEndDate(newDate)
                  }
                }}
              />
            )}
          </>
        )}

        {/* Date/Time Pickers - iOS (wrapped in Modal) */}
        {Platform.OS === 'ios' && (
          <>
            <Modal
              visible={showStartDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowStartDatePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowStartDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>Select Start Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowStartDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          const newDate = new Date(selectedDate)
                          newDate.setHours(startDate.getHours())
                          newDate.setMinutes(startDate.getMinutes())
                          setStartDate(newDate)
                        }
                      }}
                      minimumDate={new Date()}
                      textColor={theme.colors.charcoal}
                    />
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={showStartTimePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowStartTimePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowStartTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>Select Start Time</Text>
                    <TouchableOpacity
                      onPress={() => setShowStartTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={startDate}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          const newDate = new Date(startDate)
                          newDate.setHours(selectedTime.getHours())
                          newDate.setMinutes(selectedTime.getMinutes())
                          setStartDate(newDate)
                        }
                      }}
                      textColor={theme.colors.charcoal}
                    />
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={showEndDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowEndDatePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowEndDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>Select End Date</Text>
                    <TouchableOpacity
                      onPress={() => setShowEndDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          const newDate = new Date(selectedDate)
                          newDate.setHours(endDate.getHours())
                          newDate.setMinutes(endDate.getMinutes())
                          setEndDate(newDate)
                        }
                      }}
                      minimumDate={startDate}
                      textColor={theme.colors.charcoal}
                    />
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={showEndTimePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowEndTimePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>Select End Time</Text>
                    <TouchableOpacity
                      onPress={() => setShowEndTimePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={endDate}
                      mode="time"
                      display="spinner"
                      onChange={(event, selectedTime) => {
                        if (selectedTime) {
                          const newDate = new Date(endDate)
                          newDate.setHours(selectedTime.getHours())
                          newDate.setMinutes(selectedTime.getMinutes())
                          setEndDate(newDate)
                        }
                      }}
                      textColor={theme.colors.charcoal}
                    />
                  </View>
                </View>
              </View>
            </Modal>

            <Modal
              visible={showRecurringEndDatePicker}
              transparent
              animationType="slide"
              onRequestClose={() => setShowRecurringEndDatePicker(false)}
            >
              <View style={styles.pickerModal}>
                <View style={styles.pickerModalContent}>
                  <View style={styles.pickerModalHeader}>
                    <TouchableOpacity
                      onPress={() => setShowRecurringEndDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={styles.pickerModalButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.pickerModalTitle}>Repeat Until</Text>
                    <TouchableOpacity
                      onPress={() => setShowRecurringEndDatePicker(false)}
                      style={styles.pickerModalButton}
                    >
                      <Text style={[styles.pickerModalButtonText, styles.pickerModalButtonDone]}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.iosPickerContainer}>
                    <DateTimePicker
                      value={recurringEndDate}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        if (selectedDate) {
                          setRecurringEndDate(selectedDate)
                        }
                      }}
                      minimumDate={startDate}
                      textColor={theme.colors.charcoal}
                    />
                  </View>
                </View>
              </View>
            </Modal>
          </>
        )}
        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.offWhite,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(10),
  },
  title: {
    fontSize: hp(3),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '800',
    color: theme.colors.charcoal,
    marginBottom: hp(2),
  },
  inputGroup: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: hp(0.8),
  },
  input: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.offWhite,
  },
  textArea: {
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  dateInput: {
    flex: 2,
  },
  timeInput: {
    flex: 1,
  },
  section: {
    marginTop: hp(2),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.charcoal,
    marginBottom: hp(0.5),
  },
  sectionSubtext: {
    fontSize: hp(1.4),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
    marginBottom: hp(1.5),
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  switchLabel: {
    flex: 1,
  },
  switchText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.charcoal,
    marginBottom: hp(0.2),
  },
  switchSubtext: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.softBlack,
    opacity: 0.7,
  },
  switchLabelContainer: {
    flex: 1,
  },
  recurringOptions: {
    marginTop: hp(1.5),
    paddingTop: hp(1.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.offWhite,
  },
  recurringTypeRow: {
    flexDirection: 'row',
    gap: wp(2),
  },
  recurringTypeButton: {
    flex: 1,
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.offWhite,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recurringTypeButtonActive: {
    backgroundColor: theme.colors.bondedPurple,
  },
  recurringTypeText: {
    fontSize: hp(1.5),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.softBlack,
  },
  recurringTypeTextActive: {
    color: theme.colors.white,
  },
  forumOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.2),
    gap: wp(3),
  },
  checkbox: {
    width: hp(2.2),
    height: hp(2.2),
    borderRadius: theme.radius.sm,
    borderWidth: 2,
    borderColor: theme.colors.softBlack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.bondedPurple,
    borderColor: theme.colors.bondedPurple,
  },
  forumOptionText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  createButton: {
    backgroundColor: theme.colors.bondedPurple,
    paddingVertical: hp(2),
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    marginTop: hp(3),
  },
  createButtonText: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '700',
    color: theme.colors.white,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2),
  },
  dateTimeText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.charcoal,
  },
  pickerModal: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModalContent: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingBottom: hp(2),
    maxHeight: '80%',
  },
  pickerModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.offWhite,
  },
  pickerModalTitle: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.charcoal,
  },
  pickerModalButton: {
    paddingVertical: hp(0.5),
    paddingHorizontal: wp(2),
  },
  pickerModalButtonText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '500',
    color: theme.colors.softBlack,
  },
  pickerModalButtonDone: {
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  iosPickerContainer: {
    width: '100%',
    minHeight: hp(25),
    backgroundColor: theme.colors.white,
    overflow: 'hidden',
  },
  pickerModalButtonText: {
    fontSize: hp(1.8),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderWidth: 2,
    borderColor: theme.colors.bondedPurple,
    borderStyle: 'dashed',
    gap: wp(2),
  },
  imagePickerText: {
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.bondedPurple,
  },
  imagePreviewContainer: {
    position: 'relative',
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: hp(20),
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: hp(1),
    right: wp(4),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: hp(1.25),
    padding: hp(0.5),
  },
})

