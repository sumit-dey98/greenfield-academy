import { Users, GraduationCap, BookOpen, Trophy } from "lucide-react"

const stats = [
  { icon: <Users size={24} />, value: "1,200+", label: "Enrolled Students", color: "#059669" },
  { icon: <GraduationCap size={24} />, value: "30+", label: "Qualified Teachers", color: "#0891b2" },
  { icon: <BookOpen size={24} />, value: "20", label: "Subjects Taught", color: "#f59e0b" },
  { icon: <Trophy size={24} />, value: "98%", label: "GPA-5 in SSC 2024", color: "#9333ea" },
]

export default function Stats() {
  return (
    <section className="bg-bg py-10 md:py-20 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="stat-card text-center">
              <div
                className="inline-flex items-center justify-center w-12 h-12 rounded-md mb-3"
                style={{ background: `${stat.color}18`, color: stat.color, boxShadow: `0 0 1px 1px ${stat.color}30` }}
              >
                {stat.icon}
              </div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label md:text-base">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}