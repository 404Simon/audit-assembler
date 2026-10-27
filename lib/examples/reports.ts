import type {
  Finding,
  FindingCategory,
  Item,
  Severity,
  Takeaway,
} from "@/lib/audit/types"
import { SEVERITY_INFO } from "@/lib/audit/types"

import rawReports from "./reports.json"

export type ReportTraceStatus =
  "verified" | "mismatch" | "missing" | "partial" | "unchecked"

export type ReportMatch = "yes" | "no" | "partial" | "none"

export interface ReportTraceRow {
  artefact: string
  location: string
  computed: string
  matches: ReportMatch
  status: ReportTraceStatus
  /** The audit's own wording, shown on hover so nuance is not lost. */
  statusNote: string
}

export interface ReportExample {
  id: string
  audit: string
  run: "nips16" | "r16"
  arms: number
  venue: string
  paper: string
  repo: string
  commit: string | null
  summary: { whatIDid: string; headline: string }
  traceability: ReportTraceRow[]
  findings: Finding[]
  scoreboardNotes: Record<FindingCategory, string>
  takeaways: Takeaway[]
  fineItems: Item[]
  openQuestions: Item[]
}

export const REPORT_EXAMPLES = rawReports.reports as unknown as ReportExample[]

export const REPORT_TRACE_LABELS: Record<ReportTraceStatus, string> = {
  verified: "Verified",
  mismatch: "Mismatch",
  missing: "Missing",
  partial: "Partial",
  unchecked: "Not checked",
}

export const REPORT_MATCH_SYMBOLS: Record<ReportMatch, string> = {
  yes: "✓",
  no: "✗",
  partial: "~",
  none: "—",
}

export function reportFindingsByCategory(
  report: ReportExample,
  category: FindingCategory
): Finding[] {
  return report.findings.filter((finding) => finding.category === category)
}

export function reportMaxSeverity(
  report: ReportExample,
  category: FindingCategory
): Severity | null {
  const severity = reportFindingsByCategory(report, category).reduce<number>(
    (max, finding) => Math.max(max, SEVERITY_INFO[finding.severity].score),
    0
  )
  if (severity === 0) return null
  return severity === 3 ? "high" : severity === 2 ? "medium" : "low"
}
