"use client"

import { CopyButton } from "@/components/audit/copy-button"

export function CodeBlock({
  code,
  language,
  caption,
}: {
  code: string
  language?: string
  caption?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-muted/30">
      <div className="flex items-center gap-2 border-b bg-card/60 px-3 py-1.5">
        <span className="font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          {language ?? "text"}
        </span>
        {caption ? (
          <span className="truncate text-xs text-muted-foreground">
            {caption}
          </span>
        ) : null}
        <CopyButton value={code} label="Copy" className="ml-auto" />
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed">
        {code}
      </pre>
    </div>
  )
}
