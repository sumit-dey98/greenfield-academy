import { Users, GraduationCap, BookOpen, Trophy } from "lucide-react"
import Reveal from "@/components/ui/Reveal"

const stats = [
  { icon: <Users size={24} />, value: "1,200+", label: "Enrolled Students", color: "#059669" },
  { icon: <GraduationCap size={24} />, value: "30+", label: "Qualified Teachers", color: "#0891b2" },
  { icon: <BookOpen size={24} />, value: "20", label: "Subjects Taught", color: "#f59e0b" },
  { icon: <Trophy size={24} />, value: "98%", label: "GPA-5 in SSC 2024", color: "#9333ea" },
]

export default function Stats() {
  return (
    <section className="bg-bg py-10 md:py-16 px-6 md:px-12 -mt-10 md:-mt-16 relative z-10">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div className="pt-1 overflow-hidden rounded-md stat-card p-0 border-none" style={{ background: stat.color }}>
              <Reveal key={i} delay={i * 0.1} amount={0.4} className="text-center bg-surface stat-card !rounded-sm !rounded-t-md">
                {/* <div className="absolute top-0 left-1.5 right-1.5 h-3">
                <div
                  className="w-full h-full rounded-b-md"
                  style={{ background: stat.color }}
                />
              </div> */}
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-lg mb-3"
                  style={{ background: `${stat.color}18`, color: stat.color }}
                >
                  {stat.icon}
                </div>
                <div className="stat-value text-3xl md:text-4xl">{stat.value}</div>
                <div className="stat-label md:text-base">{stat.label}</div>
              </Reveal>
             </div>
          ))}
        </div>
      </div>
    </section>
  )
}