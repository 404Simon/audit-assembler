"use client"

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PlusIcon,
  Table2Icon,
  TrashIcon,
} from "lucide-react"

import { TraceStatusBadge } from "@/components/audit/status-badges"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAudit } from "@/lib/audit/store"
import { MATCH_LABELS, TRACE_STATUSES } from "@/lib/audit/types"

import { FormField, SegmentedField, SelectField } from "@/components/audit/form"
import type { Issue } from "@/lib/audit/validation"

export function TraceabilitySection({
  issues,
  showErrors,
}: {
  issues: Issue[]
  showErrors: boolean
}) {
  const { audit, addTraceRow, updateTraceRow, removeTraceRow, moveTraceRow } =
    useAudit()
  const rows = audit.traceability

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>One row per claim</CardTitle>
          <CardDescription>
            Every headline number, figure, table, ablation and statistical test
            should point to the code that computes it. A plotting script does
            not count.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Status key</span>
              {TRACE_STATUSES.map((status) => (
                <div key={status} className="flex items-center gap-1.5">
                  <TraceStatusBadge status={status} />
                  <span>
                    {status === "Verified"
                      ? "reproduced and matches"
                      : status === "Partial"
                        ? "reproduced, partly matches"
                        : status === "Mismatch"
                          ? "reproduced, differs"
                          : status === "Missing"
                            ? "no producer"
                            : "not reached"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Empty className="border bg-card">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Table2Icon />
            </EmptyMedia>
            <EmptyTitle>No traceability rows yet</EmptyTitle>
            <EmptyDescription>
              Start with the paper&apos;s headline number or main figure. Even a
              table with a few <em>Missing</em> rows is a result.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => addTraceRow()}>
              <PlusIcon data-icon="inline-start" />
              Add the first row
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <Card key={row.id} size="sm">
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Row {index + 1}
                    </span>
                    <TraceStatusBadge status={row.status} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move row up"
                      disabled={index === 0}
                      onClick={() => moveTraceRow(row.id, -1)}
                    >
                      <ArrowUpIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Move row down"
                      disabled={index === rows.length - 1}
                      onClick={() => moveTraceRow(row.id, 1)}
                    >
                      <ArrowDownIcon />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Remove row"
                      onClick={() => removeTraceRow(row.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </div>
                </div>

                <FieldGroup className="gap-4">
                  <FormField
                    label="Paper artefact"
                    exampleField="trace.artefact"
                    error={
                      showErrors
                        ? issues.find(
                            (issue) =>
                              issue.section === "traceability" &&
                              issue.level === "error" &&
                              issue.message.includes(
                                `row ${index + 1} has no paper artefact`
                              )
                          )?.message
                        : undefined
                    }
                  >
                    <Input
                      value={row.artefact}
                      placeholder="e.g. Table 1, AUROC = 0.91"
                      onChange={(event) =>
                        updateTraceRow(row.id, {
                          artefact: event.target.value,
                        })
                      }
                    />
                  </FormField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Repository location"
                      exampleField="trace.location"
                      optional
                      hint="file:line, notebook cell, paper page, URL or output file."
                    >
                      <Input
                        value={row.location}
                        placeholder="e.g. eval.py:88"
                        onChange={(event) =>
                          updateTraceRow(row.id, {
                            location: event.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Computed value"
                      exampleField="trace.computed"
                      optional
                      hint="What the code actually produced."
                    >
                      <Input
                        value={row.computed}
                        placeholder="e.g. 0.84"
                        onChange={(event) =>
                          updateTraceRow(row.id, {
                            computed: event.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Matches paper">
                      <SegmentedField
                        ariaLabel="Matches paper"
                        value={row.matches}
                        onValueChange={(value) =>
                          updateTraceRow(row.id, { matches: value })
                        }
                        options={[
                          {
                            value: "yes",
                            label: MATCH_LABELS.yes,
                            activeClassName:
                              "aria-pressed:bg-severity-low/10 aria-pressed:text-severity-low",
                          },
                          {
                            value: "no",
                            label: MATCH_LABELS.no,
                            activeClassName:
                              "aria-pressed:bg-severity-high/10 aria-pressed:text-severity-high",
                          },
                          {
                            value: "partial",
                            label: MATCH_LABELS.partial,
                            activeClassName:
                              "aria-pressed:bg-severity-medium/10 aria-pressed:text-severity-medium",
                          },
                          {
                            value: "none",
                            label: MATCH_LABELS.none,
                            activeClassName:
                              "aria-pressed:bg-muted aria-pressed:text-foreground",
                          },
                        ]}
                        className="w-full *:flex-1"
                      />
                    </FormField>

                    <FormField label="Status">
                      <SelectField
                        ariaLabel="Traceability status"
                        value={row.status}
                        onValueChange={(value) =>
                          updateTraceRow(row.id, {
                            status: value as (typeof TRACE_STATUSES)[number],
                          })
                        }
                        options={TRACE_STATUSES.map((status) => ({
                          value: status,
                          label: status,
                        }))}
                      />
                    </FormField>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      label="Match detail"
                      optional
                      exampleField="trace.matchesNote"
                      hint="Exported after the symbol, e.g. `✗ (R and P)`."
                    >
                      <Input
                        value={row.matchesNote}
                        placeholder="e.g. R and P"
                        aria-label="Matches paper detail"
                        onChange={(event) =>
                          updateTraceRow(row.id, {
                            matchesNote: event.target.value,
                          })
                        }
                      />
                    </FormField>

                    <FormField
                      label="Status detail"
                      optional
                      exampleField="trace.statusNote"
                      hint="Exported after the status, e.g. `Mismatch (→ finding-id)`."
                    >
                      <Input
                        value={row.statusNote}
                        placeholder="e.g. → finding-id"
                        aria-label="Traceability status detail"
                        onChange={(event) =>
                          updateTraceRow(row.id, {
                            statusNote: event.target.value,
                          })
                        }
                      />
                    </FormField>
                  </div>
                </FieldGroup>
              </CardContent>
            </Card>
          ))}

          <div>
            <Button variant="outline" onClick={() => addTraceRow()}>
              <PlusIcon data-icon="inline-start" />
              Add row
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
