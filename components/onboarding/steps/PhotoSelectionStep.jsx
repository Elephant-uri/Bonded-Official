import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native'
import React, { useState } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'
import { Ionicons } from '@expo/vector-icons'
import { ONBOARDING_STEPS } from '../../../stores/onboardingStore'
import theme from '../../../constants/theme'
import { hp, wp } from '../../../helpers/common'

const PhotoSelectionStep = ({ formData, updateFormData, onScroll }) => {
  const [localPhotos, setLocalPhotos] = useState(formData.photos || [])
  const [isProcessing, setIsProcessing] = useState(false)

  // Request permissions
  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need access to your photos to set up your profile.',
        [{ text: 'OK' }]
      )
      return false
    }
    return true
  }

  // Process image to square format
  const processImage = async (uri) => {
    try {
      // Get image dimensions
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [
          // First, get the image to understand its dimensions
          { resize: { width: 800 } }, // Resize to max width
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      )

      // Calculate square crop (center crop)
      const { width, height } = manipResult
      const size = Math.min(width, height)
      const x = (width - size) / 2
      const y = (height - size) / 2

      // Crop to square
      const cropped = await ImageManipulator.manipulateAsync(
        manipResult.uri,
        [
          { crop: { originX: x, originY: y, width: size, height: size } },
          { resize: { width: 800, height: 800 } }, // Ensure square 800x800
        ],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      )

      return cropped.uri
    } catch (error) {
      console.error('Error processing image:', error)
      return uri // Return original if processing fails
    }
  }

  // Handle image selection
  const handleSelectPhotos = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    // Calculate how many photos can be selected
    const remainingSlots = 5 - localPhotos.length
    if (remainingSlots <= 0) {
      Alert.alert('Maximum Photos', 'You can only upload up to 5 photos.')
      return
    }

    setIsProcessing(true)

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Image,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: remainingSlots,
      })

      if (!result.canceled && result.assets) {
        const processedPhotos = []
        
        for (const asset of result.assets) {
          const processedUri = await processImage(asset.uri)
          processedPhotos.push({
            uri: processedUri,
            localUri: processedUri,
            isYearbookPhoto: localPhotos.length === 0 && processedPhotos.length === 0,
            order: localPhotos.length + processedPhotos.length,
          })
        }

        const newPhotos = [...localPhotos, ...processedPhotos]
        // Ensure first photo is marked as yearbook photo
        if (newPhotos.length > 0) {
          newPhotos[0].isYearbookPhoto = true
          newPhotos.forEach((photo, index) => {
            photo.order = index
          })
        }

        setLocalPhotos(newPhotos)
        updateFormData(ONBOARDING_STEPS.PHOTOS, { photos: newPhotos })
      }
    } catch (error) {
      console.error('Error selecting photos:', error)
      Alert.alert('Error', 'Failed to select photos. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Remove photo
  const handleRemovePhoto = (index) => {
    const newPhotos = localPhotos.filter((_, i) => i !== index)
    // Reorder and ensure first is yearbook photo
    newPhotos.forEach((photo, i) => {
      photo.order = i
      photo.isYearbookPhoto = i === 0
    })

    setLocalPhotos(newPhotos)
    updateFormData(ONBOARDING_STEPS.PHOTOS, { photos: newPhotos })
  }

  // Reorder photos (move to first position)
  const handleSetAsYearbookPhoto = (index) => {
    if (index === 0) return // Already first

    const newPhotos = [...localPhotos]
    const [movedPhoto] = newPhotos.splice(index, 1)
    newPhotos.unshift(movedPhoto)
    
    // Update order and yearbook photo flag
    newPhotos.forEach((photo, i) => {
      photo.order = i
      photo.isYearbookPhoto = i === 0
    })

    setLocalPhotos(newPhotos)
    updateFormData(ONBOARDING_STEPS.PHOTOS, { photos: newPhotos })
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={true}
      onScroll={onScroll}
      scrollEventThrottle={16}
      nestedScrollEnabled={true}
    >
      <Text style={styles.title}>Select Your Yearbook Photo</Text>
      <Text style={styles.subtitle}>
        Upload 1-5 photos. The first photo will be your yearbook photo.
      </Text>

      {isProcessing && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={theme.colors.bondedPurple} />
          <Text style={styles.processingText}>Processing photos...</Text>
        </View>
      )}

      {/* Photo Grid */}
      <View style={styles.photoGrid}>
        {/* Add Photo Button */}
        {localPhotos.length < 5 && (
          <TouchableOpacity
            style={styles.addPhotoButton}
            onPress={handleSelectPhotos}
            disabled={isProcessing}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={hp(4)} color={theme.colors.bondedPurple} />
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        )}

        {/* Photo Cards */}
        {localPhotos.map((photo, index) => (
          <View key={index} style={styles.photoCard}>
            <Image source={{ uri: photo.localUri }} style={styles.photoImage} />
            
            {/* Yearbook Photo Badge */}
            {photo.isYearbookPhoto && (
              <View style={styles.yearbookBadge}>
                <Text style={styles.yearbookBadgeText}>Yearbook Photo</Text>
              </View>
            )}

            {/* Remove Button */}
            <TouchableOpacity
              style={[
                styles.removeButton,
                photo.isYearbookPhoto && styles.removeButtonWithBadge,
              ]}
              onPress={() => handleRemovePhoto(index)}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={hp(3)} color={theme.colors.white} />
            </TouchableOpacity>

            {/* Set as Yearbook Photo Button (if not first) */}
            {!photo.isYearbookPhoto && (
              <TouchableOpacity
                style={styles.setYearbookButton}
                onPress={() => handleSetAsYearbookPhoto(index)}
                activeOpacity={0.7}
              >
                <Text style={styles.setYearbookText}>Set as Yearbook Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Instructions */}
      {localPhotos.length === 0 && (
        <View style={styles.instructionsContainer}>
          <Ionicons name="information-circle-outline" size={hp(3)} color={theme.colors.softBlack} />
          <Text style={styles.instructionsText}>
            Tap "Add Photo" to select photos from your gallery. You can select multiple photos at once.
          </Text>
        </View>
      )}

      {/* Photo Count */}
      {localPhotos.length > 0 && (
        <Text style={styles.photoCount}>
          {localPhotos.length} of 5 photos
        </Text>
      )}
    </ScrollView>
  )
}

export default PhotoSelectionStep

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: hp(2),
    paddingBottom: hp(10),
    flexGrow: 1,
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
    paddingHorizontal: wp(4),
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: hp(3),
  },
  processingText: {
    marginTop: hp(2),
    fontSize: hp(2),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    marginBottom: hp(3),
  },
  addPhotoButton: {
    width: (wp(100) - wp(8) - wp(2)) / 2, // Screen width - padding - gap, divided by 2
    aspectRatio: 1,
    marginBottom: wp(2),
    backgroundColor: theme.colors.offWhite,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.bondedPurple,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hp(1),
  },
  addPhotoText: {
    fontSize: hp(1.8),
    color: theme.colors.bondedPurple,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  photoCard: {
    width: (wp(100) - wp(8) - wp(2)) / 2, // Screen width - padding - gap, divided by 2
    aspectRatio: 1,
    marginBottom: wp(2),
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    backgroundColor: theme.colors.offWhite,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  yearbookBadge: {
    position: 'absolute',
    top: wp(2),
    left: wp(2),
    backgroundColor: theme.colors.bondedPurple,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: theme.radius.pill,
  },
  yearbookBadgeText: {
    fontSize: hp(1.4),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  removeButton: {
    position: 'absolute',
    top: wp(2),
    right: wp(2),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: hp(1.5),
    padding: hp(0.3),
    zIndex: 10,
  },
  removeButtonWithBadge: {
    top: wp(8), // Move down if yearbook badge is present
  },
  setYearbookButton: {
    position: 'absolute',
    bottom: wp(2),
    left: wp(2),
    right: wp(2),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: hp(1),
    paddingHorizontal: wp(2),
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  setYearbookText: {
    fontSize: hp(1.6),
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.body,
    fontWeight: '600',
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.offWhite,
    padding: wp(4),
    borderRadius: theme.radius.md,
    marginHorizontal: wp(4),
    marginTop: hp(2),
    gap: wp(3),
  },
  instructionsText: {
    flex: 1,
    fontSize: hp(1.8),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    lineHeight: hp(2.5),
  },
  photoCount: {
    fontSize: hp(2),
    color: theme.colors.softBlack,
    fontFamily: theme.typography.fontFamily.body,
    textAlign: 'center',
    marginTop: hp(2),
    opacity: 0.7,
  },
})

