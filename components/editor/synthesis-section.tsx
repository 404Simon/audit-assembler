"use client"

import * as React from "react"
import { PlusIcon, TrashIcon } from "lucide-react"

import { ExamplesButton } from "@/components/audit/examples-button"
import { CategoryBadge, SeverityBadge } from "@/components/audit/status-badges"
import { SelectField } from "@/components/audit/form"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAudit } from "@/lib/audit/store"
import {
  CATEGORY_INFO,
  CONFIDENCES,
  FINDING_CATEGORIES,
  SEVERITIES,
  SEVERITY_INFO,
  type Takeaway,
} from "@/lib/audit/types"
import { scoreboardCounts } from "@/lib/audit/validation"

const SEVERITY_OPTIONS = SEVERITIES.map((value) => ({
  value,
  label: SEVERITY_INFO[value].label,
}))

const CONFIDENCE_OPTIONS = CONFIDENCES.map((value) => ({
  value,
  label: value.charAt(0).toUpperCase() + value.slice(1),
}))

const CATEGORY_OPTIONS = FINDING_CATEGORIES.map((category) => ({
  value: category,
  label: CATEGORY_INFO[category].label,
}))

function takeawayScore(takeaway: Takeaway) {
  return (
    SEVERITY_INFO[takeaway.severity].score *
    SEVERITY_INFO[takeaway.confidence].score
  )
}

export function SynthesisSection() {
  const {
    audit,
    setScoreboardNote,
    addTakeaway,
    updateTakeaway,
    removeTakeaway,
    addItem,
    updateItem,
    removeItem,
  } = useAudit()

  const counts = scoreboardCounts(audit)
  const takeaways = React.useMemo(
    () =>
      [...audit.takeaways].sort((a, b) => takeawayScore(b) - takeawayScore(a)),
    [audit.takeaways]
  )

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Scoreboard</CardTitle>
          <CardDescription>
            Counts and maximum severity are computed from your findings.
            Question rows are noted separately and never counted as findings.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-1">
              <ExamplesButton field="scoreboard.note" />
              <Badge variant="secondary">automatic</Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="hidden grid-cols-[1fr_auto_auto_1.6fr] gap-4 pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase sm:grid">
            <span>Category</span>
            <span>Findings</span>
            <span>Max severity</span>
            <span>Note</span>
          </div>
          <div className="flex flex-col divide-y">
            {FINDING_CATEGORIES.map((category) => {
              const entry = counts[category]
              const maxSeverity =
                entry.maxSeverity === 3
                  ? "high"
                  : entry.maxSeverity === 2
                    ? "medium"
                    : entry.maxSeverity === 1
                      ? "low"
                      : null
              return (
                <div
                  key={category}
                  className="grid gap-3 py-3 sm:grid-cols-[1fr_auto_auto_1.6fr] sm:items-center sm:gap-4"
                >
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={category} />
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {entry.findings}
                      {entry.questions > 0
                        ? ` (+${entry.questions} question${entry.questions === 1 ? "" : "s"})`
                        : ""}{" "}
                      findings
                    </span>
                  </div>
                  <div className="hidden font-mono text-sm sm:block">
                    {entry.findings}
                    {entry.questions > 0 ? (
                      <span className="text-muted-foreground">
                        {" "}
                        (+{entry.questions} question
                        {entry.questions === 1 ? "" : "s"})
                      </span>
                    ) : null}
                  </div>
                  <div className="hidden sm:block">
                    {maxSeverity ? (
                      <SeverityBadge severity={maxSeverity} />
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                  <Input
                    value={audit.scoreboardNotes[category]}
                    placeholder="One-line note for the reader"
                    aria-label={`Scoreboard note for ${category}`}
                    onChange={(event) =>
                      setScoreboardNote(category, event.target.value)
                    }
                  />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top take-aways</CardTitle>
          <CardDescription>
            At most six, ranked by severity × confidence. The report re-ranks
            them automatically. A defect that would invalidate a headline
            conclusion belongs here even at medium confidence.
          </CardDescription>
          <CardAction>
            <ExamplesButton field="takeaway.text" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {takeaways.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No take-aways yet. Add the one defect a reader should remember.
              </p>
            ) : null}
            {takeaways.map((takeaway, index) => (
              <div
                key={takeaway.id}
                className="flex flex-col gap-3 rounded-xl border p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex size-6 items-center justify-center rounded-full bg-muted font-mono text-xs">
                    {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    auto-ranked
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="ml-auto"
                    aria-label="Remove take-away"
                    onClick={() => removeTakeaway(takeaway.id)}
                  >
                    <TrashIcon />
                  </Button>
                </div>
                <Textarea
                  value={takeaway.text}
                  rows={2}
                  placeholder="One sentence: the defect and why it matters for the paper."
                  onChange={(event) =>
                    updateTakeaway(takeaway.id, { text: event.target.value })
                  }
                />
                <div className="grid gap-3 sm:grid-cols-3">
                  <SelectField
                    ariaLabel="Take-away category"
                    value={takeaway.category}
                    onValueChange={(value) =>
                      updateTakeaway(takeaway.id, {
                        category: value as Takeaway["category"],
                      })
                    }
                    options={CATEGORY_OPTIONS}
                    ariaInvalid={!takeaway.category}
                  />
                  <SelectField
                    ariaLabel="Take-away severity"
                    value={takeaway.severity}
                    onValueChange={(value) =>
                      updateTakeaway(takeaway.id, {
                        severity: value as Takeaway["severity"],
                      })
                    }
                    options={SEVERITY_OPTIONS}
                  />
                  <SelectField
                    ariaLabel="Take-away confidence"
                    value={takeaway.confidence}
                    onValueChange={(value) =>
                      updateTakeaway(takeaway.id, {
                        confidence: value as Takeaway["confidence"],
                      })
                    }
                    options={CONFIDENCE_OPTIONS}
                  />
                </div>
              </div>
            ))}
            <div>
              <Button variant="outline" onClick={() => addTakeaway()}>
                <PlusIcon data-icon="inline-start" />
                Add take-away
              </Button>
            </div>
            {takeaways.length > 6 ? (
              <p className="text-xs text-severity-medium">
                More than six take-aways. Keep the six strongest, or explain in
                the report why the cap is exceeded.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {takeaways.length}/6 used.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items that genuinely look fine</CardTitle>
          <CardDescription>
            What you actively checked and found correct. This guards against a
            reflexively negative report and tells the study lead what not to
            re-check.
          </CardDescription>
          <CardAction>
            <ExamplesButton field="fineItem.text" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ItemList
            items={audit.fineItems}
            placeholder="e.g. The released split fits the scaler on the training split only; no leakage across the split."
            emptyHint="Nothing here yet. Verified numbers and working entrypoints belong here."
            onAdd={() => addItem("fineItems")}
            onUpdate={(id, text) => updateItem("fineItems", id, text)}
            onRemove={(id) => removeItem("fineItems", id)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Open questions for the authors</CardTitle>
          <CardDescription>
            Incomplete evidence, dead links, missing data, expensive
            experiments. These are not findings — say what you would need to
            turn them into findings.
          </CardDescription>
          <CardAction>
            <ExamplesButton field="question.text" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <ItemList
            items={audit.openQuestions}
            placeholder="e.g. Is there a pinned environment or lockfile for the versions used for the published numbers?"
            emptyHint="Also list what you could not check. That is useful, not a gap."
            onAdd={() => addItem("openQuestions")}
            onUpdate={(id, text) => updateItem("openQuestions", id, text)}
            onRemove={(id) => removeItem("openQuestions", id)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function ItemList({
  items,
  placeholder,
  emptyHint,
  onAdd,
  onUpdate,
  onRemove,
}: {
  items: Array<{ id: string; text: string }>
  placeholder: string
  emptyHint: string
  onAdd: () => void
  onUpdate: (id: string, text: string) => void
  onRemove: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      ) : null}
      {items.map((item, index) => (
        <div key={item.id} className="flex items-start gap-2">
          <span className="mt-2.5 w-4 shrink-0 text-right font-mono text-xs text-muted-foreground">
            {index + 1}
          </span>
          <Textarea
            value={item.text}
            rows={2}
            placeholder={placeholder}
            className="min-h-16"
            onChange={(event) => onUpdate(item.id, event.target.value)}
          />
          <Button
            variant="ghost"
            size="icon-sm"
            className="mt-1"
            aria-label="Remove item"
            onClick={() => onRemove(item.id)}
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
      <div>
        <Button variant="outline" onClick={onAdd}>
          <PlusIcon data-icon="inline-start" />
          Add item
        </Button>
      </div>
    </div>
  )
}
