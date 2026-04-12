import Link from "next/link"
import { ArrowRight, BookOpen, Users, Award } from "lucide-react"
import HeroSlideshow from "./HeroSlideShow"

export default function Hero() {
  return (
    // Section
    <section className="bg-surface border-b border-surface-2 overflow-hidden relative">
      <div className="max-w-screen-3xl mx-auto grid grid-cols-1 lg:grid-cols-2 items-stretch min-h-[520px]">

        {/* Text + CTA */}
        <div className="px-6 md:px-12 py-12 md:py-20 flex flex-col justify-center">
          <div className="bg-surface border border-border rounded-lg px-4 py-3 ring ring-surface-2 flex items-center gap-3 w-fit mb-6">
            <div className="bg-primary rounded-md p-2 flex shrink-0">
              <Award size={18} color="#fff" />
            </div>
            <div>
              <div className="font-bold text-sm text-text">Top Ranked</div>
              <div className="text-xs text-muted">National Excellence Award 2023</div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold leading-tight text-text mb-5">
            Shaping Futures,{" "}
            <span className="text-primary">Building Leaders</span>
          </h1>

          <p className="text-lg text-muted leading-relaxed mb-8">
            Greenfield Academy provides world-class education with a focus on
            academic excellence, character development, and preparing students
            for a rapidly changing world.
          </p>

          <div className="flex gap-4 flex-wrap">
            <Link href="/admission" className="btn btn-primary text-base px-6 py-2.5">
              Apply Now
              <ArrowRight size={16} />
            </Link>
            <Link href="/about" className="btn btn-outline text-base px-6 py-2.5">
              Learn More
            </Link>
          </div>
        </div>

        {/* Slideshow */}
        <HeroSlideshow />
      </div>
    </section>
  )
}