import Link from "next/link"
import { ArrowRight, BookOpen, Users, Award } from "lucide-react"
import HeroSlideshow from "./HeroSlideShow"

export default function Hero() {
  return (
    <section className="bg-surface border-b border-surface-2 overflow-hidden relative">

      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(5,150,105,0.05) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(5,150,105,0.08) 0%, transparent 40%)`,
        }}
      />

      <div className="max-w-screen-2xl mx-auto px-6 md:px-12 py-10 md:py-20 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
        {/* Text + CTA */}
        <div>
          {/* Floating badge */}
          <div className="bg-surface border border-border rounded-lg px-5 py-3 ring ring-surface-2 flex items-center gap-3 md:w-96 mb-4 md:mb-8">
            <div className="bg-primary rounded-md p-2 flex">
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

          {/* <div className="inline-flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-md text-xs font-semibold mt-8">
            <Award size={14} />
            Established 1998 · Dhaka, Bangladesh
          </div> */}

          {/* Quick stats */}
          {/* <div className="flex gap-6 flex-wrap mt-10 pt-8 border-t border-border">
            {[
              { icon: <Users size={18} />, value: "1,200+", label: "Students Enrolled" },
              { icon: <BookOpen size={18} />, value: "30+", label: "Qualified Teachers" },
              { icon: <Award size={18} />, value: "25+", label: "Years of Excellence" },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="bg-primary-light text-primary rounded-md p-2 flex items-center justify-center">
                  {stat.icon}
                </div>
                <div>
                  <div className="font-bold text-xl text-text leading-none">{stat.value}</div>
                  <div className="text-xs text-muted mt-0.5">{stat.label}</div>
                </div>
              </div>
            ))}
          </div> */}
        </div>

        <HeroSlideshow />
      </div>
    </section>
  )
}