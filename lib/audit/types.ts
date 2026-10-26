export const FINDING_CATEGORIES = [
  "missing",
  "bug",
  "difference",
  "methodology",
] as const

export type FindingCategory = (typeof FINDING_CATEGORIES)[number]

export const SEVERITIES = ["high", "medium", "low"] as const
export type Severity = (typeof SEVERITIES)[number]

export const CONFIDENCES = ["high", "medium", "low"] as const
export type Confidence = (typeof CONFIDENCES)[number]

export const FINDING_STATUSES = ["finding", "question"] as const
export type FindingStatus = (typeof FINDING_STATUSES)[number]

export const TRACE_STATUSES = [
  "Verified",
  "Mismatch",
  "Missing",
  "Not checked",
] as const
export type TraceStatus = (typeof TRACE_STATUSES)[number]

export const MATCH_MARKS = ["yes", "no", "none"] as const
export type MatchMark = (typeof MATCH_MARKS)[number]

export const MATCH_LABELS: Record<MatchMark, string> = {
  yes: "✓ yes",
  no: "✗ no",
  none: "— n/a",
}

export const MATCH_SYMBOLS: Record<MatchMark, string> = {
  yes: "✓",
  no: "✗",
  none: "—",
}

export interface CategoryInfo {
  label: string
  definition: string
  test: string
  examples: string
  /** Tailwind classes for badges in light/dark mode. */
  className: string
  /** Plain accent colour used for dot indicators. */
  dot: string
}

export const CATEGORY_INFO: Record<FindingCategory, CategoryInfo> = {
  missing: {
    label: "Missing",
    definition: "The thing is not there at all.",
    test: "No producer for a reported number, absent data or weights, a dead URL/DOI, a paper step that no code implements.",
    examples:
      "No script computes the headline table; a dataset or checkpoint is not shipped; the download script downloads nothing.",
    className: "border-cat-missing/30 bg-cat-missing/10 text-cat-missing",
    dot: "bg-cat-missing",
  },
  bug: {
    label: "Bug",
    definition:
      "The artefact is there, but it does not work, or it does not do what the code itself intends.",
    test: "It crashes, hardcodes a path, uses the wrong axis, is off by one, or silently computes the metric over the wrong subset.",
    examples:
      "The documented training command raises a FileNotFoundError; early stopping never restores the best checkpoint.",
    className: "border-cat-bug/30 bg-cat-bug/10 text-cat-bug",
    dot: "bg-cat-bug",
  },
  difference: {
    label: "Difference",
    definition:
      "The code runs and is sound, but the paper describes something else.",
    test: "Metric, split, preprocessing, hyperparameters, aggregation or evaluation protocol differ between paper and code.",
    examples:
      "The paper says Adam with lr 1e-4; the released script uses AdamW with lr 1e-3.",
    className:
      "border-cat-difference/30 bg-cat-difference/10 text-cat-difference",
    dot: "bg-cat-difference",
  },
  methodology: {
    label: "Methodology",
    definition: "The code runs, but the procedure cannot support the claim.",
    test: "Leakage, no held-out test, related samples split across sets, test-set tuning, missing baselines, an unfit metric, statistical errors.",
    examples:
      "The scaler is fitted before the split; the reported test set is also the validation set; one seed with no error bars.",
    className:
      "border-cat-methodology/30 bg-cat-methodology/10 text-cat-methodology",
    dot: "bg-cat-methodology",
  },
}

export const SEVERITY_INFO: Record<
  Severity,
  { label: string; hint: string; className: string; dot: string; score: number }
> = {
  high: {
    label: "High",
    hint: "Invalidates or materially weakens a headline conclusion, or blocks reproduction of a headline number.",
    className: "border-severity-high/30 bg-severity-high/10 text-severity-high",
    dot: "bg-severity-high",
    score: 3,
  },
  medium: {
    label: "Medium",
    hint: "Affects a secondary result, or needs a workaround.",
    className:
      "border-severity-medium/30 bg-severity-medium/10 text-severity-medium",
    dot: "bg-severity-medium",
    score: 2,
  },
  low: {
    label: "Low",
    hint: "Hygiene: worth recording, but it does not move a conclusion.",
    className: "border-severity-low/30 bg-severity-low/10 text-severity-low",
    dot: "bg-severity-low",
    score: 1,
  },
}

export interface Meta {
  paperTitle: string
  paperId: string
  repo: string
  reviewer: string
  date: string
  familiarityPaper: string
  familiarityRepo: string
  aiDeclaration: string
  independence: string
}

export interface Effort {
  hours: string
  sessions: string
  longest: string
  couldNotCheck: string
}

export interface Summary {
  whatIDid: string
  headline: string
}

export interface TraceRow {
  id: string
  artefact: string
  location: string
  computed: string
  matches: MatchMark
  status: TraceStatus
}

export const VALIDATOR_FIELDS = [
  "quoteMatch",
  "controlFlow",
  "conditionSatisfiable",
] as const

export type ValidatorField = (typeof VALIDATOR_FIELDS)[number]

export type ValidatorPass = Record<ValidatorField, boolean>

export interface Finding {
  /** Stable local key for React state; never written to the report. */
  key: string
  /** The kebab-case id written to the YAML block. */
  id: string
  /** True once the reviewer edits the slug directly; stops title→slug syncing. */
  idTouched?: boolean
  category: FindingCategory
  topic: string
  title: string
  severity: Severity
  confidence: Confidence
  status: FindingStatus
  file: string
  lineStart: string
  lineEnd: string
  quote: string
  claim: string
  concern: string
  resolution: string
  crossRefs: string
  paperRef: string
  urlRetrievedAt: string
  checkScript: string
  csvRow: string
  validator: ValidatorPass
}

export interface Takeaway {
  id: string
  text: string
  category: FindingCategory
  severity: Severity
  confidence: Confidence
}

export interface Item {
  id: string
  text: string
}

export interface AuditState {
  schemaVersion: 1
  updatedAt: number
  meta: Meta
  effort: Effort
  summary: Summary
  traceability: TraceRow[]
  findings: Finding[]
  scoreboardNotes: Record<FindingCategory, string>
  takeaways: Takeaway[]
  fineItems: Item[]
  openQuestions: Item[]
}

export function today(): string {
  return new Date().toISOString().slice(0, 10)
}

let counter = 0

export function uid(prefix = "id"): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}

const SAFE_ID = /^[a-z0-9][a-z0-9._/-]*$/

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[`"'’“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  if (slug.length <= 40) return slug

  const clipped = slug.slice(0, 40)
  const boundary = clipped.lastIndexOf("-")
  return (boundary >= 20 ? clipped.slice(0, boundary) : clipped).replace(
    /-+$/g,
    ""
  )
}

export function isSafePlainScalar(value: string): boolean {
  return SAFE_ID.test(value)
}

export function createEmptyFinding(category: FindingCategory): Finding {
  return {
    key: uid("finding"),
    id: "",
    category,
    topic: "",
    title: "",
    severity: "medium",
    confidence: "high",
    status: "finding",
    file: "",
    lineStart: "",
    lineEnd: "",
    quote: "",
    claim: "",
    concern: "",
    resolution: "",
    crossRefs: "",
    paperRef: "",
    urlRetrievedAt: "",
    checkScript: "",
    csvRow: "",
    validator: {
      quoteMatch: false,
      controlFlow: false,
      conditionSatisfiable: false,
    },
  }
}

export function createEmptyAudit(): AuditState {
  return {
    schemaVersion: 1,
    updatedAt: 0,
    meta: {
      paperTitle: "",
      paperId: "",
      repo: "",
      reviewer: "",
      date: "",
      familiarityPaper: "",
      familiarityRepo: "",
      aiDeclaration:
        "I did not use generative AI or an AI agent for this review.",
      independence:
        "I did not see the agent's findings, the prescreening document, or another reviewer's report before writing this.",
    },
    effort: { hours: "", sessions: "", longest: "", couldNotCheck: "" },
    summary: { whatIDid: "", headline: "" },
    traceability: [],
    findings: [],
    scoreboardNotes: {
      missing: "",
      bug: "",
      difference: "",
      methodology: "",
    },
    takeaways: [],
    fineItems: [],
    openQuestions: [],
  }
}

export const FAMILIARITY_PAPER = [
  "none",
  "abstract only",
  "read before",
] as const

export const FAMILIARITY_REPO = ["none", "browsed", "used before"] as const

export function findingScore(finding: Finding): number {
  return (
    SEVERITY_INFO[finding.severity].score *
    SEVERITY_INFO[finding.confidence].score
  )
}

export function isCodeFile(file: string): boolean {
  const f = file.trim().toLowerCase()
  if (!f) return false
  if (f.startsWith("http://") || f.startsWith("https://")) return false
  if (f.endsWith(".pdf")) return false
  return true
}

export function isUrl(file: string): boolean {
  return /^https?:\/\//i.test(file.trim())
}
