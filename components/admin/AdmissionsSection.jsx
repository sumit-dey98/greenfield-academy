'use client'

import { useState } from "react"
import AdmissionsManager from "@/components/admin/AdmissionsManager"
import MeritListManager from "@/components/admin/MeritListManager"
import AdmissionCycleManager from "@/components/admin/AdmissionCycleManager"

const TABS = [
  { key: "applications", label: "Applications" },
  { key: "merit-list", label: "Merit List" },
  { key: "cycles", label: "Cycles" },
]

export default function AdmissionsSection() {
  const [tab, setTab] = useState("applications")

  return (
    <div className="flex flex-col gap-6">

      <div className="flex gap-2 flex-wrap border-b border-border pb-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-4 -mb-px transition-colors duration-150 cursor-pointer
              ${tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-text"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "applications" && <AdmissionsManager />}
      {tab === "merit-list" && <MeritListManager />}
      {tab === "cycles" && <AdmissionCycleManager />}

    </div>
  )
}
