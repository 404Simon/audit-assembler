export const GUIDE_STEPS = [
  {
    id: "step-1",
    title: "Read the paper for claims",
    short: "Claims",
  },
  {
    id: "step-2",
    title: "Map the repository",
    short: "Repository",
  },
  {
    id: "step-3",
    title: "Build the traceability table",
    short: "Traceability",
  },
  {
    id: "step-4",
    title: "Run the code",
    short: "Run",
  },
  {
    id: "step-5",
    title: "Inspect the method",
    short: "Method",
  },
  {
    id: "step-6",
    title: "Write the report",
    short: "Report",
  },
] as const

export type GuideStepId = (typeof GUIDE_STEPS)[number]["id"]

export const GUIDE_CHECKLIST = [
  {
    id: "claims",
    text: "I read the paper and listed every headline claim.",
  },
  {
    id: "repo-map",
    text: "I mapped the repository and found the producer candidates.",
  },
  {
    id: "traceability",
    text: "My traceability table covers every headline artefact; unchecked rows say why.",
  },
  {
    id: "run",
    text: "I ran the documented command and the cheapest headline experiment, or recorded why not.",
  },
  {
    id: "finding-fields",
    text: "Every finding has a category, severity, confidence, status, evidence, quote, claim, concern and resolution.",
  },
  {
    id: "evidence-locations",
    text: "Code evidence has line numbers; PDF evidence has a page, table or figure; URL evidence has an access date.",
  },
  {
    id: "verbatim",
    text: "Quotes are verbatim; I re-opened the evidence before writing.",
  },
  {
    id: "one-defect",
    text: "One defect per finding; related findings are cross-referenced.",
  },
  {
    id: "synthesis",
    text: "Take-aways are at most six; fine items and open questions are filled.",
  },
  {
    id: "no-findings",
    text: "If there are no findings, the report says No findings identified.",
  },
  {
    id: "placeholders",
    text: "No REPLACE ME or placeholder finding remains.",
  },
  {
    id: "scripts",
    text: "Scripts referenced in findings are in checks/ and ready to submit with audit.md.",
  },
  {
    id: "rules",
    text: "I did not use AI and did not look at the agent's findings.",
  },
] as const

export type ChecklistId = (typeof GUIDE_CHECKLIST)[number]["id"]
