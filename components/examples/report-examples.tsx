"use client"

import * as React from "react"
import {
  ArrowUpRightIcon,
  BookOpenIcon,
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleHelpIcon,
  ClipboardCheckIcon,
  FileSearchIcon,
  LightbulbIcon,
  QuoteIcon,
  SparklesIcon,
} from "lucide-react"

import {
  CategoryBadge,
  ConfidenceBadge,
  SeverityBadge,
  StatusBadge,
} from "@/components/audit/status-badges"
import { RichText } from "@/components/examples/rich-text"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CATEGORY_INFO,
  FINDING_CATEGORIES,
  type Finding,
  type FindingCategory,
} from "@/lib/audit/types"
import {
  REPORT_EXAMPLES,
  REPORT_MATCH_SYMBOLS,
  REPORT_TRACE_LABELS,
  reportFindingsByCategory,
  reportMaxSeverity,
  type ReportExample,
  type ReportTraceRow,
  type ReportTraceStatus,
} from "@/lib/examples/reports"
import { cn } from "cn"

const TRACE_CLASSES: Record<ReportTraceStatus, string> = {
  verified: "border-severity-low/30 bg-severity-low/10 text-severity-low",
  mismatch: "border-severity-high/30 bg-severity-high/10 text-severity-high",
  missing: "border-cat-missing/30 bg-cat-missing/10 text-cat-missing",
  partial:
    "border-severity-medium/30 bg-severity-medium/10 text-severity-medium",
  unchecked: "border-border text-muted-foreground",
}

function TraceStatusBadge({ row }: { row: ReportTraceRow }) {
  return (
    <Badge
      variant="outline"
      title={row.statusNote}
      className={cn(TRACE_CLASSES[row.status], "whitespace-nowrap")}
    >
      {REPORT_TRACE_LABELS[row.status]}
    </Badge>
  )
}

function countTrace(report: ReportExample, status: ReportTraceStatus) {
  return report.traceability.filter((row) => row.status === status).length
}

export function ReportBrowser() {
  const [selected, setSelected] = React.useState<ReportExample | null>(null)

  return (
    <>
      <div className="flex flex-col gap-4">
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          Three complete reports, rendered from held-out NeurIPS 2025 agent
          audits. They show the whole shape of a review — summary, traceability,
          findings, scoreboard and synthesis — not just isolated findings. The
          reports are lightly edited: duplicate findings are folded, prose is
          trimmed, and scoreboard notes are added where the run left them blank.
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          {REPORT_EXAMPLES.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onOpen={() => setSelected(report)}
            />
          ))}
        </div>
      </div>

      <ReportDialog report={selected} onClose={() => setSelected(null)} />
    </>
  )
}

function ReportCard({
  report,
  onOpen,
}: {
  report: ReportExample
  onOpen: () => void
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className="text-muted-foreground">
            {report.venue}
          </Badge>
          <Badge
            variant="outline"
            className="border-brand/30 bg-brand/10 text-brand"
          >
            audit {report.audit}
          </Badge>
          <Badge
            variant="outline"
            className="text-muted-foreground"
            title={
              report.arms === 2
                ? "Two independent audit passes"
                : "One audit pass"
            }
          >
            {report.run} · {report.arms} arm{report.arms === 1 ? "" : "s"}
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug">{report.paper}</CardTitle>
        <CardDescription className="font-mono text-xs">
          {report.repo}
          {report.commit ? ` @ ${report.commit}` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
          <RichText text={report.summary.headline} />
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          <span>
            <strong className="text-foreground">
              {report.findings.length}
            </strong>{" "}
            findings
          </span>
          <span>
            <strong className="text-foreground">
              {report.traceability.length}
            </strong>{" "}
            artefacts
          </span>
          <span>
            <strong className="text-foreground">
              {report.fineItems.length}
            </strong>{" "}
            verified fine
          </span>
          <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-1">
            {FINDING_CATEGORIES.map((category) => {
              const count = reportFindingsByCategory(report, category).length
              return (
                <span key={category} className="flex items-center gap-1">
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      CATEGORY_INFO[category].dot
                    )}
                  />
                  {count} {CATEGORY_INFO[category].label.toLowerCase()}
                </span>
              )
            })}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" onClick={onOpen}>
          Read the full report
          <ArrowUpRightIcon data-icon="inline-end" />
        </Button>
      </CardFooter>
    </Card>
  )
}

function ReportDialog({
  report,
  onClose,
}: {
  report: ReportExample | null
  onClose: () => void
}) {
  if (!report) return null

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-x-hidden overflow-y-auto p-0 sm:max-w-5xl">
        <DialogHeader className="sticky top-0 z-10 gap-3 border-b bg-popover px-5 py-4 shadow-sm sm:px-7">
          <div className="flex flex-wrap items-center gap-1.5 pr-8">
            <Badge variant="outline" className="text-muted-foreground">
              {report.venue}
            </Badge>
            <Badge
              variant="outline"
              className="border-brand/30 bg-brand/10 text-brand"
            >
              audit {report.audit}
            </Badge>
            <Badge
              variant="outline"
              className="text-muted-foreground"
              title={
                report.arms === 2
                  ? "Two independent audit passes"
                  : "One audit pass"
              }
            >
              {report.run} · {report.arms} arm{report.arms === 1 ? "" : "s"}
            </Badge>
          </div>
          <DialogTitle className="max-w-3xl text-lg leading-snug break-words">
            {report.paper}
          </DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {report.repo}
            {report.commit ? ` @ ${report.commit}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-9 px-5 py-6 sm:px-7">
          <Section
            icon={BookOpenIcon}
            title="Summary"
            hint="What the reviewer did, then the one-paragraph verdict."
          >
            <div className="grid gap-3 lg:grid-cols-2">
              <div className="flex min-w-0 flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                <SubLabel>What I did</SubLabel>
                <p className="text-sm leading-relaxed">
                  <RichText text={report.summary.whatIDid} />
                </p>
              </div>
              <div className="flex min-w-0 flex-col gap-2 rounded-xl border border-brand/20 bg-brand/5 p-4">
                <SubLabel>Headline</SubLabel>
                <p className="text-sm leading-relaxed">
                  <RichText text={report.summary.headline} />
                </p>
              </div>
            </div>
          </Section>

          <Section
            icon={FileSearchIcon}
            title="Traceability"
            hint="One row per paper artefact. Verified rows are as important as missing ones."
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  "verified",
                  "mismatch",
                  "missing",
                  "partial",
                  "unchecked",
                ] as ReportTraceStatus[]
              ).map((status) => (
                <Badge
                  key={status}
                  variant="outline"
                  className={TRACE_CLASSES[status]}
                >
                  {countTrace(report, status)} {REPORT_TRACE_LABELS[status]}
                </Badge>
              ))}
            </div>
            <div className="min-w-0 overflow-x-auto rounded-xl border bg-card">
              <Table className="[&_td]:break-words [&_td]:whitespace-normal [&_th]:whitespace-normal">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-44">Paper artefact</TableHead>
                    <TableHead className="min-w-36">Repo location</TableHead>
                    <TableHead className="min-w-44">Computed</TableHead>
                    <TableHead className="w-14 text-center">Match</TableHead>
                    <TableHead className="w-24">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.traceability.map((row, index) => (
                    <TableRow key={`${row.artefact}-${index}`}>
                      <TableCell className="align-top text-sm">
                        <RichText text={row.artefact} />
                      </TableCell>
                      <TableCell className="align-top font-mono text-xs break-words text-muted-foreground">
                        {row.location || "—"}
                      </TableCell>
                      <TableCell className="align-top text-sm">
                        <RichText text={row.computed || "—"} />
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-center align-top font-mono text-sm",
                          row.matches === "yes" && "text-severity-low",
                          row.matches === "no" && "text-severity-high",
                          row.matches === "partial" && "text-severity-medium"
                        )}
                      >
                        <span title={`Matches paper: ${row.matches}`}>
                          {REPORT_MATCH_SYMBOLS[row.matches]}
                        </span>
                      </TableCell>
                      <TableCell className="align-top">
                        <TraceStatusBadge row={row} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Section>

          <Section
            icon={ClipboardCheckIcon}
            title="Findings"
            hint="Every finding in the report, grouped by category. Open one to read the quote and narrative."
          >
            <div className="flex flex-col gap-6">
              {FINDING_CATEGORIES.map((category) => (
                <FindingGroup
                  key={category}
                  category={category}
                  findings={reportFindingsByCategory(report, category)}
                />
              ))}
            </div>
          </Section>

          <Section
            icon={SparklesIcon}
            title="Scoreboard"
            hint="Counts and maximum severities are computed from the findings; the note explains the category."
          >
            <div className="min-w-0 overflow-x-auto rounded-xl border bg-card">
              <Table className="[&_td]:break-words [&_td]:whitespace-normal [&_th]:whitespace-normal">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Category</TableHead>
                    <TableHead className="w-24 text-center">Findings</TableHead>
                    <TableHead className="w-32">Max severity</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {FINDING_CATEGORIES.map((category) => {
                    const findings = reportFindingsByCategory(report, category)
                    const max = reportMaxSeverity(report, category)
                    return (
                      <TableRow key={category}>
                        <TableCell>
                          <CategoryBadge category={category} />
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">
                          {findings.length}
                        </TableCell>
                        <TableCell>
                          {max ? (
                            <SeverityBadge severity={max} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <RichText text={report.scoreboardNotes[category]} />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section
              icon={LightbulbIcon}
              title="Top take-aways"
              hint="At most six, ranked by severity × confidence."
            >
              <ol className="flex flex-col gap-3">
                {report.takeaways.map((takeaway, index) => (
                  <li
                    key={takeaway.id}
                    className="flex gap-3 border-b pb-3 last:border-0 last:pb-0"
                  >
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted font-mono text-xs">
                      {index + 1}
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CategoryBadge category={takeaway.category} />
                        <SeverityBadge severity={takeaway.severity} />
                        <span className="text-xs text-muted-foreground">
                          {takeaway.confidence} confidence
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        <RichText text={takeaway.text} />
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </Section>

            <div className="flex flex-col gap-5">
              <Section
                icon={CheckCircle2Icon}
                title="Items that genuinely look fine"
                hint="Checked and correct. This is evidence, not politeness."
              >
                <ul className="flex flex-col gap-3">
                  {report.fineItems.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-2.5 border-b pb-3 text-sm leading-relaxed last:border-0 last:pb-0"
                    >
                      <CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-severity-low" />
                      <span>
                        <RichText text={item.text} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>

              <Section
                icon={CircleHelpIcon}
                title="Open questions for the authors"
                hint="Incomplete evidence and checks that could not be made. These are not findings."
              >
                <ul className="flex flex-col gap-3">
                  {report.openQuestions.map((item) => (
                    <li
                      key={item.id}
                      className="flex gap-2.5 border-b pb-3 text-sm leading-relaxed last:border-0 last:pb-0"
                    >
                      <CircleHelpIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>
                        <RichText text={item.text} />
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            </div>
          </div>

          <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
            Rendered from the agent&apos;s audit report. Findings are verbatim
            apart from formatting; duplicate findings were folded and blank
            scoreboard notes were filled in for this example.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FindingGroup({
  category,
  findings,
}: {
  category: FindingCategory
  findings: Finding[]
}) {
  if (findings.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span
          className={cn("size-2 rounded-full", CATEGORY_INFO[category].dot)}
        />
        <h3 className="text-sm font-semibold">
          {CATEGORY_INFO[category].label}
        </h3>
        <Badge variant="secondary">{findings.length}</Badge>
        <span className="text-xs text-muted-foreground">
          {CATEGORY_INFO[category].definition}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {findings.map((finding) => (
          <FindingBlock key={finding.key} finding={finding} />
        ))}
      </div>
    </div>
  )
}

function FindingBlock({ finding }: { finding: Finding }) {
  const location = `${finding.file}${finding.lineStart ? `:${finding.lineStart}${finding.lineEnd && finding.lineEnd !== finding.lineStart ? `-${finding.lineEnd}` : ""}` : ""}`

  return (
    <details className="group rounded-xl border bg-card">
      <summary className="flex cursor-pointer list-none items-start gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <SeverityBadge severity={finding.severity} />
            {finding.status === "question" ? (
              <StatusBadge status={finding.status} />
            ) : (
              <ConfidenceBadge confidence={finding.confidence} />
            )}
            <span className="text-xs text-muted-foreground">
              {finding.topic}
            </span>
          </div>
          <p className="text-sm leading-snug font-medium">{finding.title}</p>
          <p className="font-mono text-[11px] break-all text-muted-foreground">
            {location}
          </p>
        </div>
        <ChevronDownIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>

      <div className="flex flex-col gap-4 border-t px-3.5 py-4">
        <div className="flex flex-col gap-1.5">
          <SubLabel>
            <QuoteIcon className="size-3" />
            Quote
          </SubLabel>
          <pre className="max-h-64 w-full max-w-full overflow-y-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
            {finding.quote}
          </pre>
        </div>

        {(
          [
            ["Claim", finding.claim],
            ["Concern", finding.concern],
            ["Resolution", finding.resolution],
          ] as const
        ).map(([label, text]) => (
          <div key={label} className="flex flex-col gap-1">
            <SubLabel>{label}</SubLabel>
            <p className="text-sm leading-relaxed">
              <RichText text={text} />
            </p>
          </div>
        ))}

        <div className="border-t pt-3">
          <div className="flex min-w-0 flex-col gap-1 text-xs text-muted-foreground">
            {finding.paperRef ? <span>Paper: {finding.paperRef}</span> : null}
            {finding.checkScript ? (
              <span className="font-mono break-all">
                Check: {finding.checkScript}
              </span>
            ) : null}
            {finding.crossRefs ? (
              <span className="font-mono break-all">
                Cross-refs: {finding.crossRefs}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </details>
  )
}

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-muted-foreground" />
          <h2 className="font-heading text-base font-semibold">{title}</h2>
        </div>
        {hint ? (
          <p className="pl-6 text-xs leading-relaxed text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  )
}
