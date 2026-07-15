import { Check, X, Circle } from "lucide-react"

// steps: [{ label, status: 'done' | 'current' | 'pending' | 'rejected' }]
export default function StatusStepper({ steps }) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const iconWrap =
          step.status === "rejected"
            ? "bg-danger text-white ring-danger"
            : step.status === "done"
              ? "bg-primary text-white ring-primary"
              : step.status === "current"
                ? "bg-primary-light text-primary ring-primary"
                : "bg-surface-2 text-faint ring-border"

        return (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ring-2 shrink-0 ${iconWrap}`}>
                {step.status === "rejected" ? (
                  <X size={15} strokeWidth={2.5} />
                ) : step.status === "done" ? (
                  <Check size={15} strokeWidth={2.5} />
                ) : (
                  <Circle size={8} fill="currentColor" />
                )}
              </div>
              {!isLast && (
                <div className={`w-0.5 flex-1 min-h-[1.5rem] ${step.status === "done" ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <div className="pb-6">
              <p className={`text-sm font-semibold ${step.status === "pending" ? "text-faint" : "text-text"}`}>
                {step.label}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
