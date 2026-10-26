import { Badge } from "@/components/ui/badge"
import { cn } from "cn"

import {
  CATEGORY_INFO,
  SEVERITY_INFO,
  type Confidence,
  type FindingCategory,
  type FindingStatus,
  type Severity,
  type TraceStatus,
} from "@/lib/audit/types"

export function CategoryBadge({
  category,
  className,
}: {
  category: FindingCategory
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(CATEGORY_INFO[category].className, className)}
    >
      {CATEGORY_INFO[category].label}
    </Badge>
  )
}

export function SeverityBadge({
  severity,
  className,
}: {
  severity: Severity
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(SEVERITY_INFO[severity].className, className)}
    >
      {SEVERITY_INFO[severity].label}
    </Badge>
  )
}

export function ConfidenceBadge({
  confidence,
  className,
}: {
  confidence: Confidence
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn("text-muted-foreground", className)}>
      {confidence} confidence
    </Badge>
  )
}

export function StatusBadge({
  status,
  className,
}: {
  status: FindingStatus
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        status === "question"
          ? "border-dashed text-muted-foreground"
          : "border-foreground/20 text-foreground",
        className
      )}
    >
      {status === "finding" ? "Finding" : "Question"}
    </Badge>
  )
}

const TRACE_CLASSES: Record<TraceStatus, string> = {
  Verified: "border-severity-low/30 bg-severity-low/10 text-severity-low",
  Mismatch: "border-severity-high/30 bg-severity-high/10 text-severity-high",
  Missing: "border-cat-missing/30 bg-cat-missing/10 text-cat-missing",
  "Not checked": "border-border text-muted-foreground",
}

export function TraceStatusBadge({
  status,
  className,
}: {
  status: TraceStatus
  className?: string
}) {
  return (
    <Badge variant="outline" className={cn(TRACE_CLASSES[status], className)}>
      {status}
    </Badge>
  )
}
