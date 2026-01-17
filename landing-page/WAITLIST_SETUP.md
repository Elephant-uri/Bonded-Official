# Waitlist Setup Guide

Follow these steps to get your waitlist working with Supabase.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `bonded-waitlist` (or your choice)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for now
4. Wait 2-3 minutes for project to be created

## Step 2: Get Your Credentials

1. In your Supabase project, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

## Step 3: Create the Waitlist Table

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Paste and run this SQL:

```sql
-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  school text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- Enable Row Level Security
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anyone to insert (for public waitlist)
CREATE POLICY "Allow public waitlist signups" ON waitlist
  FOR INSERT
  TO public
  WITH CHECK (true);
```

4. Click **"Run"** - you should see "Success. No rows returned"

## Step 4: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Click on your project → **Settings** → **Environment Variables**
3. Add these two variables:

   **Variable 1:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: Your Project URL from Step 2
   - **Environments**: Production, Preview, Development (check all)

   **Variable 2:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: Your anon/public key from Step 2
   - **Environments**: Production, Preview, Development (check all)

4. Click **"Save"**

## Step 5: Redeploy

1. In Vercel, go to **Deployments**
2. Click the **"..."** menu on your latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete

## Step 6: Test It!

1. Visit your live site
2. Fill out the waitlist form
3. Submit it
4. Check Supabase → **Table Editor** → **waitlist** table
5. You should see your entry!

## Optional: Local Development

If you want to test locally, create a `.env.local` file in the `landing-page` directory:

```bash
cd landing-page
touch .env.local
```

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Then restart your dev server:
```bash
npm run dev
```

## Viewing Waitlist Data

To see all waitlist signups:

1. Go to Supabase → **Table Editor**
2. Click on **waitlist** table
3. You'll see all entries with:
   - Email
   - School
   - Created timestamp

## Querying by School

To see which schools have the most signups, run this in SQL Editor:

```sql
SELECT school, COUNT(*) as signups
FROM waitlist
GROUP BY school
ORDER BY signups DESC;
```

## Troubleshooting

**Form submits but nothing appears in Supabase:**
- Check Vercel environment variables are set correctly
- Check browser console for errors
- Verify RLS policy is set up correctly

**"Failed to join waitlist" error:**
- Check Supabase project is active
- Verify table exists
- Check RLS policy allows INSERT

**Build fails:**
- Make sure environment variables are set in Vercel
- The build should work even without credentials (uses fallback)
