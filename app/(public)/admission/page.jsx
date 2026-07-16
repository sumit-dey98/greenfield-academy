'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { getAdmissionStatus, getPublicClasses, submitApplication, verifyApplicationAccess } from "@/lib/api/public"
import { ApiError } from "@/lib/api/client"
import toast from "react-hot-toast"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import FileUpload from "@/components/ui/FileUpload"
import CheckBox from "@/components/ui/CheckBox"
import Textarea from "@/components/ui/Textarea"
import Tooltip from "@/components/ui/Tooltip"
import Turnstile from "@/components/ui/Turnstile"
import {
  GraduationCap, Users, FileText,
  CheckCircle, AlertCircle, Lock, ArrowRight,
} from "lucide-react"

const GENDERS = ["Male", "Female", "Other"]
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const RELATIONSHIPS = ["Father", "Mother", "Guardian"]
const CONTACT_METHODS = [
  { label: "Email", value: "email" },
  { label: "Phone", value: "phone" },
]

const REQUIRED_FIELDS = [
  "studentName",
  "dob",
  "gender",
  "applyingClass",
  "contactValue",
  "guardianName",
  "address",
  "photo",
]

const FIELD_LABELS = {
  studentName: "Student Full Name",
  dob: "Date of Birth",
  gender: "Gender",
  applyingClass: "Applying for Class",
  contactValue: "Contact Email or Phone",
  guardianName: "Guardian Name",
  address: "Home Address",
  photo: "Applicant Photo",
}

// Maps the backend's snake_case field names (from a 422 `errors` array) back to this form's
// local camelCase state keys, so a server-side validation failure highlights the same input
// the client-side check would have.
const BACKEND_FIELD_MAP = {
  student_name: "studentName",
  dob: "dob",
  gender: "gender",
  applying_class: "applyingClass",
  blood_group: "bloodGroup",
  previous_school: "previousSchool",
  contact_email: "contactValue",
  contact_phone: "contactValue",
  guardian_name: "guardianName",
  guardian_relationship: "relationship",
  guardian_phone: "guardianPhone",
  guardian_email: "guardianEmail",
  guardian_occupation: "occupation",
  address: "address",
  medical_conditions: "medicalConditions",
  extracurricular: "extracurricular",
  notes: "notes",
  photo: "photo",
  captcha_token: "captcha",
}

function localAccessKey(ref) {
  return `gfa_admission_access_${ref}`
}

function formatDateForDB(ddmmyyyy) {
  if (!ddmmyyyy) return ""
  const [d, m, y] = ddmmyyyy.split("/")
  return `${y}-${m}-${d}`
}

export default function AdmissionPage() {
  const [admissionOpen, setAdmissionOpen] = useState(null)
  const [cycleName, setCycleName] = useState(null)
  const [academicYear, setAcademicYear] = useState(null)
  const [form, setForm] = useState({ contactMethod: "email" })
  const [errors, setErrors] = useState({})
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [captchaToken, setCaptchaToken] = useState(null)
  const [classOptions, setClassOptions] = useState([])

  useEffect(() => {
    getPublicClasses()
      .then(classes => setClassOptions((classes ?? []).map(c => ({ label: c.name, value: c.name }))))
      .catch(err => console.error("Failed to load classes:", err))
  }, [])

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getAdmissionStatus()
        setAdmissionOpen(data?.value ?? false)
        setCycleName(data?.cycle_name || null)
        setAcademicYear(data?.academic_year || null)
      } catch (err) {
        console.error("Failed to load admission status:", err)
        setAdmissionOpen(false)
      }
    }
    fetchStatus()
  }, [])

  const set = (key, value) => {
    setForm(f => ({ ...f, [key]: value }))
    setErrors(e => ({ ...e, [key]: null }))
  }

  const validate = () => {
    const newErrors = {}
    REQUIRED_FIELDS.forEach(key => {
      if (!form[key]?.toString().trim()) {
        newErrors[key] = `${FIELD_LABELS[key]} is required.`
      }
    })
    if (form.contactValue) {
      if (form.contactMethod === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(form.contactValue)) {
          newErrors.contactValue = "Please enter a valid email address."
        }
      } else {
        const digits = form.contactValue.replace(/\D/g, "")
        if (!/^1\d{9}$/.test(digits)) {
          newErrors.contactValue = "Enter a valid 10-digit Bangladesh mobile number."
        }
      }
    }
    if (!agreed) {
      newErrors.agreed = "You must accept the declaration to submit."
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captchaToken) {
      newErrors.captcha = "Please complete the verification challenge."
    }
    return newErrors
  }

  const cacheAccessToken = (referenceNumber, accessToken, expiresIn) => {
    if (typeof window === "undefined") return
    try {
      localStorage.setItem(localAccessKey(referenceNumber), JSON.stringify({
        accessToken,
        expiresAt: Date.now() + expiresIn * 1000,
      }))
    } catch { /* localStorage unavailable — tracking page will just re-prompt */ }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!admissionOpen) return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error("Please fix the errors before submitting.")
      const firstKey = Object.keys(validationErrors)[0]
      document.getElementById(firstKey)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setSubmitting(true)
    setResult(null)

    try {
      const fd = new FormData()
      fd.append("student_name", form.studentName ?? "")
      fd.append("dob", formatDateForDB(form.dob))
      fd.append("gender", form.gender ?? "")
      fd.append("applying_class", form.applyingClass ?? "")
      if (form.bloodGroup) fd.append("blood_group", form.bloodGroup)
      if (form.previousSchool) fd.append("previous_school", form.previousSchool)
      fd.append("contact_method", form.contactMethod)
      if (form.contactMethod === "email") {
        fd.append("contact_email", form.contactValue ?? "")
      } else {
        fd.append("contact_phone", form.contactValue ?? "")
      }
      fd.append("guardian_name", form.guardianName ?? "")
      if (form.relationship) fd.append("guardian_relationship", form.relationship)
      if (form.guardianPhone) fd.append("guardian_phone", form.guardianPhone)
      if (form.guardianEmail) fd.append("guardian_email", form.guardianEmail)
      if (form.occupation) fd.append("guardian_occupation", form.occupation)
      fd.append("address", form.address ?? "")
      if (form.medicalConditions) fd.append("medical_conditions", form.medicalConditions)
      if (form.extracurricular) fd.append("extracurricular", form.extracurricular)
      if (form.notes) fd.append("notes", form.notes)
      fd.append("captcha_token", captchaToken ?? "")
      fd.append("photo", form.photo)
      ;(form.documents ?? []).forEach(file => fd.append("documents", file))

      const data = await submitApplication(fd)
      setResult(data)

      if (data.duplicate) {
        toast(data.message || "You already have an application in progress.")
      } else {
        toast.success("Application submitted successfully!")
      }
      setForm({ contactMethod: "email" })
      setAgreed(false)
      setCaptchaToken(null)
      window.scrollTo({ top: 0, behavior: "smooth" })

      // The applicant just proved contact ownership by submitting — verify immediately
      // in the background so the tracking link works without asking them to re-enter it.
      try {
        const verify = await verifyApplicationAccess(data.reference_number, form.contactValue)
        cacheAccessToken(data.reference_number, verify.access_token, verify.expires_in)
      } catch { /* tracking page will just prompt for verification on first visit */ }
    } catch (err) {
      const message = err instanceof ApiError
        ? (err.errors?.[0]?.message || err.message)
        : "Network error. Please check your connection."
      toast.error(message)
      setResult({ error: message })

      // Map backend field-level errors back onto the matching local input and scroll to it,
      // same as a client-side validation failure would.
      if (err instanceof ApiError && err.errors?.length) {
        const fieldErrors = {}
        err.errors.forEach(({ field, message: fieldMessage }) => {
          const localKey = BACKEND_FIELD_MAP[field] || field
          fieldErrors[localKey] = fieldMessage
        })
        setErrors(prev => ({ ...prev, ...fieldErrors }))
        const firstKey = Object.keys(fieldErrors)[0]
        document.getElementById(firstKey)?.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const isDisabled = !admissionOpen || submitting

  return (
    <div className="flex-1 py-10 md:py-14 px-4 md:px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
              <GraduationCap size={13} />
              {cycleName || "Admissions"}
            </div>
            <h1 className="text-3xl font-bold text-text mb-2">
              Apply for Admission
            </h1>
            <p className="text-muted text-sm leading-relaxed max-w-xl mx-auto">
              Complete the form below to apply for admission to Greenfield Academy.
              Fields marked with * are required.
            </p>
          </div>

          {/* Admission status banner */}
          {admissionOpen === null ? (
            <div className="card h-16 bg-surface-2 animate-pulse" />
          ) : admissionOpen ? (
            <div className="flex items-start gap-3 px-5 py-4 bg-primary-light border border-success rounded-md">
              <CheckCircle size={20} strokeWidth={2.5} className="text-green-700 shrink-0 mt-1" />
              <div>
                <p className="text-lg font-semibold text-green-800">
                  Admissions are open!
                </p>
                <p className="text-sm text-green-700 mt-0.5">
                  {academicYear
                    ? `Applications are being accepted for ${academicYear} academic year.`
                    : cycleName
                      ? `Applications are being accepted for ${cycleName}.`
                      : "Applications are currently being accepted."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 px-5 py-4 bg-red-100 border border-border rounded-md">
              <Lock size={20} strokeWidth={2.5} className="text-red-600 shrink-0 mt-1" />
              <div>
                <p className="text-lg font-semibold text-red-500">
                  Admissions are currently closed
                </p>
                <p className="text-sm text-red-400 mt-0.5">
                  We are not accepting applications at this time. Please check
                  back later or contact us for more information.
                </p>
              </div>
            </div>
          )}

          {/* API error */}
          {result?.error && (
            <div className="flex items-center gap-3 px-4 py-3 bg-surface border border-danger rounded-md">
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-danger leading-none">{result.error}</p>
            </div>
          )}

          {/* Success */}
          {result?.reference_number ? (
            <div className="card flex flex-col items-center text-center gap-5 py-12">
              <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center ring-1  ring-surface-2">
                <CheckCircle size={30} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-text text-xl mb-2">
                  {result.duplicate ? "Application Already In Progress" : "Application Submitted!"}
                </h3>
                <p className="text-muted text-sm leading-relaxed max-w-md">
                  {result.message}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-surface-2 px-5 py-3 rounded-sm">
                <span className="text-xs text-muted">Reference number:</span>
                <span className="text-sm font-bold text-primary font-mono">
                  {result.reference_number}
                </span>
              </div>
              <Link
                href={`/admission/${result.reference_number}`}
                className="btn btn-outline gap-2"
              >
                View your admission progress <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-faint max-w-sm">
                You can view your admission progress {" "}
                <Link href={`/admission/${result.reference_number}`} className="font-mono text-primary hover:text-text underline">
                  here
                </Link>{" "}
                anytime — save this link, you&apos;ll need to verify with your contact email/phone
                each time you visit.
              </p>
            </div>
          ) : (

            /* Form */
            <form
              onSubmit={handleSubmit}
              noValidate
              className={`flex flex-col gap-6 transition-opacity duration-300 ${!admissionOpen ? "opacity-50 pointer-events-none select-none" : ""
                }`}
            >

              {/* Student Information */}
              <div className="card flex flex-col gap-5">
                <h2 className="font-semibold text-text flex items-center gap-2 text-base pb-3 border-b border-border">
                  <GraduationCap size={16} className="text-primary" />
                  Student Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div id="studentName" className="sm:col-span-2">
                    <Input
                      label="Full Name"
                      required
                      placeholder="Student's full name"
                      value={form.studentName ?? ""}
                      onChange={e => set("studentName", e.target.value)}
                      error={errors.studentName}
                      disabled={isDisabled}
                    />
                  </div>

                  <div id="dob">
                    <DatePicker
                      label="Date of Birth"
                      required
                      value={form.dob ?? ""}
                      onChange={val => set("dob", val)}
                      error={errors.dob}
                      maxDate={new Date()}
                      disabled={isDisabled}
                      menuPlacement="bottom"
                    />
                  </div>

                  <div id="gender">
                    <Select
                      label="Gender"
                      required
                      options={GENDERS}
                      value={form.gender ?? ""}
                      onChange={val => set("gender", val)}
                      error={errors.gender}
                      placeholder="Select gender"
                      disabled={isDisabled}
                      searchable={false}
                      menuPlacement="bottom"
                    />
                  </div>

                  <div id="applyingClass">
                    <Select
                      label="Applying for Class"
                      required
                      options={classOptions}
                      value={form.applyingClass ?? ""}
                      onChange={val => set("applyingClass", val)}
                      error={errors.applyingClass}
                      placeholder="Select class"
                      disabled={isDisabled}
                      searchable={false}
                      menuPlacement="bottom"

                    />
                  </div>

                  <div>
                    <Select
                      label="Blood Group"
                      options={BLOOD_GROUPS}
                      value={form.bloodGroup ?? ""}
                      onChange={val => set("bloodGroup", val)}
                      placeholder="Select blood group"
                      disabled={isDisabled}
                      searchable={false}
                      menuPlacement="bottom"

                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Previous School"
                      placeholder="Name of previous school"
                      value={form.previousSchool ?? ""}
                      onChange={e => set("previousSchool", e.target.value)}
                      disabled={isDisabled}
                    />
                  </div>

                  <div id="contactValue" className="sm:col-span-2 flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="w-full sm:w-40">
                      <Select
                        label="Primary Contact"
                        options={CONTACT_METHODS}
                        value={form.contactMethod ?? "email"}
                        onChange={val => set("contactMethod", val)}
                        disabled={isDisabled}
                        searchable={false}
                        clearable={false}
                        menuPlacement="bottom"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-text flex items-center gap-1.5">
                        {form.contactMethod === "phone" ? "Contact Phone" : "Contact Email"}
                        <span className="text-danger">*</span>
                        <Tooltip text="Used to track your application status. May be used as a login credential in a future update." />
                      </label>
                      {form.contactMethod === "phone" ? (
                        <div className="flex gap-2 items-start">
                          <span className="input w-20 flex items-center justify-center text-muted select-none shrink-0">
                            +880
                          </span>
                          <div className="flex-1">
                            <Input
                              required
                              type="tel"
                              placeholder="1XXXXXXXXX"
                              value={form.contactValue ?? ""}
                              onChange={e => set("contactValue", e.target.value.replace(/\D/g, ""))}
                              error={errors.contactValue}
                              disabled={isDisabled}
                            />
                          </div>
                        </div>
                      ) : (
                        <Input
                          required
                          type="email"
                          placeholder="you@email.com"
                          value={form.contactValue ?? ""}
                          onChange={e => set("contactValue", e.target.value)}
                          error={errors.contactValue}
                          disabled={isDisabled}
                        />
                      )}
                    </div>
                  </div>

                </div>
              </div>

              {/* Guardian Information */}
              <div className="card flex flex-col gap-5">
                <h2 className="font-semibold text-text flex items-center gap-2 text-base pb-3 border-b border-border">
                  <Users size={16} className="text-primary" />
                  Guardian Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <div id="guardianName">
                    <Input
                      label="Guardian Name"
                      required
                      placeholder="Full name of parent / guardian"
                      value={form.guardianName ?? ""}
                      onChange={e => set("guardianName", e.target.value)}
                      error={errors.guardianName}
                      disabled={isDisabled}
                    />
                  </div>

                  <div>
                    <Select
                      label="Relationship"
                      options={RELATIONSHIPS}
                      value={form.relationship ?? ""}
                      onChange={val => set("relationship", val)}
                      placeholder="Select relationship"
                      disabled={isDisabled}
                      searchable={false}
                      menuPlacement="bottom"

                    />
                  </div>

                  <div>
                    <Input
                      label="Guardian Phone"
                      type="tel"
                      placeholder="+880-XXXX-XXXXXX"
                      value={form.guardianPhone ?? ""}
                      onChange={e => set("guardianPhone", e.target.value)}
                      disabled={isDisabled}
                    />
                  </div>

                  <div>
                    <Input
                      label="Guardian Email"
                      type="email"
                      placeholder="guardian@email.com"
                      value={form.guardianEmail ?? ""}
                      onChange={e => set("guardianEmail", e.target.value)}
                      disabled={isDisabled}
                    />
                  </div>

                  <div>
                    <Input
                      label="Occupation"
                      placeholder="Guardian's occupation"
                      value={form.occupation ?? ""}
                      onChange={e => set("occupation", e.target.value)}
                      disabled={isDisabled}
                    />
                  </div>

                  <div id="address" className="sm:col-span-2">
                    <Input
                      label="Home Address"
                      required
                      placeholder="Full residential address"
                      value={form.address ?? ""}
                      onChange={e => set("address", e.target.value)}
                      error={errors.address}
                      disabled={isDisabled}
                    />
                  </div>

                </div>
              </div>

              {/* Additional Information */}
              <div className="card flex flex-col gap-5">
                <h2 className="font-semibold text-text flex items-center gap-2 text-base pb-3 border-b border-border">
                  <FileText size={16} className="text-primary" />
                  Additional Information
                </h2>
                <div className="flex flex-col gap-4">
                  <Input
                    label="Medical Conditions"
                    placeholder="Any known medical conditions (or 'None')"
                    value={form.medicalConditions ?? ""}
                    onChange={e => set("medicalConditions", e.target.value)}
                    disabled={isDisabled}
                  />
                  <Input
                    label="Extracurricular Interests"
                    placeholder="Sports, music, art, debate, etc."
                    value={form.extracurricular ?? ""}
                    onChange={e => set("extracurricular", e.target.value)}
                    disabled={isDisabled}
                  />
                  <Textarea
                    label="Additional Notes"
                    placeholder="Anything else you'd like us to know..."
                    rows={3}
                    value={form.notes ?? ""}
                    onChange={e => set("notes", e.target.value)}
                    disabled={isDisabled}
                  />
                </div>
              </div>

              {/* Photo */}
              <div id="photo" className="card flex flex-col gap-4">
                <h2 className="font-semibold text-text flex items-center gap-2 text-base pb-3 border-b border-border">
                  <FileText size={16} className="text-primary" />
                  Applicant Photo
                </h2>
                <FileUpload
                  label="Recent Passport-Size Photo"
                  required
                  accept=".jpg,.jpeg,.png"
                  onChange={file => set("photo", file)}
                  disabled={isDisabled}
                  error={errors.photo}
                />
              </div>

              {/* Document Upload */}
              <div className="card flex flex-col gap-4">
                <h2 className="font-semibold text-text flex items-center gap-2 text-base pb-3 border-b border-border">
                  <FileText size={16} className="text-primary" />
                  Document Upload
                </h2>
                <FileUpload
                  label="Birth Certificate / Previous Report Card"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  maxFiles={4}
                  onChange={files => set("documents", files)}
                  disabled={isDisabled}
                />
              </div>

              {/* Declaration */}
              <div className="card bg-surface-2 flex flex-col gap-4">
                <p className="text-xs text-muted leading-relaxed">
                  By submitting this application, I confirm that all information
                  provided is accurate and complete. I understand that any false
                  information may result in cancellation of the application.
                </p>
                <div id="agreed">
                  <CheckBox
                    label="I have read and agree to the above declaration."
                    checked={agreed}
                    onChange={e => {
                      setAgreed(e.target.checked)
                      setErrors(err => ({ ...err, agreed: null }))
                    }}
                    error={errors.agreed}
                    disabled={isDisabled}
                  />
                </div>
                <div id="captcha">
                  <Turnstile
                    onVerify={token => { setCaptchaToken(token); setErrors(err => ({ ...err, captcha: null })) }}
                    onExpire={() => setCaptchaToken(null)}
                  />
                  {errors.captcha && <p className="text-xs text-danger mt-1">{errors.captcha}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isDisabled}
                className="btn btn-primary w-full justify-center h-12 text-base disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {submitting ? (
                  <span className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : !admissionOpen ? (
                  <><Lock size={22} /> Admissions Closed</>
                ) : (
                  <><GraduationCap size={22} /> Submit Application</>
                )}
              </button>

            </form>
          )}
      </div>
    </div>
  )
}
