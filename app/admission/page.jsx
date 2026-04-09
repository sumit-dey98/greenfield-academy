'use client'

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import DatePicker from "@/components/ui/DatePicker"
import FileUpload from "@/components/ui/FileUpload"
import Checkbox from "@/components/ui/Checkbox"
import Textarea from "@/components/ui/Textarea"
import {
  GraduationCap, Users, FileText,
  CheckCircle, AlertCircle, Lock,
} from "lucide-react"

const CLASSES = [
  "Class 9 - Section A",
  "Class 9 - Section B",
  "Class 10 - Section A",
  "Class 10 - Section B",
  "Class 11 - Science",
  "Class 11 - Commerce",
]

const GENDERS = ["Male", "Female", "Other"]
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
const RELATIONSHIPS = ["Father", "Mother", "Guardian"]

const REQUIRED_FIELDS = [
  "studentName",
  "dob",
  "gender",
  "applyingClass",
  "guardianName",
  "guardianPhone",
  "guardianEmail",
  "address",
]

const FIELD_LABELS = {
  studentName: "Student Full Name",
  dob: "Date of Birth",
  gender: "Gender",
  applyingClass: "Applying for Class",
  guardianName: "Guardian Name",
  guardianPhone: "Guardian Phone",
  guardianEmail: "Guardian Email",
  address: "Home Address",
}

export default function AdmissionPage() {
  const [admissionOpen, setAdmissionOpen] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from("admission_open")
        .select("value")
        .eq("id", "admission_status")
        .single()
      setAdmissionOpen(data?.value ?? false)
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (form.guardianEmail && !emailRegex.test(form.guardianEmail)) {
      newErrors.guardianEmail = "Please enter a valid email address."
    }
    const phoneRegex = /^[+\d\s\-()]{7,20}$/
    if (form.guardianPhone && !phoneRegex.test(form.guardianPhone)) {
      newErrors.guardianPhone = "Please enter a valid phone number."
    }
    if (!agreed) {
      newErrors.agreed = "You must accept the declaration to submit."
    }
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!admissionOpen) return

    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      const firstKey = Object.keys(validationErrors)[0]
      document.getElementById(firstKey)?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }

    setSubmitting(true)
    setResult(null)

    try {
      const res = await fetch("/api/admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setResult(data)
      if (data.success) {
        setForm({})
        setAgreed(false)
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } catch {
      setResult({ success: false, error: "Network error. Please check your connection." })
    } finally {
      setSubmitting(false)
    }
  }

  const isDisabled = !admissionOpen || submitting

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />

      <main className="flex-1 py-10 md:py-14 px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-8">

          {/* Header */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
              <GraduationCap size={13} />
              Admissions 2026
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
            <div className="flex items-start gap-3 px-5 py-4 bg-primary-light border border-success rounded-lg">
              <CheckCircle size={20} strokeWidth={2.5} className="text-green-700 shrink-0 mt-1" />
              <div>
                <p className="text-lg font-semibold text-green-800">
                  Admissions are open!
                </p>
                <p className="text-sm text-green-700 mt-0.5">
                  Applications are being accepted for the 2025–26 academic year.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 px-5 py-4 bg-red-100 border border-border rounded-lg">
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
          {result?.success === false && (
            <div className="flex items-start gap-3 px-4 py-3 bg-surface border border-danger rounded-lg">
              <AlertCircle size={16} className="text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{result.error}</p>
            </div>
          )}

          {/* Success */}
          {result?.success ? (
            <div className="card flex flex-col items-center text-center gap-5 py-12">
              <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center ring-1  ring-surface-2">
                <CheckCircle size={30} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-text text-xl mb-2">
                  Application Submitted!
                </h3>
                <p className="text-muted text-sm leading-relaxed max-w-md">
                  {result.message}
                </p>
              </div>
              {result.reference && (
                <div className="flex items-center gap-2 bg-surface-2 px-5 py-3 rounded-lg">
                  <span className="text-xs text-muted">Reference number:</span>
                  <span className="text-sm font-bold text-primary font-mono">
                    {result.reference}
                  </span>
                </div>
              )}
              <button
                onClick={() => setResult(null)}
                className="btn btn-outline mt-2"
              >
                Submit another application
              </button>
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
                <h2 className="font-semibold text-text flex items-center gap-2 pb-3 border-b border-border">
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
                    />
                  </div>

                  <div id="applyingClass">
                    <Select
                      label="Applying for Class"
                      required
                      options={CLASSES}
                      value={form.applyingClass ?? ""}
                      onChange={val => set("applyingClass", val)}
                      error={errors.applyingClass}
                      placeholder="Select class"
                      disabled={isDisabled}
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

                </div>
              </div>

              {/* Guardian Information */}
              <div className="card flex flex-col gap-5">
                <h2 className="font-semibold text-text flex items-center gap-2 pb-3 border-b border-border">
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
                    />
                  </div>

                  <div id="guardianPhone">
                    <Input
                      label="Phone Number"
                      required
                      type="tel"
                      placeholder="+880-XXXX-XXXXXX"
                      value={form.guardianPhone ?? ""}
                      onChange={e => set("guardianPhone", e.target.value)}
                      error={errors.guardianPhone}
                      disabled={isDisabled}
                    />
                  </div>

                  <div id="guardianEmail">
                    <Input
                      label="Email Address"
                      required
                      type="email"
                      placeholder="guardian@email.com"
                      value={form.guardianEmail ?? ""}
                      onChange={e => set("guardianEmail", e.target.value)}
                      error={errors.guardianEmail}
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
                <h2 className="font-semibold text-text flex items-center gap-2 pb-3 border-b border-border">
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

              {/* Document Upload */}
              <div className="card flex flex-col gap-4">
                <h2 className="font-semibold text-text flex items-center gap-2 pb-3 border-b border-border">
                  <FileText size={16} className="text-primary" />
                  Document Upload
                </h2>
                <FileUpload
                  label="Birth Certificate / Previous Report Card"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  maxFiles={3}
                  maxSize={5 * 1024 * 1024}
                  hint="PDF, JPG, PNG up to 5MB each · Max 3 files"
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
                  This is a demonstration form — no data will be stored or processed.
                </p>
                <div id="agreed">
                  <Checkbox
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
                  <><Lock size={15} /> Admissions Closed</>
                ) : (
                  <><GraduationCap size={15} /> Submit Application</>
                )}
              </button>

            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}