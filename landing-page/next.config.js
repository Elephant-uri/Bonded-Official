const path = require('path')

// Load root .env so EXPO_PUBLIC_ vars work when running landing from monorepo
try {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
} catch (_) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    // Fallback: use EXPO_PUBLIC_ vars from root .env if NEXT_PUBLIC_ not set
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    unoptimized: false,
    remotePatterns: [],
  },
}

module.exports = nextConfig












