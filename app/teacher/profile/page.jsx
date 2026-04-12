'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  User, Mail, Phone, BookOpen, Calendar,
  GraduationCap, Save, Pencil, CheckCircle, Users,
} from "lucide-react"
import Input from "@/components/ui/Input"

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted mt-[5px] shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-muted mb-0.5">{label}</div>
        <div className="text-sm text-text">{value ?? "--"}</div>
      </div>
    </div>
  )
}

export default function TeacherProfile() {
  const { user, setUser } = useAuth()
  const [cls, setCls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [phone, setPhone] = useState("")
  const [phoneError, setPhoneError] = useState(null)

  useEffect(() => {
    if (!user?.class_id) { setLoading(false); return }
    const fetch = async () => {
      const { data } = await supabase
        .from("classes")
        .select("*")
        .eq("id", user.class_id)
        .single()
      if (data) setCls(data)
      setLoading(false)
    }
    fetch()
  }, [user])

  const handleSave = async () => {
    if (!phone.trim()) {
      setPhoneError("Phone number is required.")
      return
    }
    setSaving(true)
    setPhoneError(null)
    const { error } = await supabase
      .from("teachers")
      .update({ phone })
      .eq("id", user.id)

    if (!error) {
      const updated = { ...user, phone }
      localStorage.setItem("user", JSON.stringify(updated))
      setUser(updated)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

  const initials = user?.name
    ?.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">View and update your personal information.</p>
      </div>

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 px-4 py-3 bg-primary-light border border-success text-success rounded-lg text-sm font-medium">
          <CheckCircle size={15} />
          Profile updated successfully.
        </div>
      )}

      {/* Profile card */}
      <div className="card flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-28 h-28 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <div
            className="w-28 h-28 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shrink-0"
            style={{ background: "#059669" }}
          >
            {initials}
          </div>
        )}
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-text">{user?.name}</h2>
          <p className="text-muted text-sm mt-1">{user?.email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
            <span className="badge badge-success">Teacher</span>
            <span className="badge badge-info">{user?.subject}</span>
            {cls && <span className="badge badge-warning">{cls.name}</span>}
          </div>
        </div>
        <button
          onClick={() => { setEditing(!editing); setPhoneError(null) }}
          className={`btn ${editing ? "btn-outline" : "btn-primary"} shrink-0`}
        >
          <Pencil size={14} />
          {editing ? "Cancel" : "Edit Profile"}
        </button>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal info */}
        <div className="card flex flex-col gap-4">
          <h3 className="font-semibold text-text flex items-center gap-2 text-base">
            <User size={16} className="text-primary" />
            Personal Information
          </h3>
          <div className="flex flex-col gap-3">
            <InfoRow icon={<Mail size={15} />} label="Email" value={user?.email} />
            <InfoRow icon={<BookOpen size={15} />} label="Subject" value={user?.subject} />
            <InfoRow icon={<Calendar size={15} />} label="Joined"
              value={user?.join_date ? new Date(user.join_date).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              }) : "—"}
            />

            {/* Editable phone */}
            <div className="flex items-start">
              <span className="text-muted mt-0.5 shrink-0"><Phone size={15} /></span>
              <div className="flex-1">
                {editing ? (
                  <Input
                    label="Phone"
                    type="tel"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setPhoneError(null) }}
                    error={phoneError}
                    placeholder="+880-XXXX-XXXXXX"
                  />
                ) : (
                  <InfoRow icon={null} label="Phone" value={user?.phone} />
                )}
              </div>
            </div>

            {editing && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary mt-2 w-full justify-center"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save"}
              </button>
            )}
          </div>
        </div>

        {/* Class info */}
        <div className="card flex flex-col gap-4">
          <h3 className="font-semibold text-text flex items-center gap-2 text-base">
            <GraduationCap size={16} className="text-primary" />
            Class Information
          </h3>
          <div className="flex flex-col gap-3">
            {cls ? (
              <>
                <InfoRow icon={<BookOpen size={15} />} label="Class" value={cls.name} />
                <InfoRow icon={<GraduationCap size={15} />} label="Grade" value={`Grade ${cls.grade}`} />
                <InfoRow icon={<Users size={15} />} label="Section" value={cls.section} />
                <InfoRow icon={<User size={15} />} label="Room" value={`Room ${cls.room}`} />
              </>
            ) : (
              <p className="text-sm text-muted">No class assigned.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}