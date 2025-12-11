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
  Image,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { hp, wp } from '../../helpers/common'
import { useAppTheme } from '../theme'
import AppTopBar from '../../components/AppTopBar'
import BottomNav from '../../components/BottomNav'
import Picker from '../../components/Picker'
import { useClubsContext } from '../../contexts/ClubsContext'

const CATEGORIES = [
  { value: 'academic', label: 'Academic' },
  { value: 'sports', label: 'Sports' },
  { value: 'arts', label: 'Arts' },
  { value: 'service', label: 'Service' },
  { value: 'business', label: 'Business' },
  { value: 'social', label: 'Social' },
]

export default function CreateOrg() {
  const theme = useAppTheme()
  const styles = createStyles(theme)
  const router = useRouter()
  const { createClub } = useClubsContext()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('academic')
  const [isPublic, setIsPublic] = useState(true)
  const [requiresApproval, setRequiresApproval] = useState(false)
  const [coverImage, setCoverImage] = useState(null)
  const [avatar, setAvatar] = useState(null)

  const pickImage = async (type: 'cover' | 'avatar') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        Alert.alert('Permission needed', 'Please grant photo library access')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Image,
        allowsEditing: true,
        aspect: type === 'cover' ? [16, 9] : [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets?.[0]) {
        if (type === 'cover') {
          setCoverImage(result.assets[0].uri)
        } else {
          setAvatar(result.assets[0].uri)
        }
      }
    } catch (error) {
      console.log('Image picker error:', error)
      Alert.alert('Error', 'Failed to pick image')
    }
  }

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter an organization name')
      return
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description')
      return
    }

    const clubData = {
      name: name.trim(),
      description: description.trim(),
      category,
      isPublic,
      requiresApproval,
      coverImage: coverImage || null,
      avatar: avatar || null,
    }

    const clubId = createClub(clubData)
    Alert.alert('Success', 'Organization created!', [
      {
        text: 'OK',
        onPress: () => router.push(`/clubs/${clubId}`),
      },
    ])
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <AppTopBar
          schoolName="Create Organization"
          onPressProfile={() => router.back()}
          onPressSchool={() => {}}
          onPressNotifications={() => router.push('/notifications')}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Start an Organization</Text>

          {/* Avatar */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization Avatar</Text>
            <TouchableOpacity
              style={styles.imagePickerButton}
              onPress={() => pickImage('avatar')}
              activeOpacity={0.7}
            >
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarPreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={hp(3)} color={theme.colors.bondedPurple} />
                  <Text style={styles.imagePickerText}>Add Avatar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Cover Image */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cover Image (optional)</Text>
            {coverImage ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: coverImage }} style={styles.coverImagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setCoverImage(null)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={hp(2.5)} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={() => pickImage('cover')}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={hp(3)} color={theme.colors.bondedPurple} />
                <Text style={styles.imagePickerText}>Add Cover Image</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Computer Science Club"
              placeholderTextColor={theme.colors.textSecondary + '60'}
            />
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Tell people about your organization..."
              placeholderTextColor={theme.colors.textSecondary + '60'}
              multiline
              numberOfLines={4}
            />
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

          {/* Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <View style={styles.switchRow}>
              <View style={styles.switchLabel}>
                <Text style={styles.switchText}>Public Organization</Text>
                <Text style={styles.switchSubtext}>
                  Anyone can see and join
                </Text>
              </View>
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{
                  false: theme.colors.backgroundSecondary,
                  true: theme.colors.bondedPurple + '50',
                }}
                thumbColor={isPublic ? theme.colors.bondedPurple : theme.colors.textSecondary}
              />
            </View>

            {!isPublic && (
              <View style={styles.switchRow}>
                <View style={styles.switchLabel}>
                  <Text style={styles.switchText}>Require Approval</Text>
                  <Text style={styles.switchSubtext}>
                    Approve join requests manually
                  </Text>
                </View>
                <Switch
                  value={requiresApproval}
                  onValueChange={setRequiresApproval}
                  trackColor={{
                    false: theme.colors.offWhite,
                    true: theme.colors.bondedPurple + '50',
                  }}
                  thumbColor={
                    requiresApproval ? theme.colors.bondedPurple : theme.colors.textSecondary
                  }
                />
              </View>
            )}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <Text style={styles.createButtonText}>Create Organization</Text>
          </TouchableOpacity>
        </ScrollView>

        <BottomNav />
      </View>
    </SafeAreaView>
  )
}

const createStyles = (theme) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
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
    color: theme.colors.textPrimary,
    marginBottom: hp(2),
  },
  inputGroup: {
    marginBottom: hp(2),
  },
  label: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.8),
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    fontSize: hp(1.7),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textArea: {
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
    padding: hp(3),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.bondedPurple,
    borderStyle: 'dashed',
    gap: hp(1),
  },
  imagePickerText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.bondedPurple,
    fontWeight: '600',
  },
  avatarPreview: {
    width: hp(12),
    height: hp(12),
    borderRadius: hp(6),
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  coverImagePreview: {
    width: '100%',
    height: hp(20),
    borderRadius: theme.radius.lg,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: hp(1),
    right: wp(4),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.full,
  },
  section: {
    marginTop: hp(2),
    marginBottom: hp(2),
    padding: wp(4),
    backgroundColor: theme.colors.background,
    borderRadius: theme.radius.lg,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: theme.typography.fontFamily.heading,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.5),
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  switchLabel: {
    flex: 1,
  },
  switchText: {
    fontSize: hp(1.6),
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: hp(0.2),
  },
  switchSubtext: {
    fontSize: hp(1.3),
    fontFamily: theme.typography.fontFamily.body,
    color: theme.colors.textSecondary,
    opacity: 0.7,
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
})

