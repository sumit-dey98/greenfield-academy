import { getAdmissionStatus } from "@/lib/api/public"
import AdmissionBannerTicker from "./AdmissionBannerTicker"

export default async function AdmissionBanner() {
  let status
  try {
    status = await getAdmissionStatus()
  } catch (err) {
    console.error("Failed to load admission status:", err)
    return null
  }
  if (!status?.value) return null

  return <AdmissionBannerTicker academicYear={status.academic_year} />
}
