'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { verifyApplicationAccess, getApplicationStatus, getAdmitCardBlob, getAcceptanceLetterBlob, getFaculty } from "@/lib/api/public"
import { ApiError } from "@/lib/api/client"
import toast from "react-hot-toast"
import Input from "@/components/ui/Input"
import {
  GraduationCap, ShieldCheck, CheckCircle,
  XCircle, Clock, FileText, MapPin, Video, Lock, Check, Download, Award,
} from "lucide-react"

// Only stages with real, concrete content to show get their own tab. Purely transitional
// backend statuses (under_review, exam_completed, grading_assigned, graded,
// interview_completed) have nothing new to display beyond "still in progress" - those are
// surfaced as the status badge above the tabs instead, not as a dead-end tab of their own.
const STEPS = [
  { key: "submitted", label: "Submitted" },
  { key: "entrance_exam", label: "Entrance Exam" },
  { key: "interview", label: "Interview" },
  { key: "final_result", label: "Final Result" },
]

// Human-readable label for every backend status, shown as a small badge above the tabs -
// this is where the "in progress, nothing to click into yet" states are actually communicated.
const STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  screening_rejected: "Not Successful",
  exam_scheduled: "Exam Scheduled",
  exam_completed: "Exam Completed — Awaiting Grading",
  grading_assigned: "Exam Completed — Awaiting Grading",
  graded: "Grading Complete — Awaiting Next Steps",
  interview_scheduled: "Interview Scheduled",
  interview_completed: "Interview Complete — Awaiting Decision",
  waitlisted: "Waitlisted",
  accepted: "Accepted",
  rejected: "Not Successful",
  withdrawn: "Withdrawn",
  decision_pending: "Decision Pending",
}

// Maps the fine-grained backend status onto which of the 4 STEPS is "current".
function stepIndexFor(statusValue) {
  if (statusValue === "submitted") return 0
  if (["screening_rejected", "withdrawn"].includes(statusValue)) return 0
  if (["under_review", "exam_scheduled", "exam_completed", "grading_assigned", "graded"].includes(statusValue)) return 1
  if (["interview_scheduled", "interview_completed"].includes(statusValue)) return 2
  if (["decision_pending", "waitlisted", "accepted", "rejected"].includes(statusValue)) return 3
  return 0
}

function outcomeBanner(statusValue) {
  if (statusValue === "accepted") {
    return { icon: CheckCircle, className: "bg-primary-light border-success text-green-800", title: "Congratulations — Application Accepted!", body: "The applicant has been accepted for admission." }
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

function PdfDownloadButton({ refNo, fetchBlob, filename, label, errorMessage }) {
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    const token = readCachedToken(refNo)
    if (!token) {
      toast.error("Your session has expired — please verify again to download this document.")
      return
    }
    setDownloading(true)
    try {
      const blob = await fetchBlob(refNo, token)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : errorMessage
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
        <><Download size={15} /> {label}</>
      )}
    </button>
  )
}

function AdmitCardButton({ refNo }) {
  return (
    <PdfDownloadButton
      refNo={refNo}
      fetchBlob={getAdmitCardBlob}
      filename={`admit-card-${refNo}.pdf`}
      label="Download Admit Card (PDF)"
      errorMessage="Could not download the admit card."
    />
  )
}

function AcceptanceLetterButton({ refNo }) {
  return (
    <PdfDownloadButton
      refNo={refNo}
      fetchBlob={getAcceptanceLetterBlob}
      filename={`acceptance-letter-${refNo}.pdf`}
      label="Download Acceptance Letter (PDF)"
      errorMessage="Could not download the acceptance letter."
    />
  )
}

function TabContent({ stepKey, data }) {
  const isRejectedAtScreening = data.visible_status === "screening_rejected"

  if (stepKey === "submitted") {
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
              <p className="text-base text-text font-medium -mb-1">Guardian</p>
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

  if (stepKey === "entrance_exam") {
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
            <span className="text-text font-medium">
              {data.exam_schedule.venue || "TBA"}
              {data.exam_schedule.room && <>, {data.exam_schedule.room}</>}
            </span>
          </div>
          <Row label="Roll Number" value={data.exam_schedule.roll_number} mono highlight />
          {data.entrance_score != null && (
            <div className="flex items-center gap-2 pt-1">
              <Award size={14} className="text-primary shrink-0" />
              <span className="text-text font-semibold">Score: {data.entrance_score}/100</span>
            </div>
          )}
        </div>
        <AdmitCardButton refNo={data.reference_number} />
      </div>
    )
  }

  if (stepKey === "interview") {
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
        {data.interview.mode === "in_person" && data.interview.room && (
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-muted shrink-0" />
            <span className="text-text font-medium">{data.interview.room}</span>
          </div>
        )}
        {data.interview.mode === "video" && data.interview.meeting_link && (
          <a
            href={data.interview.meeting_link}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline font-medium break-all"
          >
            {data.interview.meeting_link}
          </a>
        )}
        {data.interview.mode === "phone" && data.interview.phone_number && (
          <Row label="Phone" value={data.interview.phone_number} mono />
        )}
      </div>
    )
  }

  if (stepKey === "final_result") {
    const banner = outcomeBanner(data.visible_status)
    if (!banner) {
      return <p className="text-sm text-muted">A final result has not been published yet.</p>
    }
    return (
      <div className="flex flex-col gap-5">
        <div className={`flex items-start gap-3 px-4 py-3 border rounded-md ${banner.className}`}>
          <banner.icon size={18} strokeWidth={2.5} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">{banner.title}</p>
            <p className="text-xs mt-0.5 opacity-90">{banner.body}</p>
          </div>
        </div>
        {data.visible_status === "accepted" && <AcceptanceLetter data={data} />}
      </div>
    )
  }

  return null
}

function AcceptanceLetter({ data }) {
  const [principal, setPrincipal] = useState(null)

  useEffect(() => {
    getFaculty({ role: "Principal" })
      .then(rows => setPrincipal(rows?.[0] || null))
      .catch(err => console.error("Failed to load principal for acceptance letter:", err))
  }, [])

  const signatoryName = principal?.name || "The Admissions Office"
  const signatoryRole = principal ? `${principal.role}, Greenfield Academy` : "Greenfield Academy"
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md overflow-hidden ring-1 ring-border">
        <div className="bg-primary text-white text-center py-6 px-4">
          <p className="font-script text-3xl">Greenfield Academy</p>
          <p className="font-script text-sm mt-1 opacity-90">
            info@greenfieldacademy.edu.bd | +880-2-9876543
          </p>
        </div>
        <div className="font-script bg-surface px-6 sm:px-10 py-8 flex flex-col gap-4 text-text">
          <p className="text-xl font-bold text-center">Admission Acceptance Letter</p>
          <p className="text-base">{today}</p>
          <div>
            <p className="text-lg">{data.student_name}</p>
            {data.applying_class && <p className="text-base">Admitted to: {data.applying_class}</p>}
          </div>
          <p className="text-lg mt-2">Dear {data.student_name || "Applicant"},</p>
          <p className="text-base leading-relaxed">
            We are pleased to inform you that your application to Greenfield Academy
            {data.cycle_name ? ` for ${data.cycle_name}` : ""} has been accepted. Welcome to
            our school community!
          </p>
          <p className="text-base leading-relaxed">
            Your dedication throughout the admissions process, from the entrance examination
            to the interview, truly stood out, and we are confident you will thrive as part
            of Greenfield Academy.
          </p>
          <p className="text-base leading-relaxed">
            Please be aware that your admission is contingent upon completing the enrollment
            formalities communicated by our Admissions Office. Should you have any questions
            or need further assistance, please do not hesitate to reach out.
          </p>
          <p className="text-base mt-3">Sincerely,</p>
          <div>
            <p className="text-2xl text-primary">{signatoryName}</p>
            <p className="text-sm text-muted mt-1">{signatoryRole}</p>
          </div>
        </div>
      </div>
      <AcceptanceLetterButton refNo={data.reference_number} />
    </div>
  )
}

function Row({ label, value, mono, highlight }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-medium text-muted shrink-0">{label}</span>
      <span className={`text-right text-sm ${mono ? "font-mono" : ""} ${highlight ? "text-primary font-semibold" : "text-text"}`}>
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
      setActiveTab(stepIndexFor(status.visible_status))
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

  const reachedIdx = stepIndexFor(data.visible_status)
  const isRejected = ["rejected", "screening_rejected"].includes(data.visible_status)
  const statusLabel = STATUS_LABELS[data.visible_status] || data.visible_status

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
          <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
            isRejected
              ? "bg-red-100 text-red-600 ring-red-300"
              : "bg-primary-light text-primary ring-primary"
          }`}>
            Current status: {statusLabel}
          </span>
        </div>

        {/* Stepper tab bar */}
        <div className="card overflow-x-auto !transform-none">
          <div className="flex items-start min-w-max px-1 py-1">
            {STEPS.map((step, i) => {
              const locked = i > reachedIdx
              const isDone = i < reachedIdx
              const isCurrent = i === reachedIdx
              const isTabRejected = isRejected && step.key === "final_result"
              const isLast = i === STEPS.length - 1

              return (
                <div key={step.key} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && setActiveTab(i)}
                    className="flex flex-col items-center gap-2 group shrink-0 px-1"
                  >
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ring-2 shrink-0 transition-colors leading-none
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
                      {step.label}
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
            {STEPS[activeTab].label}
          </h2>
          <div className="pt-3">
            <TabContent stepKey={STEPS[activeTab].key} data={data} />
          </div>
        </div>

      </div>
    </div>
  )
}
