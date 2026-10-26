import type { ReactNode } from "react"
import {
  CheckCircle2Icon,
  InfoIcon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "cn"

type Tone = "note" | "good" | "warn" | "stop"

const TONES: Record<Tone, { className: string; icon: ReactNode }> = {
  note: {
    className: "border-brand/25 bg-brand/5 [&_svg]:text-brand",
    icon: <InfoIcon />,
  },
  good: {
    className:
      "border-severity-low/25 bg-severity-low/5 [&_svg]:text-severity-low",
    icon: <CheckCircle2Icon />,
  },
  warn: {
    className:
      "border-severity-medium/30 bg-severity-medium/5 [&_svg]:text-severity-medium",
    icon: <TriangleAlertIcon />,
  },
  stop: {
    className:
      "border-severity-high/30 bg-severity-high/5 [&_svg]:text-severity-high",
    icon: <OctagonXIcon />,
  },
}

export function Callout({
  tone = "note",
  title,
  children,
  className,
}: {
  tone?: Tone
  title?: string
  children: ReactNode
  className?: string
}) {
  const config = TONES[tone]
  return (
    <Alert className={cn("items-start", config.className, className)}>
      {config.icon}
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription className="text-foreground/80">
        {children}
      </AlertDescription>
    </Alert>
  )
}
