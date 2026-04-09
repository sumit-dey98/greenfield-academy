'use client'

import { ShieldCheck, BookOpenCheck, Users, Bell, Clock, Award } from "lucide-react"

const features = [
  {
    icon: <BookOpenCheck size={22} />,
    title: "Academic Excellence",
    description: "Rigorous curriculum designed to challenge and inspire students across all disciplines.",
    color: "#1a56db",
  },
  {
    icon: <Users size={22} />,
    title: "Experienced Faculty",
    description: "Over 80 qualified teachers dedicated to nurturing every student's potential.",
    color: "#0e9f6e",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Safe Environment",
    description: "A secure and inclusive campus where every student feels welcome and protected.",
    color: "#9333ea",
  },
  {
    icon: <Bell size={22} />,
    title: "Real-time Updates",
    description: "Students and parents stay informed with instant notices and announcements.",
    color: "#ff5a1f",
  },
  {
    icon: <Clock size={22} />,
    title: "Flexible Schedules",
    description: "Well-structured timetables that balance academics, sports, and extracurriculars.",
    color: "#e02424",
  },
  {
    icon: <Award size={22} />,
    title: "Award Winning",
    description: "Recognized nationally for outstanding academic and extracurricular achievements.",
    color: "#0891b2",
  },
]

export default function Features() {
  return (
    <section className="relative bg-surface border-t border-surface-2 py-10 md:py-20 px-6 md:px-12 bg-cover bg-top " style={{ backgroundImage: "url('https://images.unsplash.com/photo-1613662449996-35130a75be10?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>
      <div className="absolute inset-0 h-full w-full bg-gradient-to-b from-surface-2 to-transparent opacity-15 "></div>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
            Why Choose Us
          </div>
          <h2 className="text-3xl font-bold text-emerald-950 mb-3">
            Everything a student needs to thrive
          </h2>
          <p className="text-muted text-base max-w-xl mx-auto">
            We combine academic rigor with a supportive environment to help
            every student reach their full potential.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card cursor-default transition-transform duration-200 hover:bg-bg hover:ring-1 hover:ring-surface-2 will-change-auto">
              <div
                className="inline-flex items-center justify-center w-11 h-11 rounded-lg mb-4"
                style={{ background: `${f.color}18`, color: f.color, boxShadow: `0 0 1px 1px ${f.color}30` }}
              >
                {f.icon}
              </div>
              <h3 className="font-semibold text-base text-text mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-muted leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}