/**
 * OCR Text Extraction Utility
 * 
 * Uses React Native ML Kit Text Recognition for production builds.
 * Falls back gracefully in Expo Go (development).
 * 
 * Works in:
 * - ✅ EAS Build (production)
 * - ✅ Development Build (expo-dev-client)
 * - ❌ Expo Go (shows fallback message)
 */

import * as ImagePicker from 'expo-image-picker'
import { Logger } from '../logger'

export interface TextBlock {
  text: string
  boundingBox: {
    x: number
    y: number
    width: number
    height: number
  }
  confidence?: number
}

export interface OCRResult {
  rawText: string
  blocks: TextBlock[]
  imageUri: string
}

/**
 * Check if ML Kit is available (not in Expo Go)
 */
let TextRecognition: any = null
let mlKitAvailable = false

try {
  // Dynamic import to avoid crash in Expo Go
  TextRecognition = require('@react-native-ml-kit/text-recognition').default
  mlKitAvailable = true
  Logger.info('ML Kit Text Recognition is available')
} catch (error) {
  Logger.info('ML Kit not available (likely running in Expo Go)')
  mlKitAvailable = false
}

/**
 * Request camera/photo library permissions
 */
export async function requestImagePermissions(): Promise<boolean> {
  const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
  const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  
  return cameraStatus === 'granted' || libraryStatus === 'granted'
}

/**
 * Pick image from camera or library
 */
export async function pickScheduleImage(): Promise<string | null> {
  try {
    const hasPermission = await requestImagePermissions()
    if (!hasPermission) {
      throw new Error('Camera and photo library permissions are required')
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    Logger.error(error, 'Error picking image')
    throw error
  }
}

/**
 * Take photo with camera
 */
export async function takeSchedulePhoto(): Promise<string | null> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      throw new Error('Camera permission is required')
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    })

    if (result.canceled || !result.assets[0]) {
      return null
    }

    return result.assets[0].uri
  } catch (error) {
    Logger.error(error, 'Error taking photo')
    throw error
  }
}

/**
 * Extract text from image using ML Kit Text Recognition (production) or Cloud OCR (Expo Go)
 * 
 * Priority:
 * 1. ML Kit (if available in production/dev builds)
 * 2. Google Cloud Vision API (if API key configured - works in Expo Go)
 * 3. Supabase Edge Function (if deployed - works in Expo Go)
 * 4. Fallback to empty result
 * 
 * @param imageUri - Local URI of the image
 * @returns OCR result with raw text and bounding boxes
 */
export async function extractTextFromImage(imageUri: string): Promise<OCRResult> {
  if (!imageUri) {
    throw new Error('Image URI is required')
  }

  Logger.info('Processing image:', imageUri)

  // Priority 1: Try ML Kit (production/dev builds)
  if (mlKitAvailable && TextRecognition) {
    try {
      Logger.info('Starting ML Kit text recognition...')

      const result = await TextRecognition.recognize(imageUri)

      Logger.info(`ML Kit recognized ${result.blocks?.length || 0} text blocks`)

      const blocks: TextBlock[] = (result.blocks || []).map((block: any) => ({
        text: block.text || '',
        boundingBox: {
          x: block.frame?.origin?.x || block.frame?.x || 0,
          y: block.frame?.origin?.y || block.frame?.y || 0,
          width: block.frame?.size?.width || block.frame?.width || 0,
          height: block.frame?.size?.height || block.frame?.height || 0,
        },
        confidence: block.confidence,
      }))

      const rawText = result.text || blocks.map((b) => b.text).join('\n')

      Logger.info(`Extracted ${rawText.length} characters of text`)

      return {
        rawText,
        blocks,
        imageUri,
      }
    } catch (error) {
      Logger.warn('ML Kit failed, falling back to cloud OCR:', error)
      // Fall through to cloud OCR
    }
  }

  // Priority 2: Try Google Cloud Vision API (works in Expo Go)
  try {
    const { extractTextFromImageCloud, isCloudOCRAvailable } = await import('./cloudOCR')
    
    if (isCloudOCRAvailable()) {
      Logger.info('Using Google Cloud Vision API (works in Expo Go)')
      const result = await extractTextFromImageCloud(imageUri)
      
      if (result.rawText) {
        return result
      }
    }
  } catch (error) {
    Logger.warn('Google Cloud Vision not available:', error)
  }

  // Priority 3: Try Supabase Edge Function (works in Expo Go)
  try {
    const { extractTextFromImageSupabase, isSupabaseOCRAvailable } = await import('./cloudOCR-supabase')
    
    if (await isSupabaseOCRAvailable()) {
      Logger.info('Using Supabase Edge Function OCR (works in Expo Go)')
      const result = await extractTextFromImageSupabase(imageUri)
      
      if (result.rawText) {
        return result
      }
    }
  } catch (error) {
    Logger.warn('Supabase OCR not available:', error)
  }

  // Fallback: No OCR available
  Logger.info('No OCR method available')
  Logger.info('Options:')
  Logger.info('   1. Use Google Cloud Vision API (set EXPO_PUBLIC_GOOGLE_VISION_API_KEY)')
  Logger.info('   2. Deploy Supabase Edge Function for OCR')
  Logger.info('   3. Use EAS Build with ML Kit for on-device OCR')
  
  return {
    rawText: '',
    blocks: [],
    imageUri,
  }

}

/**
 * Check if OCR is available on this device/build
 * Checks ML Kit, Google Cloud Vision, and Supabase Edge Function
 */
export async function isOCRAvailable(): Promise<boolean> {
  // Check ML Kit
  if (mlKitAvailable) {
    return true
  }

  // Check Google Cloud Vision
  try {
    const { isCloudOCRAvailable } = await import('./cloudOCR')
    if (isCloudOCRAvailable()) {
      return true
    }
  } catch {
    // Ignore import errors
  }

  // Check Supabase Edge Function
  try {
    const { isSupabaseOCRAvailable } = await import('./cloudOCR-supabase')
    if (await isSupabaseOCRAvailable()) {
      return true
    }
  } catch {
    // Ignore import errors
  }

  return false
}
