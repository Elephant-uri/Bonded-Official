# 🔧 School Events Scraper Setup Guide

## Overview

The scraper automatically pulls events from external school event platforms and syncs them to your Bonded database. This works for any university nationwide.

**Features:**
- ✅ Fetches events (title, description, date, time, location, organization)
- ✅ Matches organizations to Bonded clubs (if club exists)
- ✅ Deduplicates (skips events that already exist)
- ✅ Links events to clubs automatically
- ✅ Works with any university's event platform

## Current Status

**⚠️ HTML Parsing Not Implemented Yet**

The scraper structure is ready, but you need to:
1. Inspect the actual HTML structure of your school's event platform
2. Update `parseEventsFromHTML()` function to extract event data

## Step 1: Inspect Your School's Event Platform HTML

1. Open your school's event platform in your browser (e.g., https://urinvolved.uri.edu/events)
2. Right-click → "Inspect Element"
3. Identify:
   - How events are structured (div classes, IDs)
   - Where title, description, date, time, location are located
   - How to extract organization/club name
   - How to get the event detail page URL

## Step 2: Implement HTML Parsing

Update `services/schoolEventsScraper.js` → `parseEventsFromHTML()` function.

### Option A: Simple HTML Parsing (if page is server-rendered)

If the page HTML contains all event data:

```javascript
import { parse } from 'node-html-parser' // npm install node-html-parser

function parseEventsFromHTML(html) {
  const root = parse(html)
  const events = []
  
  // Find all event cards (adjust selector based on actual HTML)
  const eventCards = root.querySelectorAll('.event-card') // or whatever the class is
  
  eventCards.forEach(card => {
    const title = card.querySelector('h3')?.text || ''
    const description = card.querySelector('.description')?.text || ''
    const dateStr = card.querySelector('.date')?.text || ''
    const timeStr = card.querySelector('.time')?.text || ''
    const location = card.querySelector('.location')?.text || ''
    const org = card.querySelector('.organization')?.text || ''
    const link = card.querySelector('a')?.getAttribute('href') || ''
    
    // Parse date/time into ISO format
    const start_at = parseSchoolDate(dateStr, timeStr)
    
    events.push({
      title: title.trim(),
      description: description.trim(),
      start_at,
      end_at: start_at, // Adjust if end time is available
      location: location.trim(),
      location_address: location.trim(),
      organization: org.trim(),
      externalUrl: link.startsWith('http') ? link : `${BASE_URL}${link}`,
      imageUrl: null
    })
  })
  
  return events
}
```

### Option B: Puppeteer (if page is JavaScript-rendered)

If the page uses React/Vue/Angular and events are loaded via JavaScript:

```javascript
import puppeteer from 'puppeteer'

async function scrapeSchoolEvents(eventSourceUrl) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  await page.goto(eventSourceUrl, { waitUntil: 'networkidle0' })
  
  // Wait for events to load
  await page.waitForSelector('.event-card')
  
  // Extract events from page
  const events = await page.evaluate(() => {
    const eventCards = document.querySelectorAll('.event-card')
    return Array.from(eventCards).map(card => ({
      title: card.querySelector('h3')?.textContent || '',
      description: card.querySelector('.description')?.textContent || '',
      // ... extract other fields
    }))
  })
  
  await browser.close()
  return events
}
```

## Step 3: Configure for Your School

Update the scraper to use your school's event platform URL:

```javascript
// In your script or admin panel
import { syncSchoolEvents } from './services/schoolEventsScraper'

// For URI example:
await syncSchoolEvents('uri.edu', 'https://urinvolved.uri.edu/events')

// For MIT example:
await syncSchoolEvents('mit.edu', 'https://mit.edu/events')

// For any other school:
await syncSchoolEvents('school.edu', 'https://school.edu/events')
```

## Step 4: Set Up Scheduled Sync

### Option A: Cron Job (Server)

```bash
# Run weekly on Sundays at 2 AM
0 2 * * 0 node scripts/sync-school-events.js
```

### Option B: Supabase Edge Function

Create a scheduled Edge Function that runs weekly:

```javascript
// supabase/functions/sync-school-events/index.ts
import { syncSchoolEvents } from '../services/schoolEventsScraper'

Deno.serve(async (req) => {
  // Get all universities that have event source URLs configured
  const universities = await getUniversitiesWithEventSources()
  
  for (const uni of universities) {
    await syncSchoolEvents(uni.domain, uni.event_source_url)
  }
  
  return new Response('Sync complete', { status: 200 })
})
```

### Option C: Manual Trigger (Admin Panel)

Add a button in your admin panel to manually trigger sync:

```javascript
import { syncSchoolEvents } from './services/schoolEventsScraper'

const handleSyncEvents = async () => {
  try {
    const result = await syncSchoolEvents('uri.edu', 'https://urinvolved.uri.edu/events')
    console.log(`Synced: ${result.synced}, Skipped: ${result.skipped}, Errors: ${result.errors}`)
  } catch (error) {
    console.error('Sync failed:', error)
  }
}
```

## Testing

1. **Test with one event:**
   ```javascript
   const events = await scrapeSchoolEvents('https://your-school.edu/events')
   console.log('Scraped events:', events)
   ```

2. **Test saving one event:**
   ```javascript
   const event = events[0]
   const saved = await saveScrapedEvent(event, universityId, systemUserId)
   console.log('Saved event:', saved)
   ```

3. **Test full sync:**
   ```javascript
   const result = await syncSchoolEvents('your-school.edu', 'https://your-school.edu/events')
   console.log('Sync result:', result)
   ```

## Troubleshooting

### Events not appearing in calendar
- Check that `university_id` is set correctly
- Verify events are being created in the `events` table (not `uri_events`)
- Check that events have `start_at` in the future

### Duplicate events
- The scraper checks for duplicates by title + start_at + university_id
- If duplicates still appear, check the deduplication logic

### Organization matching not working
- Verify club names in `orgs` table match organization names from platform
- The matching is case-insensitive and uses partial matching
- Check `matchOrganizationToClub()` function

### HTML parsing errors
- Inspect the actual HTML structure of your school's platform
- Update selectors in `parseEventsFromHTML()` to match actual structure
- Test parsing with sample HTML before running full sync

## Notes

- Events are automatically filtered by `university_id` - each school only sees their own events
- Events are created with `source: 'school_sync'` to distinguish from user-created events
- The scraper respects existing events and won't create duplicates
- Organizations are automatically matched to clubs if names are similar


