"use client"

import * as React from "react"
import Link from "next/link"
import {
  AlignLeftIcon,
  BugIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CircleCheckIcon,
  DownloadIcon,
  FileTextIcon,
  HardDriveIcon,
  ListChecksIcon,
  SparklesIcon,
  Table2Icon,
  TimerIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useAudit } from "@/lib/audit/store"
import { buildMarkdown } from "@/lib/audit/export"
import {
  EDITOR_SECTIONS,
  SECTION_LABELS,
  issuesForSection,
  sectionStatus,
  validateAudit,
  type SectionId,
} from "@/lib/audit/validation"
import { cn } from "cn"
import { downloadTextFile, formatSavedAt } from "@/lib/download"

import { ExportSection } from "./export-section"
import { FindingsSection } from "./findings-section"
import { EffortSection, MetaSection } from "./meta-sections"
import { SectionHeading } from "./section-heading"
import { SummarySection } from "./summary-section"
import { SynthesisSection } from "./synthesis-section"
import { TraceabilitySection } from "./traceability-section"

const SECTION_META: Record<
  SectionId,
  { icon: React.ComponentType<{ className?: string }>; description: string }
> = {
  meta: {
    icon: FileTextIcon,
    description: "Who is reviewing, which paper, and which snapshot.",
  },
  effort: {
    icon: TimerIcon,
    description: "Rough time spent, for the study. No time limit.",
  },
  summary: {
    icon: AlignLeftIcon,
    description: "The two paragraphs a reader sees first.",
  },
  traceability: {
    icon: Table2Icon,
    description: "Map every claim to the code that computes it.",
  },
  findings: {
    icon: BugIcon,
    description: "One defect per block. The YAML is generated for you.",
  },
  synthesis: {
    icon: ListChecksIcon,
    description: "Scoreboard, take-aways, fine items, open questions.",
  },
  export: {
    icon: DownloadIcon,
    description: "Check readiness, preview the document, download audit.md.",
  },
}

const subscribeToHash = (callback: () => void) => {
  window.addEventListener("hashchange", callback)
  return () => window.removeEventListener("hashchange", callback)
}
const getHash = () => window.location.hash.replace(/^#/, "")
const getServerHash = () => ""

export function EditorShell() {
  const { audit, loaded, saveState, savedAt, storageError } = useAudit()
  const hash = React.useSyncExternalStore(
    subscribeToHash,
    getHash,
    getServerHash
  )
  const section: SectionId = EDITOR_SECTIONS.includes(hash as SectionId)
    ? (hash as SectionId)
    : "meta"
  const [focusKey, setFocusKey] = React.useState<string | null>(null)
  const [focusToken, setFocusToken] = React.useState(0)
  const [showErrors, setShowErrors] = React.useState(false)
  const [, tick] = React.useState(0)

  const issues = React.useMemo(() => validateAudit(audit), [audit])
  const errors = issues.filter((issue) => issue.level === "error").length
  const warnings = issues.filter((issue) => issue.level === "warning").length

  React.useEffect(() => {
    const interval = window.setInterval(() => tick((value) => value + 1), 15000)
    return () => window.clearInterval(interval)
  }, [])

  React.useEffect(() => {
    if (!focusKey) window.scrollTo({ top: 0, behavior: "smooth" })
  }, [section, focusKey])

  const go = React.useCallback(
    (next: SectionId, finding?: string) => {
      if (next === "export" || section === "export" || finding) {
        setShowErrors(true)
      }
      if (window.location.hash !== `#${next}`) {
        window.location.hash = next
      }
      setFocusKey(finding ?? null)
      if (finding) setFocusToken((token) => token + 1)
    },
    [section]
  )

  const pristine =
    loaded &&
    !audit.updatedAt &&
    !audit.meta.paperTitle.trim() &&
    !audit.summary.whatIDid.trim() &&
    audit.findings.length === 0

  const index = EDITOR_SECTIONS.indexOf(section)
  const previous = index > 0 ? EDITOR_SECTIONS[index - 1] : null
  const next =
    index < EDITOR_SECTIONS.length - 1 ? EDITOR_SECTIONS[index + 1] : null

  const doneCount = EDITOR_SECTIONS.filter((id) => id !== "export").filter(
    (id) => sectionDone(audit, id, issues)
  ).length
  const progress = Math.round((doneCount / (EDITOR_SECTIONS.length - 1)) * 100)
  const meta = SECTION_META[section]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10 lg:px-8">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-20 flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Your audit
              </p>
              <p className="truncate font-heading text-sm font-medium">
                {audit.meta.paperTitle.trim() || "Untitled paper"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {audit.meta.paperId.trim()
                  ? `Paper ${audit.meta.paperId}`
                  : "No paper ID yet"}
              </p>
            </div>
            <Progress value={progress} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{doneCount}/6 sections</span>
              <span>
                {pristine
                  ? "not started"
                  : `${errors} error${errors === 1 ? "" : "s"}`}
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5" aria-label="Audit sections">
            {EDITOR_SECTIONS.map((id) => {
              const Icon = SECTION_META[id].icon
              const status = sectionStatus(audit, issues, id)
              const isActive = id === section
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => go(id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1 text-left">{SECTION_LABELS[id]}</span>
                  {id === "findings" && audit.findings.length > 0 ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {audit.findings.length}
                    </span>
                  ) : id === "traceability" && audit.traceability.length > 0 ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {audit.traceability.length}
                    </span>
                  ) : null}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-1.5 rounded-full",
                      pristine
                        ? "bg-border"
                        : status.errors > 0
                          ? "bg-severity-high"
                          : status.warnings > 0
                            ? "bg-severity-medium"
                            : isActive
                              ? "bg-foreground/40"
                              : "bg-severity-low/50"
                    )}
                  />
                </button>
              )
            })}
          </nav>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1 text-xs">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <HardDriveIcon className="size-3.5" />
                {saveState === "error"
                  ? "Save failed"
                  : saveState === "loading"
                    ? "Loading…"
                    : saveState === "saving"
                      ? "Saving…"
                      : formatSavedAt(savedAt)}
              </span>
              <span className="text-muted-foreground">
                Stored only in this browser.
              </span>
            </div>
            <Button
              onClick={() =>
                downloadTextFile(
                  "audit.md",
                  buildMarkdown(audit),
                  "text/markdown;charset=utf-8"
                )
              }
            >
              <DownloadIcon data-icon="inline-start" />
              Download audit.md
            </Button>
            {storageError ? (
              <p className="text-xs text-destructive">{storageError}</p>
            ) : null}
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <HardDriveIcon className="size-3.5" />
            {saveState === "error"
              ? "Save failed"
              : saveState === "loading"
                ? "Loading…"
                : saveState === "saving"
                  ? "Saving…"
                  : formatSavedAt(savedAt)}
          </div>
          <Button
            size="sm"
            onClick={() =>
              downloadTextFile(
                "audit.md",
                buildMarkdown(audit),
                "text/markdown;charset=utf-8"
              )
            }
          >
            <DownloadIcon data-icon="inline-start" />
            audit.md
          </Button>
        </div>

        <div className="flex flex-col gap-1.5 lg:hidden">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{doneCount}/6 sections ready</span>
            <span>
              {errors} error{errors === 1 ? "" : "s"}
            </span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="-mx-1 flex items-center gap-1 overflow-x-auto pb-1 lg:hidden">
          {EDITOR_SECTIONS.map((id) => {
            const Icon = SECTION_META[id].icon
            return (
              <Button
                key={id}
                variant={id === section ? "secondary" : "ghost"}
                size="sm"
                className="shrink-0"
                onClick={() => go(id)}
              >
                <Icon data-icon="inline-start" />
                {SECTION_LABELS[id]}
              </Button>
            )
          })}
        </div>

        {loaded && !audit.meta.paperTitle.trim() && !audit.updatedAt ? (
          <Alert>
            <SparklesIcon />
            <AlertTitle>Start a new audit</AlertTitle>
            <AlertDescription>
              The form mirrors the study&apos;s template, so the YAML blocks
              come out parseable without any manual writing. New to the review?
              Read the{" "}
              <Link
                href="/"
                className="underline underline-offset-4 hover:text-foreground"
              >
                six-step guide
              </Link>{" "}
              first, or open a{" "}
              <Link
                href="/examples"
                className="underline underline-offset-4 hover:text-foreground"
              >
                worked example
              </Link>
              .
            </AlertDescription>
          </Alert>
        ) : null}

        <SectionHeading
          eyebrow={`Section ${index + 1} of ${EDITOR_SECTIONS.length}`}
          title={SECTION_LABELS[section]}
          description={meta.description}
          action={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-muted-foreground">
                {section === "findings"
                  ? `${audit.findings.length} finding${audit.findings.length === 1 ? "" : "s"}`
                  : section === "traceability"
                    ? `${audit.traceability.length} row${audit.traceability.length === 1 ? "" : "s"}`
                    : `${progress}% ready`}
              </Badge>
            </div>
          }
        />

        <div>
          {section === "meta" ? (
            <MetaSection issues={issues} showErrors={showErrors} />
          ) : null}
          {section === "effort" ? <EffortSection /> : null}
          {section === "summary" ? (
            <SummarySection issues={issues} showErrors={showErrors} />
          ) : null}
          {section === "traceability" ? (
            <TraceabilitySection issues={issues} showErrors={showErrors} />
          ) : null}
          {section === "findings" ? (
            <FindingsSection
              key={focusToken}
              issues={issues}
              focusKey={focusKey}
              showErrors={showErrors}
            />
          ) : null}
          {section === "synthesis" ? <SynthesisSection /> : null}
          {section === "export" ? (
            <ExportSection
              issues={issues}
              onNavigate={go}
              onReset={() => {
                setShowErrors(false)
                go("meta")
              }}
            />
          ) : null}
        </div>

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CircleCheckIcon className="size-3.5" />
            {pristine
              ? "Start with the paper title, or read the guide first."
              : errors === 0
                ? "No blocking issues. Keep going."
                : `${errors} blocking issue${errors === 1 ? "" : "s"} left · ${warnings} warning${warnings === 1 ? "" : "s"}`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={!previous}
              onClick={() => previous && go(previous)}
            >
              <ChevronLeftIcon data-icon="inline-start" />
              {previous ? SECTION_LABELS[previous] : "Previous"}
            </Button>
            <Button disabled={!next} onClick={() => next && go(next)}>
              {next ? SECTION_LABELS[next] : "Done"}
              <ChevronRightIcon data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function sectionDone(
  audit: ReturnType<typeof useAudit>["audit"],
  section: SectionId,
  issues: ReturnType<typeof validateAudit>
): boolean {
  if (
    issuesForSection(issues, section).some((issue) => issue.level === "error")
  )
    return false
  switch (section) {
    case "meta":
      return Boolean(
        audit.meta.paperTitle.trim() &&
        audit.meta.paperId.trim() &&
        audit.meta.repo.trim() &&
        audit.meta.reviewer.trim() &&
        audit.meta.familiarityPaper &&
        audit.meta.familiarityRepo
      )
    case "effort":
      return Boolean(audit.effort.hours.trim() && audit.effort.sessions.trim())
    case "summary":
      return Boolean(
        audit.summary.whatIDid.trim() && audit.summary.headline.trim()
      )
    case "traceability":
      return audit.traceability.some((row) => row.artefact.trim())
    case "findings":
      return (
        audit.findings.length > 0 ||
        audit.fineItems.some((item) => item.text.trim())
      )
    case "synthesis":
      return (
        audit.takeaways.some((takeaway) => takeaway.text.trim()) &&
        audit.fineItems.some((item) => item.text.trim()) &&
        audit.openQuestions.some((item) => item.text.trim())
      )
    case "export":
      return issues.every((issue) => issue.level !== "error")
  }
}
