"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { examplesForField, type ExampleField } from "@/lib/examples/data"

const FIELD_TITLES: Partial<Record<ExampleField, string>> = {
  "summary.whatIDid": "What I did",
  "summary.headline": "Headline",
  "finding.title": "Finding titles",
  "finding.topic": "Finding topics",
  "finding.quote": "Evidence quotes",
  "finding.claim": "Claims",
  "finding.concern": "Concerns",
  "finding.resolution": "Resolutions",
  "finding.file": "Evidence locations",
  "trace.artefact": "Paper artefacts",
  "trace.location": "Repository locations",
  "trace.computed": "Computed values",
  "trace.matchesNote": "Match details",
  "trace.statusNote": "Status details",
  "takeaway.text": "Take-aways",
  "fineItem.text": "Things that look fine",
  "question.text": "Open questions",
  "scoreboard.note": "Scoreboard notes",
  effort: "Effort notes",
}

export function ExamplesButton({
  field,
  label,
  className,
}: {
  field: ExampleField
  label?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const groups = examplesForField(field)
  const title = label ?? FIELD_TITLES[field] ?? "Examples"

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="xs"
        className={className}
        onClick={() => setOpen(true)}
      >
        <SparklesIcon data-icon="inline-start" />
        Examples
      </Button>
      <Dialog open={open} onOpenChange={(next) => setOpen(next)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Examples — {title}</DialogTitle>
            <DialogDescription>
              Concrete excerpts from held-out NeurIPS 2025 audits. Match the
              shape and level of detail, never the content: your report must
              describe your own paper.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <section key={group.title} className="flex flex-col gap-3">
                {groups.length > 1 ? (
                  <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {group.title}
                  </h3>
                ) : null}
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-3"
                  >
                    {item.source ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {item.source.venue} · audit {item.source.audit}
                        </Badge>
                        <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
                          {item.source.paper}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Short example
                      </span>
                    )}
                    {item.context ? (
                      <p className="text-xs text-muted-foreground">
                        From: {item.context}
                      </p>
                    ) : null}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {item.text}
                    </p>
                  </div>
                ))}
              </section>
            ))}
          </div>

          <DialogFooter showCloseButton>
            <Link
              href="/examples"
              className={buttonVariants({
                variant: "outline",
                className: "sm:mr-auto",
              })}
            >
              Browse all examples
              <ArrowUpRightIcon data-icon="inline-end" />
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
