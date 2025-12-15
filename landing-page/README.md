# Bonded Landing Page

Nova-style waitlist landing page for Bonded. Clean, modern, and conversion-focused.

## Features

- ✅ Clean, premium Nova-style design
- ✅ Mobile-first responsive layout
- ✅ Waitlist form with Supabase integration
- ✅ LocalStorage fallback if Supabase unavailable
- ✅ Smooth Framer Motion animations
- ✅ SEO-ready metadata
- ✅ Fast performance with Next.js Image optimization
- ✅ TypeScript for type safety

## Quick Start

1. **Install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
```bash
# Create .env.local file
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run development server:**
```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
landing-page/
├── app/
│   ├── api/waitlist/     # API route for waitlist submissions
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Main landing page
│   └── globals.css        # Global styles
├── components/
│   ├── WaitlistForm.tsx   # Waitlist form component
│   └── ValueBlock.tsx     # Value proposition blocks
├── lib/
│   └── supabase.ts        # Supabase client
└── public/
    └── img/               # Landing page images
```

## Supabase Setup

See `DEPLOYMENT.md` for complete SQL setup instructions.

## Deployment

See `DEPLOYMENT.md` for detailed deployment guide.

Quick deploy to Vercel:
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

## Customization

- **Colors:** Edit `tailwind.config.ts`
- **Content:** Edit `app/page.tsx`
- **Form fields:** Edit `components/WaitlistForm.tsx`
- **Schools list:** Update `SCHOOLS` array in `WaitlistForm.tsx`



