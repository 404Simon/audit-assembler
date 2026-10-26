"use client"

import Link from "next/link"
import { ArrowRightIcon, CheckIcon, RotateCcwIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { useAudit } from "@/lib/audit/store"
import { GUIDE_CHECKLIST, GUIDE_STEPS, type GuideStepId } from "@/lib/guide"
import { cn } from "cn"

export function GuideProgressCard() {
  const { guide, loaded } = useAudit()
  const done = loaded ? guide.steps.length : 0
  const percent = Math.round((done / GUIDE_STEPS.length) * 100)

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Your progress</CardTitle>
        <CardDescription>
          {done} of {GUIDE_STEPS.length} steps marked done
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Progress value={percent} />
        <ol className="flex flex-col gap-1">
          {GUIDE_STEPS.map((step, index) => {
            const complete = guide.steps.includes(step.id)
            return (
              <li key={step.id}>
                <a
                  href={`#${step.id}`}
                  className="flex items-center gap-2 rounded-md px-1 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border font-mono text-[10px]",
                      complete
                        ? "border-severity-low bg-severity-low text-background"
                        : "border-border"
                    )}
                  >
                    {complete ? <CheckIcon className="size-2.5" /> : index + 1}
                  </span>
                  <span className={complete ? "line-through" : undefined}>
                    {step.short}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
        <Separator />
        <Link
          href="/editor"
          className={buttonVariants({ size: "sm", className: "w-full" })}
        >
          Open the editor
          <ArrowRightIcon data-icon="inline-end" />
        </Link>
      </CardContent>
    </Card>
  )
}

export function GuideStepToggle({ id }: { id: GuideStepId }) {
  const { guide, toggleGuideStep } = useAudit()
  const complete = guide.steps.includes(id)

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">
        {complete
          ? "Marked done. You can come back at any time."
          : "Finished this step? Mark it so you can see where you stopped."}
      </p>
      <Button
        variant={complete ? "secondary" : "outline"}
        size="sm"
        onClick={() => toggleGuideStep(id)}
      >
        <CheckIcon data-icon="inline-start" />
        {complete ? "Done" : "Mark done"}
      </Button>
    </div>
  )
}

export function GuideChecklist() {
  const { guide, loaded, toggleGuideChecklist, resetGuide } = useAudit()
  const validIds = new Set<string>(GUIDE_CHECKLIST.map((item) => item.id))
  const checked = loaded
    ? guide.checklist.filter((id) => validIds.has(id)).length
    : 0
  const percent = Math.round((checked / GUIDE_CHECKLIST.length) * 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Final checklist</CardTitle>
        <CardDescription>
          Tick items as you finish them. Progress is saved in this browser and
          included in your JSON backup.
        </CardDescription>
        <CardAction>
          <Badge variant="secondary">
            {checked}/{GUIDE_CHECKLIST.length}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Progress value={percent} />
        <div className="flex flex-col gap-2">
          {GUIDE_CHECKLIST.map((item) => {
            const id = item.id
            const isChecked = guide.checklist.includes(id)
            return (
              <label
                key={id}
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
              >
                <Checkbox
                  id={id}
                  checked={isChecked}
                  onCheckedChange={() => toggleGuideChecklist(id)}
                  className="mt-0.5"
                />
                <span
                  className={cn(
                    "text-sm leading-relaxed",
                    isChecked && "text-muted-foreground line-through"
                  )}
                >
                  {item.text}
                </span>
              </label>
            )
          })}
        </div>
        <div>
          <Button variant="ghost" size="sm" onClick={resetGuide}>
            <RotateCcwIcon data-icon="inline-start" />
            Reset guide progress
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
