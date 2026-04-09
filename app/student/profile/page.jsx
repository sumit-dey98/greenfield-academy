'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  User, Mail, Phone, MapPin, Calendar,
  GraduationCap, Users, BookOpen, Save, Pencil, CheckCircle,
} from "lucide-react"

export default function StudentProfile() {
  const { user } = useAuth()
  const [cls, setCls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({ phone: "", address: "" })

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase
        .from("classes")
        .select("*, teachers(name, subject)")
        .eq("id", user.class_id)
        .single()
      if (data) setCls(data)
      setLoading(false)
    }
    fetch()
  }, [user])

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from("students")
      .update({ phone: form.phone, address: form.address })
      .eq("id", user.id)

    if (!error) {
      const updated = { ...user, ...form }
      localStorage.setItem("user", JSON.stringify(updated))
      setUser(updated)
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 3000)
    }
    setSaving(false)
  }

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
        <img
          src={user?.avatar}
          alt={user?.name}
          className="w-24 h-24 rounded-2xl bg-surface-2 shrink-0 object-cover"
        />
        <div className="flex-1 text-center sm:text-left">
          <h2 className="text-xl font-bold text-text">{user?.name}</h2>
          <p className="text-muted text-sm mt-1" style={{lineBreak: 'anywhere'}}>{user?.email}</p>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-3 flex-wrap">
            <span className="badge badge-info">Student</span>
            <span className="badge badge-success">Roll: {user?.roll}</span>
            {cls && <span className="badge badge-warning">{cls.name}</span>}
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
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
          <h3 className="font-semibold text-text flex items-center gap-2">
            <User size={16} className="text-primary" />
            Personal Information
          </h3>
          <div className="flex flex-col gap-3">
            <InfoRow icon={<Calendar size={15} />} label="Date of Birth"
              value={user?.dob ? new Date(user.dob).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric"
              }) : "—"}
            />
            <InfoRow icon={<User size={15} />} label="Gender" value={user?.gender} />
            <InfoRow icon={<Mail size={15} />} label="Email" value={user?.email} />

            {/* Editable phone */}
            <div className="flex items-start gap-3">
              <span className="text-muted mt-[5px] shrink-0"><Phone size={15} /></span>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted mb-1">Phone</div>
                {editing ? (
                  <input
                    className="input text-xs"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="Your phone number"
                  />
                ) : (
                  <div className="text-xs text-text">{user?.phone ?? "—"}</div>
                )}
              </div>
            </div>

            {/* Editable address */}
            <div className="flex items-start gap-3">
              <span className="text-muted mt-[5px] shrink-0"><MapPin size={15} /></span>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted mb-1">Address</div>
                {editing ? (
                  <input
                    className="input text-xs"
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Your address"
                  />
                ) : (
                  <div className="text-xs text-text">{user?.address ?? "—"}</div>
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

        {/* Academic info */}
        <div className="card flex flex-col gap-4">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <GraduationCap size={16} className="text-primary" />
            Academic Information
          </h3>
          <div className="flex flex-col gap-3">
            <InfoRow icon={<BookOpen size={15} />} label="Class" value={cls?.name} />
            <InfoRow icon={<GraduationCap size={15} />} label="Grade" value={cls ? `Grade ${cls.grade}` : "—"} />
            <InfoRow icon={<Users size={15} />} label="Section" value={cls?.section} />
            <InfoRow icon={<MapPin size={15} />} label="Classroom" value={cls ? `Room ${cls.room}` : "—"} />
            <InfoRow icon={<User size={15} />} label="Class Teacher" value={cls?.teachers?.name} />
            <InfoRow icon={<BookOpen size={15} />} label="Teacher Subject" value={cls?.teachers?.subject} />
          </div>
        </div>

        {/* Guardian info */}
        <div className="card flex flex-col gap-4 lg:col-span-2">
          <h3 className="font-semibold text-text flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Guardian Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={<User size={15} />} label="Guardian Name" value={user?.guardian} />
            <InfoRow icon={<Phone size={15} />} label="Guardian Phone" value={user?.guardian_phone} />
          </div>
        </div>

      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-muted mt-[5px] shrink-0">{icon}</span>
      <div className="flex-1">
        <div className="text-sm font-medium text-muted mb-0.5">{label}</div>
        <div className="text-xs text-text" style={{ lineBreak: 'anywhere'}} >{value ?? "—"}</div>
      </div>
    </div>
  )
}