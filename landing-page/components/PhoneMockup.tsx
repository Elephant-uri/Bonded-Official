'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'

interface PhoneMockupProps {
  screens: string[]
  interval?: number
  className?: string
  priority?: boolean
}

export default function PhoneMockup({
  screens,
  interval = 4000,
  className = '',
  priority = false
}: PhoneMockupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (screens.length <= 1) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % screens.length)
    }, interval)
    return () => clearInterval(timer)
  }, [screens.length, interval])

  return (
    <div className={`relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px] mx-auto ${className}`}>
      {/* iPhone Frame with refined high-fidelity details */}
      <div className="relative bg-[#0F0F0F] rounded-[3.2rem] p-[9px] shadow-[0_40px_100px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.12)_inset]">
        {/* Outer bezel premium highlight */}
        <div className="absolute inset-0 rounded-[3.2rem] bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-20" />

        {/* Screen Container */}
        <div className="relative w-full rounded-[2.8rem] overflow-hidden bg-black ring-1 ring-white/5">
          {/* Inner screen shadow for depth */}
          <div className="absolute inset-0 rounded-[2.8rem] shadow-[inset_0_0_40px_rgba(0,0,0,0.8)] pointer-events-none z-10" />

          {/* Glass Reflection Overlay */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-[2.8rem]">
            <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/5 via-transparent to-transparent rotate-[35deg]" />
          </div>

          {/* Screen Content - Animating Cross-fade */}
          <div className="relative w-full" style={{ aspectRatio: '9 / 19.5' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <Image
                  src={screens[currentIndex]}
                  alt={`App screen ${currentIndex + 1}`}
                  fill
                  className="object-cover rounded-[2.8rem]"
                  priority={priority}
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Hardware details: Notch/Dynamic Island visual representation */}
        <div className="absolute top-[22px] left-1/2 -translate-x-1/2 w-[80px] h-[24px] bg-black rounded-full z-30" />

        {/* Side buttons indicator (subtle refined) */}
        <div className="absolute left-[-2px] top-[100px] w-[3px] h-[45px] bg-[#222] rounded-l-full border-r border-white/5" />
        <div className="absolute left-[-2px] top-[160px] w-[3px] h-[70px] bg-[#222] rounded-l-full border-r border-white/5" />
        <div className="absolute right-[-2px] top-[140px] w-[3px] h-[80px] bg-[#222] rounded-r-full border-l border-white/5" />
      </div>

      {/* Subtle floor shadow */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[120%] h-[40px] bg-black/20 blur-3xl -z-10 rounded-full" />
    </div>
  )
}












