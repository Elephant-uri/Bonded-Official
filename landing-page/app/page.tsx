'use client'

import PhoneMockup from '@/components/PhoneMockup';
import WaitlistForm from '@/components/WaitlistForm';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useState } from 'react';

export default function Home() {
  const SHOW_SOCIALS = true;
  const [phraseIndex, setPhraseIndex] = useState(0);
  const phrases = [
    { text: 'Roommate', prefix: 'Find your new' },
    { text: 'Best friend', prefix: 'Find your new' },
    { text: 'Friend', prefix: 'Find your new' },
    { text: 'Classmates', prefix: 'Find your new' },
    { text: 'Study buddy', prefix: 'Find your new' },
    { text: 'Club', prefix: 'Find your new' },
    { text: 'Organization', prefix: 'Find your new' },
    { text: 'Events', prefix: 'Find new' }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [phrases.length]);

  const screens = [
    '/img/Simulator Screenshot - iPhone 17 Pro - yearbook.png',
    '/img/calendar-new.png',
    '/img/events-new.png',
    '/img/messages-new.png',
    '/img/Simulator Screenshot - iPhone 17 Pro - clubs.png',
    '/img/Simulator Screenshot - iPhone 17 Pro - forum.png',
    '/img/Simulator Screenshot - iPhone 17 Pro -linkai.png'
  ]

  return (
    <main className="min-h-screen bg-white relative overflow-hidden flex flex-col">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-100/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-50/20 blur-[100px] rounded-full" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md border-b border-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Image src="/img/transparent-bonded.png" alt="Bonded Logo" width={32} height={32} className="w-8 h-8 rounded-lg" />
            <div className="text-xl font-bold tracking-tight text-gray-900">Bonded</div>
          </div>
          <div className="flex items-center gap-6">
            <a href="#waitlist" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Waitlist</a>
            {SHOW_SOCIALS && (
              <div className="flex items-center gap-4 pl-6 border-l border-gray-100">
                <a href="https://instagram.com/bonded.io" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#E4405F] transition-colors">
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
                <a href="https://linkedin.com/company/getbondedapp" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[#0077B5] transition-colors">
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
            The first college <br />connection network.
          </motion.h1>

          <div className="flex flex-col items-center justify-center gap-4 mb-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl sm:text-3xl font-bold flex items-center gap-3 text-gray-400"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={phraseIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="flex items-center gap-3"
                >
                  <span>{phrases[phraseIndex].prefix}</span>
                  <span className="text-purple-600 font-extrabold">
                    {phrases[phraseIndex].text}
                  </span>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
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

        {/* Waitlist Form */}
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
          <div className="flex items-center gap-2">
            <Image src="/img/transparent-bonded.png" alt="Bonded Logo" width={24} height={24} className="w-6 h-6 opacity-50" />
            <div className="text-lg font-bold text-gray-900">Bonded</div>
          </div>
          <p className="text-sm text-gray-400 font-medium text-center">
            © {new Date().getFullYear()} Bonded. The first college connection network.
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
