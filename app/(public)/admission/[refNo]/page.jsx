'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { verifyApplicationAccess, getApplicationStatus, getAdmitCardBlob } from "@/lib/api/public"
import { ApiError } from "@/lib/api/client"
import toast from "react-hot-toast"
import Input from "@/components/ui/Input"
import {
  GraduationCap, ShieldCheck, CheckCircle,
  XCircle, Clock, FileText, MapPin, Video, Lock, Check, Download,
} from "lucide-react"

const MILESTONES = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under Review" },
  { key: "exam_scheduled", label: "Entrance Exam" },
  { key: "exam_completed", label: "Exam Completed" },
  { key: "graded", label: "Grading" },
  { key: "interview_scheduled", label: "Interview" },
  { key: "interview_completed", label: "Interview Done" },
  { key: "decision", label: "Decision" },
]

function milestoneIndexFor(statusValue) {
  // grading_assigned sits between exam_completed and graded — treat it as "not yet graded".
  if (statusValue === "grading_assigned") return MILESTONES.findIndex(m => m.key === "exam_completed")
  if (["decision_pending", "waitlisted", "accepted", "rejected"].includes(statusValue)) {
    return MILESTONES.length - 1
  }
  if (["screening_rejected", "withdrawn"].includes(statusValue)) return 0
  const idx = MILESTONES.findIndex(m => m.key === statusValue)
  return idx === -1 ? 0 : idx
}

function outcomeBanner(statusValue) {
  if (statusValue === "accepted") {
    return { icon: CheckCircle, className: "bg-primary-light border-success text-green-800", title: "Congratulations — Accepted!", body: "The applicant has been accepted for admission." }
  }
  if (statusValue === "rejected" || statusValue === "screening_rejected") {
    return { icon: XCircle, className: "bg-red-100 border-border text-red-600", title: "Application Not Successful", body: "This application was not successful this cycle." }
  }
  if (statusValue === "waitlisted") {
    return { icon: Clock, className: "bg-amber-50 border-warning text-amber-700", title: "Waitlisted", body: "The applicant is on the waitlist. We'll update this page if a seat opens up." }
  }
  if (statusValue === "withdrawn") {
    return { icon: XCircle, className: "bg-surface-2 border-border text-muted", title: "Application Withdrawn", body: "This application has been withdrawn." }
  }
  return null
}

function localAccessKey(ref) {
  return `gfa_admission_access_${ref}`
}

function readCachedToken(ref) {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(localAccessKey(ref))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.accessToken || !parsed?.expiresAt || parsed.expiresAt <= Date.now()) return null
    return parsed.accessToken
  } catch {
    return null
  }
}

function cacheToken(ref, accessToken, expiresIn) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(localAccessKey(ref), JSON.stringify({
      accessToken, expiresAt: Date.now() + expiresIn * 1000,
    }))
  } catch { /* localStorage unavailable — will just re-prompt every visit */ }
}

function AdmitCardButton({ refNo }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    const token = readCachedToken(refNo)
    if (!token) {
      toast.error("Your session has expired — please verify again to download the admit card.")
      return
    }
    setDownloading(true)
    try {
      const blob = await getAdmitCardBlob(refNo, token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `admit-card-${refNo}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not download the admit card."
      toast.error(message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={downloading}
      className="btn btn-primary w-full sm:w-auto justify-center gap-2"
    >
      {downloading ? (
        <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <><Download size={15} /> Download Admit Card (PDF)</>
      )}
    </button>
  )
}

function TabContent({ milestoneKey, data, reachedIdx }) {
  const isRejectedAtScreening = data.visible_status === "screening_rejected"

  if (milestoneKey === "submitted") {
    return (
      <div className="flex flex-col sm:flex-row gap-5">
        {data.photo_url && (
          <img
            src={data.photo_url}
            alt={data.student_name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg object-cover ring-1 ring-border shrink-0 mx-auto sm:mx-0"
          />
        )}
        <div className="flex flex-col gap-3 text-sm flex-1">
          <Row label="Student Name" value={data.student_name} />
          <Row label="Date of Birth" value={data.dob} />
          <Row label="Gender" value={data.gender} />
          <Row label="Applying For" value={data.applying_class} />
          <Row label="Blood Group" value={data.blood_group} />
          <Row label="Previous School" value={data.previous_school} />
          <Row label="Admission Cycle" value={data.cycle_name} />
          <Row label="Reference Number" value={data.reference_number} mono />
          {(data.guardian_name || data.guardian_phone || data.guardian_email) && (
            <div className="pt-2 mt-1 border-t border-border flex flex-col gap-3">
              <p className="text-xs text-muted -mb-1">Guardian</p>
              <Row label="Name" value={data.guardian_name} />
              <Row label="Relationship" value={data.guardian_relationship} />
              <Row label="Phone" value={data.guardian_phone} />
              <Row label="Email" value={data.guardian_email} />
            </div>
          )}
          {data.address && (
            <div className="pt-2 mt-1 border-t border-border">
              <Row label="Address" value={data.address} />
            </div>
          )}
          {data.documents?.length > 0 && (
            <div className="pt-2 mt-1 border-t border-border">
              <p className="text-xs text-muted mb-2">Submitted Documents</p>
              <ul className="flex flex-col gap-2">
                {data.documents.map((doc, i) => (
                  <li key={i} className="flex items-center justify-between">
                    <span className="text-text flex items-center gap-1.5">
                      <FileText size={13} className="text-muted" />
                      {doc.file_name || doc.doc_type || `Document ${i + 1}`}
                    </span>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-primary hover:underline text-xs">
                      View
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (milestoneKey === "under_review") {
    return (
      <p className="text-sm text-muted leading-relaxed">
        Your application is being reviewed by our admissions team. We&apos;ll update this
        page once a decision is made on whether to proceed to the entrance exam stage.
      </p>
    )
  }

  if (milestoneKey === "exam_scheduled") {
    if (isRejectedAtScreening) {
      return <p className="text-sm text-muted">This application did not proceed past initial review.</p>
    }
    if (!data.exam_schedule) {
      return <p className="text-sm text-muted">Your entrance exam has not been scheduled yet.</p>
    }
    return (
      <div className="flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-3">
          <Row label="Date" value={data.exam_schedule.exam_date || "TBA"} />
          <Row label="Time" value={data.exam_schedule.exam_time || "TBA"} />
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-muted shrink-0" />
            <span className="text-text font-medium">{data.exam_schedule.venue || "TBA"}</span>
          </div>
          <Row label="Roll Number" value={data.exam_schedule.roll_number} mono highlight />
        </div>
        <AdmitCardButton refNo={data.reference_number} />
      </div>
    )
  }

  if (milestoneKey === "exam_completed") {
    return (
      <p className="text-sm text-muted leading-relaxed">
        Your entrance exam has been completed. Results are being graded — check back for
        the next update.
      </p>
    )
  }

  if (milestoneKey === "graded") {
    return (
      <p className="text-sm text-muted leading-relaxed">
        Grading has been completed for your entrance exam. Our admissions team is
        reviewing results and deciding on next steps.
      </p>
    )
  }

  if (milestoneKey === "interview_scheduled") {
    if (!data.interview) {
      return <p className="text-sm text-muted">Your interview has not been scheduled yet.</p>
    }
    return (
      <div className="flex flex-col gap-3 text-sm">
        <Row label="Date" value={data.interview.interview_date || "TBA"} />
        <Row label="Time" value={data.interview.interview_time || "TBA"} />
        <div className="flex items-center gap-2">
          <Video size={14} className="text-muted shrink-0" />
          <span className="text-text font-medium capitalize">
            {data.interview.mode?.replace("_", " ") || "TBA"}
          </span>
        </div>
      </div>
    )
  }

  if (milestoneKey === "interview_completed") {
    return (
      <p className="text-sm text-muted leading-relaxed">
        Your interview is complete. A final decision will be published here once ready.
      </p>
    )
  }

  if (milestoneKey === "decision") {
    const banner = outcomeBanner(data.visible_status)
    if (!banner) {
      return <p className="text-sm text-muted">A final decision has not been published yet.</p>
    }
    return (
      <div className={`flex items-start gap-3 px-4 py-3 border rounded-md ${banner.className}`}>
        <banner.icon size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">{banner.title}</p>
          <p className="text-xs mt-0.5 opacity-90">{banner.body}</p>
        </div>
      </div>
    )
  }

  return null
}

function Row({ label, value, mono, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted shrink-0">{label}</span>
      <span className={`text-right font-medium ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-semibold" : "text-text"}`}>
        {value || "—"}
      </span>
    </div>
  )
}

export default function AdmissionTrackPage() {
  const { refNo } = useParams()
  const [loading, setLoading] = useState(true)
  const [needsVerify, setNeedsVerify] = useState(false)
  const [contactValue, setContactValue] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState(0)

  const loadStatus = async (token) => {
    try {
      const status = await getApplicationStatus(refNo, token)
      setData(status)
      setNeedsVerify(false)
      setActiveTab(milestoneIndexFor(status.visible_status))
    } catch {
      setNeedsVerify(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const cached = readCachedToken(refNo)
    if (cached) {
      loadStatus(cached)
    } else {
      setNeedsVerify(true)
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refNo])

  const handleVerify = async (e) => {
    e.preventDefault()
    if (!contactValue.trim()) return
    setVerifying(true)
    setError(null)
    try {
      const res = await verifyApplicationAccess(refNo, contactValue.trim())
      cacheToken(refNo, res.access_token, res.expires_in)
      await loadStatus(res.access_token)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Verification failed."
      setError(message)
      toast.error(message)
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="text-muted text-sm">Loading...</div>
      </div>
    )
  }

  if (needsVerify) {
    return (
      <div className="flex-1 py-14 px-4 md:px-6">
        <div className="max-w-md mx-auto flex flex-col gap-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
              <ShieldCheck size={13} />
              Verify Your Identity
            </div>
            <h1 className="text-2xl font-bold text-text mb-2">Track Application</h1>
            <p className="text-muted text-sm">
              Reference: <span className="font-mono font-semibold text-text">{refNo}</span>
            </p>
          </div>
          <form onSubmit={handleVerify} className="card flex flex-col gap-4">
            <Input
              label="Contact Email or Phone"
              required
              placeholder="Whatever you used when applying"
              value={contactValue}
              onChange={e => setContactValue(e.target.value)}
              hint="Enter the email or phone number you provided on your application."
              error={error}
              disabled={verifying}
            />
            <button type="submit" disabled={verifying} className="btn btn-primary w-full justify-center h-11">
              {verifying ? (
                <span className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "View Status"
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!data) return null

  const reachedIdx = milestoneIndexFor(data.visible_status)
  const isRejected = ["rejected", "screening_rejected"].includes(data.visible_status)

  return (
    <div className="flex-1 py-10 md:py-14 px-4 md:px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">

        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
            <GraduationCap size={13} />
            {data.cycle_name || "Admission"}
          </div>
          <h1 className="page-title">{data.student_name}</h1>
          <p className="page-subtitle">
            {data.applying_class && <>{data.applying_class} · </>}
            Reference <span className="font-mono">{data.reference_number}</span>
          </p>
        </div>

        {/* Stepper tab bar */}
        <div className="card overflow-x-auto">
          <div className="flex items-start min-w-max px-1 py-1">
            {MILESTONES.map((m, i) => {
              const locked = i > reachedIdx
              const isDone = i < reachedIdx
              const isCurrent = i === reachedIdx
              const isTabRejected = isRejected && m.key === "decision"
              const isLast = i === MILESTONES.length - 1

              return (
                <div key={m.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setActiveTab(i)}
                    className="flex flex-col items-center gap-2 group shrink-0 px-1"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 shrink-0 transition-colors
                        ${isTabRejected
                          ? "bg-danger text-white ring-danger"
                          : activeTab === i
                            ? "bg-primary text-white ring-primary scale-110"
                            : isDone
                              ? "bg-primary-light text-primary ring-primary"
                              : isCurrent
                                ? "bg-surface text-primary ring-primary animate-pulse"
                                : "bg-surface-2 text-faint ring-border"
                        }
                        ${!locked && activeTab !== i ? "group-hover:ring-primary group-hover:text-primary cursor-pointer" : ""}
                        ${locked ? "cursor-not-allowed" : ""}
                      `}
                    >
                      {locked ? (
                        <Lock size={13} />
                      ) : isTabRejected ? (
                        <XCircle size={16} />
                      ) : isDone ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={`text-[11px] font-semibold text-center leading-tight max-w-[5.5rem] transition-colors
                        ${locked ? "text-faint" : activeTab === i ? "text-primary" : "text-text"}
                      `}
                    >
                      {m.label}
                    </span>
                  </button>
                  {!isLast && (
                    <div className={`h-0.5 flex-1 min-w-[1.5rem] rounded-full mt-[-1.25rem] ${i < reachedIdx ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Active tab content */}
        <div className="card">
          <h2 className="font-semibold text-text text-base pb-3 mb-1 border-b border-border">
            {MILESTONES[activeTab].label}
          </h2>
          <div className="pt-3">
            <TabContent milestoneKey={MILESTONES[activeTab].key} data={data} reachedIdx={reachedIdx} />
          </div>
        </div>

      </div>
    </div>
  )
}
