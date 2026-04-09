'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import { Settings, GraduationCap, CheckCircle, Lock } from "lucide-react"

export default function SettingsManager() {
  const { attemptWrite } = useAuth()
  const [admissionOpen, setAdmissionOpen] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("admission_open")
        .select("value")
        .eq("id", "admission_status")
        .single()
      setAdmissionOpen(data?.value ?? false)
      setLoading(false)
    }
    fetch()
  }, [])

  const handleToggle = async (val) => {
    if (!attemptWrite("cms")) return
    setSaving(true)
    setSaved(false)
    const { error } = await supabase
      .from("admission_open")
      .update({ value: val })
      .eq("id", "admission_status")
    setSaving(false)
    if (error) return
    setAdmissionOpen(val)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage school-wide settings and configurations.</p>
      </div>

      <div className="flex flex-col 2xl:flex-row gap-6">
        <div className="card flex-1 flex flex-col gap-5">
          <h2 className="font-semibold text-text flex items-center gap-2 pb-3 border-b border-border">
            <GraduationCap size={16} className="text-primary" />
            Admissions
          </h2>

          {loading ? (
            <div className="h-16 bg-surface-2 rounded-lg animate-pulse" />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-text">Admission Applications</p>
                  <p className="text-xs text-muted mt-0.5">
                    Controls whether the admission form accepts applications.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${admissionOpen ? "badge-success" : "badge-warning"}`}>
                    {admissionOpen ? "Open" : "Closed"}
                  </span>
                  <button
                    onClick={() => handleToggle(!admissionOpen)}
                    disabled={saving}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 cursor-pointer
                    ${admissionOpen ? "bg-primary" : "bg-border"}
                    disabled:opacity-60`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
                    ${admissionOpen ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </button>
                </div>
              </div>

              <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${admissionOpen ? "bg-primary-light border-success" : "bg-surface-2 border-border"}`}>
                {admissionOpen
                  ? <CheckCircle size={16} className="text-success shrink-0 mt-0.5" />
                  : <Lock size={16} className="text-faint shrink-0 mt-0.5" />
                }
                <div>
                  <p className={`text-sm font-medium ${admissionOpen ? "text-text" : "text-faint"}`}>
                    {admissionOpen ? "Admissions are currently open" : "Admissions are currently closed"}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {admissionOpen
                      ? "The admission form is active and accepting applications."
                      : "The admission form is visible but disabled."
                    }
                  </p>
                </div>
              </div>

              {saved && (
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle size={14} /> Setting saved successfully.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card flex-1 flex flex-col gap-5">
          <h2 className="font-semibold text-text flex items-center gap-2 pb-3 border-b border-border">
            <Settings size={16} className="text-primary" />
            School Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "School Name", value: "Greenfield Academy" },
              { label: "Established", value: "1998" },
              { label: "Address", value: "123 Education Lane, Dhaka, Bangladesh" },
              { label: "Phone", value: "+880-2-9876543" },
              { label: "Email", value: "info@greenfieldacademy.edu.bd" },
              { label: "Website", value: "www.greenfieldacademy.edu.bd" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1 px-3 py-2.5 bg-surface-2 rounded-lg">
                <span className="text-xs text-muted">{item.label}</span>
                <span className="text-sm font-medium text-text">{item.value}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-faint">
            School information is managed in the codebase. Contact your developer to update these details.
          </p>
        </div>
      </div>

    </div>
  )
}