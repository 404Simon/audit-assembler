import * as React from "react"

import { cn } from "cn"

const INLINE = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g

/**
 * Renders the light inline markdown used in the agent reports: `code`, **bold**
 * and *emphasis*. Reports are curated, so a full markdown renderer would be
 * more machinery than the content needs.
 */
export function RichText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  const parts = text.split(INLINE).filter((part) => part !== "")

  return (
    <span className={cn("whitespace-pre-line", className)}>
      {parts.map((part, index) => {
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code
              key={index}
              className="rounded bg-muted px-1 py-0.5 font-mono text-[0.9em] break-words"
            >
              {part.slice(1, -1)}
            </code>
          )
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {part.slice(2, -2)}
            </strong>
          )
        }
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          return <em key={index}>{part.slice(1, -1)}</em>
        }
        return <React.Fragment key={index}>{part}</React.Fragment>
      })}
    </span>
  )
}
