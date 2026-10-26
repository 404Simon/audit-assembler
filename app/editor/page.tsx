import type { Metadata } from "next"

import { EditorShell } from "@/components/editor/editor-shell"

export const metadata: Metadata = {
  title: "Audit editor",
  description:
    "Piece together a manual reproducibility audit: paper header, effort, traceability, findings, scoreboard and a generated audit.md.",
}

export default function EditorPage() {
  return <EditorShell />
}
