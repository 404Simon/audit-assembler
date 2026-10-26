import {
  FINDING_CATEGORIES,
  isCodeFile,
  isUrl,
  type AuditState,
  type Finding,
  type FindingCategory,
} from "./types"

export const EDITOR_SECTIONS = [
  "meta",
  "effort",
  "summary",
  "traceability",
  "findings",
  "synthesis",
  "export",
] as const

export type SectionId = (typeof EDITOR_SECTIONS)[number]

export const SECTION_LABELS: Record<SectionId, string> = {
  meta: "Paper & reviewer",
  effort: "Effort",
  summary: "Summary",
  traceability: "Traceability",
  findings: "Findings",
  synthesis: "Take-aways & questions",
  export: "Review & export",
}

export type IssueLevel = "error" | "warning"

export interface Issue {
  id: string
  level: IssueLevel
  section: SectionId
  message: string
  findingId?: string
}

function issue(
  level: IssueLevel,
  section: SectionId,
  message: string,
  findingId?: string
): Issue {
  return {
    id: `${section}-${findingId ?? ""}-${message.slice(0, 24)}-${level}`,
    level,
    section,
    message,
    findingId,
  }
}

export function validatorComplete(finding: Finding): boolean {
  return (
    finding.validator.quoteMatch &&
    finding.validator.controlFlow &&
    finding.validator.conditionSatisfiable
  )
}

export function validateFinding(finding: Finding, audit: AuditState): Issue[] {
  const issues: Issue[] = []
  const label = finding.title.trim() || "Untitled finding"
  const add = (level: IssueLevel, message: string) =>
    issues.push(issue(level, "findings", `${label}: ${message}`, finding.key))

  const id = finding.id.trim()
  if (!id) add("error", "Finding ID is required.")
  else {
    if (id.length > 40)
      add("warning", "Finding ID is longer than 40 characters.")
    if (!/^[a-z0-9][a-z0-9-]*$/.test(id))
      add(
        "warning",
        "Finding ID should be lowercase kebab-case (a-z, 0-9, dashes)."
      )
    const duplicates = audit.findings.filter((other) => other.id.trim() === id)
    if (duplicates.length > 1)
      add("error", `Finding ID “${id}” is used by more than one finding.`)
  }

  if (!finding.topic.trim()) add("error", "Topic is required.")
  if (!finding.title.trim()) add("error", "Title is required.")
  else if (finding.title.trim().length > 80)
    add("warning", "Title is longer than 80 characters.")
  if (!finding.file.trim())
    add("error", "Evidence location (file / PDF / URL) is required.")
  if (!finding.quote.trim()) add("error", "Quote is required.")

  if (isCodeFile(finding.file)) {
    if (!finding.lineStart.trim())
      add(
        "error",
        "Line numbers are required when the evidence is a repository file."
      )
    else {
      const start = Number.parseInt(finding.lineStart, 10)
      const end = Number.parseInt(finding.lineEnd || finding.lineStart, 10)
      if (Number.isNaN(start) || Number.isNaN(end))
        add("error", "Line numbers must be integers.")
      else if (start < 1 || end < 1) add("error", "Line numbers start at 1.")
      else if (start > end)
        add("error", "The line range is inverted (start is after end).")
    }
  }

  if (isUrl(finding.file) && !finding.urlRetrievedAt.trim())
    add("error", "URL evidence needs the date you accessed it.")
  if (
    finding.file.trim().toLowerCase().endsWith(".pdf") &&
    !finding.paperRef.trim()
  )
    add(
      "error",
      "PDF evidence needs a page, section, table or figure reference."
    )

  if (finding.csvRow.trim() && !finding.checkScript.trim())
    add(
      "warning",
      "You cite an output row; add the script that produced it under Check script."
    )

  if (!finding.claim.trim()) add("error", "Claim is required.")
  if (!finding.concern.trim()) add("error", "Concern is required.")
  if (!finding.resolution.trim()) add("error", "Resolution is required.")

  if (finding.status === "finding" && !validatorComplete(finding))
    add(
      "error",
      "Validator pass is incomplete. Re-open the evidence and tick all three boxes, or change the status to question."
    )

  return issues
}

export function validateAudit(audit: AuditState): Issue[] {
  const issues: Issue[] = []
  const { meta, summary } = audit

  if (!meta.paperTitle.trim())
    issues.push(issue("error", "meta", "Paper title is required."))
  if (!meta.paperId.trim())
    issues.push(issue("error", "meta", "Paper ID is required."))
  if (!meta.repo.trim())
    issues.push(issue("error", "meta", "Repository / snapshot is required."))
  if (!meta.reviewer.trim())
    issues.push(issue("error", "meta", "Reviewer name is required."))
  if (!meta.date.trim()) issues.push(issue("warning", "meta", "Date is empty."))
  if (!meta.familiarityPaper.trim())
    issues.push(
      issue("warning", "meta", "Choose your prior familiarity with the paper.")
    )
  if (!meta.familiarityRepo.trim())
    issues.push(
      issue(
        "warning",
        "meta",
        "Choose your prior familiarity with the repository."
      )
    )
  if (!meta.aiDeclaration.trim())
    issues.push(issue("warning", "meta", "AI/agent declaration is empty."))
  if (!meta.independence.trim())
    issues.push(issue("warning", "meta", "Independence statement is empty."))

  if (!summary.whatIDid.trim())
    issues.push(issue("error", "summary", "“What I did” is required."))
  if (!summary.headline.trim())
    issues.push(issue("error", "summary", "The headline is required."))

  if (audit.traceability.length === 0)
    issues.push(
      issue(
        "warning",
        "traceability",
        "No traceability rows yet. Every headline number, figure, table, ablation and test should have a row."
      )
    )
  audit.traceability.forEach((row, index) => {
    if (!row.artefact.trim())
      issues.push(
        issue(
          "error",
          "traceability",
          `Traceability row ${index + 1} has no paper artefact.`
        )
      )
    if (!row.location.trim() && row.status === "Verified")
      issues.push(
        issue(
          "warning",
          "traceability",
          `Traceability row ${index + 1} is marked Verified but has no repository location.`
        )
      )
    if (!row.computed.trim() && row.status === "Verified")
      issues.push(
        issue(
          "warning",
          "traceability",
          `Traceability row ${index + 1} is marked Verified but has no computed value.`
        )
      )
  })

  for (const finding of audit.findings) {
    issues.push(...validateFinding(finding, audit))
  }

  if (audit.findings.length === 0)
    issues.push(
      issue(
        "warning",
        "findings",
        "No findings yet. A clean audit is a valid result — state “No findings identified.” in the summary."
      )
    )
  if (
    audit.findings.length > 0 &&
    audit.findings.every((finding) => finding.status === "question")
  )
    issues.push(
      issue(
        "warning",
        "findings",
        "All entries are questions, so the report contains no findings. That is allowed, but say so explicitly."
      )
    )

  if (audit.takeaways.length > 6)
    issues.push(
      issue(
        "warning",
        "synthesis",
        "More than six take-aways. Keep the six strongest, or explain in the report why the cap is exceeded."
      )
    )
  if (audit.takeaways.filter((takeaway) => takeaway.text.trim()).length === 0)
    issues.push(
      issue(
        "warning",
        "synthesis",
        "No take-aways yet. Rank the most consequential findings first."
      )
    )
  if (audit.fineItems.filter((item) => item.text.trim()).length === 0)
    issues.push(
      issue(
        "warning",
        "synthesis",
        "“Items that genuinely look fine” is empty. List what you checked and found correct."
      )
    )
  if (audit.openQuestions.filter((item) => item.text.trim()).length === 0)
    issues.push(
      issue(
        "warning",
        "synthesis",
        "“Open questions for the authors” is empty. Put incomplete evidence and checks you could not run here."
      )
    )

  return issues.map((item, index) => ({
    ...item,
    id: `${item.id}-${index}`,
  }))
}

export function issuesForSection(issues: Issue[], section: SectionId): Issue[] {
  return issues.filter((item) => item.section === section)
}

export interface SectionStatus {
  errors: number
  warnings: number
}

export function sectionStatus(
  audit: AuditState,
  issues: Issue[],
  section: SectionId
): SectionStatus {
  const own = issuesForSection(issues, section)
  if (section === "effort") {
    return {
      errors: 0,
      warnings:
        audit.effort.hours.trim() && audit.effort.sessions.trim() ? 0 : 1,
    }
  }
  if (section === "export") {
    return {
      errors: issues.filter((item) => item.level === "error").length,
      warnings: 0,
    }
  }
  return {
    errors: own.filter((item) => item.level === "error").length,
    warnings: own.filter((item) => item.level === "warning").length,
  }
}

export function scoreboardCounts(
  audit: AuditState
): Record<
  FindingCategory,
  { findings: number; questions: number; maxSeverity: number }
> {
  const result = Object.fromEntries(
    FINDING_CATEGORIES.map((category) => [
      category,
      { findings: 0, questions: 0, maxSeverity: 0 },
    ])
  ) as Record<
    FindingCategory,
    { findings: number; questions: number; maxSeverity: number }
  >

  for (const finding of audit.findings) {
    const entry = result[finding.category]
    if (finding.status === "finding") {
      entry.findings += 1
      const score =
        finding.severity === "high" ? 3 : finding.severity === "medium" ? 2 : 1
      entry.maxSeverity = Math.max(entry.maxSeverity, score)
    } else {
      entry.questions += 1
    }
  }
  return result
}
