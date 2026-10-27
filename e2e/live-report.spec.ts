import {
  expect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test"
import { readFile } from "node:fs/promises"
import { parse } from "yaml"

const PAPER_TITLE =
  "Sparse Diffusion Autoencoder for Test-time Adapting Prediction"
const PAPER_ID = "btag236"
const REPO = "tsinghua-fib-lab/SparseDiff @ 55d5b7b"
const REVIEWER = "E2E Reviewer"
const FINDING_TITLE = "Documented training command cannot start"
const FINDING_ID = "documented-training-command-cannot-start"
const QUOTE = [
  "path = '/home/alice/data/train.csv'",
  "data = pd.read_csv(path)",
].join("\n")

function watchPage(page: Page, baseURL: string | undefined) {
  const problems: string[] = []
  const siteOrigin = new URL(baseURL ?? page.url()).origin
  const sameOrigin = (url: string) => new URL(url).origin === siteOrigin

  page.on("pageerror", (error) => {
    problems.push(`pageerror: ${error.message}`)
  })
  page.on("console", (message) => {
    if (message.type() !== "error") return
    const text = message.text()
    // Chromium reports a failed subresource twice: once on the console and
    // once through the response listener below. Keep only non-network errors.
    if (text.startsWith("Failed to load resource:")) return
    problems.push(`console: ${text}`)
  })
  page.on("response", (response) => {
    if (response.status() < 400 || !sameOrigin(response.url())) return
    problems.push(`HTTP ${response.status()}: ${response.url()}`)
  })
  page.on("requestfailed", (request) => {
    if (!sameOrigin(request.url())) return
    // Next.js link prefetches are aborted when a real navigation starts.
    if (request.failure()?.errorText === "net::ERR_ABORTED") return
    problems.push(
      `request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown"})`
    )
  })
  return problems
}

async function choose(page: Page, trigger: Locator, option: string) {
  await trigger.click()
  const popup = page.locator('[data-slot="select-content"][data-open]').last()
  await expect(popup).toBeVisible()
  await popup.getByRole("option", { name: option, exact: true }).click()
  await expect(popup).toBeHidden()
}

async function openSection(page: Page, name: string) {
  await page
    .getByRole("navigation", { name: "Audit sections" })
    // Counts are appended to some labels (e.g. "Findings 1").
    .getByRole("button", { name, exact: false })
    .click()
}

async function card(page: Page, text: string) {
  // CardTitle is not a semantic heading in every deployed build, so locate the
  // card by its visible text instead.
  return page.locator('[data-slot="card"]').filter({ hasText: text }).first()
}

async function downloadMarkdown(page: Page, testInfo: TestInfo) {
  const reportCard = await card(page, "Your report")
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    reportCard
      .getByRole("button", {
        name: "Download",
        exact: true,
      })
      .click(),
  ])
  expect(download.suggestedFilename()).toBe("audit.md")
  const path = testInfo.outputPath(`audit-${Date.now()}.md`)
  await download.saveAs(path)
  return { path, text: await readFile(path, "utf8") }
}

test("files, exports, resets, imports and re-exports a complete audit", async ({
  page,
}, testInfo) => {
  const problems = watchPage(page, testInfo.project.use.baseURL)
  const editor = /\/editor\/?$/

  // The home page must load through the Pages base path and keep guide state.
  await page.goto("./")
  await expect(page).toHaveTitle(
    /Manual reproducibility review|Audit Assembler/
  )
  await expect(
    page.getByRole("checkbox", {
      name: "I read the paper and listed every headline claim.",
    })
  ).toBeVisible()
  await page.getByRole("button", { name: "Mark done" }).first().click()
  await expect(
    page.getByRole("complementary").getByText("1 of 6 steps marked done")
  ).toBeVisible()
  const claims = page.getByRole("checkbox", {
    name: "I read the paper and listed every headline claim.",
  })
  await claims.click()
  await expect(claims).toHaveAttribute("aria-checked", "true")

  await page
    .getByRole("banner")
    .getByRole("link", { name: /Open (the )?editor/i })
    .click()
  await expect(page).toHaveURL(editor)

  // Section 1: paper and reviewer.
  await page.locator("#paper-title").fill(PAPER_TITLE)
  await page.locator("#paper-id").fill(PAPER_ID)
  await page.locator("#repo").fill(REPO)
  await page.locator("#reviewer").fill(REVIEWER)
  await choose(
    page,
    page.getByLabel("Prior familiarity with the paper"),
    "abstract only"
  )
  await choose(
    page,
    page.getByLabel("Prior familiarity with the repository"),
    "browsed"
  )
  // The AI and independence statements are prefilled; assert they survive.
  await expect(page.locator("#ai-declaration")).not.toHaveValue("")
  await expect(page.locator("#independence")).not.toHaveValue("")

  // Section 2: effort.
  await openSection(page, "Effort")
  await page.locator("#hours").fill("14")
  await page.locator("#sessions").fill("3 sessions over 4 days")
  await page
    .locator("#longest")
    .fill("Re-running the demo and reconciling Table 1 row by row.")
  await page
    .locator("#could-not-check")
    .fill("The full training run (no GPU and no dataset).")

  // Section 3: summary.
  await openSection(page, "Summary")
  await page
    .getByLabel("What I did", { exact: true })
    .fill(
      "I read the paper, mapped the repository, and ran the documented demo. " +
        "I could not rerun full training because no dataset ships with the code."
    )
  await page
    .getByLabel("Headline", { exact: true })
    .fill(
      "The released code cannot reproduce the headline numbers as documented: " +
        "the training entrypoint references a private absolute path. The demo is runnable."
    )

  // Section 4: traceability.
  await openSection(page, "Traceability")
  await page.getByRole("button", { name: "Add the first row" }).click()
  const traceCard = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("Row 1", { exact: true }) })
  await traceCard
    .getByPlaceholder("e.g. Table 1, AUROC = 0.91")
    .fill("Table 1, AUROC = 0.91")
  await traceCard.getByPlaceholder("e.g. eval.py:88").fill("eval.py:88")
  await traceCard.getByPlaceholder("e.g. 0.84").fill("0.84")
  await traceCard
    .locator('[aria-label="Matches paper"]')
    .getByRole("button", { name: "✗ no" })
    .click()
  await choose(
    page,
    traceCard.getByRole("combobox", {
      name: "Traceability status",
      exact: true,
    }),
    "Mismatch"
  )

  // Section 5: one complete finding.
  await openSection(page, "Findings")
  await page.getByRole("button", { name: "New finding" }).click()
  const titleInput = page.locator('[id^="title-"]')
  await expect(titleInput).toBeVisible()
  const findingKey = (await titleInput.getAttribute("id"))!.replace(
    /^title-/,
    ""
  )
  const finding = page.locator(`#finding-${findingKey}`)

  await titleInput.fill(FINDING_TITLE)
  await page.locator(`#topic-${findingKey}`).fill("entrypoints")
  await page.locator(`#file-${findingKey}`).fill("train.py")
  await page.locator(`#line-start-${findingKey}`).fill("42")
  await page.locator(`#line-end-${findingKey}`).fill("44")
  await page.locator(`#quote-${findingKey}`).fill(QUOTE)
  await page
    .locator(`#claim-${findingKey}`)
    .fill(
      "train.py opens an absolute path under /home/alice that is not in the repository."
    )
  await page
    .locator(`#concern-${findingKey}`)
    .fill(
      "The documented training entrypoint cannot start on any other machine, so the headline model cannot be retrained."
    )
  await page
    .locator(`#resolution-${findingKey}`)
    .fill(
      "Ship the data or a download script, or make the path relative and document the expected layout."
    )

  // Auto-generated ID and the failure-mode fields.
  await expect(page.locator(`#id-${findingKey}`)).toHaveValue(FINDING_ID)
  await choose(page, page.locator(`#category-${findingKey}`), "Bug")
  await finding
    .locator('[aria-label="Severity"]')
    .getByRole("button", { name: "High", exact: true })
    .click()
  await finding
    .locator('[aria-label="Confidence"]')
    .getByRole("button", { name: "High", exact: true })
    .click()

  // Validator pass: all three checks are mandatory for status "finding".
  for (const label of [
    "Quote matches the evidence",
    "Control flow claim is correct",
    "Condition is reachable",
  ]) {
    const checkbox = finding.getByRole("checkbox", { name: label })
    await checkbox.click()
    await expect(checkbox).toHaveAttribute("aria-checked", "true")
  }

  // Section 6: synthesis.
  await openSection(page, "Take-aways & questions")
  await page
    .getByLabel("Scoreboard note for bug")
    .fill("Entrypoint is unusable without the private data path.")
  await page.getByRole("button", { name: "Add take-away" }).click()
  await page
    .getByPlaceholder(
      "One sentence: the defect and why it matters for the paper."
    )
    .fill(
      "The documented training command cannot start, so the headline model cannot be retrained."
    )
  await choose(page, page.getByLabel("Take-away category"), "Bug")
  await choose(page, page.getByLabel("Take-away severity"), "High")
  await choose(page, page.getByLabel("Take-away confidence"), "High")

  const fineCard = await card(page, "Items that genuinely look fine")
  await fineCard.getByRole("button", { name: "Add item" }).click()
  await fineCard
    .getByPlaceholder(/released split fits the scaler/)
    .fill(
      "The released demo runs end to end and writes the reported metrics file."
    )

  const questionCard = await card(page, "Open questions for the authors")
  await questionCard.getByRole("button", { name: "Add item" }).click()
  await questionCard
    .getByPlaceholder(/pinned environment or lockfile/)
    .fill(
      "Is there a pinned environment or lockfile for the published numbers?"
    )

  // Review and export: no blocking issues, then download the report.
  await openSection(page, "Review & export")
  await expect(
    page.getByText("No blocking issues", { exact: true })
  ).toBeVisible()
  await expect(
    (await card(page, "Readiness check")).getByText("0 errors", {
      exact: true,
    })
  ).toBeVisible()

  // The on-screen preview renders the same document that is downloaded.
  const reportPreview = await card(page, "Your report")
  await expect(
    reportPreview.getByRole("heading", {
      name: `Manual review — ${PAPER_TITLE}`,
    })
  ).toBeVisible()
  await reportPreview.getByRole("tab", { name: "Markdown" }).click()
  await expect(reportPreview.locator("pre")).toContainText(`id: ${FINDING_ID}`)

  const first = await downloadMarkdown(page, testInfo)
  expect(first.text).toContain(`# Manual review — ${PAPER_TITLE}`)
  expect(first.text).toContain(`| Paper ID | \`${PAPER_ID}\` |`)
  expect(first.text).toContain(`| Repository / snapshot | \`${REPO}\` |`)
  expect(first.text).toContain(`| Reviewer | ${REVIEWER} |`)
  expect(first.text).toContain(
    "| Table 1, AUROC = 0.91 | `eval.py:88` | 0.84 | ✗ | Mismatch |"
  )
  expect(first.text).not.toContain("REPLACE ME")
  expect(first.text).toContain(
    "1. The documented training command cannot start, so the headline model cannot be retrained. — `bug`, high."
  )
  expect(first.text).toContain(
    "- The released demo runs end to end and writes the reported metrics file."
  )
  expect(first.text).toContain(
    "- Is there a pinned environment or lockfile for the published numbers?"
  )
  expect(first.text).toContain(
    "| bug | 1 | high | Entrypoint is unusable without the private data path. |"
  )

  const yamlBlock = first.text.match(/```yaml finding\n([\s\S]*?)\n```/)
  expect(yamlBlock).not.toBeNull()
  const findingData = parse(yamlBlock![1]) as Record<string, unknown>
  expect(findingData).toMatchObject({
    id: FINDING_ID,
    category: "bug",
    topic: "entrypoints",
    title: FINDING_TITLE,
    severity: "high",
    confidence: "high",
    status: "finding",
    file: "train.py",
    line_start: 42,
    line_end: 44,
    quote: `${QUOTE}\n`,
    cross_refs: [],
    validator_pass: {
      quote_match: true,
      control_flow: true,
      condition_satisfiable: true,
    },
  })

  // Download the JSON backup from the same UI.
  const [backupDownload] = await Promise.all([
    page.waitForEvent("download"),
    (await card(page, "Saved in this browser"))
      .getByRole("button", { name: "Download backup" })
      .click(),
  ])
  expect(backupDownload.suggestedFilename()).toBe("audit-backup.json")
  const backupPath = testInfo.outputPath("audit-backup.json")
  await backupDownload.saveAs(backupPath)
  const backup = JSON.parse(await readFile(backupPath, "utf8"))
  expect(backup).toMatchObject({
    app: "audit-assembler",
    version: 1,
    audit: {
      meta: { paperTitle: PAPER_TITLE, paperId: PAPER_ID },
      findings: [{ id: FINDING_ID }],
    },
    guide: { steps: ["step-1"], checklist: ["claims"] },
  })
  expect(backup.audit.traceability).toHaveLength(1)
  expect(backup.audit.takeaways).toHaveLength(1)
  expect(backup.audit.fineItems).toHaveLength(1)
  expect(backup.audit.openQuestions).toHaveLength(1)
  expect(backup.exportedAt).toMatch(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
  )

  // Reload: autosave must have persisted the whole report.
  await page.reload()
  await openSection(page, "Paper & reviewer")
  await expect(page.locator("#paper-title")).toHaveValue(PAPER_TITLE)
  await openSection(page, "Findings")
  await expect(page.getByText(FINDING_TITLE, { exact: true })).toBeVisible()

  // Deliberately change guide progress so the import has something to restore.
  await page.goto("./")
  await expect(
    page.getByRole("complementary").getByText("1 of 6 steps marked done")
  ).toBeVisible()
  await page.getByRole("button", { name: "Done", exact: true }).first().click()
  await claims.click()
  await expect(
    page.getByRole("complementary").getByText("0 of 6 steps marked done")
  ).toBeVisible()
  await expect(claims).toHaveAttribute("aria-checked", "false")

  // Reset the audit through the destructive dialog, then import the backup.
  await page.goto("./editor/")
  await openSection(page, "Review & export")
  await page.getByRole("button", { name: "Reset audit" }).click()
  const alert = page.getByRole("alertdialog")
  await expect(alert).toBeVisible()
  await alert.getByRole("button", { name: "Reset everything" }).click()
  await expect(page.locator("#paper-title")).toHaveValue("")

  await openSection(page, "Review & export")
  const chooserPromise = page.waitForEvent("filechooser")
  await page.getByRole("button", { name: "Import backup" }).click()
  const chooser = await chooserPromise
  await chooser.setFiles(backupPath)
  const importDialog = page.getByRole("alertdialog")
  await expect(importDialog).toBeVisible()
  await importDialog.getByRole("button", { name: "Import backup" }).click()
  await expect(
    page.getByText(
      "Backup imported. Your audit and guide progress were replaced."
    )
  ).toBeVisible()

  // The imported audit matches the original, field for field.
  await openSection(page, "Paper & reviewer")
  await expect(page.locator("#paper-title")).toHaveValue(PAPER_TITLE)
  await expect(page.locator("#paper-id")).toHaveValue(PAPER_ID)
  await openSection(page, "Findings")
  await expect(page.getByText(FINDING_TITLE, { exact: true })).toBeVisible()

  // A second export must be byte-for-byte identical to the first.
  await openSection(page, "Review & export")
  await expect(
    page.getByText("No blocking issues", { exact: true })
  ).toBeVisible()
  const second = await downloadMarkdown(page, testInfo)
  expect(second.text).toBe(first.text)

  // Guide progress travelled with the backup as well.
  await page.goto("./")
  await expect(
    page.getByRole("complementary").getByText("1 of 6 steps marked done")
  ).toBeVisible()
  await expect(claims).toHaveAttribute("aria-checked", "true")

  // The real site produced no console errors and no failed same-origin requests.
  expect(problems).toEqual([])
})
