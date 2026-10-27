# Audit Assembler

Local-first editor for manual reproducibility reviews. It turns the ISMB code-audit template
into a guided form and exports a study-ready `audit.md` with parseable `yaml finding` blocks.

Next.js 16 static export, React 19, Tailwind CSS v4, shadcn/ui on Base UI.

## Pages

- `/`: six-step guide, finding categories, Q&A, checklist.
- `/editor`: form, live validation, preview, `audit.md` export and backup.
- `/examples`: complete reports and worked examples from held-out NeurIPS 2025 audits.

Editor state is per browser; sections deep-link (`/editor#findings`, `/editor#export`).

## Saved data

Everything stays in localStorage: `audit-assembler:audit:v1` and `audit-assembler:guide:v1`.
Autosave is debounced and flushed on `pagehide`/tab hide. Download/import a JSON backup to move
browsers; reset clears the audit but keeps guide progress. Unreadable data is preserved under
`<key>:corrupt`.

## Development

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm build   # static export in out/
```

`pnpm test:e2e` drives Chromium against
`https://404simon.github.io/audit-assembler/` (install once with
`pnpm exec playwright install chromium`). It files a complete audit, exercises traceability
details and examples, downloads and parses `audit.md`, downloads/imports the backup, and
requires a second export to be byte-for-byte identical. Override the target with
`AUDIT_E2E_BASE_URL`; `e2e/report-schema.spec.ts` checks the YAML contract in Node.

## Deploy

GitHub Actions deploys `out/` to Pages on push to `main`; set Pages source to GitHub Actions.
For a subpath build: `PAGES_BASE_PATH=/audit-assembler pnpm build`.

## Layout

- Guide: `app/page.tsx`, `lib/guide.ts`
- Editor: `components/editor/`
- Export and validation: `lib/audit/export.ts`, `lib/audit/validation.ts`
- Examples: `lib/examples/` (NeurIPS 2025 only; no ISMB audits)
