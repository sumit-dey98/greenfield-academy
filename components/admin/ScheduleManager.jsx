'use client'

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/context/AuthContext"
import {
  Clock, Plus, Trash2, Save,
  AlertTriangle, ChevronDown, Pencil, Check, X,
} from "lucide-react"
import Select from "@/components/ui/Select"
import Input from "@/components/ui/Input"
import CheckBox from "@/components/ui/CheckBox"
import TimePicker from "@/components/ui/TimePicker"

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

  // Period editing
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [periodForm, setPeriodForm] = useState({})
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [showAddPeriod, setShowAddPeriod] = useState(false)
  const [newPeriod, setNewPeriod] = useState({ start_time: "", end_time: "", is_break: false, label: "" })

  const popoverRef = useRef(null)

  const fetchAll = async () => {
    const [classesRes, subjectsRes, teachersRes, periodsRes, scheduleRes] = await Promise.all([
      supabase.from("classes").select("*").order("grade", { ascending: true }),
      supabase.from("subjects").select("*").order("name", { ascending: true }),
      supabase.from("teachers").select("*"),
      supabase.from("periods").select("*").order("sort_order", { ascending: true }),
      supabase.from("schedule").select("*, subjects(name), teachers(name)"),
    ])
    if (classesRes.data) setClasses(classesRes.data)
    if (subjectsRes.data) setSubjects(subjectsRes.data)
    if (teachersRes.data) setTeachers(teachersRes.data)
    if (periodsRes.data) setPeriods(periodsRes.data)
    if (scheduleRes.data) setSchedule(scheduleRes.data)
    if (classesRes.data?.[0]) setSelectedClass(classesRes.data[0].id)
    setLoading(false)
  }

  useEffect(() => { fetchAll() }, [])

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

  const getSlot = (periodId, day) =>
    schedule.find(s =>
      s.class_id === selectedClass &&
      s.period_id === periodId &&
      s.day === day
    )

  const checkConflict = (periodId, day, teacherId) => {
    if (!teacherId) return null
    const clash = schedule.find(s =>
      s.period_id === periodId &&
      s.day === day &&
      s.teacher_id === teacherId &&
      s.class_id !== selectedClass
    )
    if (!clash) return null
    const clashClass = classes.find(c => c.id === clash.class_id)
    return `${teachers.find(t => t.id === teacherId)?.name} is already teaching another class (${clashClass?.name ?? clash.class_id}) at this time.`
  }

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

    let error
    if (existing) {
      const res = await supabase.from("schedule").update(payload).eq("id", existing.id)
      error = res.error
    } else {
      const id = `sch_${Date.now()}`
      const res = await supabase.from("schedule").insert({ id, ...payload })
      error = res.error
    }

    setSaving(false)
    if (error) return
    setActiveCell(null)
    setConflict(null)
    fetchAll()
  }

  const handleDeleteCell = async (periodId, day) => {
    if (!attemptWrite("academic")) return
    const existing = getSlot(periodId, day)
    if (!existing) return
    setDeleting(`${periodId}-${day}`)
    await supabase.from("schedule").delete().eq("id", existing.id)
    setDeleting(null)
    setActiveCell(null)
    fetchAll()
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

  const handleSavePeriod = async (periodId) => {
    setSavingPeriod(true)
    await supabase.from("periods").update({
      start_time: periodForm.start_time,
      end_time: periodForm.end_time,
      label: periodForm.label || null,
      is_break: periodForm.is_break,
    }).eq("id", periodId)
    setSavingPeriod(false)
    setEditingPeriod(null)
    fetchAll()
  }

  const handleDeletePeriod = async (periodId) => {
    if (!attemptWrite("academic")) return
    await supabase.from("schedule").delete().eq("period_id", periodId)
    await supabase.from("periods").delete().eq("id", periodId)
    fetchAll()
  }

  const handleAddPeriod = async () => {
    if (!attemptWrite("academic")) return
    if (!newPeriod.start_time || !newPeriod.end_time) return
    setSavingPeriod(true)
    const maxOrder = Math.max(...periods.map(p => p.sort_order), 0)
    const id = `per_${Date.now()}`
    await supabase.from("periods").insert({
      id,
      sort_order: maxOrder + 1,
      start_time: newPeriod.start_time,
      end_time: newPeriod.end_time,
      is_break: newPeriod.is_break,
      label: newPeriod.label || null,
    })
    setSavingPeriod(false)
    setShowAddPeriod(false)
    setNewPeriod({ start_time: "", end_time: "", is_break: false, label: "" })
    fetchAll()
  }

  const classOptions = classes.map(c => ({ label: c.name, value: c.id }))
  const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }))
  const teacherOptions = teachers.map(t => ({ label: `${t.name} (${t.subject})`, value: t.id }))

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
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-text flex items-center gap-2 text-base">
            <Clock size={16} className="text-primary" />
            Periods
          </h2>
          <button
            onClick={() => setShowAddPeriod(o => !o)}
            className="btn btn-primary text-sm w-fit"
          >
            <Plus size={14} /> Add Period
          </button>
        </div>

        {showAddPeriod && (
          <div className="flex flex-col xl:flex-row xl:justify-between gap-3 flex-1 min-w-0 p-3 bg-surface-2 rounded-lg border border-border">
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
              <button onClick={handleAddPeriod} disabled={savingPeriod} className="btn btn-primary text-xs disabled:opacity-60">
                {savingPeriod ? <span className="w-3.5 h-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Plus size={13} /> Add</>}
              </button>
              <button onClick={() => setShowAddPeriod(false)} className="btn btn-outline text-xs">Cancel</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {periods.map(period => (
            <div
              key={period.id}
              className={`flex items-start gap-3 px-4 py-2.5 rounded-lg border transition-colors ${period.is_break ? "bg-border border-border" : "bg-bg border-border"}`}
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
                    <button onClick={() => handleSavePeriod(period.id)} disabled={savingPeriod} className="btn btn-primary text-xs disabled:opacity-60">
                      {savingPeriod ? <span className="w-3 h-3 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <><Save size={14} /> Save</>}
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
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEditPeriod(period)} className="p-1.5 rounded-md hover:bg-surface-2 text-text hover:text-amber-800 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDeletePeriod(period.id)} className="p-1.5 rounded-md hover:bg-surface-2 text-text hover:text-danger transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </>
              )}
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
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse" style={{ minWidth: "700px" }}>
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted uppercase tracking-wide bg-surface2 w-32">
                  Period
                </th>
                {DAYS.map((day, di) => (
                  <th
                    key={day}
                    className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide bg-surface2"
                    style={{ color: DAY_COLORS[di] }}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period.id} className={`border-b border-border last:border-0 ${period.is_break ? "bg-surface2 opacity-70" : ""}`}>
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
                            className="relative w-full rounded-lg border px-2.5 py-2 group"
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
                                {slot.subjects?.name}
                              </p>
                              <p className="text-xs text-muted truncate">{slot.teachers?.name}</p>
                              <p className="text-xs text-faint">Rm {slot.room}</p>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => openCell(period.id, day, e.currentTarget)}
                            className="w-full h-16 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-primary-light transition-all duration-150 flex items-center justify-center group"
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
          className="fixed z-50 bg-surface border border-border rounded-xl shadow-xl p-4 flex flex-col gap-3"
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