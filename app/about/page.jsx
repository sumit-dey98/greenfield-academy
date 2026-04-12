import Link from "next/link"
import { GraduationCap, Award, Heart, Target, Eye, ArrowRight } from "lucide-react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import Leadership from "@/components/home/LeaderShip"
import ContactCTA from "@/components/home/ContactCTA"

const stats = [
  { value: "1,200+", label: "Enrolled Students" },
  { value: "30+", label: "Qualified Teachers" },
  { value: "98%", label: "GPA-5 in SSC 2024" },
  { value: "25+", label: "Years of Excellence" },
]

const values = [
  {
    icon: <Target size={20} />,
    title: "Academic Excellence",
    description: "We set high standards and support every student to meet them through rigorous curriculum and dedicated faculty.",
    color: "#059669",
  },
  {
    icon: <Heart size={20} />,
    title: "Inclusive Community",
    description: "Every student, regardless of background, is welcomed, respected, and given equal opportunity to thrive.",
    color: "#0891b2",
  },
  {
    icon: <Eye size={20} />,
    title: "Forward Thinking",
    description: "We prepare students for a rapidly changing world by combining classical learning with modern skills.",
    color: "#9333ea",
  },
  {
    icon: <Award size={20} />,
    title: "Character Development",
    description: "Academic success matters, but so does integrity, resilience, and compassion — values we instill every day.",
    color: "#f59e0b",
  },
]

const TIMELINE_BG = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2000 1500'><rect fill='#C4D8D000' width='2000' height='1500'/><defs><path fill='none' stroke-width='32.6' stroke-opacity='0.04' id='a' d='M0.74-509.63l485.39 352.65l-185.4 570.61h-599.97l-185.4-570.61L0.74-509.63 M0.74-510.87l-486.56 353.51l185.85 571.99h601.42L487.3-157.36L0.74-510.87L0.74-510.87z'/></defs><g transform='' style='transform-origin:center'><g transform='rotate(27.36 0 0)' style='transform-origin:center'><g transform='rotate(-64 0 0)' style='transform-origin:center'><g transform='translate(1000 750)'><use stroke='#059669' href='#a' transform='rotate(4 0 0) scale(1.04)'/><use stroke='#078f63' href='#a' transform='rotate(8 0 0) scale(1.08)'/><use stroke='#09885c' href='#a' transform='rotate(12 0 0) scale(1.12)'/><use stroke='#0a8156' href='#a' transform='rotate(16 0 0) scale(1.16)'/><use stroke='#0a7b50' href='#a' transform='rotate(20 0 0) scale(1.2)'/><use stroke='#0a744a' href='#a' transform='rotate(24 0 0) scale(1.24)'/><use stroke='#096e44' href='#a' transform='rotate(28 0 0) scale(1.28)'/><use stroke='#09673f' href='#a' transform='rotate(32 0 0) scale(1.32)'/><use stroke='#086139' href='#a' transform='rotate(36 0 0) scale(1.36)'/><use stroke='#075a34' href='#a' transform='rotate(40 0 0) scale(1.4)'/><use stroke='#06542e' href='#a' transform='rotate(44 0 0) scale(1.44)'/><use stroke='#044e29' href='#a' transform='rotate(48 0 0) scale(1.48)'/><use stroke='#034824' href='#a' transform='rotate(52 0 0) scale(1.52)'/><use stroke='#02421f' href='#a' transform='rotate(56 0 0) scale(1.56)'/><use stroke='#013c1b' href='#a' transform='rotate(60 0 0) scale(1.6)'/><use stroke='#003616' href='#a' transform='rotate(64 0 0) scale(1.64)'/></g></g></g></g></svg>`)}")`

const milestones = [
  { year: "1998", event: "Greenfield Academy founded with 3 classrooms and 120 students in Dhaka." },
  { year: "2003", event: "Expanded to full secondary level, introducing grades 9 and 10." },
  { year: "2008", event: "New campus building inaugurated, doubling classroom capacity." },
  { year: "2013", event: "Launched digital library and computer lab for all students." },
  { year: "2018", event: "Recognized with the National School Excellence Award." },
  { year: "2023", event: "Introduced the online student portal for results, attendance and notices." },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1">

        {/* Hero */}
        <section className="bg-surface border-b border-border py-10 md:py-20 px-6 md:px-12 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `radial-gradient(circle at 10% 50%, rgba(5,150,105,0.07) 0%, transparent 50%),
                        radial-gradient(circle at 90% 20%, rgba(5,150,105,0.05) 0%, transparent 40%)`,
            }}
          />

          <div className="max-w-6xl mx-auto relative">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

              {/* Left — image */}
              <div className="relative row-start-2 lg:row-start-1">
                <div className="rounded-2xl overflow-hidden shadow-lg aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop"
                    alt="Greenfield Academy"
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Floating badge */}
                {/* <div className="absolute -bottom-4 -right-4 bg-surface border border-border rounded-xl px-5 py-3 shadow-lg flex items-center gap-3">
                  <div className="bg-primary rounded-lg p-2 flex shrink-0">
                    <GraduationCap size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-text">Est. 1998</div>
                    <div className="text-xs text-muted">Dhaka, Bangladesh</div>
                  </div>
                </div> */}
              </div>

              {/* Right — content */}
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold w-fit ring-1 ring-primary">
                  <GraduationCap size={14} />
                  Established 1998 · Dhaka, Bangladesh
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-text leading-tight">
                  Shaping futures for{" "}
                  <span className="text-primary">25 years</span>
                </h1>

                <p className="text-muted text-lg leading-relaxed">
                  Greenfield Academy has been a cornerstone of quality education
                  in Dhaka since 1998. We believe every child deserves an environment
                  where curiosity is encouraged, excellence is expected, and character
                  is built alongside knowledge.
                </p>

                <Link href="/faculty" className="btn btn-primary text-base px-6 py-2.5 w-fit">
                  Our Faculty
                  <ArrowRight size={16} />
                </Link>

                {/* Quick stats */}
                {/* <div className="flex items-center gap-8 flex-wrap pt-2 border-t border-border">
                  {[
                    { value: "1,200+", label: "Students" },
                    { value: "80+", label: "Teachers" },
                    { value: "98%", label: "Pass Rate" },
                    { value: "25+", label: "Years" },
                  ].map((s, i) => (
                    <div key={i}>
                      <div className="text-2xl font-bold text-primary">{s.value}</div>
                      <div className="text-xs text-muted mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div> */}
              </div>

            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="bg-primary px-6 md:px-12 py-10">
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white">{s.value}</div>
                <div className="text-sm text-white/60 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Leadership */}
        <Leadership title="Meet our administration" roles={["Principal", "Vice Principal", "Head of Academics"]} bio={true} message={false} />

        {/* Mission & Vision */}
        <section className="py-10 md:py-20 px-6 md:px-12 bg-bg border-t border-surface-2">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-semibold w-fit ring-1 ring-primary">
                <Target size={13} />
                Our Mission
              </div>
              <h2 className="text-xl font-bold text-text">
                Educate, inspire, and empower
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                Our mission is to provide a holistic, student-centred education that develops
                critical thinkers, compassionate citizens, and lifelong learners. We combine
                academic rigour with values-based teaching to prepare students not just for
                exams, but for life.
              </p>
            </div>
            <div className="card flex flex-col gap-4">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-3 py-1 rounded-full text-xs font-semibold w-fit ring-1 ring-primary">
                <Eye size={13} />
                Our Vision
              </div>
              <h2 className="text-xl font-bold text-text">
                A school the community is proud of
              </h2>
              <p className="text-muted text-sm leading-relaxed">
                We envision Greenfield Academy as a nationally recognised institution where
                students from all walks of life have access to world-class education. A place
                where teachers are empowered, parents are partners, and every graduate leaves
                ready to lead.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section
          className="py-10 md:py-20 px-6 md:px-12 border-t border-border bg-fixed bg-opacity-50 relative"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1527891751199-7225231a68dd?q=80&w=2070&auto=format&fit=crop')",
          }}
        >
          <div className="absolute inset-0 h-full w-full bg-black/50 -z-1">

          </div>
          <div className="max-w-5xl mx-auto relative z-1">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
                What We Stand For
              </div>
              <h2 className="text-3xl font-bold text-primary-light mb-8">Our core values</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {values.map((v, i) => (
                <div key={i} className="card flex gap-4 items-start">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${v.color}18`, color: v.color, boxShadow: `0 0 1px 1px ${v.color}30` }}
                  >
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-text mb-1">{v.title}</h3>
                    <p className="text-sm text-muted leading-relaxed">{v.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Timeline */}
        <section
          className="py-10 md:py-20 px-6 md:px-12 bg-cover bg-center"
          style={{ backgroundImage: TIMELINE_BG }}
        >
          <div className="max-w-3xl w-fit mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
                Our Journey
              </div>
              <h2 className="text-3xl font-bold text-text">25 years of milestones</h2>
            </div>
            <div className="flex flex-col gap-0">
              {[...milestones].reverse().map((m, i) => (
                <div key={i} className="flex gap-6 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-primary shrink-0 mt-1.5 relative" />
                    <span className="absolute h-4 w-4 bg-surface ring-2 ring-faint top-3.5 rounded-full" />
                    {i < milestones.length - 1 && (
                      <div className="w-[2px] rounded-[1px] flex-1 bg-border mt-1" />
                    )}
                  </div>
                  <div className="pb-6 md:pb-12">
                    <span className="text-3xl font-bold text-primary">
                      {m.year}
                    </span>
                    <p className="text-base text-text mt-2 leading-relaxed font-medium">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>



        {/* Contact */}
        <ContactCTA />

      </main>

      <Footer />
    </div>
  )
}