"use client"

import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { copyText } from "@/lib/download"

export function CopyButton({
  value,
  label = "Copy",
  className,
  iconOnly = false,
}: {
  value: string
  label?: string
  className?: string
  iconOnly?: boolean
}) {
  const [copied, setCopied] = React.useState(false)

  React.useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timer)
  }, [copied])

  return (
    <Button
      type="button"
      variant="ghost"
      size={iconOnly ? "icon-xs" : "xs"}
      className={className}
      aria-label={iconOnly ? (copied ? "Copied" : label) : undefined}
      onClick={async () => {
        const ok = await copyText(value)
        if (ok) setCopied(true)
      }}
    >
      {copied ? (
        <CheckIcon data-icon={iconOnly ? undefined : "inline-start"} />
      ) : (
        <CopyIcon data-icon={iconOnly ? undefined : "inline-start"} />
      )}
      {iconOnly ? null : copied ? "Copied" : label}
    </Button>
  )
}
