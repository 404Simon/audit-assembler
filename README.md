# Audit Assembler

An interactive, local-first companion for manual reproducibility reviews. It turns the ISMB
code-audit template into a guided form: fill in the paper header, effort, traceability table,
findings, scoreboard and take-aways, then download a study-ready `audit.md` with valid
`yaml finding` blocks generated for you.

Built with Next.js 16 (static export), React 19, Tailwind CSS v4 and shadcn/ui on Base UI.

## Pages

| Route       | What it is                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `/`         | The six-step review guide, finding categories, writing and submission guidance, Q&A, checklist.                         |
| `/editor`   | The form-based audit editor with live validation, YAML preview and export.                                              |
| `/examples` | Three complete reports plus worked findings, summaries and traceability tables from held-out NeurIPS 2025 agent audits. |

The editor is one audit per browser. Sections deep-link through the hash, e.g.
`/editor#findings` or `/editor#export`.

## What is generated

`audit.md` follows the study template: paper/reviewer table, effort, summary, traceability,
one section per finding category, scoreboard, top take-aways, items that look fine and open
questions. Findings are the only hand-off format that matters:

```yaml finding
id: documented-command-cannot-start
category: bug
topic: "entrypoints"
title: "Documented training command cannot start"
severity: high
confidence: high
status: finding
file: train.py
line_start: 42
line_end: 42
quote: |
  path = '/home/alice/data/train.csv'
claim: "train.py opens an absolute path that is not in the repository."
concern: "The documented entrypoint cannot start, so the headline model cannot be retrained."
resolution: "Ship the data or make the path relative."
cross_refs: []
validator_pass:
  quote_match: true
  control_flow: true
  condition_satisfiable: true
```

The editor derives the finding ID from the title (and de-duplicates it), keeps multi-line
quotes verbatim, and only emits optional fields when they apply. The scoreboard, maximum
severities and take-away ranking are computed from the findings.

## Saving and backups

Everything is stored in the browser, no account, no server, no upload:

- `audit-assembler:audit:v1`: the audit
- `audit-assembler:guide:v1`: guide step and checklist progress

Autosave is debounced and flushed on `pagehide`/tab hide, so closing the tab is safe. Clearing
site data, using a different browser or a private window is not. The editor provides:

- **Download backup**: a JSON file with the audit and guide progress.
- **Import backup**: restores both on another browser.
- **Reset audit**: clears the report but keeps guide progress.

If stored JSON is unreadable, the raw value is kept under `<key>:corrupt` instead of being
silently overwritten.

## Development

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm typecheck
pnpm lint
pnpm build      # static export in out/
```

### Live end-to-end check

`pnpm test:e2e` runs a fast schema contract test plus one live check that drives
Chromium against the deployed site at
`https://404simon.github.io/audit-assembler/`. On a fresh checkout, install the
browser once with `pnpm exec playwright install chromium`.

`e2e/report-schema.spec.ts` checks the generated YAML against the review-agent
contract: code/PDF/URL/`out/*.csv` evidence, optional fields, finding IDs,
validator flags, and the readiness errors that prevent an unparseable export.

The live test:

1. opens the guide and marks progress,
2. fills a complete audit through the real editor (paper, effort, summary,
   traceability row, a validated finding, take-away, fine item, open question),
3. checks the readiness report and downloads `audit.md`,
4. parses the generated YAML finding block and verifies the report content,
5. downloads `audit-backup.json`,
6. reloads to verify autosave, resets the audit, imports the backup through the
   file picker, and checks that everything was restored,
7. downloads `audit.md` again and requires it to be byte-for-byte identical,
8. fails on page errors, HTTP errors and unexpected failed requests.

It does not mock storage, downloads, imports or the network. Run it against a
local build or preview with:

```bash
AUDIT_E2E_BASE_URL=http://localhost:3000/ pnpm test:e2e
```

Preview the exported site with any static file server, e.g. `npx serve out`.

## Deploying to GitHub Pages

The site is a static export (`output: "export"`, `trailingSlash: true`, unoptimized images).
`.github/workflows/deploy.yml` builds with pnpm and deploys `out/` through GitHub Actions.

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`.
3. The workflow reads the repository's base path from `actions/configure-pages` and passes it
   as `PAGES_BASE_PATH`, so project sites work under `/<repo>/` without editing the config. A
   user/organization site or custom domain gets an empty base path automatically.

Build locally with a base path if you want to test the subpath:

```bash
PAGES_BASE_PATH=/audit-assembler pnpm build
```

## Content and examples

- Guide copy lives in `app/page.tsx`; checklist text and step IDs are in `lib/guide.ts`.
- The editor field layout lives in `components/editor/`.
- Report/YAML generation is in `lib/audit/export.ts`; validation in `lib/audit/validation.ts`.
- Curated snippets live in `lib/examples/data.ts`; three complete example reports live in
  `lib/examples/reports.json`. Both draw on agent audits of NeurIPS 2025 papers under
  `review-agent/runs/reviews/*-nips16` and `*-r16`. **No ISMB audit is used as an example**, so the
  material cannot bias a reviewer's comparison with the agent's findings.
