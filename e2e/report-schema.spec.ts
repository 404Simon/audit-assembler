import { expect, test } from "@playwright/test"
import { parse } from "yaml"

import { buildMarkdown } from "../lib/audit/export"
import {
  createEmptyAudit,
  createEmptyFinding,
  type AuditState,
  type Finding,
} from "../lib/audit/types"
import {
  validateAudit,
  validateFinding,
  type Issue,
} from "../lib/audit/validation"

const VALIDATOR = {
  quoteMatch: true,
  controlFlow: true,
  conditionSatisfiable: true,
}

function makeFinding(overrides: Partial<Finding>): Finding {
  return {
    ...createEmptyFinding("bug"),
    id: "example-finding",
    topic: "entrypoints",
    title: "Example finding",
    file: "train.py",
    lineStart: "10",
    lineEnd: "12",
    quote: "print('hello')",
    claim: "The code prints a greeting.",
    concern: "It blocks a documented command.",
    resolution: "Fix the path.",
    validator: { ...VALIDATOR },
    ...overrides,
  }
}

function makeAudit(findings: Finding[]): AuditState {
  const audit = createEmptyAudit()
  audit.meta = {
    ...audit.meta,
    paperTitle: "A paper",
    paperId: "btag000",
    repo: "owner/repo @ abc1234",
    reviewer: "Reviewer",
    date: "2026-10-27",
    familiarityPaper: "abstract only",
    familiarityRepo: "browsed",
  }
  audit.effort = {
    hours: "4",
    sessions: "1",
    longest: "Checking the entrypoint.",
    couldNotCheck: "Full training.",
  }
  audit.summary = {
    whatIDid: "Read the code and ran the demo.",
    headline: "The demo runs but training does not.",
  }
  audit.traceability = [
    {
      id: "row-1",
      artefact: "Table 1, AUROC = 0.91",
      location: "eval.py:88",
      computed: "0.84",
      matches: "partial",
      matchesNote: "R and P",
      status: "Partial",
      statusNote: "→ traceability-finding",
    },
  ]
  audit.findings = findings
  return audit
}

function errorMessages(issues: Issue[]): string[] {
  return issues
    .filter((issue) => issue.level === "error")
    .map((issue) => issue.message)
}

function findingBlocks(markdown: string): Array<Record<string, unknown>> {
  return [...markdown.matchAll(/```yaml finding\n([\s\S]*?)\n```/g)].map(
    (match) => parse(match[1]) as Record<string, unknown>
  )
}

test("manual report uses the review-agent YAML contract", () => {
  const code = makeFinding({ id: "code-finding", category: "bug" })
  const paper = makeFinding({
    id: "paper-finding",
    category: "missing",
    file: "paper.pdf",
    lineStart: "",
    lineEnd: "",
    paperRef: "Table 2, p. 5",
  })
  const csv = makeFinding({
    id: "csv-finding",
    category: "methodology",
    file: "out/check_auc.csv",
    lineStart: "",
    lineEnd: "",
    csvRow: "3",
    checkScript: "checks/check_auc.py",
  })
  const url = makeFinding({
    id: "url-finding",
    category: "difference",
    file: "https://example.org/results",
    lineStart: "",
    lineEnd: "",
    urlRetrievedAt: "2026-10-20",
  })
  const question = makeFinding({
    id: "open-question",
    category: "missing",
    status: "question",
    validator: {
      quoteMatch: false,
      controlFlow: false,
      conditionSatisfiable: false,
    },
  })
  const audit = makeAudit([code, paper, csv, url, question])

  expect(errorMessages(validateAudit(audit))).toEqual([])

  const blocks = findingBlocks(buildMarkdown(audit))
  const markdown = buildMarkdown(audit)
  expect(markdown).toContain(
    "| Table 1, AUROC = 0.91 | `eval.py:88` | 0.84 | ~ (R and P) | Partial (→ traceability-finding) |"
  )
  expect(blocks).toHaveLength(5)
  const byId = new Map(blocks.map((block) => [block.id, block]))

  expect(byId.get("code-finding")).toMatchObject({
    line_start: 10,
    line_end: 12,
    validator_pass: {
      quote_match: true,
      control_flow: true,
      condition_satisfiable: true,
    },
  })
  expect(byId.get("paper-finding")).toMatchObject({
    paper_ref: "Table 2, p. 5",
  })
  expect(byId.get("paper-finding")).not.toHaveProperty("line_start")
  expect(byId.get("csv-finding")).toMatchObject({ csv_row: 3 })
  expect(byId.get("csv-finding")).not.toHaveProperty("line_start")
  expect(byId.get("csv-finding")).not.toHaveProperty("line_end")
  expect(byId.get("url-finding")).toMatchObject({
    url_retrieved_at: "2026-10-20",
  })
  expect(byId.get("open-question")).not.toHaveProperty("validator_pass")
})

test("invalid evidence is blocked before export", () => {
  const audit = makeAudit([])
  const expectError = (finding: Finding, message: string) => {
    expect(
      errorMessages(validateFinding(finding, audit)).some((entry) =>
        entry.endsWith(message)
      )
    ).toBe(true)
  }

  const badId = makeFinding({ id: "Not_A_Slug" })
  expectError(
    badId,
    "Finding ID must be a lowercase kebab-case slug (a-z, 0-9, single dashes)."
  )

  const longId = makeFinding({ id: "a".repeat(41) })
  expectError(longId, "Finding ID must be at most 40 characters.")

  const csvWithoutRow = makeFinding({
    id: "csv-without-row",
    file: "out/check_auc.csv",
    lineStart: "",
    lineEnd: "",
    csvRow: "",
  })
  expectError(
    csvWithoutRow,
    "Output row is required when the evidence is an out/*.csv file."
  )

  const csvBadRow = makeFinding({
    id: "csv-bad-row",
    file: "out/check_auc.csv",
    lineStart: "",
    lineEnd: "",
    csvRow: "-1",
  })
  expectError(csvBadRow, "Output row must be a non-negative integer.")

  const urlBadDate = makeFinding({
    id: "url-bad-date",
    file: "https://example.org/results",
    lineStart: "",
    lineEnd: "",
    urlRetrievedAt: "20 October 2026",
  })
  expectError(
    urlBadDate,
    "URL retrieval date must be an ISO 8601 date, e.g. 2026-10-20."
  )
})
