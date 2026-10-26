"use client"

import * as React from "react"
import ReactMarkdown, { type Components } from "react-markdown"
import remarkGfm from "remark-gfm"
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  DownloadIcon,
  FileJsonIcon,
  RotateCcwIcon,
  UploadIcon,
} from "lucide-react"

import { CopyButton } from "@/components/audit/copy-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAudit } from "@/lib/audit/store"
import { buildMarkdown } from "@/lib/audit/export"
import {
  SECTION_LABELS,
  type Issue,
  type SectionId,
} from "@/lib/audit/validation"
import { downloadTextFile, formatSavedAt } from "@/lib/download"

const MARKDOWN_FILE = "audit.md"

function clean<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const { node, ...rest } = props
  void node
  return rest
}

const markdownComponents: Components = {
  h1: (props) => (
    <h1
      className="mt-2 mb-4 font-heading text-2xl font-semibold tracking-tight"
      {...clean(props)}
    />
  ),
  h2: (props) => (
    <h2
      className="mt-8 mb-3 border-b pb-2 font-heading text-lg font-semibold tracking-tight"
      {...clean(props)}
    />
  ),
  h3: (props) => (
    <h3
      className="mt-6 mb-2 font-heading text-base font-semibold"
      {...clean(props)}
    />
  ),
  p: (props) => (
    <p className="my-3 text-sm leading-relaxed text-pretty" {...clean(props)} />
  ),
  ul: (props) => (
    <ul
      className="my-3 flex list-disc flex-col gap-1.5 pl-5 text-sm"
      {...clean(props)}
    />
  ),
  ol: (props) => (
    <ol
      className="my-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm"
      {...clean(props)}
    />
  ),
  li: (props) => <li className="leading-relaxed" {...clean(props)} />,
  strong: (props) => <strong className="font-semibold" {...clean(props)} />,
  a: (props) => (
    <a className="underline underline-offset-4" {...clean(props)} />
  ),
  table: (props) => (
    <div className="my-4 w-full overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm" {...clean(props)} />
    </div>
  ),
  thead: (props) => <thead className="bg-muted/50" {...clean(props)} />,
  th: (props) => (
    <th
      className="border-b px-3 py-2 text-left text-xs font-medium tracking-wide uppercase"
      {...clean(props)}
    />
  ),
  td: (props) => (
    <td
      className="border-b px-3 py-2 align-top text-sm last:border-r-0 [tr:last-child_&]:border-b-0"
      {...clean(props)}
    />
  ),
  code: (props) => (
    <code
      className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
      {...clean(props)}
    />
  ),
  pre: (props) => (
    <pre
      className="my-3 overflow-x-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed [&>code]:bg-transparent [&>code]:p-0"
      {...clean(props)}
    />
  ),
  hr: (props) => <hr className="my-6" {...clean(props)} />,
}

export function ExportSection({
  issues,
  onNavigate,
  onReset,
}: {
  issues: Issue[]
  onNavigate: (section: SectionId, findingKey?: string) => void
  onReset: () => void
}) {
  const {
    audit,
    saveState,
    savedAt,
    storageError,
    exportBackup,
    importBackup,
    resetAudit,
  } = useAudit()
  const [confirmReset, setConfirmReset] = React.useState(false)
  const [importMessage, setImportMessage] = React.useState<{
    ok: boolean
    text: string
  } | null>(null)
  const [pendingImport, setPendingImport] = React.useState<string | null>(null)
  const fileInput = React.useRef<HTMLInputElement>(null)

  const markdown = React.useMemo(() => buildMarkdown(audit), [audit])
  const errors = issues.filter((issue) => issue.level === "error")
  const warnings = issues.filter((issue) => issue.level === "warning")
  const wordCount = markdown.trim().split(/\s+/).length

  const grouped = React.useMemo(() => {
    const order: SectionId[] = [
      "meta",
      "effort",
      "summary",
      "traceability",
      "findings",
      "synthesis",
    ]
    return order
      .map((section) => ({
        section,
        items: issues.filter((issue) => issue.section === section),
      }))
      .filter((entry) => entry.items.length > 0)
  }, [issues])

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>Readiness check</CardTitle>
          <CardDescription>
            The report can be downloaded at any time, but unresolved issues are
            written into it as <code>REPLACE ME</code> or as an incomplete YAML
            block.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <Badge variant={errors.length > 0 ? "destructive" : "secondary"}>
                {errors.length} error{errors.length === 1 ? "" : "s"}
              </Badge>
              <Badge variant="outline" className="text-muted-foreground">
                {warnings.length} warning{warnings.length === 1 ? "" : "s"}
              </Badge>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {errors.length === 0 ? (
            <Alert>
              <CheckCircle2Icon />
              <AlertTitle>No blocking issues</AlertTitle>
              <AlertDescription>
                Every required field is filled and every finding still marked as
                a finding passed its validator. Give the preview a final read.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>
                {errors.length} item{errors.length === 1 ? "" : "s"} still need
                attention
              </AlertTitle>
              <AlertDescription>
                Click any issue to jump to the field that needs it.
              </AlertDescription>
            </Alert>
          )}

          {grouped.length > 0 ? (
            <div className="flex flex-col divide-y rounded-xl border">
              {grouped.map((group) => (
                <div key={group.section} className="flex flex-col gap-1 p-3">
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    {SECTION_LABELS[group.section]}
                  </p>
                  {group.items.map((issue) => (
                    <button
                      key={issue.id}
                      type="button"
                      onClick={() => onNavigate(issue.section, issue.findingId)}
                      className="flex items-start gap-2 rounded-md px-1 py-1.5 text-left text-sm hover:bg-muted/60"
                    >
                      <span
                        className={
                          issue.level === "error"
                            ? "mt-1.5 size-1.5 shrink-0 rounded-full bg-severity-high"
                            : "mt-1.5 size-1.5 shrink-0 rounded-full bg-severity-medium"
                        }
                      />
                      <span className="min-w-0 flex-1">{issue.message}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your report</CardTitle>
          <CardDescription>
            {MARKDOWN_FILE} · {wordCount.toLocaleString()} words · findings and
            YAML are generated from what you entered.
          </CardDescription>
          <CardAction>
            <div className="flex items-center gap-2">
              <CopyButton value={markdown} label="Copy Markdown" />
              <Button
                onClick={() =>
                  downloadTextFile(
                    MARKDOWN_FILE,
                    markdown,
                    "text/markdown;charset=utf-8"
                  )
                }
              >
                <DownloadIcon data-icon="inline-start" />
                Download
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="preview" className="gap-3">
            <TabsList>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="markdown">Markdown</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <div className="max-h-[70vh] overflow-y-auto rounded-xl border bg-card p-5 sm:p-7">
                <div className="mx-auto max-w-3xl">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="markdown">
              <div className="max-h-[70vh] overflow-auto rounded-xl border bg-muted/30">
                <pre className="p-4 font-mono text-xs leading-relaxed break-words whitespace-pre-wrap">
                  {markdown}
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved in this browser</CardTitle>
          <CardDescription>
            Everything is stored in this browser with localStorage. Nothing is
            uploaded. Closing the tab is safe; clearing site data or switching
            browsers is not.
          </CardDescription>
          <CardAction>
            <Badge
              variant={saveState === "error" ? "destructive" : "secondary"}
            >
              {saveState === "error"
                ? "save failed"
                : saveState === "saving"
                  ? "saving…"
                  : formatSavedAt(savedAt)}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {storageError ? (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>Local save is not working</AlertTitle>
              <AlertDescription>
                {storageError} Download a JSON backup now, and check that
                private browsing or storage limits are not blocking this site.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <FileJsonIcon />
              <AlertTitle>Make a backup before you switch machines</AlertTitle>
              <AlertDescription>
                The backup contains the full audit and your guide progress.
                Import it on another browser to continue exactly where you
                stopped.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() =>
                downloadTextFile(
                  "audit-backup.json",
                  exportBackup(),
                  "application/json"
                )
              }
            >
              <FileJsonIcon data-icon="inline-start" />
              Download backup
            </Button>
            <Button
              variant="outline"
              onClick={() => fileInput.current?.click()}
            >
              <UploadIcon data-icon="inline-start" />
              Import backup
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                event.target.value = ""
                if (!file) return
                const text = await file.text()
                setPendingImport(text)
              }}
            />
            <Button
              variant="destructive"
              className="sm:ml-auto"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcwIcon data-icon="inline-start" />
              Reset audit
            </Button>
          </div>

          {importMessage ? (
            <Alert variant={importMessage.ok ? "default" : "destructive"}>
              {importMessage.ok ? <CheckCircle2Icon /> : <AlertTriangleIcon />}
              <AlertTitle>
                {importMessage.ok ? "Imported" : "Import failed"}
              </AlertTitle>
              <AlertDescription>{importMessage.text}</AlertDescription>
            </Alert>
          ) : null}

          <Separator />
          <div className="flex flex-col gap-1 text-xs leading-relaxed text-muted-foreground">
            <p>
              The exported file is named <code>{MARKDOWN_FILE}</code> so it can
              be sent as-is. Keep the YAML blocks intact: they are what the
              study parses.
            </p>
            <p>
              Keep any scripts referenced in your findings in a{" "}
              <code>checks/</code> folder and submit them together with{" "}
              <code>{MARKDOWN_FILE}</code>. Upload details will be on StudOn.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingImport !== null}
        onOpenChange={(open) => {
          if (!open) setPendingImport(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import this backup?</AlertDialogTitle>
            <AlertDialogDescription>
              Importing replaces the audit and guide progress currently in this
              browser. Download a backup first if you might want the current
              version back.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!pendingImport) return
                const result = importBackup(pendingImport)
                setImportMessage({
                  ok: result.ok,
                  text: result.ok
                    ? "Backup imported. Your audit and guide progress were replaced."
                    : (result.error ?? "Could not import this file."),
                })
                setPendingImport(null)
              }}
            >
              Import backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset the audit?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears the metadata, traceability rows, findings and
              synthesis from this browser. Download a backup first if you might
              want it back. Guide progress is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                resetAudit()
                setConfirmReset(false)
                onReset()
              }}
            >
              Reset everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
