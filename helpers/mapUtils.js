/**
 * Map utilities for generating static map images and location handling
 */

/**
 * Generate a static map image URL using OpenStreetMap (free, no API key needed)
 * For production, consider using Google Maps Static API or Mapbox
 */
export const getStaticMapUrl = (locationName, width = 400, height = 200) => {
  if (!locationName) return null
  
  // For now, use a placeholder or OpenStreetMap static image
  // In production, use Google Maps Static API or Mapbox Static Images API
  const encodedLocation = encodeURIComponent(locationName)
  
  // Using OpenStreetMap Nominatim for geocoding and static map
  // Note: This is a simple implementation. For production, use a proper mapping service
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+ff0000(${encodedLocation})/${encodedLocation},15/${width}x${height}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXV4NTFiamM2Y2J6Y2Z1c2ZtNnAifQ.rJcFIG214AriISLbB6B5aw`
  
  // Alternative: Use a simple placeholder that looks like a map
  // return `https://via.placeholder.com/${width}x${height}/E5E5E5/737373?text=Map+Preview`
}

/**
 * Generate a static map image URL using Google Maps Static API
 * Requires GOOGLE_MAPS_API_KEY in environment
 */
export const getGoogleStaticMapUrl = (locationName, width = 400, height = 200, zoom = 15) => {
  if (!locationName) return null
  
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  if (!apiKey) {
    // Fallback to placeholder
    return `https://via.placeholder.com/${width}x${height}/E5E5E5/737373?text=Map+Preview`
  }
  
  const encodedLocation = encodeURIComponent(locationName)
  return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedLocation}&zoom=${zoom}&size=${width}x${height}&markers=color:red%7C${encodedLocation}&key=${apiKey}`
}

/**
 * Get coordinates from location name (geocoding)
 * In production, use a geocoding service like Google Geocoding API
 */
export const geocodeLocation = async (locationName) => {
  if (!locationName) return null
  
  try {
    // Using OpenStreetMap Nominatim (free, but rate-limited)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`,
      {
        headers: {
          'User-Agent': 'Bonded App', // Required by Nominatim
        },
      }
    )
    
    const data = await response.json()
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        address: data[0].display_name,
      }
    }
  } catch (error) {
    console.log('Geocoding error:', error)
  }
  
  return null
}

/**
 * Generate a simple map preview placeholder
 */
export const getMapPlaceholder = (width = 400, height = 200) => {
  return `https://via.placeholder.com/${width}x${height}/E5E5E5/737373?text=Map+Preview`
}


