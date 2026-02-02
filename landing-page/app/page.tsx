'use client'

import PhoneMockup from '@/components/PhoneMockup';
import WaitlistForm from '@/components/WaitlistForm';
import { motion } from 'framer-motion';

export default function Home() {
  const SHOW_SOCIALS = false;

  const screens = [
    '/img/Simulator Screenshot - iPhone 17 Pro - drawer.png',
    '/img/Simulator Screenshot - iPhone 17 Pro - yearbook.png',
    '/img/Simulator Screenshot - iPhone 17 Pro - events.png',
    '/img/Simulator Screenshot - iPhone 17 Pro - clubs.png',
    '/img/Simulator Screenshot - iPhone 17 Pro - forum.png',
    '/img/bonded-calandar.png',
    '/img/Simulator Screenshot - iPhone 17 Pro -linkai.png'
  ]

  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex flex-col">
      {/* Background Orbs - Subtle Saturn-style gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/20 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div className="text-xl font-bold tracking-tight text-gray-900">Bonded</div>
          <div className="flex items-center gap-6">
            <a href="#waitlist" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Waitlist</a>
            {SHOW_SOCIALS && (
              <div className="flex items-center gap-3 pl-6 border-l border-gray-100">
                <a href="https://linkedin.com" className="text-gray-400 hover:text-gray-900 transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Content */}
      <section className="relative pt-32 pb-20 px-6 flex-1 flex flex-col items-center justify-center z-10">
        <div className="max-w-4xl w-full text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black text-gray-900 tracking-tighter leading-[0.9] mb-8"
          >
            Bonded. <br />Find your people.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="text-xl text-gray-500 font-medium max-w-xl mx-auto mb-12"
          >
            The social network for campus. Born at the hackathon. <br className="hidden sm:block" /> Launching soon to your campus.
          </motion.p>
        </div>

        {/* Centerpiece: Animating Phone */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg mb-20 px-4"
        >
          <PhoneMockup screens={screens} />
        </motion.div>

        {/* Waitlist Form - Directly below phone */}
        <div id="waitlist" className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-purple-500/5"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Join the Waitlist</h2>
            <WaitlistForm variant="hero" />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-6 border-t border-gray-50 z-10 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-lg font-bold text-gray-900">Bonded</div>
          <p className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} Bonded. Created at the 2024 Hackathon.
          </p>
          <div className="flex gap-6 text-sm text-gray-500 font-medium">
            <a href="#" className="hover:text-gray-900 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
