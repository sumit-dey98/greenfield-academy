export function calcGrade(marks) {
  if (marks >= 80) return "A+"
  if (marks >= 70) return "A"
  if (marks >= 60) return "B"
  if (marks >= 50) return "C"
  if (marks >= 40) return "D"
  if (marks >= 33) return "E"
  return "F"
}

export function calcRemarks(grade) {
  const map = {
    "A+": "Outstanding",
    "A": "Excellent",
    "B": "Good",
    "C": "Average",
    "D": "Needs improvement",
    "E": "Poor",
    "F": "Failed",
  }
  return map[grade] ?? "—"
}

export const gradeColor = {
  "A+": "badge-success",
  "A": "badge-success",
  "B": "badge-info",
  "C": "badge-warning",
  "D": "badge-warning",
  "E": "badge-danger",
  "F": "badge-danger",
}