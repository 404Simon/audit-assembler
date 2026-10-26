"use client"

import { ExamplesButton } from "@/components/audit/examples-button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field"
import { Textarea } from "@/components/ui/textarea"
import { useAudit } from "@/lib/audit/store"
import type { Issue } from "@/lib/audit/validation"

import { fieldIssue } from "./utils"

export function SummarySection({
  issues,
  showErrors,
}: {
  issues: Issue[]
  showErrors: boolean
}) {
  const { audit, setSummary } = useAudit()
  const { summary } = audit

  const whatError = showErrors
    ? fieldIssue(issues, "summary", "what i did")?.message
    : undefined
  const headlineError = showErrors
    ? fieldIssue(issues, "summary", "headline")?.message
    : undefined

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>What I did</CardTitle>
          <CardDescription>
            One paragraph on what you read, what you ran, and what you could not
            run. Name the scripts or commands that produced evidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={whatError ? true : undefined}>
              <Textarea
                id="what-i-did"
                aria-label="What I did"
                aria-invalid={Boolean(whatError)}
                value={summary.whatIDid}
                rows={8}
                className="min-h-44 leading-relaxed"
                placeholder="REPLACE ME: one paragraph on what you read, what you ran, and what you could not run. Name the scripts or commands that produced evidence."
                onChange={(event) =>
                  setSummary({ whatIDid: event.target.value })
                }
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                {whatError ? (
                  <FieldError className="flex-1">{whatError}</FieldError>
                ) : (
                  <FieldDescription className="flex-1">
                    {summary.whatIDid.trim().length} characters. Mention the
                    reproduction command and where its output lives.
                  </FieldDescription>
                )}
                <ExamplesButton field="summary.whatIDid" />
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Headline</CardTitle>
          <CardDescription>
            Two or three sentences. Does the released code reproduce the
            headline numbers? What is the most consequential defect? What
            remains unverifiable?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field data-invalid={headlineError ? true : undefined}>
              <Textarea
                id="headline"
                aria-label="Headline"
                aria-invalid={Boolean(headlineError)}
                value={summary.headline}
                rows={6}
                className="min-h-32 leading-relaxed"
                placeholder="REPLACE ME: two or three sentences. Does the released code reproduce the headline numbers? What is the most consequential defect? What remains unverifiable?"
                onChange={(event) =>
                  setSummary({ headline: event.target.value })
                }
              />
              <div className="flex flex-wrap items-start justify-between gap-2">
                {headlineError ? (
                  <FieldError className="flex-1">{headlineError}</FieldError>
                ) : (
                  <FieldDescription className="flex-1">
                    {summary.headline.trim().length} characters. Do not repeat
                    the findings — the blocks carry the detail.
                  </FieldDescription>
                )}
                <ExamplesButton field="summary.headline" />
              </div>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-dashed bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
        <strong className="font-medium text-foreground">Tip.</strong> If you
        found nothing, say so here and still fill the rest of the report: a
        clean audit is a valid result. Write “No findings identified.” under the
        findings section and explain what you checked.
      </div>
    </div>
  )
}
