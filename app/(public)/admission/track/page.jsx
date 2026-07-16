'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { verifyApplicationAccess } from "@/lib/api/public"
import { ApiError } from "@/lib/api/client"
import toast from "react-hot-toast"
import Input from "@/components/ui/Input"
import { ShieldCheck, Search } from "lucide-react"

function localAccessKey(ref) {
  return `gfa_admission_access_${ref}`
}

function cacheToken(ref, accessToken, expiresIn) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(localAccessKey(ref), JSON.stringify({
      accessToken, expiresAt: Date.now() + expiresIn * 1000,
    }))
  } catch { /* localStorage unavailable — the tracking page will just re-prompt */ }
}

export default function AdmissionTrackerEntryPage() {
  const router = useRouter()
  const [referenceNumber, setReferenceNumber] = useState("")
  const [contactValue, setContactValue] = useState("")
  const [errors, setErrors] = useState({})
  const [verifying, setVerifying] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ref = referenceNumber.trim()
    const contact = contactValue.trim()
    const newErrors = {}
    if (!ref) newErrors.referenceNumber = "Reference number is required."
    if (!contact) newErrors.contactValue = "Contact email or phone is required."
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setVerifying(true)
    setErrors({})
    try {
      const res = await verifyApplicationAccess(ref, contact)
      cacheToken(ref, res.access_token, res.expires_in)
      router.push(`/admission/${ref}`)
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : "Verification failed. Check your reference number and contact details."
      setErrors({ form: message })
      toast.error(message)
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="flex-1 py-14 px-4 md:px-6">
      <div className="max-w-md mx-auto flex flex-col gap-6">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary-light text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ring-1 ring-primary">
            <ShieldCheck size={18} />
            Track Application
          </div>
          <h1 className="text-2xl font-bold text-text mb-2">Check Your Admission Status</h1>
          <p className="text-muted text-sm leading-relaxed">
            Enter the reference number you received when you applied, along with the
            contact email or phone you used, to view your application status.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card flex flex-col gap-4">
          <Input
            label="Reference Number"
            required
            placeholder="GFA-XXXXXXXXXXXX"
            value={referenceNumber}
            onChange={e => setReferenceNumber(e.target.value)}
            error={errors.referenceNumber}
            disabled={verifying}
          />
          <Input
            label="Contact Email or Phone"
            required
            placeholder="Whatever you used when applying"
            value={contactValue}
            onChange={e => setContactValue(e.target.value)}
            error={errors.contactValue}
            disabled={verifying}
          />
          {errors.form && (
            <p className="text-xs text-danger">{errors.form}</p>
          )}
          <button type="submit" disabled={verifying} className="btn btn-primary w-full justify-center h-11">
            {verifying ? (
              <span className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <><Search size={16} /> Track Application</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
