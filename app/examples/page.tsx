import type { Metadata } from "next"

import { ExamplesBrowser } from "@/components/examples/examples-browser"

export const metadata: Metadata = {
  title: "Examples",
  description:
    "Three complete reports plus worked findings, summaries and traceability tables from NeurIPS 2025 audits.",
}

export default function ExamplesPage() {
  return <ExamplesBrowser />
}
