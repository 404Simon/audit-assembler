"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpRightIcon,
  BookMarkedIcon,
  SearchIcon,
  SparklesIcon,
} from "lucide-react"

import { ReportBrowser } from "@/components/examples/report-examples"
import {
  CategoryBadge,
  SeverityBadge,
  TraceStatusBadge,
} from "@/components/audit/status-badges"
import { SelectField } from "@/components/audit/form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  CATEGORY_INFO,
  FINDING_CATEGORIES,
  SEVERITIES,
  type FindingCategory,
  type Severity,
} from "@/lib/audit/types"
import {
  FINE_EXAMPLES,
  FINDING_EXAMPLES,
  QUESTION_EXAMPLES,
  SCOREBOARD_NOTE_EXAMPLES,
  SUMMARY_EXAMPLES,
  TAKEAWAY_EXAMPLES,
  TRACE_EXAMPLES,
  type FindingExample,
} from "@/lib/examples/data"
import { REPORT_EXAMPLES } from "@/lib/examples/reports"
import { cn } from "cn"

type CategoryFilter = "all" | FindingCategory
type SeverityFilter = "all" | Severity

export function ExamplesBrowser() {
  const [category, setCategory] = React.useState<CategoryFilter>("all")
  const [severity, setSeverity] = React.useState<SeverityFilter>("all")
  const [query, setQuery] = React.useState("")
  const [selected, setSelected] = React.useState<FindingExample | null>(null)

  const findings = React.useMemo(() => {
    const needle = query.trim().toLowerCase()
    return FINDING_EXAMPLES.filter((finding) => {
      if (category !== "all" && finding.category !== category) return false
      if (severity !== "all" && finding.severity !== severity) return false
      if (!needle) return true
      return [
        finding.title,
        finding.topic,
        finding.claim,
        finding.concern,
        finding.file,
        finding.sourcePaper,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    })
  }, [category, severity, query])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4">
        <Badge
          variant="outline"
          className="w-fit border-brand/30 bg-brand/10 text-brand"
        >
          <SparklesIcon />
          Worked examples
        </Badge>
        <div className="flex max-w-3xl flex-col gap-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            What a strong audit looks like
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            Three complete reports plus worked findings, summaries and
            traceability tables from held-out NeurIPS 2025 audits. Use them to
            calibrate the level of evidence, not as text to reuse.
          </p>
        </div>
        <Alert className="max-w-3xl">
          <BookMarkedIcon />
          <AlertTitle>Why only NeurIPS?</AlertTitle>
          <AlertDescription>
            These audits are from papers outside the ISMB study. None of the
            ISMB papers you may review appear here, so reading them cannot bias
            your comparison with the agent&apos;s findings. Never copy a finding
            into your report: the content must describe your own paper.
          </AlertDescription>
        </Alert>
      </header>

      <Tabs defaultValue="reports" className="gap-5">
        <TabsList className="max-w-full justify-start max-sm:h-auto max-sm:w-full max-sm:flex-wrap max-sm:[&>[data-slot=tabs-trigger]]:flex-none">
          <TabsTrigger value="reports">
            Full reports
            <Badge variant="secondary">{REPORT_EXAMPLES.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="findings">
            Findings
            <Badge variant="secondary">{FINDING_EXAMPLES.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="summaries">Summaries</TabsTrigger>
          <TabsTrigger value="traceability">Traceability</TabsTrigger>
          <TabsTrigger value="synthesis">Synthesis</TabsTrigger>
        </TabsList>

        <TabsContent value="reports">
          <ReportBrowser />
        </TabsContent>

        <TabsContent value="findings" className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button
                variant={category === "all" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setCategory("all")}
              >
                All
              </Button>
              {FINDING_CATEGORIES.map((value) => (
                <Button
                  key={value}
                  variant={category === value ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setCategory(value)}
                >
                  <span
                    className={cn(
                      "size-1.5 rounded-full",
                      CATEGORY_INFO[value].dot
                    )}
                  />
                  {CATEGORY_INFO[value].label}
                </Button>
              ))}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <InputGroup className="sm:w-64">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="Search examples…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label="Search examples"
                />
              </InputGroup>
              <div className="sm:w-40">
                <SelectField
                  value={severity}
                  onValueChange={(value) =>
                    setSeverity(value as SeverityFilter)
                  }
                  options={[
                    { value: "all", label: "Any severity" },
                    ...SEVERITIES.map((value) => ({
                      value,
                      label: value.charAt(0).toUpperCase() + value.slice(1),
                    })),
                  ]}
                />
              </div>
            </div>
          </div>

          {findings.length === 0 ? (
            <Empty className="border bg-card">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>No examples match those filters</EmptyTitle>
                <EmptyDescription>
                  Clear the search or choose another category.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategory("all")
                    setSeverity("all")
                    setQuery("")
                  }}
                >
                  Reset filters
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {findings.map((finding) => (
                <Card key={finding.key} className="flex flex-col">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <CategoryBadge category={finding.category} />
                      <SeverityBadge severity={finding.severity} />
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        {finding.confidence} confidence
                      </Badge>
                    </div>
                    <CardTitle className="text-base leading-snug">
                      {finding.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-1">
                      {finding.sourcePaper}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-2">
                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                      {finding.claim}
                    </p>
                    <p className="mt-auto font-mono text-xs text-muted-foreground">
                      {finding.file}
                      {finding.lineStart ? `:${finding.lineStart}` : ""}
                    </p>
                  </CardContent>
                  <CardFooter className="justify-between gap-2">
                    <Badge variant="outline">
                      NeurIPS 2025 · audit {finding.sourceAudit}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelected(finding)}
                    >
                      Read full example
                      <ArrowUpRightIcon data-icon="inline-end" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="summaries" className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            The summary is two paragraphs: what the reviewer did, then the
            headline. Both are written in plain prose — no bullets.
          </p>
          {SUMMARY_EXAMPLES.map((example) => (
            <Card key={example.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {example.source.paper}
                </CardTitle>
                <CardDescription>
                  {example.source.venue} · audit {example.source.audit}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    What I did
                  </h3>
                  <p className="text-sm leading-relaxed">{example.whatIDid}</p>
                </div>
                <Separator />
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Headline
                  </h3>
                  <p className="text-sm leading-relaxed">{example.headline}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="traceability" className="flex flex-col gap-6">
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            One row per paper artefact. The location points at the producer, the
            computed value is what the code actually printed, and the status
            says what that means. A row marked <em>Not checked</em> is honest,
            not a failure.
          </p>
          {[...new Set(TRACE_EXAMPLES.map((row) => row.source.audit))].map(
            (audit) => {
              const rows = TRACE_EXAMPLES.filter(
                (row) => row.source.audit === audit
              )
              if (rows.length === 0) return null
              const first = rows[0]
              return (
                <Card key={audit}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {first.source.paper}
                    </CardTitle>
                    <CardDescription>
                      {first.source.venue} · audit {audit}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table className="[&_td]:whitespace-normal [&_th]:whitespace-normal">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Paper artefact</TableHead>
                          <TableHead>Repo location</TableHead>
                          <TableHead>Computed</TableHead>
                          <TableHead>Matches</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="align-top text-sm">
                              {row.artefact}
                            </TableCell>
                            <TableCell className="align-top font-mono text-xs">
                              {row.location}
                            </TableCell>
                            <TableCell className="align-top text-sm">
                              {row.computed}
                            </TableCell>
                            <TableCell className="align-top">
                              {row.matches === "yes"
                                ? "✓"
                                : row.matches === "no"
                                  ? "✗"
                                  : "—"}
                            </TableCell>
                            <TableCell className="align-top">
                              <TraceStatusBadge status={row.status} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )
            }
          )}
        </TabsContent>

        <TabsContent value="synthesis" className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top take-aways</CardTitle>
              <CardDescription>
                At most six, ranked by severity × confidence, each tagged with
                its category.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {TAKEAWAY_EXAMPLES.map((example, index) => (
                <div
                  key={example.id}
                  className="flex flex-col gap-2 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-full bg-muted font-mono text-xs">
                      {index + 1}
                    </span>
                    {example.category ? (
                      <CategoryBadge category={example.category} />
                    ) : null}
                    {example.severity ? (
                      <SeverityBadge severity={example.severity} />
                    ) : null}
                    <span className="text-xs text-muted-foreground">
                      audit {example.source.audit}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{example.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items that genuinely look fine</CardTitle>
              <CardDescription>
                Things the reviewer checked and found correct. This is evidence,
                not politeness.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {FINE_EXAMPLES.map((example) => (
                <div
                  key={example.id}
                  className="flex flex-col gap-1.5 border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm leading-relaxed">{example.text}</p>
                  <p className="text-xs text-muted-foreground">
                    audit {example.source.audit} · {example.source.venue}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open questions for the authors</CardTitle>
              <CardDescription>
                Incomplete evidence and checks that could not be made. These are
                not findings.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {QUESTION_EXAMPLES.map((example) => (
                <div
                  key={example.id}
                  className="flex flex-col gap-1.5 border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="text-sm leading-relaxed">{example.text}</p>
                  <p className="text-xs text-muted-foreground">
                    audit {example.source.audit} · {example.source.venue}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scoreboard notes</CardTitle>
              <CardDescription>
                One line per category. Counts and maximum severity are computed;
                the note explains the shape of the category.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {SCOREBOARD_NOTE_EXAMPLES.map((example) => (
                <div
                  key={example.id}
                  className="flex flex-col gap-1.5 border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-2">
                    {example.category ? (
                      <CategoryBadge category={example.category} />
                    ) : null}
                  </div>
                  <p className="text-sm leading-relaxed">{example.text}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col items-start gap-3 rounded-2xl border bg-card p-6">
        <h2 className="font-heading text-lg font-semibold">
          Ready to write your own?
        </h2>
        <p className="text-sm text-muted-foreground">
          The editor uses the same structure, with the YAML generated from your
          fields.
        </p>
        <Link href="/editor" className={buttonVariants()}>
          Open the editor
          <ArrowUpRightIcon data-icon="inline-end" />
        </Link>
      </div>

      <FindingDialog finding={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

function FindingDialog({
  finding,
  onClose,
}: {
  finding: FindingExample | null
  onClose: () => void
}) {
  if (!finding) return null

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-x-hidden overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={finding.category} />
            <SeverityBadge severity={finding.severity} />
            <Badge variant="outline">{finding.status}</Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {finding.confidence} confidence
            </Badge>
          </div>
          <DialogTitle className="text-lg leading-snug break-words">
            {finding.title}
          </DialogTitle>
          <DialogDescription>
            {finding.sourcePaper} · NeurIPS 2025 · audit {finding.sourceAudit}
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid min-w-0 gap-2 rounded-xl border bg-muted/30 p-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Topic</p>
              <p>{finding.topic}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Evidence</p>
              <p className="font-mono text-xs break-all">
                {finding.file}
                {finding.lineStart
                  ? `:${finding.lineStart}${finding.lineEnd && finding.lineEnd !== finding.lineStart ? `-${finding.lineEnd}` : ""}`
                  : ""}
              </p>
            </div>
            {finding.paperRef ? (
              <div>
                <p className="text-xs text-muted-foreground">Paper reference</p>
                <p>{finding.paperRef}</p>
              </div>
            ) : null}
            {finding.checkScript ? (
              <div>
                <p className="text-xs text-muted-foreground">Check script</p>
                <p className="font-mono text-xs break-all">
                  {finding.checkScript}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Quote
            </h3>
            <pre className="max-h-64 w-full max-w-full overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
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
            <div key={label} className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
              </h3>
              <p className="text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
