"use client"

import Link from "next/link"

import { ExamplesButton } from "@/components/audit/examples-button"
import { FormField, SelectField } from "@/components/audit/form"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useAudit } from "@/lib/audit/store"
import { FAMILIARITY_PAPER, FAMILIARITY_REPO } from "@/lib/audit/types"
import type { Issue } from "@/lib/audit/validation"

import { fieldIssue } from "./utils"

export function MetaSection({
  issues,
  showErrors,
}: {
  issues: Issue[]
  showErrors: boolean
}) {
  const { audit, setMeta } = useAudit()
  const { meta } = audit

  const error = (needle: string) =>
    showErrors ? fieldIssue(issues, "meta", needle)?.message : undefined

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Paper and reviewer</CardTitle>
          <CardDescription>
            These values become the header table of the report. The paper ID and
            repository snapshot let the study lead find your evidence later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                id="paper-title"
                label="Paper title"
                className="sm:col-span-2"
                error={error("paper title")}
                hint="Copy it exactly as it appears on the paper."
              >
                <Input
                  id="paper-title"
                  value={meta.paperTitle}
                  placeholder="e.g. Sparse Diffusion Autoencoder for Test-time Adapting Prediction"
                  onChange={(event) =>
                    setMeta({ paperTitle: event.target.value })
                  }
                  aria-invalid={Boolean(error("paper title"))}
                />
              </FormField>

              <FormField
                id="paper-id"
                label="Paper ID"
                error={error("paper id")}
                hint="The identifier the study lead gave you."
              >
                <Input
                  id="paper-id"
                  value={meta.paperId}
                  placeholder="e.g. 376"
                  onChange={(event) => setMeta({ paperId: event.target.value })}
                  aria-invalid={Boolean(error("paper id"))}
                />
              </FormField>

              <FormField
                id="repo"
                label="Repository / snapshot"
                error={error("repository")}
                hint="owner/repo plus the commit or snapshot you received."
              >
                <Input
                  id="repo"
                  value={meta.repo}
                  placeholder="e.g. tsinghua-fib-lab/SparseDiff @ 55d5b7b"
                  onChange={(event) => setMeta({ repo: event.target.value })}
                  aria-invalid={Boolean(error("repository"))}
                />
              </FormField>

              <FormField
                id="reviewer"
                label="Reviewer"
                error={error("reviewer")}
                hint="Your name, as you want it in the study."
              >
                <Input
                  id="reviewer"
                  value={meta.reviewer}
                  placeholder="Your name"
                  onChange={(event) =>
                    setMeta({ reviewer: event.target.value })
                  }
                  aria-invalid={Boolean(error("reviewer"))}
                />
              </FormField>

              <FormField
                id="date"
                label="Date"
                hint="Filled in automatically. Change it if you are finishing later."
              >
                <Input
                  id="date"
                  type="date"
                  value={meta.date}
                  onChange={(event) => setMeta({ date: event.target.value })}
                />
              </FormField>

              <FormField
                id="familiarity-paper"
                label="Prior familiarity with the paper"
                hint="Before you started this review."
              >
                <SelectField
                  id="familiarity-paper"
                  value={meta.familiarityPaper}
                  onValueChange={(value) =>
                    setMeta({ familiarityPaper: value })
                  }
                  options={FAMILIARITY_PAPER.map((value) => ({
                    value,
                    label: value,
                  }))}
                  placeholder="Choose one"
                />
              </FormField>

              <FormField
                id="familiarity-repo"
                label="Prior familiarity with the repository"
                hint="Before you started this review."
              >
                <SelectField
                  id="familiarity-repo"
                  value={meta.familiarityRepo}
                  onValueChange={(value) => setMeta({ familiarityRepo: value })}
                  options={FAMILIARITY_REPO.map((value) => ({
                    value,
                    label: value,
                  }))}
                  placeholder="Choose one"
                />
              </FormField>
            </div>

            <Separator />

            <FormField
              id="ai-declaration"
              label="AI / agent declaration"
              hint="Keep the default statement unless it is not true for you. If you used AI, say so here."
            >
              <Textarea
                id="ai-declaration"
                value={meta.aiDeclaration}
                rows={2}
                onChange={(event) =>
                  setMeta({ aiDeclaration: event.target.value })
                }
              />
            </FormField>

            <FormField
              id="independence"
              label="Independence statement"
              hint="You must not have seen the agent's findings, the prescreening document, or another reviewer's report before writing this."
            >
              <Textarea
                id="independence"
                value={meta.independence}
                rows={2}
                onChange={(event) =>
                  setMeta({ independence: event.target.value })
                }
              />
            </FormField>
          </FieldGroup>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Looking for a realistic header? See the{" "}
        <Link
          href="/examples"
          className="underline underline-offset-4 hover:text-foreground"
        >
          worked examples
        </Link>{" "}
        page.
      </p>
    </div>
  )
}

export function EffortSection() {
  const { audit, setEffort } = useAudit()
  const { effort } = audit

  return (
    <Card>
      <CardHeader>
        <CardTitle>Effort</CardTitle>
        <CardDescription>
          Rough numbers, for the study. There is no time limit — this is not a
          grade.
        </CardDescription>
        <CardAction>
          <ExamplesButton field="effort" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="hours"
              label="Rough total hours"
              hint="A single number is enough."
            >
              <Input
                id="hours"
                value={effort.hours}
                placeholder="e.g. 14"
                inputMode="decimal"
                onChange={(event) => setEffort({ hours: event.target.value })}
              />
            </FormField>

            <FormField
              id="sessions"
              label="Sessions / days"
              hint="How the work was spread out."
            >
              <Input
                id="sessions"
                value={effort.sessions}
                placeholder="e.g. 3 sessions over 4 days"
                onChange={(event) =>
                  setEffort({ sessions: event.target.value })
                }
              />
            </FormField>

            <FormField
              id="longest"
              label="What took longest"
              hint="The check, script or section that consumed the most time."
            >
              <Textarea
                id="longest"
                value={effort.longest}
                rows={3}
                placeholder="e.g. Re-running the demo and reconciling Table 1 row by row."
                onChange={(event) => setEffort({ longest: event.target.value })}
              />
            </FormField>

            <FormField
              id="could-not-check"
              label="What I could not check"
              hint="Missing data, expensive runs, absent appendix."
            >
              <Textarea
                id="could-not-check"
                value={effort.couldNotCheck}
                rows={3}
                placeholder="e.g. The full training run (no GPU and no dataset); Appendix E missing from the PDF."
                onChange={(event) =>
                  setEffort({ couldNotCheck: event.target.value })
                }
              />
            </FormField>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
