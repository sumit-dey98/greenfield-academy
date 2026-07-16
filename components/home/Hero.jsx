'use client'

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Users, Award } from "lucide-react"
import HeroSlideshow from "./HeroSlideShow"

const easeOut = [0.21, 0.47, 0.32, 0.98]

export default function Hero() {
  return (
    // Section
    <section className="bg-gradient-to-br from-surface via-surface to-primary-light/40 overflow-hidden relative pb-16 md:pb-24">
      <div className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -left-32 w-72 h-72 rounded-full bg-accent/10 blur-3xl" />

      <div className="max-w-screen-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[520px] relative">

        {/* Text + CTA */}
        <div className="px-6 md:px-12 py-12 md:py-20 flex flex-col justify-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOut }}
            className="bg-surface border border-border rounded-lg px-4 py-3 flex items-center gap-3 w-fit mb-6 ring-4 ring-emerald-500/30"
          >
            <div className="bg-text rounded-md p-2 flex shrink-0">
              <Award size={18} className="text-bg" />
            </div>
            <div>
              <div className="font-bold text-sm text-text">Top Ranked</div>
              <div className="text-xs text-muted">National Excellence Award 2023</div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: easeOut }}
            className="text-4xl md:text-6xl font-bold leading-normal text-text mb-5"
          >
            Shaping Futures,{" "}
            <span className="text-primary leading-normal">Building Leaders</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: easeOut }}
            className="text-lg text-muted leading-relaxed mb-8"
          >
            Greenfield Academy provides world-class education with a focus on
            academic excellence, character development, and preparing students
            for a rapidly changing world.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: easeOut }}
            className="flex gap-4 flex-wrap"
          >
            <Link href="/admission" className="btn btn-primary text-base px-6 py-2.5 shadow-hover">
              Apply Now
              <ArrowRight size={16} />
            </Link>
            <Link href="/about" className="btn btn-outline text-base px-6 py-2.5">
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* Slideshow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: easeOut }}
          className="relative z-10 lg:py-10 lg:pr-12"
        >
          <div className="h-full lg:rounded-2xl overflow-hidden lg:shadow-lg">
            <HeroSlideshow />
          </div>
        </motion.div>
      </div>
    </section>
  )
}