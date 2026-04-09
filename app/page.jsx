'use client'

import { useState, useCallback } from "react"
import Navbar from "@/components/Navbar"
import Hero from "@/components/home/Hero"
import Stats from "@/components/home/Stats"
import Leadership from "@/components/home/LeaderShip"
import Features from "@/components/home/Features"
import EventsFeed from "@/components/home/EventsFeed"
import Testimonials from "@/components/home/Testimonials"
import Notices from "@/components/home/Notices"
import ContactCTA from "@/components/home/ContactCTA"
import Footer from "@/components/Footer"
import Preloader from "@/components/Preloader"

const DYNAMIC_SECTION_COUNT = 4

export default function HomePage() {
  const [readyCount, setReadyCount] = useState(0)

  const onReady = useCallback(() => {
    setReadyCount(c => c + 1)
  }, [])

  const allReady = readyCount >= DYNAMIC_SECTION_COUNT

  return (
    <>
      <Preloader ready={allReady} />
      <Navbar />
      <main className="min-h-screen">
        <Hero />
        <Stats />
        <Leadership onReady={onReady} />
        <Notices onReady={onReady} />
        <Features />
        <EventsFeed onReady={onReady} />
        <Testimonials onReady={onReady} />
        <ContactCTA />
      </main>
      <Footer />
    </>
  )
}