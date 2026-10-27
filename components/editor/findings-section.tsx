"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  CopyPlusIcon,
  PlusIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"

import { FormField, SegmentedField, SelectField } from "@/components/audit/form"
import {
  CategoryBadge,
  ConfidenceBadge,
  SeverityBadge,
  StatusBadge,
} from "@/components/audit/status-badges"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAudit } from "@/lib/audit/store"
import {
  CATEGORY_INFO,
  CONFIDENCES,
  FINDING_CATEGORIES,
  SEVERITIES,
  VALIDATOR_FIELDS,
  isCodeFile,
  isScriptOutput,
  isUrl,
  type Finding,
  type FindingCategory,
} from "@/lib/audit/types"
import type { Issue } from "@/lib/audit/validation"

import { issuesForFinding } from "./utils"

const VALIDATOR_LABELS: Record<
  (typeof VALIDATOR_FIELDS)[number],
  { label: string; hint: string }
> = {
  quoteMatch: {
    label: "Quote matches the evidence",
    hint: "I re-opened the file and the quote is verbatim, including indentation.",
  },
  controlFlow: {
    label: "Control flow claim is correct",
    hint: "I traced the path that actually reaches this code, not just the lines in isolation.",
  },
  conditionSatisfiable: {
    label: "Condition is reachable",
    hint: "The branch can be taken with the configuration the paper documents.",
  },
}

type Filter = "all" | FindingCategory

export function FindingsSection({
  issues,
  focusKey,
  showErrors,
}: {
  issues: Issue[]
  focusKey?: string | null
  showErrors: boolean
}) {
  const { audit, addFinding } = useAudit()
  const [filter, setFilter] = React.useState<Filter>("all")
  const [openKeys, setOpenKeys] = React.useState<string[]>(
    focusKey ? [focusKey] : []
  )

  React.useEffect(() => {
    if (!focusKey) return
    const timer = window.setTimeout(() => {
      document
        .getElementById(`finding-${focusKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
    return () => window.clearTimeout(timer)
  }, [focusKey])

  const counts = React.useMemo(() => {
    const base = Object.fromEntries(
      FINDING_CATEGORIES.map((category) => [category, 0])
    ) as Record<FindingCategory, number>
    for (const finding of audit.findings) base[finding.category] += 1
    return base
  }, [audit.findings])

  const visible = audit.findings.filter(
    (finding) =>
      filter === "all" ||
      finding.category === filter ||
      openKeys.includes(finding.key)
  )

  function createFinding() {
    const key = addFinding(filter === "all" ? "missing" : filter)
    setOpenKeys((current) => [...current, key])
    window.setTimeout(() => {
      document
        .getElementById(`finding-${key}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 80)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          <FilterButton
            active={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All
            <Badge variant="secondary">{audit.findings.length}</Badge>
          </FilterButton>
          {FINDING_CATEGORIES.map((category) => (
            <FilterButton
              key={category}
              active={filter === category}
              onClick={() => setFilter(category)}
            >
              <span
                className={`size-1.5 rounded-full ${CATEGORY_INFO[category].dot}`}
              />
              {CATEGORY_INFO[category].label}
              <Badge variant="secondary">{counts[category]}</Badge>
            </FilterButton>
          ))}
        </div>
        <Button onClick={createFinding} className="sm:shrink-0">
          <PlusIcon data-icon="inline-start" />
          New finding
        </Button>
      </div>

      <p className="px-1 text-xs leading-relaxed text-muted-foreground">
        The category is the <em>owner</em> of the defect. Decide by failure
        mode, not by topic: one split problem can be any of the four.{" "}
        <Link
          href="/#categories"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Category guide
        </Link>
      </p>

      {audit.findings.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TriangleAlertIcon />
            </EmptyMedia>
            <EmptyTitle>No findings yet</EmptyTitle>
            <EmptyDescription>
              A clean audit is a valid result. If you are still checking, start
              with the category that fits the failure mode.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap justify-center gap-2">
              {FINDING_CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  onClick={() => {
                    const key = addFinding(category)
                    setOpenKeys([key])
                  }}
                >
                  <span
                    className={`size-2 rounded-full ${CATEGORY_INFO[category].dot}`}
                  />
                  {CATEGORY_INFO[category].label}
                </Button>
              ))}
            </div>
          </EmptyContent>
        </Empty>
      ) : visible.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyTitle>Nothing in this category</EmptyTitle>
            <EmptyDescription>
              Keep the section empty — the report will say “None.” for it.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {visible.map((finding) => (
            <FindingCard
              key={finding.key}
              finding={finding}
              open={openKeys.includes(finding.key)}
              onToggle={() =>
                setOpenKeys((current) =>
                  current.includes(finding.key)
                    ? current.filter((key) => key !== finding.key)
                    : [...current, finding.key]
                )
              }
              onFocus={(key) => {
                setOpenKeys((current) =>
                  current.includes(key) ? current : [...current, key]
                )
                window.setTimeout(() => {
                  document
                    .getElementById(`finding-${key}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }, 80)
              }}
              issues={issuesForFinding(issues, finding.key)}
              showErrors={showErrors}
              isFirst={visible[0]?.key === finding.key}
              isLast={visible[visible.length - 1]?.key === finding.key}
            />
          ))}
          <div>
            <Button variant="outline" onClick={createFinding}>
              <PlusIcon data-icon="inline-start" />
              Add another finding
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      size="sm"
      onClick={onClick}
      data-active={active || undefined}
    >
      {children}
    </Button>
  )
}

function FindingCard({
  finding,
  open,
  onToggle,
  onFocus,
  issues,
  showErrors,
  isFirst,
  isLast,
}: {
  finding: Finding
  open: boolean
  onToggle: () => void
  onFocus: (key: string) => void
  issues: Issue[]
  showErrors: boolean
  isFirst: boolean
  isLast: boolean
}) {
  const { updateFinding, removeFinding, duplicateFinding, moveFinding } =
    useAudit()
  const [confirmDelete, setConfirmDelete] = React.useState(false)

  const errors = showErrors
    ? issues.filter((issue) => issue.level === "error")
    : []
  const warnings = showErrors
    ? issues.filter((issue) => issue.level === "warning")
    : []
  const codeFile = isCodeFile(finding.file)
  const scriptOutput = isScriptOutput(finding.file)
  const urlFile = isUrl(finding.file)

  const update = (patch: Partial<Finding>) => updateFinding(finding.key, patch)

  return (
    <>
      <Card id={`finding-${finding.key}`} className="scroll-mt-24 gap-0 py-0">
        <div
          className="flex cursor-pointer items-start gap-3 px-4 py-3.5"
          onClick={onToggle}
        >
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-full ${CATEGORY_INFO[finding.category].dot}`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <CategoryBadge category={finding.category} />
              <SeverityBadge severity={finding.severity} />
              <StatusBadge status={finding.status} />
              {finding.status === "finding" ? (
                <ConfidenceBadge confidence={finding.confidence} />
              ) : null}
              {errors.length > 0 ? (
                <Badge variant="destructive">
                  {errors.length} issue{errors.length === 1 ? "" : "s"}
                </Badge>
              ) : warnings.length > 0 ? (
                <Badge variant="outline" className="text-muted-foreground">
                  {warnings.length} warning{warnings.length === 1 ? "" : "s"}
                </Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-sm font-medium">
                {finding.title.trim() || "Untitled finding"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                {finding.id || "auto id from title"}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={open ? "Collapse finding" : "Expand finding"}
            onClick={(event) => {
              event.stopPropagation()
              onToggle()
            }}
          >
            <ChevronDownIcon
              className={
                open
                  ? "rotate-180 transition-transform"
                  : "transition-transform"
              }
            />
          </Button>
        </div>

        {open ? (
          <>
            <Separator />
            <CardContent className="flex flex-col gap-6 py-5">
              {errors.length > 0 ? (
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>Needs attention before export</AlertTitle>
                  <AlertDescription>
                    <ul className="flex list-disc flex-col gap-1 pl-4">
                      {errors.map((issue) => (
                        <li key={issue.id}>{issue.message}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              ) : null}

              <FieldGroup>
                <FormField
                  id={`title-${finding.key}`}
                  label="Title"
                  exampleField="finding.title"
                  hint={`${finding.title.trim().length}/80 characters. One line, specific enough to stand alone.`}
                >
                  <Input
                    id={`title-${finding.key}`}
                    value={finding.title}
                    placeholder="e.g. Early stopping never restores the best checkpoint"
                    onChange={(event) => update({ title: event.target.value })}
                    aria-invalid={finding.title.trim().length > 80 || undefined}
                  />
                </FormField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id={`topic-${finding.key}`}
                    label="Topic"
                    exampleField="finding.topic"
                    hint="Where it lives, e.g. data splitting, baselines, metrics."
                  >
                    <Input
                      id={`topic-${finding.key}`}
                      value={finding.topic}
                      placeholder="e.g. result traceability"
                      onChange={(event) =>
                        update({ topic: event.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id={`id-${finding.key}`}
                    label="Finding ID"
                    hint="Auto-generated from the title. Edit to override; it must be unique."
                  >
                    <Input
                      id={`id-${finding.key}`}
                      value={finding.id}
                      placeholder="kebab-case-slug"
                      className="font-mono text-xs"
                      onChange={(event) =>
                        update({ id: event.target.value, idTouched: true })
                      }
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    id={`category-${finding.key}`}
                    label="Category"
                    hint={CATEGORY_INFO[finding.category].definition}
                  >
                    <SelectField
                      id={`category-${finding.key}`}
                      value={finding.category}
                      onValueChange={(value) =>
                        update({ category: value as FindingCategory })
                      }
                      options={FINDING_CATEGORIES.map((category) => ({
                        value: category,
                        label: CATEGORY_INFO[category].label,
                      }))}
                    />
                  </FormField>

                  <FormField
                    label="Status"
                    hint="Use question when the evidence is incomplete; it is honest, not weak."
                  >
                    <SegmentedField
                      ariaLabel="Status"
                      value={finding.status}
                      onValueChange={(value) => update({ status: value })}
                      options={[
                        {
                          value: "finding",
                          label: "Finding",
                          activeClassName:
                            "aria-pressed:bg-foreground aria-pressed:text-background",
                        },
                        {
                          value: "question",
                          label: "Question",
                          activeClassName:
                            "aria-pressed:bg-muted aria-pressed:text-foreground",
                        },
                      ]}
                      className="w-full *:flex-1"
                    />
                  </FormField>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    label="Severity"
                    hint={findingsHint(finding.severity)}
                  >
                    <SegmentedField
                      ariaLabel="Severity"
                      value={finding.severity}
                      onValueChange={(value) => update({ severity: value })}
                      options={SEVERITIES.map((severity) => ({
                        value: severity,
                        label:
                          severity.charAt(0).toUpperCase() + severity.slice(1),
                        activeClassName: `${severityActive[severity]}`,
                      }))}
                      className="w-full *:flex-1"
                    />
                  </FormField>

                  <FormField
                    label="Confidence"
                    hint="High only if you opened the evidence and verified it."
                  >
                    <SegmentedField
                      ariaLabel="Confidence"
                      value={finding.confidence}
                      onValueChange={(value) => update({ confidence: value })}
                      options={CONFIDENCES.map((confidence) => ({
                        value: confidence,
                        label:
                          confidence.charAt(0).toUpperCase() +
                          confidence.slice(1),
                      }))}
                      className="w-full *:flex-1"
                    />
                  </FormField>
                </div>
              </FieldGroup>

              <Separator />

              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-medium">Evidence</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Point to something a reader can open in seconds.
                  </p>
                </div>

                <FieldGroup>
                  <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
                    <FormField
                      id={`file-${finding.key}`}
                      label="File / PDF / URL"
                      exampleField="finding.file"
                      hint="Repository-relative path, paper.pdf, an out/*.csv output file, or a URL."
                    >
                      <Input
                        id={`file-${finding.key}`}
                        value={finding.file}
                        placeholder="e.g. train.py"
                        className="font-mono text-xs"
                        onChange={(event) =>
                          update({ file: event.target.value })
                        }
                      />
                    </FormField>

                    <FormField
                      id={`line-start-${finding.key}`}
                      label="Line start"
                      hint={
                        codeFile
                          ? "Required for code, unless you cite an output row."
                          : scriptOutput
                            ? "Not needed for out/*.csv evidence; cite the output row instead."
                            : "Code only."
                      }
                    >
                      <Input
                        id={`line-start-${finding.key}`}
                        value={finding.lineStart}
                        inputMode="numeric"
                        placeholder="42"
                        onChange={(event) =>
                          update({ lineStart: event.target.value })
                        }
                      />
                    </FormField>

                    <FormField
                      id={`line-end-${finding.key}`}
                      label="Line end"
                      hint="Inclusive."
                    >
                      <Input
                        id={`line-end-${finding.key}`}
                        value={finding.lineEnd}
                        inputMode="numeric"
                        placeholder="48"
                        onChange={(event) =>
                          update({ lineEnd: event.target.value })
                        }
                      />
                    </FormField>
                  </div>

                  <FormField
                    id={`quote-${finding.key}`}
                    label="Quote"
                    exampleField="finding.quote"
                    hint="Verbatim. Re-open the file immediately before writing; whitespace is part of the quote."
                  >
                    <Textarea
                      id={`quote-${finding.key}`}
                      value={finding.quote}
                      rows={4}
                      placeholder="Paste the cited lines exactly as they appear."
                      className="font-mono text-xs leading-relaxed"
                      onChange={(event) =>
                        update({ quote: event.target.value })
                      }
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      id={`paper-ref-${finding.key}`}
                      label="Paper reference"
                      optional
                      hint="Required for PDF evidence: page, section, table or figure."
                    >
                      <Input
                        id={`paper-ref-${finding.key}`}
                        value={finding.paperRef}
                        placeholder="e.g. Section 6.2 and Table 3, p. 10"
                        onChange={(event) =>
                          update({ paperRef: event.target.value })
                        }
                      />
                    </FormField>

                    <FormField
                      id={`url-date-${finding.key}`}
                      label="URL retrieved at"
                      optional
                      hint={
                        urlFile
                          ? "Required for URL evidence: the date you accessed it."
                          : "Only for URL evidence, e.g. 2026-10-20."
                      }
                    >
                      <Input
                        id={`url-date-${finding.key}`}
                        value={finding.urlRetrievedAt}
                        placeholder="2026-10-20"
                        onChange={(event) =>
                          update({ urlRetrievedAt: event.target.value })
                        }
                      />
                    </FormField>

                    <FormField
                      id={`check-script-${finding.key}`}
                      label="Check script"
                      optional
                      hint="The script in checks/ that supports this finding. Submit it with audit.md."
                    >
                      <Input
                        id={`check-script-${finding.key}`}
                        value={finding.checkScript}
                        placeholder="e.g. checks/check_split.py"
                        className="font-mono text-xs"
                        onChange={(event) =>
                          update({ checkScript: event.target.value })
                        }
                      />
                    </FormField>

                    <FormField
                      id={`csv-row-${finding.key}`}
                      label="Output row"
                      optional
                      hint="Required for out/*.csv evidence: the 0-based row index."
                    >
                      <Input
                        id={`csv-row-${finding.key}`}
                        value={finding.csvRow}
                        placeholder="e.g. 5"
                        onChange={(event) =>
                          update({ csvRow: event.target.value })
                        }
                      />
                    </FormField>
                  </div>

                  <FormField
                    id={`cross-refs-${finding.key}`}
                    label="Cross references"
                    optional
                    hint="Related finding IDs or paper sections, comma-separated."
                  >
                    <Input
                      id={`cross-refs-${finding.key}`}
                      value={finding.crossRefs}
                      placeholder="e.g. other-finding-id, Section 5"
                      className="font-mono text-xs"
                      onChange={(event) =>
                        update({ crossRefs: event.target.value })
                      }
                    />
                  </FormField>
                </FieldGroup>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div>
                  <h4 className="text-sm font-medium">Narrative</h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    What the code does, why it matters for the claim, and what
                    you want the authors to do.
                  </p>
                </div>
                <FieldGroup>
                  <FormField
                    id={`claim-${finding.key}`}
                    label="Claim"
                    exampleField="finding.claim"
                    hint="What the cited code or artefact does. No interpretation yet."
                  >
                    <Textarea
                      id={`claim-${finding.key}`}
                      value={finding.claim}
                      rows={3}
                      placeholder="e.g. train.py:42 opens /home/alice/data/train.csv; the README command fails there because no download script creates it."
                      onChange={(event) =>
                        update({ claim: event.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id={`concern-${finding.key}`}
                    label="Concern"
                    exampleField="finding.concern"
                    hint="Why that is a problem for the paper's claim."
                  >
                    <Textarea
                      id={`concern-${finding.key}`}
                      value={finding.concern}
                      rows={3}
                      placeholder="e.g. The documented training entrypoint cannot start on any machine except the author's, so the headline model cannot be retrained."
                      onChange={(event) =>
                        update({ concern: event.target.value })
                      }
                    />
                  </FormField>

                  <FormField
                    id={`resolution-${finding.key}`}
                    label="Resolution"
                    exampleField="finding.resolution"
                    hint="A specific question or check for the authors."
                  >
                    <Textarea
                      id={`resolution-${finding.key}`}
                      value={finding.resolution}
                      rows={3}
                      placeholder="e.g. Ship the data or a download script, or make the path relative and document the expected layout."
                      onChange={(event) =>
                        update({ resolution: event.target.value })
                      }
                    />
                  </FormField>
                </FieldGroup>
              </div>

              <Separator />

              <FieldSet>
                <FieldLegend variant="label">Validator pass</FieldLegend>
                <FieldDescription>
                  Tick these only after you re-open the evidence. If any box is
                  false, use <strong>status: question</strong> instead.
                  {finding.status === "question"
                    ? " They are optional for questions."
                    : ""}
                </FieldDescription>
                <FieldGroup className="gap-2">
                  {VALIDATOR_FIELDS.map((field) => (
                    <Field
                      key={field}
                      orientation="horizontal"
                      className="items-start rounded-lg border bg-muted/20 p-3"
                    >
                      <Checkbox
                        id={`${field}-${finding.key}`}
                        checked={finding.validator[field]}
                        onCheckedChange={(checked) =>
                          update({
                            validator: {
                              ...finding.validator,
                              [field]: checked,
                            },
                          })
                        }
                        className="mt-0.5"
                      />
                      <FieldContent>
                        <FieldLabel htmlFor={`${field}-${finding.key}`}>
                          {VALIDATOR_LABELS[field].label}
                        </FieldLabel>
                        <FieldDescription>
                          {VALIDATOR_LABELS[field].hint}
                        </FieldDescription>
                      </FieldContent>
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const key = duplicateFinding(finding.key)
                    if (key) onFocus(key)
                  }}
                >
                  <CopyPlusIcon data-icon="inline-start" />
                  Duplicate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete
                </Button>
                <div className="ml-auto flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isFirst}
                    onClick={() => moveFinding(finding.key, -1)}
                  >
                    <ArrowUpIcon data-icon="inline-start" />
                    Move up
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLast}
                    onClick={() => moveFinding(finding.key, 1)}
                  >
                    <ArrowDownIcon data-icon="inline-start" />
                    Move down
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        ) : null}
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this finding?</AlertDialogTitle>
            <AlertDialogDescription>
              “{finding.title.trim() || "Untitled finding"}” will be removed
              from this browser. This cannot be undone, but your audit stays
              saved on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                removeFinding(finding.key)
                setConfirmDelete(false)
              }}
            >
              Delete finding
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

const severityActive: Record<string, string> = {
  high: "aria-pressed:border-severity-high/40 aria-pressed:bg-severity-high/10 aria-pressed:text-severity-high",
  medium:
    "aria-pressed:border-severity-medium/40 aria-pressed:bg-severity-medium/10 aria-pressed:text-severity-medium",
  low: "aria-pressed:border-severity-low/40 aria-pressed:bg-severity-low/10 aria-pressed:text-severity-low",
}

function findingsHint(severity: string) {
  if (severity === "high")
    return "Invalidates a headline conclusion, or blocks reproduction of a headline number."
  if (severity === "medium")
    return "Affects a secondary result, or needs a workaround."
  return "Hygiene: record it, but it does not move a conclusion."
}
