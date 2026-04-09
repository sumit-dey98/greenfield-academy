import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import { GraduationCap, Mail, Phone, BookOpen } from "lucide-react"

const LEADERSHIP_ROLES = ["Chairman", "Principal", "Vice Principal", "Head of Academics"]

const AVATAR_COLORS = [
  "#059669", "#0891b2", "#f59e0b", "#9333ea", "#ef4444",
  "#10b981", "#0ea5e9", "#f97316", "#14b8a6", "#6366f1",
  "#8b5cf6", "#84cc16", "#ec4899", "#3b82f6", "#d946ef",
  "#f43f5e", "#78716c", "#eab308", "#64748b", "#71717a",
]

async function getFaculty() {
  const [facultyRes, subjectsRes] = await Promise.all([
    supabase.from("teachers").select("*").order("join_date", { ascending: true }),
    supabase.from("subjects").select("id, name").order("name", { ascending: true }),
  ])
  return {
    faculty: facultyRes.data ?? [],
    subjects: subjectsRes.data ?? [],
  }
}

export default async function FacultyPage() {
  const { faculty, subjects } = await getFaculty()

  const leadership = faculty.filter(t => LEADERSHIP_ROLES.includes(t.role))
  const teachers = faculty.filter(t => !LEADERSHIP_ROLES.includes(t.role))

  const getAvatarColor = (subjectName) => {
    const idx = subjects.findIndex(s => s.name === subjectName)
    return AVATAR_COLORS[idx % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
  }

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
          <div className="max-w-4xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-6 ring-1 ring-primary">
              <GraduationCap size={14} />
              Our People
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text mb-5 leading-tight">
              Meet our <span className="text-primary">faculty</span>
            </h1>
            <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto">
              Our teachers are the heart of Greenfield Academy. Experienced,
              passionate, and dedicated — they bring learning to life every day.
            </p>

            <div className="flex items-center justify-center gap-10 mt-10 pt-8 border-t border-border flex-wrap">
              {[
                { value: faculty.length, label: "Staff Members" },
                { value: subjects.length, label: "Subjects Taught" },
                { value: "10+", label: "Years Avg. Experience" },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-3xl font-bold text-primary">{s.value}</div>
                  <div className="text-sm text-muted mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Leadership */}
        {leadership.length > 0 && (
          <section className="py-10 md:py-20 px-6 md:px-12 bg-bg">
            <div className="max-w-5xl mx-auto flex flex-col gap-8">
              <div>
                <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-3 ring-1 ring-primary">
                  Leadership
                </div>
                <h2 className="text-2xl font-bold text-text">School Administration</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {leadership.map(member => (
                  <FacultyCard key={member.id} member={member} color={getAvatarColor(member.subject)} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Teaching staff */}
        <section className="py-10 md:py-20 px-6 md:px-12 bg-surface border-t border-border">
          <div className="max-w-5xl mx-auto flex flex-col gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold mb-3 ring-1 ring-primary">
                Teaching Staff
              </div>
              <h2 className="text-2xl font-bold text-text">Our Teachers</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map(member => (
                <FacultyCard key={member.id} member={member} color={getAvatarColor(member.subject)} />
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}

function FacultyCard({ member, color }) {
  const initials = member.name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className="card flex flex-col gap-4 hover:ring hover:ring-surface-2 transition-all duration-200 will-change-transform">

      <div className="flex items-center gap-4">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="w-14 h-14 rounded-xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
            style={{ background: color }}
          >
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-text text-base leading-snug truncate">{member.name}</h3>
          <p className="text-sm text-muted mt-0.5">{member.role}</p>
          {member.subject && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block"
              style={{ background: `${color}18`, color }}
            >
              {member.subject}
            </span>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Mail size={15} strokeWidth={2.5} className="text-faint shrink-0" />
          <span className="truncate">{member.email}</span>
        </div>
        {member.phone && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Phone size={15} strokeWidth={2.5} className="text-faint shrink-0" />
            <span>{member.phone}</span>
          </div>
        )}
        {member.class_id && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <BookOpen size={15} strokeWidth={2.5} className="text-faint shrink-0" />
            <span>Class Teacher</span>
          </div>
        )}
      </div>

      <div className="text-xs text-faint mt-auto pt-2 border-t border-border">
        Joined {new Date(member.join_date).toLocaleDateString("en-GB", {
          month: "long", year: "numeric",
        })}
      </div>

    </div>
  )
}