"use client"

import * as React from "react"

import {
  FINDING_CATEGORIES,
  createEmptyAudit,
  createEmptyFinding,
  slugify,
  today,
  uid,
  type AuditState,
  type Confidence,
  type Effort,
  type Finding,
  type FindingCategory,
  type Item,
  type MatchMark,
  type Meta,
  type Severity,
  type Summary,
  type Takeaway,
  type TraceRow,
  type TraceStatus,
  type ValidatorPass,
} from "./types"

const AUDIT_KEY = "audit-assembler:audit:v1"
const GUIDE_KEY = "audit-assembler:guide:v1"
const SAVE_DELAY = 350

export interface GuideProgress {
  steps: string[]
  checklist: string[]
  updatedAt: number
}

export type SaveState = "loading" | "saving" | "saved" | "error"

interface AuditStore {
  audit: AuditState
  guide: GuideProgress
  loaded: boolean
  saveState: SaveState
  savedAt: number | null
  storageError: string | null
  setMeta: (patch: Partial<Meta>) => void
  setEffort: (patch: Partial<Effort>) => void
  setSummary: (patch: Partial<Summary>) => void
  addTraceRow: () => string
  updateTraceRow: (id: string, patch: Partial<TraceRow>) => void
  removeTraceRow: (id: string) => void
  moveTraceRow: (id: string, direction: -1 | 1) => void
  addFinding: (category: FindingCategory) => string
  updateFinding: (key: string, patch: Partial<Finding>) => void
  removeFinding: (key: string) => void
  duplicateFinding: (key: string) => string | null
  moveFinding: (key: string, direction: -1 | 1) => void
  setScoreboardNote: (category: FindingCategory, value: string) => void
  addTakeaway: () => string
  updateTakeaway: (id: string, patch: Partial<Takeaway>) => void
  removeTakeaway: (id: string) => void
  moveTakeaway: (id: string, direction: -1 | 1) => void
  addItem: (key: "fineItems" | "openQuestions", text?: string) => string
  updateItem: (
    key: "fineItems" | "openQuestions",
    id: string,
    text: string
  ) => void
  removeItem: (key: "fineItems" | "openQuestions", id: string) => void
  toggleGuideStep: (id: string) => void
  toggleGuideChecklist: (id: string) => void
  resetAudit: () => void
  resetGuide: () => void
  exportBackup: () => string
  importBackup: (json: string) => { ok: boolean; error?: string }
}

const AuditContext = React.createContext<AuditStore | null>(null)

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function readString(
  source: Record<string, unknown>,
  key: string,
  fallback = ""
) {
  const value = source[key]
  return typeof value === "string" ? value : fallback
}

function normalizeValidator(value: unknown): ValidatorPass {
  const source = isRecord(value) ? value : {}
  return {
    quoteMatch: source.quoteMatch === true,
    controlFlow: source.controlFlow === true,
    conditionSatisfiable: source.conditionSatisfiable === true,
  }
}

function normalizeCategory(value: unknown): FindingCategory {
  return FINDING_CATEGORIES.includes(value as FindingCategory)
    ? (value as FindingCategory)
    : "missing"
}

function normalizeFinding(value: unknown): Finding | null {
  if (!isRecord(value)) return null
  const category = normalizeCategory(value.category)
  const base = createEmptyFinding(category)
  const title = readString(value, "title")
  return {
    ...base,
    key: readString(value, "key") || uid("finding"),
    id: readString(value, "id") || slugify(title),
    idTouched: value.idTouched === true,
    category,
    topic: readString(value, "topic"),
    title,
    severity: ["high", "medium", "low"].includes(String(value.severity))
      ? (value.severity as Severity)
      : "medium",
    confidence: ["high", "medium", "low"].includes(String(value.confidence))
      ? (value.confidence as Confidence)
      : "high",
    status: value.status === "question" ? "question" : "finding",
    file: readString(value, "file"),
    lineStart: readString(value, "lineStart", String(value.line_start ?? "")),
    lineEnd: readString(value, "lineEnd", String(value.line_end ?? "")),
    quote: readString(value, "quote"),
    claim: readString(value, "claim"),
    concern: readString(value, "concern"),
    resolution: readString(value, "resolution"),
    crossRefs: Array.isArray(value.crossRefs)
      ? value.crossRefs.join(", ")
      : readString(value, "crossRefs"),
    paperRef: readString(value, "paperRef", readString(value, "paper_ref")),
    urlRetrievedAt: readString(
      value,
      "urlRetrievedAt",
      readString(value, "url_retrieved_at")
    ),
    checkScript: readString(
      value,
      "checkScript",
      readString(value, "check_script")
    ),
    csvRow: readString(value, "csvRow", readString(value, "csv_row")),
    validator: normalizeValidator(value.validator ?? value.validator_pass),
  }
}

function normalizeTraceRow(value: unknown): TraceRow | null {
  if (!isRecord(value)) return null
  const status = [
    "Verified",
    "Partial",
    "Mismatch",
    "Missing",
    "Not checked",
  ].includes(String(value.status))
    ? (value.status as TraceStatus)
    : "Not checked"
  const matches = ["yes", "no", "partial", "none"].includes(
    String(value.matches)
  )
    ? (value.matches as MatchMark)
    : "none"
  return {
    id: readString(value, "id") || uid("row"),
    artefact: readString(value, "artefact"),
    location: readString(value, "location"),
    computed: readString(value, "computed"),
    matches,
    matchesNote: readString(value, "matchesNote"),
    status,
    statusNote: readString(value, "statusNote"),
  }
}

function withSlugSuffix(base: string, suffix: string): string {
  const tail = `-${suffix}`
  const head = base.slice(0, Math.max(0, 40 - tail.length)).replace(/-+$/, "")
  return `${head || "finding"}${tail}`
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>()
  return items.map((item, index) => {
    let id = item.id
    while (seen.has(id)) id = `${item.id || "item"}-${index}`
    seen.add(id)
    return id === item.id ? item : { ...item, id }
  })
}

function dedupeFindingKeys(findings: Finding[]): Finding[] {
  const seen = new Set<string>()
  return findings.map((finding, index) => {
    let key = finding.key
    while (seen.has(key)) key = `${finding.key || "finding"}-${index}`
    seen.add(key)
    return key === finding.key ? finding : { ...finding, key }
  })
}

function normalizeItems(value: unknown): Item[] {
  if (!Array.isArray(value)) return []
  return value
    .map((entry) =>
      typeof entry === "string"
        ? { id: uid("item"), text: entry }
        : isRecord(entry)
          ? {
              id: readString(entry, "id") || uid("item"),
              text: readString(entry, "text"),
            }
          : null
    )
    .filter((entry): entry is Item => entry !== null)
}

export function normalizeAudit(raw: unknown): AuditState {
  const empty = createEmptyAudit()
  if (!isRecord(raw)) return empty

  const metaSource = isRecord(raw.meta) ? raw.meta : {}
  const effortSource = isRecord(raw.effort) ? raw.effort : {}
  const summarySource = isRecord(raw.summary) ? raw.summary : {}
  const notesSource = isRecord(raw.scoreboardNotes) ? raw.scoreboardNotes : {}

  const meta = {
    ...empty.meta,
    paperTitle: readString(metaSource, "paperTitle"),
    paperId: readString(metaSource, "paperId"),
    repo: readString(metaSource, "repo"),
    reviewer: readString(metaSource, "reviewer"),
    date: readString(metaSource, "date"),
    familiarityPaper: readString(metaSource, "familiarityPaper"),
    familiarityRepo: readString(metaSource, "familiarityRepo"),
    aiDeclaration: readString(
      metaSource,
      "aiDeclaration",
      empty.meta.aiDeclaration
    ),
    independence: readString(
      metaSource,
      "independence",
      empty.meta.independence
    ),
  }

  const findings = dedupeFindingKeys(
    Array.isArray(raw.findings)
      ? raw.findings
          .map(normalizeFinding)
          .filter((entry): entry is Finding => entry !== null)
      : []
  )

  return {
    schemaVersion: 1,
    updatedAt:
      typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : 0,
    meta,
    effort: {
      hours: readString(effortSource, "hours"),
      sessions: readString(effortSource, "sessions"),
      longest: readString(effortSource, "longest"),
      couldNotCheck: readString(effortSource, "couldNotCheck"),
    },
    summary: {
      whatIDid: readString(summarySource, "whatIDid"),
      headline: readString(summarySource, "headline"),
    },
    traceability: dedupeById(
      Array.isArray(raw.traceability)
        ? raw.traceability
            .map(normalizeTraceRow)
            .filter((entry): entry is TraceRow => entry !== null)
        : []
    ),
    findings,
    scoreboardNotes: Object.fromEntries(
      FINDING_CATEGORIES.map((category) => [
        category,
        readString(notesSource, category),
      ])
    ) as Record<FindingCategory, string>,
    takeaways: dedupeById(
      Array.isArray(raw.takeaways)
        ? raw.takeaways
            .map((entry) => {
              if (!isRecord(entry)) return null
              return {
                id: readString(entry, "id") || uid("takeaway"),
                text: readString(entry, "text"),
                category: normalizeCategory(entry.category),
                severity: ["high", "medium", "low"].includes(
                  String(entry.severity)
                )
                  ? (entry.severity as Severity)
                  : "medium",
                confidence: ["high", "medium", "low"].includes(
                  String(entry.confidence)
                )
                  ? (entry.confidence as Confidence)
                  : "high",
              }
            })
            .filter((entry): entry is Takeaway => entry !== null)
        : []
    ),
    fineItems: dedupeById(normalizeItems(raw.fineItems)),
    openQuestions: dedupeById(normalizeItems(raw.openQuestions)),
  }
}

function normalizeGuide(raw: unknown): GuideProgress {
  if (!isRecord(raw)) return { steps: [], checklist: [], updatedAt: 0 }
  return {
    steps: Array.isArray(raw.steps)
      ? raw.steps.filter((entry): entry is string => typeof entry === "string")
      : [],
    checklist: Array.isArray(raw.checklist)
      ? raw.checklist.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : [],
    updatedAt:
      typeof raw.updatedAt === "number" && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : 0,
  }
}

function readStored(key: string): unknown {
  if (typeof window === "undefined") return null
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(key)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    // Keep a copy of unreadable data instead of silently overwriting it.
    try {
      window.localStorage.setItem(`${key}:corrupt`, raw)
    } catch {
      /* nothing else we can do */
    }
    return null
  }
}

function usePersistentState<T>(
  key: string,
  normalize: (raw: unknown) => T,
  empty: () => T
) {
  const [value, setValue] = React.useState<T>(empty)
  const [loaded, setLoaded] = React.useState(false)
  const [savedAt, setSavedAt] = React.useState<number | null>(null)
  const [storageError, setStorageError] = React.useState<string | null>(null)
  const lastWritten = React.useRef<string | null>(null)
  const valueRef = React.useRef(value)

  React.useLayoutEffect(() => {
    valueRef.current = value
  }, [value])

  React.useEffect(() => {
    const stored = readStored(key)
    if (stored !== null) {
      // Loading from an external store (localStorage) is exactly what an
      // effect is for; the state setters are the synchronization step.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(normalize(stored))
      setSavedAt(Date.now())
    }
    setLoaded(true)
  }, [key, normalize])

  React.useEffect(() => {
    if (!loaded) return
    const timer = window.setTimeout(() => {
      try {
        const serialized = JSON.stringify(value)
        window.localStorage.setItem(key, serialized)
        lastWritten.current = serialized
        setSavedAt(Date.now())
        setStorageError(null)
      } catch (error) {
        setStorageError(
          error instanceof Error
            ? `Could not save to this browser: ${error.message}`
            : "Could not save to this browser."
        )
      }
    }, SAVE_DELAY)
    return () => window.clearTimeout(timer)
  }, [key, value, loaded])

  React.useEffect(() => {
    if (!loaded) return
    const flush = () => {
      try {
        const serialized = JSON.stringify(valueRef.current)
        window.localStorage.setItem(key, serialized)
        lastWritten.current = serialized
      } catch {
        /* handled by the debounced save */
      }
    }
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush()
    }
    window.addEventListener("pagehide", flush)
    document.addEventListener("visibilitychange", onVisibility)
    return () => {
      window.removeEventListener("pagehide", flush)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [key, loaded])

  React.useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key || !event.newValue) return
      if (event.newValue === lastWritten.current) return
      try {
        const incoming = normalize(JSON.parse(event.newValue))
        lastWritten.current = event.newValue
        setValue(incoming)
        setSavedAt(Date.now())
      } catch {
        /* ignore malformed updates from other tabs */
      }
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [key, normalize])

  return {
    value,
    setValue,
    loaded,
    savedAt,
    storageError,
    reset: () => setValue(empty()),
  }
}

function patchItem<T extends { id: string }>(
  items: T[],
  id: string,
  patch: Partial<T>
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

function moveItem<T extends { id: string }>(
  items: T[],
  id: string,
  direction: -1 | 1
): T[] {
  const index = items.findIndex((item) => item.id === id)
  const next = index + direction
  if (index < 0 || next < 0 || next >= items.length) return items
  const copy = [...items]
  const [item] = copy.splice(index, 1)
  copy.splice(next, 0, item)
  return copy
}

function withUpdate(audit: AuditState): AuditState {
  return { ...audit, updatedAt: Date.now() }
}

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const auditStore = usePersistentState(
    AUDIT_KEY,
    normalizeAudit,
    createEmptyAudit
  )
  const guideStore = usePersistentState(GUIDE_KEY, normalizeGuide, () => ({
    steps: [],
    checklist: [],
    updatedAt: 0,
  }))

  const { setValue: setAudit, loaded } = auditStore

  React.useEffect(() => {
    if (!loaded) return
    setAudit((current) =>
      current.meta.date
        ? current
        : { ...current, meta: { ...current.meta, date: today() } }
    )
  }, [loaded, setAudit])

  const mutate = React.useCallback(
    (recipe: (current: AuditState) => AuditState) => {
      setAudit((current) => withUpdate(recipe(current)))
    },
    [setAudit]
  )

  const store = React.useMemo<AuditStore>(() => {
    const { value: audit, setValue } = auditStore
    const setGuide = guideStore.setValue

    return {
      audit,
      guide: guideStore.value,
      loaded: auditStore.loaded && guideStore.loaded,
      saveState:
        auditStore.storageError || guideStore.storageError
          ? "error"
          : !auditStore.loaded || !guideStore.loaded
            ? "loading"
            : audit.updatedAt > (auditStore.savedAt ?? 0) ||
                guideStore.value.updatedAt > (guideStore.savedAt ?? 0)
              ? "saving"
              : "saved",
      savedAt: auditStore.savedAt,
      storageError: auditStore.storageError ?? guideStore.storageError,
      setMeta: (patch) =>
        mutate((current) => ({
          ...current,
          meta: { ...current.meta, ...patch },
        })),
      setEffort: (patch) =>
        mutate((current) => ({
          ...current,
          effort: { ...current.effort, ...patch },
        })),
      setSummary: (patch) =>
        mutate((current) => ({
          ...current,
          summary: { ...current.summary, ...patch },
        })),
      addTraceRow: () => {
        const id = uid("row")
        mutate((current) => ({
          ...current,
          traceability: [
            ...current.traceability,
            {
              id,
              artefact: "",
              location: "",
              computed: "",
              matches: "none",
              matchesNote: "",
              status: "Not checked",
              statusNote: "",
            },
          ],
        }))
        return id
      },
      updateTraceRow: (id, patch) =>
        mutate((current) => ({
          ...current,
          traceability: patchItem(current.traceability, id, patch),
        })),
      removeTraceRow: (id) =>
        mutate((current) => ({
          ...current,
          traceability: current.traceability.filter((row) => row.id !== id),
        })),
      moveTraceRow: (id, direction) =>
        mutate((current) => ({
          ...current,
          traceability: moveItem(current.traceability, id, direction),
        })),
      addFinding: (category) => {
        const key = uid("finding")
        mutate((current) => ({
          ...current,
          findings: [
            ...current.findings,
            { ...createEmptyFinding(category), key },
          ],
        }))
        return key
      },
      updateFinding: (key, patch) =>
        mutate((current) => {
          const target = current.findings.find((finding) => finding.key === key)
          if (!target) return current
          let nextPatch = patch
          if (!target.idTouched && "title" in patch) {
            const base = slugify(patch.title ?? "")
            const taken = new Set(
              current.findings
                .filter((finding) => finding.key !== key)
                .map((finding) => finding.id)
            )
            let candidate = base || ""
            let suffix = 2
            while (candidate && taken.has(candidate)) {
              candidate = withSlugSuffix(base, String(suffix))
              suffix += 1
            }
            nextPatch = { ...patch, id: candidate }
          }
          return {
            ...current,
            findings: current.findings.map((finding) =>
              finding.key === key
                ? {
                    ...finding,
                    ...nextPatch,
                    idTouched: "id" in patch ? true : finding.idTouched,
                  }
                : finding
            ),
          }
        }),
      removeFinding: (key) =>
        mutate((current) => ({
          ...current,
          findings: current.findings.filter((finding) => finding.key !== key),
        })),
      duplicateFinding: (key) => {
        const source = audit.findings.find((finding) => finding.key === key)
        if (!source) return null
        const nextKey = uid("finding")
        const base = source.id || slugify(source.title) || "finding"
        let candidate = withSlugSuffix(base, "copy")
        let suffix = 2
        const taken = new Set(audit.findings.map((finding) => finding.id))
        while (taken.has(candidate)) {
          candidate = withSlugSuffix(base, `copy-${suffix}`)
          suffix += 1
        }
        const copy: Finding = {
          ...source,
          key: nextKey,
          id: candidate,
          idTouched: true,
          title: `${source.title} (copy)`,
          validator: { ...source.validator },
        }
        mutate((current) => ({
          ...current,
          findings: [...current.findings, copy],
        }))
        return nextKey
      },
      moveFinding: (key, direction) =>
        mutate((current) => ({
          ...current,
          findings: moveItem(current.findings, key, direction),
        })),
      setScoreboardNote: (category, value) =>
        mutate((current) => ({
          ...current,
          scoreboardNotes: { ...current.scoreboardNotes, [category]: value },
        })),
      addTakeaway: () => {
        const id = uid("takeaway")
        mutate((current) => ({
          ...current,
          takeaways: [
            ...current.takeaways,
            {
              id,
              text: "",
              category: "missing",
              severity: "high",
              confidence: "high",
            },
          ],
        }))
        return id
      },
      updateTakeaway: (id, patch) =>
        mutate((current) => ({
          ...current,
          takeaways: patchItem(current.takeaways, id, patch),
        })),
      removeTakeaway: (id) =>
        mutate((current) => ({
          ...current,
          takeaways: current.takeaways.filter((takeaway) => takeaway.id !== id),
        })),
      moveTakeaway: (id, direction) =>
        mutate((current) => ({
          ...current,
          takeaways: moveItem(current.takeaways, id, direction),
        })),
      addItem: (key, text = "") => {
        const id = uid("item")
        mutate((current) => ({
          ...current,
          [key]: [...current[key], { id, text }],
        }))
        return id
      },
      updateItem: (key, id, text) =>
        mutate((current) => ({
          ...current,
          [key]: patchItem(current[key], id, { text }),
        })),
      removeItem: (key, id) =>
        mutate((current) => ({
          ...current,
          [key]: current[key].filter((item) => item.id !== id),
        })),
      toggleGuideStep: (id) =>
        setGuide((current) => ({
          ...current,
          updatedAt: Date.now(),
          steps: current.steps.includes(id)
            ? current.steps.filter((entry) => entry !== id)
            : [...current.steps, id],
        })),
      toggleGuideChecklist: (id) =>
        setGuide((current) => ({
          ...current,
          updatedAt: Date.now(),
          checklist: current.checklist.includes(id)
            ? current.checklist.filter((entry) => entry !== id)
            : [...current.checklist, id],
        })),
      resetAudit: () => {
        setValue(createEmptyAudit())
      },
      resetGuide: () =>
        setGuide({
          steps: [],
          checklist: [],
          updatedAt: Date.now(),
        }),
      exportBackup: () =>
        JSON.stringify(
          {
            app: "audit-assembler",
            version: 1,
            exportedAt: new Date().toISOString(),
            audit,
            guide: guideStore.value,
          },
          null,
          2
        ),
      importBackup: (json) => {
        try {
          const parsed: unknown = JSON.parse(json)
          if (!isRecord(parsed)) {
            return { ok: false, error: "The file is not a JSON object." }
          }
          const candidate = isRecord(parsed.audit) ? parsed.audit : parsed
          if (!isRecord(candidate)) {
            return { ok: false, error: "No audit data found in this file." }
          }
          const recognised = [
            "meta",
            "effort",
            "summary",
            "traceability",
            "findings",
          ].some((key) => key in candidate)
          if (!recognised) {
            return {
              ok: false,
              error: "This JSON does not look like an Audit Assembler backup.",
            }
          }
          const next = { ...normalizeAudit(candidate), updatedAt: Date.now() }
          setValue(next)
          if (isRecord(parsed.guide)) {
            setGuide(normalizeGuide(parsed.guide))
          }
          return { ok: true }
        } catch {
          return { ok: false, error: "Could not parse this JSON file." }
        }
      },
    }
  }, [auditStore, guideStore, mutate])

  return <AuditContext.Provider value={store}>{children}</AuditContext.Provider>
}

export function useAudit(): AuditStore {
  const store = React.useContext(AuditContext)
  if (!store) {
    throw new Error("useAudit must be used inside <AuditProvider>")
  }
  return store
}
