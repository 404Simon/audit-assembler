import {
  FINDING_CATEGORIES,
  MATCH_SYMBOLS,
  SEVERITY_INFO,
  isCodeFile,
  type AuditState,
  type Finding,
  type FindingCategory,
  type TraceRow,
} from "./types"

const PLACEHOLDER = "REPLACE ME"

function orPlaceholder(value: string): string {
  return value.trim() || PLACEHOLDER
}

function inlineCode(value: string): string {
  const text = value.trim()
  if (!text) return ""
  const fence = text.includes("`") ? "``" : "`"
  return `${fence}${text}${fence}`
}

function tableCell(value: string): string {
  return value.replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|").trim()
}

function yamlString(value: string): string {
  return JSON.stringify(value)
}

function yamlScalar(value: string): string {
  return /^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(value) ? value : yamlString(value)
}

function yamlBlock(value: string): string[] {
  const normalized = value.replace(/\r\n/g, "\n").replace(/[ \t]+$/, "")
  const lines = normalized.split("\n")
  return ["|", ...lines.map((line) => (line.length > 0 ? `  ${line}` : ""))]
}

function splitRefs(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function buildFindingYaml(finding: Finding): string {
  const lines: string[] = []
  const id = finding.id.trim() || slugFallback(finding.title, finding.category)
  lines.push(`id: ${yamlScalar(id)}`)
  lines.push(`category: ${finding.category}`)
  lines.push(`topic: ${yamlString(finding.topic.trim())}`)
  lines.push(`title: ${yamlString(finding.title.trim())}`)
  lines.push(`severity: ${finding.severity}`)
  lines.push(`confidence: ${finding.confidence}`)
  lines.push(`status: ${finding.status}`)
  lines.push(`file: ${yamlScalar(finding.file.trim())}`)

  if (isCodeFile(finding.file)) {
    const start = Number.parseInt(finding.lineStart, 10)
    const end = Number.parseInt(finding.lineEnd || finding.lineStart, 10)
    if (Number.isFinite(start)) {
      lines.push(`line_start: ${start}`)
      lines.push(`line_end: ${Number.isFinite(end) ? end : start}`)
    }
  }

  const quote = yamlBlock(finding.quote)
  lines.push(`quote: ${quote[0]}`)
  lines.push(...quote.slice(1))
  lines.push(`claim: ${yamlString(finding.claim.trim())}`)
  lines.push(`concern: ${yamlString(finding.concern.trim())}`)
  lines.push(`resolution: ${yamlString(finding.resolution.trim())}`)

  const refs = splitRefs(finding.crossRefs)
  lines.push(`cross_refs: ${refs.length ? JSON.stringify(refs) : "[]"}`)

  if (finding.paperRef.trim()) {
    lines.push(`paper_ref: ${yamlString(finding.paperRef.trim())}`)
  }
  if (finding.urlRetrievedAt.trim()) {
    lines.push(`url_retrieved_at: ${yamlString(finding.urlRetrievedAt.trim())}`)
  }
  if (finding.checkScript.trim()) {
    lines.push(`check_script: ${yamlScalar(finding.checkScript.trim())}`)
  }
  if (finding.csvRow.trim()) {
    lines.push(`csv_row: ${yamlScalar(finding.csvRow.trim())}`)
  }

  if (finding.status === "finding") {
    lines.push("validator_pass:")
    lines.push(`  quote_match: ${finding.validator.quoteMatch}`)
    lines.push(`  control_flow: ${finding.validator.controlFlow}`)
    lines.push(
      `  condition_satisfiable: ${finding.validator.conditionSatisfiable}`
    )
  }

  return lines.join("\n")
}

function slugFallback(title: string, category: FindingCategory): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return base ? base.slice(0, 40) : `untitled-${category}`
}

function traceRowLine(row: TraceRow): string {
  return [
    tableCell(row.artefact),
    row.location.trim() ? tableCell(inlineCode(row.location)) : "",
    tableCell(row.computed),
    MATCH_SYMBOLS[row.matches],
    tableCell(row.status),
  ].join(" | ")
}

export function buildMarkdown(audit: AuditState): string {
  const { meta, effort, summary } = audit
  const findings = audit.findings.filter((f) => f.status === "finding")
  const questions = audit.findings.filter((f) => f.status === "question")

  const out: string[] = []
  out.push(`# Manual review — ${orPlaceholder(meta.paperTitle)}`, "")

  out.push("## Paper and reviewer", "")
  out.push("| Field | Value |", "|---|---|")
  out.push(
    `| Paper ID | ${tableCell(inlineCode(meta.paperId || PLACEHOLDER))} |`
  )
  out.push(`| Paper title | ${tableCell(orPlaceholder(meta.paperTitle))} |`)
  out.push(
    `| Repository / snapshot | ${tableCell(
      meta.repo.trim() ? inlineCode(meta.repo) : PLACEHOLDER
    )} |`
  )
  out.push(`| Reviewer | ${tableCell(orPlaceholder(meta.reviewer))} |`)
  out.push(`| Date | ${tableCell(inlineCode(meta.date || PLACEHOLDER))} |`)
  out.push(
    `| Prior familiarity with the paper | ${tableCell(orPlaceholder(meta.familiarityPaper))} |`
  )
  out.push(
    `| Prior familiarity with the repository | ${tableCell(orPlaceholder(meta.familiarityRepo))} |`
  )
  out.push(
    `| AI/agent declaration | ${tableCell(orPlaceholder(meta.aiDeclaration))} |`
  )
  out.push(
    `| Independence | ${tableCell(orPlaceholder(meta.independence))} |`,
    ""
  )

  out.push("## Effort", "")
  out.push(
    "| Rough total hours | Sessions / days | What took longest | What I could not check |"
  )
  out.push("|---|---|---|---|")
  out.push(
    `| ${tableCell(effort.hours)} | ${tableCell(effort.sessions)} | ${tableCell(
      effort.longest
    )} | ${tableCell(effort.couldNotCheck)} |`,
    ""
  )

  out.push("## Summary", "")
  out.push(`**What I did.** ${orPlaceholder(summary.whatIDid)}`, "")
  out.push(`**Headline.** ${orPlaceholder(summary.headline)}`, "")

  out.push("## Traceability", "")
  out.push(
    "| Paper artefact | Repo location | Computed value | Matches paper | Status |"
  )
  out.push("|---|---|---|---|---|")
  if (audit.traceability.length === 0) {
    out.push(`| ${PLACEHOLDER} | | | — | Not checked |`)
  } else {
    for (const row of audit.traceability) {
      out.push(`| ${traceRowLine(row)} |`)
    }
  }
  out.push("")

  for (const category of FINDING_CATEGORIES) {
    out.push(`## ${category}`, "")
    const inCategory = audit.findings.filter((f) => f.category === category)
    if (inCategory.length === 0) {
      out.push("None.", "")
      continue
    }
    for (const finding of inCategory) {
      out.push("```yaml finding")
      out.push(buildFindingYaml(finding))
      out.push("```", "")
    }
  }

  if (findings.length === 0) {
    out.push("No findings identified.", "")
  }

  out.push("## Scoreboard", "")
  out.push("| Category | # findings | Max severity | Note |")
  out.push("|---|---|---|---|")
  for (const category of FINDING_CATEGORIES) {
    const counted = findings.filter((f) => f.category === category)
    const asked = questions.filter((f) => f.category === category)
    const max = counted.reduce<number>(
      (acc, finding) => Math.max(acc, SEVERITY_INFO[finding.severity].score),
      0
    )
    const maxSeverity =
      max === 0 ? "-" : max === 3 ? "high" : max === 2 ? "medium" : "low"
    const count =
      asked.length === 0
        ? String(counted.length)
        : `${counted.length} (+${asked.length} question${asked.length === 1 ? "" : "s"})`
    out.push(
      `| ${category} | ${count} | ${maxSeverity} | ${tableCell(
        audit.scoreboardNotes[category]
      )} |`
    )
  }
  out.push("")

  out.push("## Top take-aways", "")
  const takeaways = audit.takeaways
    .filter((takeaway) => takeaway.text.trim())
    .sort((a, b) => scoreOf(b) - scoreOf(a))
  if (takeaways.length === 0) {
    out.push("None recorded.", "")
  } else {
    takeaways.forEach((takeaway, index) => {
      out.push(
        `${index + 1}. ${takeaway.text.trim()} — \`${takeaway.category}\`, ${takeaway.severity}.`
      )
    })
    out.push("")
  }

  out.push("## Items that genuinely look fine", "")
  const fine = audit.fineItems.filter((item) => item.text.trim())
  if (fine.length === 0) {
    out.push("None recorded.", "")
  } else {
    for (const item of fine) out.push(`- ${item.text.trim()}`)
    out.push("")
  }

  out.push("## Open questions for the authors", "")
  const questionsText = audit.openQuestions.filter((item) => item.text.trim())
  if (questionsText.length === 0) {
    out.push("None recorded.", "")
  } else {
    for (const item of questionsText) out.push(`- ${item.text.trim()}`)
    out.push("")
  }

  return `${out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`
}

function scoreOf(takeaway: {
  severity: keyof typeof SEVERITY_INFO
  confidence: keyof typeof SEVERITY_INFO
}): number {
  return (
    SEVERITY_INFO[takeaway.severity].score *
    SEVERITY_INFO[takeaway.confidence].score
  )
}
