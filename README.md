# Bonded 🎓

A social networking app designed to help college students connect, collaborate, and build meaningful relationships on campus.

## Features

- **Forums** - Engage in campus-wide discussions organized by topics and interests
- **Events** - Discover and create campus events, from study sessions to social gatherings
- **Stories** - Share moments with your campus community
- **Clubs** - Find and join student organizations
- **Calendar** - Stay organized with your class schedule and events
- **Circles** - Build close-knit groups with friends
- **Yearbook** - A digital yearbook experience
- **Link AI** - Smart recommendations for courses and connections
- **Messages** - Direct messaging with fellow students
- **Network** - Expand your campus connections

## Tech Stack

- **Frontend**: React Native with Expo
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Navigation**: Expo Router

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- Expo CLI
- iOS Simulator / Android Emulator or physical device with Expo Go

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/bonded.git
   cd bonded
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   npx expo start
   ```

5. Scan the QR code with Expo Go (mobile) or press `i` for iOS simulator / `a` for Android emulator

## Project Structure

```
├── app/                  # Expo Router screens
├── components/           # Reusable React components
├── constants/            # App constants and theme
├── contexts/             # React Context providers
├── database/             # Database schemas and migrations
├── helpers/              # Utility functions
├── hooks/                # Custom React hooks
├── landing-page/         # Next.js landing page
├── lib/                  # Core libraries (Supabase client)
├── providers/            # App providers
├── services/             # API and external services
└── stores/               # Zustand state stores
```

## Landing Page

The landing page is built with Next.js and located in the `landing-page/` directory.

```bash
cd landing-page
npm install
npm run dev
```

## License

MIT License
