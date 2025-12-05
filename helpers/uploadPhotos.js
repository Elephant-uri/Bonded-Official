import * as FileSystem from 'expo-file-system'
import { supabase } from '../lib/supabase'

/**
 * Upload photos to Supabase Storage
 * @param {Array} photos - Array of photo objects with localUri
 * @param {string} userId - User ID for folder structure
 * @returns {Promise<Array>} Array of uploaded photo URLs
 */
export const uploadPhotosToSupabase = async (photos, userId) => {
  if (!photos || photos.length === 0) {
    return []
  }

  const uploadedPhotos = []

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]
    
    // Skip if already uploaded
    if (photo.uploadedUrl) {
      uploadedPhotos.push(photo)
      continue
    }
    
    try {
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(photo.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      })

      // Create file path
      const timestamp = Date.now()
      const filePath = `${userId}/photos/${timestamp}_${i}.jpg`

      // Convert base64 to array buffer for React Native
      // Supabase Storage accepts base64 strings directly
      const { data, error } = await supabase.storage
        .from('profiles')
        .upload(filePath, decodeBase64(base64), {
          contentType: 'image/jpeg',
          upsert: false,
        })

      if (error) {
        console.error(`Error uploading photo ${i}:`, error)
        // Continue with other photos even if one fails
        continue
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      uploadedPhotos.push({
        ...photo,
        uploadedUrl: urlData.publicUrl,
        storagePath: filePath,
      })
    } catch (error) {
      console.error(`Error processing photo ${i}:`, error)
      // Continue with other photos
    }
  }

  return uploadedPhotos
}

// Helper to convert base64 to Uint8Array for React Native
function decodeBase64(base64) {
  // For React Native, we can use the base64 string directly
  // But Supabase might need it as a blob/array buffer
  // Try using the base64 string first, if that doesn't work, convert
  try {
    // React Native compatible base64 to Uint8Array
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  } catch (e) {
    // Fallback: return base64 string (Supabase might accept this)
    return base64
  }
}

