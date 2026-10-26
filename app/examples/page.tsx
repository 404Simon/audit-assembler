import type { Metadata } from "next"

import { ExamplesBrowser } from "@/components/examples/examples-browser"

export const metadata: Metadata = {
  title: "Examples",
  description:
    "Worked findings, summaries and traceability tables from held-out NeurIPS 2025 audits.",
}

export default function ExamplesPage() {
  return <ExamplesBrowser />
}
