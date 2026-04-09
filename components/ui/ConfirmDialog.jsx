'use client'

import Modal from "./Modal"
import { AlertTriangle } from "lucide-react"

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-md">
      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <p className="text-sm text-muted leading-relaxed mt-1">
            {message ?? "This action cannot be undone."}
          </p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="btn btn-danger disabled:opacity-60"
          >
            {loading
              ? <span className="w-4 h-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : confirmLabel
            }
          </button>
        </div>
      </div>
    </Modal>
  )
}