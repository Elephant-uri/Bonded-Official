// Use legacy API for expo-file-system v19+
import { createSignedUrlForPath, uploadImageToBondedMedia } from './mediaStorage'
import { Logger } from '../utils/logger'

/**
 * Upload photos to Supabase Storage
 * @param {Array} photos - Array of photo objects with localUri
 * @param {string} userId - User ID for folder structure
 * @returns {Promise<Array>} Array of uploaded photo URLs
 */
export const uploadPhotosToSupabase = async (photos, userId, universityId = null) => {
  if (!photos || photos.length === 0) {
    Logger.info('No photos to upload')
    return []
  }

  if (!userId) {
    Logger.error('User ID is required for photo upload')
    throw new Error('User ID is required for photo upload')
  }

  Logger.info(`Starting upload of ${photos.length} photo(s) for user ${userId} (University: ${universityId || 'None'})`)

  const uploadedPhotos = []
  const errors = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]

    // Skip if already uploaded
    if (photo.uploadedUrl) {
      Logger.info(`Photo ${i + 1} already uploaded, skipping: ${photo.uploadedUrl}`)
      uploadedPhotos.push(photo)
      continue
    }

    if (!photo.localUri) {
      Logger.warn(`Photo ${i + 1} has no localUri, skipping`)
      errors.push({ index: i, error: 'No localUri provided' })
      continue
    }

    try {
      Logger.info(`Uploading photo ${i + 1}/${photos.length}...`)

      const mediaType = photo.isYearbookPhoto ? 'profile_avatar' : 'profile_photo'

      // Note: Run database/enable-profile-media.sql to set up media_type enum and RLS policies
      const uploadResult = await uploadImageToBondedMedia({
        fileUri: photo.localUri,
        mediaType,
        ownerType: 'user',
        ownerId: userId,
        userId,
        universityId, // Pass the pre-resolved universityId
        upsert: mediaType === 'profile_avatar',
      })

      const signedUrl = await createSignedUrlForPath(uploadResult.path)

      const uploadedPhoto = {
        ...photo,
        uploadedUrl: signedUrl,
        storagePath: uploadResult.path,
        mediaId: uploadResult.media?.id || null,
      }

      uploadedPhotos.push(uploadedPhoto)
      Logger.info(`Signed URL for photo ${i + 1}: ${signedUrl}`)
    } catch (error) {
      Logger.error(`Error processing photo ${i + 1}:`, error)
      errors.push({
        index: i,
        error: error.message || 'Unknown error',
        stack: error.stack
      })
      // Continue with other photos
    }
  }

  // Log summary
  const successCount = uploadedPhotos.filter(p => p.uploadedUrl).length
  Logger.info(`Upload summary: ${successCount}/${photos.length} photos uploaded successfully`)

  if (errors.length > 0) {
    Logger.warn(`${errors.length} photo(s) failed to upload:`, errors)
  }

  if (uploadedPhotos.length === 0 && photos.length > 0) {
    throw new Error(`Failed to upload any photos. ${errors.length} error(s) occurred.`)
  }

  return uploadedPhotos
}
