'use client'

import { useEffect, useState, useRef } from "react"
import {
  listSchedule, createSchedule, updateSchedule, deleteSchedule,
  listPeriods, deletePeriod, replacePeriods,
} from "@/lib/api/schedule"
import { listClasses } from "@/lib/api/classes"
import { listSubjects } from "@/lib/api/subjects"
import { listTeachers } from "@/lib/api/adminPeople"
import { useAuth } from "@/context/AuthContext"
import {
  Clock, Plus, Trash2, Save,
  AlertTriangle, ChevronDown, Pencil, Check, X,
} from "lucide-react"
import toast from "react-hot-toast"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import CheckBox from "@/components/ui/CheckBox"
import TimePicker from "@/components/ui/TimePicker"

function errMsg(err, fallback) {
  return err?.errors?.[0]?.message || err?.message || fallback
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]

const COLORS = {
  primary: "#059669", info: "#0891b2", warning: "#f59e0b",
  danger: "#ef4444", purple: "#9333ea",
}

const DAY_COLORS = [
  COLORS.primary, COLORS.info, COLORS.purple, COLORS.warning, COLORS.danger,
]

export default function ScheduleManager() {
  const { attemptWrite } = useAuth()
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [periods, setPeriods] = useState([])
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState("")
  const [activeCell, setActiveCell] = useState(null)
  const [cellForm, setCellForm] = useState({ subject_id: "", teacher_id: "", room: "" })
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0, above: false })
  const [conflict, setConflict] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

  // Periods
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [periodForm, setPeriodForm] = useState({})
  const [pendingEdits, setPendingEdits] = useState({})   // periodId -> { start_time, end_time, label, is_break }
  const [pendingNewPeriods, setPendingNewPeriods] = useState([])   // [{ tempId, start_time, end_time, label, is_break }]
  const [savingAllPeriods, setSavingAllPeriods] = useState(false)
  const [showAddPeriod, setShowAddPeriod] = useState(false)
  const [newPeriod, setNewPeriod] = useState({ start_time: "", end_time: "", is_break: false, label: "" })

  const hasPendingPeriodChanges = Object.keys(pendingEdits).length > 0 || pendingNewPeriods.length > 0

  // Merge fetched periods with any pending local edits, for display.
  const displayPeriods = periods.map(p => pendingEdits[p.id] ? { ...p, ...pendingEdits[p.id] } : p)

  const popoverRef = useRef(null)

  // Reference data (classes/subjects/teachers/periods) is small and fixed — load once.
  const fetchMeta = async () => {
    try {
      const [classesData, subjectsData, teachersPage, periodsData] = await Promise.all([
        listClasses(),
        listSubjects(),
        listTeachers({ limit: 200 }),
        listPeriods(),
      ])
      const cls = classesData ?? []
      setClasses(cls)
      setSubjects(subjectsData ?? [])
      setTeachers(teachersPage?.items ?? [])
      setPeriods(periodsData ?? [])
      setSelectedClass(prev => prev || (cls[0]?.id ?? ""))
    } catch (err) {
      console.error("Failed to load schedule metadata:", err)
    } finally {
      setLoading(false)
    }
  }

  // The timetable itself is fetched per selected class — one class is at most
  // days × periods entries, well within a single page.
  const fetchSchedule = async (classId) => {
    if (!classId) { setSchedule([]); return }
    try {
      const schedulePage = await listSchedule({ class_id: classId, limit: 200 })
      setSchedule(schedulePage?.items ?? [])
    } catch (err) {
      console.error("Failed to load schedule:", err)
    }
  }

  // Admin /schedule returns ids only (no joined names) — resolve from the loaded lists.
  const getSubjectName = (id) => subjects.find(s => s.id === id)?.name
  const getTeacherName = (id) => teachers.find(t => t.id === id)?.name

  useEffect(() => { fetchMeta() }, [])
  useEffect(() => { fetchSchedule(selectedClass) }, [selectedClass])

  useEffect(() => {
    const handler = (e) => {
      if (
        popoverRef.current?.contains(e.target) ||
        e.target.closest("[data-select-dropdown]") ||
        e.target.closest("[data-datepicker-calendar]")
      ) return
      setActiveCell(null)
      setConflict(null)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (!activeCell) return
    const handler = (e) => {
      if (
        popoverRef.current?.contains(e.target) ||
        e.target.closest?.("[data-select-dropdown]") ||
        e.target.closest?.("[data-datepicker-calendar]")
      ) return
      setActiveCell(null)
      setConflict(null)
    }
    window.addEventListener("scroll", handler, true)
    return () => window.removeEventListener("scroll", handler, true)
  }, [activeCell])

  const getSlot = (periodId, day) =>
    schedule.find(s =>
      s.class_id === selectedClass &&
      s.period_id === periodId &&
      s.day === day
    )

  // Only this class's schedule is loaded, so we can't pre-detect cross-class teacher clashes here
  const checkConflict = () => null

  const openCell = (periodId, day, anchorEl) => {
    if (!attemptWrite("academic")) return
    const existing = getSlot(periodId, day)
    setCellForm({
      subject_id: existing?.subject_id ?? "",
      teacher_id: existing?.teacher_id ?? "",
      room: existing?.room ?? "",
    })
    setConflict(null)

    const rect = anchorEl.getBoundingClientRect()
    const popoverHeight = 280
    const spaceBelow = window.innerHeight - rect.bottom
    const above = spaceBelow < popoverHeight + 12

    setPopoverPos({
      top: above ? rect.top - popoverHeight + 20 : rect.bottom - 6,
      left: Math.min(rect.left, window.innerWidth - 260),
      width: Math.max(rect.width, 240),
      above,
    })
    setActiveCell({ periodId, day })
  }

  const handleCellFormChange = (key, val) => {
    const updated = { ...cellForm, [key]: val }
    setCellForm(updated)
    if (key === "teacher_id" && activeCell) {
      const warn = checkConflict(activeCell.periodId, activeCell.day, val)
      setConflict(warn)
    }
  }

  const handleSaveCell = async () => {
    if (!activeCell || !cellForm.subject_id || !cellForm.teacher_id) return
    setSaving(true)

    const existing = getSlot(activeCell.periodId, activeCell.day)
    const period = periods.find(p => p.id === activeCell.periodId)

    const payload = {
      class_id: selectedClass,
      subject_id: cellForm.subject_id,
      teacher_id: cellForm.teacher_id,
      day: activeCell.day,
      period_id: activeCell.periodId,
      start_time: period?.start_time ?? "",
      end_time: period?.end_time ?? "",
      room: cellForm.room.trim(),
    }

    try {
      if (existing) {
        await updateSchedule(existing.id, payload)
      } else {
        await createSchedule(payload)
      }
      setActiveCell(null)
      setConflict(null)
      toast.success(existing ? "Slot updated." : "Slot created.")
      fetchSchedule(selectedClass)
    } catch (err) {
      console.error("Failed to save slot:", err)
      const msg = errMsg(err, "Could not save this slot.")
      setConflict(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCell = async (periodId, day) => {
    if (!attemptWrite("academic")) return
    const existing = getSlot(periodId, day)
    if (!existing) return
    setDeleting(`${periodId}-${day}`)
    try {
      await deleteSchedule(existing.id)
      toast.success("Slot removed.")
    } catch (err) {
      console.error("Failed to delete slot:", err)
      toast.error(errMsg(err, "Could not remove this slot."))
    } finally {
      setDeleting(null)
      setActiveCell(null)
      fetchSchedule(selectedClass)
    }
  }

  const openEditPeriod = (period) => {
    if (!attemptWrite("academic")) return
    setEditingPeriod(period.id)
    setPeriodForm({
      start_time: period.start_time,
      end_time: period.end_time,
      label: period.label ?? "",
      is_break: period.is_break,
    })
  }

  // Stages the edit locally instead of saving immediately 
  const handleSavePeriod = (periodId) => {
    setPendingEdits(prev => ({
      ...prev,
      [periodId]: {
        start_time: periodForm.start_time,
        end_time: periodForm.end_time,
        label: periodForm.label || null,
        is_break: periodForm.is_break,
      },
    }))
    setEditingPeriod(null)
  }

  const handleDeletePeriod = async (periodId) => {
    if (!attemptWrite("academic")) return
    try {
      const refPage = await listSchedule({ /* all classes */ limit: 200 })
      const referencing = (refPage?.items ?? []).filter(s => s.period_id === periodId)
      for (const slot of referencing) {
        await deleteSchedule(slot.id)
      }
      await deletePeriod(periodId)
      setPendingEdits(prev => {
        const next = { ...prev }
        delete next[periodId]
        return next
      })
      toast.success("Period removed.")
      fetchMeta()
      fetchSchedule(selectedClass)
    } catch (err) {
      console.error("Failed to delete period:", err)
      toast.error(errMsg(err, "Could not remove this period."))
    }
  }

  // Stages a new period locally instead of creating it immediately — sent on "Save Periods".
  const handleAddPeriod = () => {
    if (!attemptWrite("academic")) return
    if (!newPeriod.start_time || !newPeriod.end_time) return
    setPendingNewPeriods(prev => [...prev, {
      tempId: `new-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      start_time: newPeriod.start_time,
      end_time: newPeriod.end_time,
      is_break: newPeriod.is_break,
      label: newPeriod.label || null,
    }])
    setShowAddPeriod(false)
    setNewPeriod({ start_time: "", end_time: "", is_break: false, label: "" })
  }

  const handleRemovePendingNewPeriod = (tempId) => {
    setPendingNewPeriods(prev => prev.filter(p => p.tempId !== tempId))
  }

  const handleDiscardPendingEdit = (periodId) => {
    setPendingEdits(prev => {
      const next = { ...prev }
      delete next[periodId]
      return next
    })
  }

  // Sends the whole period list 
    if (!attemptWrite("academic")) return
    setSavingAllPeriods(true)

    const fullList = [
      ...displayPeriods.map(p => ({
        id: p.id,
        sort_order: p.sort_order,
        start_time: p.start_time,
        end_time: p.end_time,
        is_break: p.is_break,
        label: p.label,
      })),
      ...pendingNewPeriods.map((p, i) => ({
        sort_order: Math.max(...periods.map(x => x.sort_order), 0) + 1 + i,
        start_time: p.start_time,
        end_time: p.end_time,
        is_break: p.is_break,
        label: p.label,
      })),
    ]

    try {
      await replacePeriods(fullList)
      setPendingEdits({})
      setPendingNewPeriods([])
      toast.success("Periods saved.")
    } catch (err) {
      console.error("Failed to save periods:", err)
      toast.error(errMsg(err, "Could not save period changes."))
    } finally {
      setSavingAllPeriods(false)
      fetchMeta()
      fetchSchedule(selectedClass)
    }
  }

  const classOptions = classes.map(c => ({ label: c.name, value: c.id }))
  const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }))
  const teacherOptions = teachers.map(t => ({ label: `${t.name} (${t.subject_name ?? "—"})`, value: t.id }))

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">

      <div>
        <h1 className="page-title">Schedule</h1>
        <p className="page-subtitle">View and manage class timetables.</p>
      </div>

      {/* Period editor */}
      <div className="card flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-text flex items-center gap-2 text-base">
            <Clock size={16} className="text-primary" />
            Periods
          </h2>
          <div className="flex items-center gap-2">
            {hasPendingPeriodChanges && (
              <span className="text-xs text-warning font-medium">Unsaved changes</span>
            )}
            <button
              onClick={handleSaveAllPeriods}
              disabled={!hasPendingPeriodChanges || savingAllPeriods}
              className="btn btn-primary text-sm w-fit disabled:opacity-60"
            >
              {savingAllPeriods
                ? <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Save size={14} /> Save Periods</>
              }
            </button>
            <button
              onClick={() => setShowAddPeriod(o => !o)}
              className="btn btn-outline text-sm w-fit"
            >
              <Plus size={14} /> Add Period
            </button>
          </div>
        </div>

        {showAddPeriod && (
          <div className="flex flex-col xl:flex-row xl:justify-between gap-3 flex-1 min-w-0 p-3 bg-surface-2 rounded-md border border-border">
            {/* Time pickers */}
            <div className="flex items-end gap-2 flex-wrap md:flex-nowrap">
              <TimePicker className="min-w-44" label="Start" value={newPeriod.start_time} onChange={v => setNewPeriod(f => ({ ...f, start_time: v }))} />
              <TimePicker className="min-w-44" label="End" value={newPeriod.end_time} onChange={v => setNewPeriod(f => ({ ...f, end_time: v }))} />
            </div>

            {/* Label + break */}
            <div className="flex items-center gap-3 flex-wrap">
              <Input
                className=" w-full"
                type="text"
                value={newPeriod.label}
                onChange={e => setNewPeriod(f => ({ ...f, label: e.target.value }))}
                placeholder="e.g. Break, Assembly"
              />
              <CheckBox
                label="Is break"
                checked={newPeriod.is_break}
                onChange={e => setNewPeriod(f => ({ ...f, is_break: e.target.checked }))}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 h-10 xl:self-center">
              <button onClick={handleAddPeriod} className="btn btn-primary text-xs">
                <Plus size={13} /> Add
              </button>
              <button onClick={() => setShowAddPeriod(false)} className="btn btn-outline text-xs">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {displayPeriods.map(period => (
            <div
              key={period.id}
              className={`flex items-start gap-3 px-4 py-2.5 rounded-sm border transition-colors ${period.is_break ? "bg-border border-border" : "bg-bg border-border"} ${pendingEdits[period.id] ? "!border-warning" : ""}`}
            >
              {editingPeriod === period.id ? (
                <div className="flex flex-col xl:flex-row xl:justify-between gap-3 flex-1 min-w-0 ">
                  {/* Time pickers */}
                  <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                    <TimePicker className="min-w-44" value={periodForm.start_time} onChange={v => setPeriodForm(f => ({ ...f, start_time: v }))} />
                    <span className="text-faint text-sm">to</span>
                    <TimePicker className="min-w-44" value={periodForm.end_time} onChange={v => setPeriodForm(f => ({ ...f, end_time: v }))} />
                  </div>

                  {/* Label + break */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <Input
                      className="w-fit"
                      type="text"
                      value={periodForm.label}
                      onChange={e => setPeriodForm(f => ({ ...f, label: e.target.value }))}
                      placeholder="Label (optional)"
                    />
                    <CheckBox
                      label="Break"
                      checked={periodForm.is_break}
                      onChange={e => setPeriodForm(f => ({ ...f, is_break: e.target.checked }))}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 h-10 xl:self-center ">
                    <button onClick={() => handleSavePeriod(period.id)} className="btn btn-primary text-xs">
                      <Check size={14} /> Apply
                    </button>
                    <button onClick={() => setEditingPeriod(null)} className="btn btn-outline text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm font-semibold text-text shrink-0 whitespace-nowrap">
                      {period.start_time} – {period.end_time}
                    </span>
                    {period.is_break && <span className="badge badge-warning text-xs">{period.label ?? "Break"}</span>}
                    {period.label && !period.is_break && <span className="text-xs text-muted truncate">{period.label}</span>}
                    {pendingEdits[period.id] && (
                      <span className="badge badge-warning text-xs">Unsaved</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {pendingEdits[period.id] && (
                      <button onClick={() => handleDiscardPendingEdit(period.id)} className="p-1.5 rounded-sm hover:bg-surface-2 text-text hover:text-danger transition-colors" title="Discard unsaved change">
                        <X size={13} />
                      </button>
                    )}
                    <button onClick={() => openEditPeriod(period)} className="p-1.5 rounded-sm hover:bg-surface-2 text-text hover:text-amber-800 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDeletePeriod(period.id)} className="p-1.5 rounded-sm hover:bg-surface-2 text-text hover:text-danger transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          {pendingNewPeriods.map(period => (
            <div
              key={period.tempId}
              className={`flex items-start gap-3 px-4 py-2.5 rounded-sm border !border-warning transition-colors ${period.is_break ? "bg-border" : "bg-bg"}`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-sm font-semibold text-text shrink-0 whitespace-nowrap">
                  {period.start_time} – {period.end_time}
                </span>
                {period.is_break && <span className="badge badge-warning text-xs">{period.label ?? "Break"}</span>}
                {period.label && !period.is_break && <span className="text-xs text-muted truncate">{period.label}</span>}
                <span className="badge badge-warning text-xs">New · Unsaved</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => handleRemovePendingNewPeriod(period.tempId)} className="p-1.5 rounded-sm hover:bg-surface-2 text-text hover:text-danger transition-colors" title="Discard">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Class selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-72">
          <Select label="Class" options={classOptions} value={selectedClass} onChange={setSelectedClass} searchable={false} />
        </div>
        <p className="text-xs text-muted mt-5">
          {schedule.filter(s => s.class_id === selectedClass).length} slots scheduled
        </p>
      </div>

      {/* Timetable grid */}
      <div className="p-0 table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "700px" }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-bg uppercase tracking-wide bg-surface2 w-32 bg-text rounded-tl-md">
                  Period
                </th>
                {DAYS.map((day, di) => (
                  <th
                    key={day}
                    className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide bg-surface2 bg-text last:rounded-tr-md"
                    style={{ color: DAY_COLORS[di] }}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayPeriods.map(period => (
                <tr key={period.id} className={`border-b border-border last:border-0 ${period.is_break ? "bg-surface-2 opacity-70" : ""}`}>
                  <td className="px-4 py-3 shrink-0 w-32">
                    {period.is_break ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-muted">{period.label ?? "Break"}</span>
                        <span className="text-xs text-faint">{period.start_time} – {period.end_time}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-text">{period.start_time}</span>
                        <span className="text-xs text-faint">{period.end_time}</span>
                      </div>
                    )}
                  </td>

                  {DAYS.map((day, di) => {
                    if (period.is_break) {
                      return (
                        <td key={day} className="px-3 py-3 text-center">
                          <span className="text-xs text-faint italic">—</span>
                        </td>
                      )
                    }

                    const slot = getSlot(period.id, day)
                    const cellKey = `${period.id}-${day}`
                    const isActive = activeCell?.periodId === period.id && activeCell?.day === day
                    const isDeleting = deleting === cellKey
                    const color = DAY_COLORS[di]

                    return (
                      <td key={day} className="px-2 py-2">
                        {slot ? (
                          <div
                            className="relative w-full rounded-sm border px-2.5 py-2 group"
                            style={{ background: `${color}10`, borderColor: isActive ? color : `${color}30` }}
                          >
                            {/* Action icons */}
                            <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => openCell(period.id, day, e.currentTarget.closest("td"))}
                                className="p-1 rounded-md hover:bg-black/10 transition-colors"
                                title="Edit"
                              >
                                <Pencil size={12} style={{ color }} />
                              </button>
                              <button
                                onClick={() => handleDeleteCell(period.id, day)}
                                disabled={isDeleting}
                                className="p-1 rounded-md hover:bg-black/10 transition-colors"
                                title="Delete"
                              >
                                {isDeleting
                                  ? <span className="w-3 h-3 animate-spin rounded-full border-2 border-danger/20 border-t-danger block" />
                                  : <Trash2 size={12} className="text-danger" />
                                }
                              </button>
                            </div>

                            {/* Cell content  */}
                            <div className="flex flex-col gap-1 pr-10">
                              <p className="text-xs font-semibold truncate" style={{ color }}>
                                {getSubjectName(slot.subject_id)}
                              </p>
                              <p className="text-xs text-muted truncate">{getTeacherName(slot.teacher_id)}</p>
                              <p className="text-xs text-faint">Rm {slot.room}</p>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => openCell(period.id, day, e.currentTarget)}
                            className="w-full h-16 rounded-sm border-2 border-dashed border-border hover:border-primary hover:bg-primary-light transition-all duration-150 flex items-center justify-center group"
                          >
                            <Plus size={14} className="text-faint group-hover:text-primary transition-colors" />
                          </button>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed popover */}
      {activeCell && (
        <div
          ref={popoverRef}
          className="fixed z-50 bg-surface border-2 border-border rounded-sm shadow-xl p-4 flex flex-col gap-3"
          style={{
            top: popoverPos.top,
            left: popoverPos.left,
            width: popoverPos.width,
            minWidth: 240,
          }}
        >
          {/* Arrow indicator */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-text">
              {activeCell.day} · {periods.find(p => p.id === activeCell.periodId)?.start_time}
            </span>
            <button onClick={() => { setActiveCell(null); setConflict(null) }} className="text-faint hover:text-text">
              <X size={14} />
            </button>
          </div>

          {conflict && (
            <div className="flex items-start gap-1.5 px-2 py-2 bg-surface border border-warning rounded-md">
              <AlertTriangle size={11} className="text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning leading-snug">{conflict}</p>
            </div>
          )}

          <Select
            options={subjectOptions}
            value={cellForm.subject_id}
            onChange={v => handleCellFormChange("subject_id", v)}
            placeholder="Subject"
            className="text-xs"
          />
          <Select
            options={teacherOptions}
            value={cellForm.teacher_id}
            onChange={v => handleCellFormChange("teacher_id", v)}
            placeholder="Teacher"
            className="text-xs"
          />
          <input
            className="input text-xs py-2.5"
            value={cellForm.room}
            onChange={e => handleCellFormChange("room", e.target.value)}
            placeholder="Room"
          />

          <div className="flex gap-2 pt-3 border-t border-border">
            <button
              onClick={handleSaveCell}
              disabled={saving || !cellForm.subject_id || !cellForm.teacher_id}
              className="btn btn-primary text-xs flex-1 disabled:opacity-60"
            >
              {saving
                ? <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                : <><Save size={12} /> Save</>
              }
            </button>
            <button onClick={() => { setActiveCell(null); setConflict(null) }} className="btn btn-outline text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}