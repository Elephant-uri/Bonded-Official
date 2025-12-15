# Deployment Guide

## Quick Deploy to Vercel

1. **Push to GitHub:**
```bash
cd landing-page
git init
git add .
git commit -m "Initial commit: Bonded landing page"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `landing-page` folder (or root if separate repo)

3. **Add Environment Variables:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4. **Deploy!**

## Supabase Table Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  school text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- Enable RLS (optional, for security)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for public waitlist)
CREATE POLICY "Allow public waitlist signups" ON waitlist
  FOR INSERT
  TO public
  WITH CHECK (true);
```

## Custom Domain (Optional)

1. In Vercel project settings, go to "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions

## Analytics (Optional)

Add to `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react'

// In RootLayout:
<Analytics />
```

## Performance Checklist

- ✅ Images optimized with Next.js Image
- ✅ Minimal JavaScript bundle
- ✅ Tailwind CSS purged in production
- ✅ Static generation where possible
- ✅ Lazy loading for below-fold content



