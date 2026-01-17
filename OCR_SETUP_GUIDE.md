# OCR Setup Guide for Expo Go

This guide explains how to get OCR (Optical Character Recognition) working in **Expo Go** for extracting text from class schedule images.

## 🎯 Why Expo Go Doesn't Support Native OCR

Expo Go doesn't support native modules like `@react-native-ml-kit/text-recognition`. To get OCR working in Expo Go, we need to use **cloud-based OCR services** that work via HTTP requests.

## ✅ Solution: Cloud-Based OCR

We've implemented a multi-tier OCR system that works in Expo Go:

1. **Google Cloud Vision API** (Recommended for Expo Go)
2. **Supabase Edge Function** (Alternative - keeps API keys secure)
3. **ML Kit** (Production builds only - doesn't work in Expo Go)

## 🚀 Option 1: Google Cloud Vision API (Easiest)

### Step 1: Get API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Cloud Vision API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Cloud Vision API"
   - Click "Enable"
4. Create API Key:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the API key

### Step 2: Add to Environment Variables

Add to your `.env` file:

```bash
EXPO_PUBLIC_GOOGLE_VISION_API_KEY=your_api_key_here
```

### Step 3: Restart Expo

```bash
# Stop Expo
# Then restart
npx expo start
```

### Step 4: Test

1. Open the app in Expo Go
2. Go to onboarding > Class Schedule step
3. Upload a schedule image
4. OCR should now work! 🎉

### Pricing

- **Free tier**: 1,000 requests/month
- **Paid**: $1.50 per 1,000 requests after free tier
- Very affordable for a college app!

---

## 🔒 Option 2: Supabase Edge Function (More Secure)

This keeps your API keys on the server side.

### Step 1: Create Edge Function

Create `supabase/functions/ocr-text-extraction/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const GOOGLE_VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')
const GOOGLE_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate'

serve(async (req) => {
  try {
    const { image, imageType } = await req.json()

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Image is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Call Google Vision API
    const response = await fetch(
      `${GOOGLE_VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: image },
            features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
          }],
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`)
    }

    const data = await response.json()
    const textAnnotations = data.responses[0]?.textAnnotations || []

    if (textAnnotations.length === 0) {
      return new Response(
        JSON.stringify({ text: '', blocks: [] }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const fullText = textAnnotations[0].description || ''
    const blocks = textAnnotations.slice(1).map((annotation: any) => {
      const vertices = annotation.boundingPoly?.vertices || []
      const x = Math.min(...vertices.map((v: any) => v.x || 0))
      const y = Math.min(...vertices.map((v: any) => v.y || 0))
      const maxX = Math.max(...vertices.map((v: any) => v.x || 0))
      const maxY = Math.max(...vertices.map((v: any) => v.y || 0))

      return {
        text: annotation.description || '',
        x,
        y,
        width: maxX - x,
        height: maxY - y,
      }
    })

    return new Response(
      JSON.stringify({ text: fullText, blocks }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Step 2: Set Environment Variable in Supabase

1. Go to Supabase Dashboard > Project Settings > Edge Functions
2. Add secret: `GOOGLE_VISION_API_KEY` = your Google Vision API key

### Step 3: Deploy Function

```bash
supabase functions deploy ocr-text-extraction
```

### Step 4: Test

The app will automatically use the Supabase Edge Function if it's deployed!

---

## 📊 How It Works

The OCR system tries methods in this order:

1. **ML Kit** (if available in production/dev builds)
2. **Google Cloud Vision API** (if `EXPO_PUBLIC_GOOGLE_VISION_API_KEY` is set)
3. **Supabase Edge Function** (if `ocr-text-extraction` function is deployed)
4. **Fallback**: Shows message to user

## 🧪 Testing

1. Take a photo of a class schedule
2. The app will extract text automatically
3. Check console logs for OCR method being used:
   - `☁️ Using Google Cloud Vision API` = Cloud OCR working
   - `☁️ Using Supabase Edge Function OCR` = Edge Function working
   - `🔍 Starting ML Kit text recognition` = ML Kit working

## 💰 Cost Comparison

| Method | Free Tier | Cost After |
|--------|-----------|------------|
| Google Cloud Vision | 1,000/month | $1.50/1,000 |
| Supabase Edge Function | Uses Google Vision | Same as above |
| ML Kit (on-device) | Free | Free |

**Recommendation**: Start with Google Cloud Vision API for Expo Go. It's free for 1,000 requests/month and very affordable after that.

---

## 🐛 Troubleshooting

### "No OCR method available"

**Solution**: Set up Google Cloud Vision API (Option 1) or deploy Supabase Edge Function (Option 2)

### "Google Vision API error: 403"

**Solution**: 
- Check that Cloud Vision API is enabled in Google Cloud Console
- Verify API key is correct
- Check API key restrictions in Google Cloud Console

### "Supabase Edge Function not found"

**Solution**: 
- Deploy the Edge Function: `supabase functions deploy ocr-text-extraction`
- Check function name matches exactly

---

## 🎉 Success!

Once set up, OCR will work in Expo Go! Users can:
- Take photos of their class schedule
- Extract text automatically
- Parse into structured class data

No native modules required! 🚀


