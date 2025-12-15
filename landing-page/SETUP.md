# Bonded Landing Page Setup

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
cp .env.local.example .env.local
```

Then edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Copy images:**
Images should already be in `public/img/`. If not:
```bash
cp ../img-for-landiing-page/*.png public/img/
```

4. **Run development server:**
```bash
npm run dev
```

Visit http://localhost:3000

## Supabase Setup

Create the waitlist table in your Supabase project:

```sql
CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  school text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(email)
);

CREATE INDEX idx_waitlist_email ON waitlist(email);
CREATE INDEX idx_waitlist_created_at ON waitlist(created_at);
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

## Features

- ✅ Nova-style clean design
- ✅ Mobile-first responsive layout
- ✅ Waitlist form with Supabase integration
- ✅ LocalStorage fallback if Supabase unavailable
- ✅ Smooth Framer Motion animations
- ✅ SEO-ready metadata
- ✅ Fast performance

## Customization

- Colors: Edit `tailwind.config.ts`
- Content: Edit `app/page.tsx`
- Form: Edit `components/WaitlistForm.tsx`
- Schools: Update `SCHOOLS` array in `WaitlistForm.tsx`



