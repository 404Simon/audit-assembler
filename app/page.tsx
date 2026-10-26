import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRightIcon,
  BookOpenIcon,
  ClipboardListIcon,
  FlaskConicalIcon,
  FolderSearchIcon,
  SearchIcon,
  Table2Icon,
  TerminalIcon,
} from "lucide-react"

import { CategoryBadge } from "@/components/audit/status-badges"
import { Callout } from "@/components/guide/callout"
import {
  GuideChecklist,
  GuideProgressCard,
  GuideStepToggle,
} from "@/components/guide/guide-progress"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CATEGORY_INFO, FINDING_CATEGORIES } from "@/lib/audit/types"

export const metadata: Metadata = {
  title: "Manual reproducibility review",
  description:
    "A concise guide to the manual reproducibility review: claims, repository map, traceability, running the code, method checks, findings and submission.",
}

const TOC = [
  { href: "#start", label: "Before you start" },
  { href: "#steps", label: "The six steps" },
  { href: "#categories", label: "What counts as a finding" },
  { href: "#writing", label: "Writing a finding" },
  { href: "#finishing", label: "Finishing and submitting" },
  { href: "#qa", label: "Q&A" },
  { href: "#checklist", label: "Checklist" },
]

const QA = [
  {
    q: "I am not a bioinformatician.",
    a: "You do not need to be. Follow the paper's claims and the code. You are checking whether the evidence trace holds, not whether the biology is interesting.",
  },
  {
    q: "The code does not run, or a dependency or dataset is missing.",
    a: "That is a candidate finding. Record the exact command, the environment and the error, then classify it: missing dependency or data, a bug, or an environment limitation. Say what you could not run.",
  },
  {
    q: "I cannot run the main experiment.",
    a: "Trace the code statically, run a smaller configuration if possible, and mark the limits. A careful static audit with clear limits is still useful.",
  },
  {
    q: "I found twenty issues.",
    a: "Deduplicate, apply the single-owner rule, and prioritize. Take-aways are capped at six; the findings section can hold the rest. Quality beats count.",
  },
  {
    q: "What if I find nothing?",
    a: "That is a valid audit. Say No findings identified. and explain under Items that genuinely look fine what you checked.",
  },
  {
    q: "Can I ask the authors or read GitHub issues?",
    a: "No for this study. Write the questions in the report; we want your independent view.",
  },
  {
    q: "Can I use AI, or look at the agent's findings?",
    a: "No. Do the analysis yourself, and do not read the agent's findings, the prescreening document or another reviewer's report before you finish. The examples on this site are from NeurIPS papers outside this study, so they are safe to read, but never copy them.",
  },
  {
    q: "How long should it take, and can I use my own scripts?",
    a: "There is no time limit; most papers take about a day or two. Debuggers, profilers and your own scripts are ordinary tools. Keep scripts in checks/ and cite them in the findings they support.",
  },
]

export default function GuidePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <article className="flex max-w-3xl min-w-0 flex-col gap-14 [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_table_td]:whitespace-normal [&_table_th]:whitespace-normal">
          <header id="start" className="flex scroll-mt-20 flex-col gap-5">
            <Badge
              variant="outline"
              className="w-fit border-brand/30 bg-brand/10 text-brand"
            >
              <BookOpenIcon />
              Hands-on guide
            </Badge>

            <div className="flex flex-col gap-3">
              <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Manual reproducibility review
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Check whether the code behind an ISMB paper actually produces
                the numbers the paper reports.
              </p>
            </div>

            <Callout tone="note" title="What this is">
              <p>
                You review <strong>one paper by hand</strong>, without AI. Your
                report is compared with an agent&apos;s audit of the same paper,
                and the results feed a paper we want to submit to ISMB. If you
                contribute in a meaningful way, you will be a coauthor.
              </p>
            </Callout>

            <div className="grid gap-3 sm:grid-cols-2">
              <Card size="sm">
                <CardHeader>
                  <CardTitle>You get</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  The paper PDF, usually a text dump, the authors&apos;
                  repository at a fixed snapshot, and this page.
                </CardContent>
              </Card>
              <Card size="sm">
                <CardHeader>
                  <CardTitle>You send</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-relaxed text-muted-foreground">
                  <code>audit.md</code> from the editor, plus the scripts and
                  outputs you used in a <code>checks/</code> folder. Submission
                  details will be on StudOn.
                </CardContent>
              </Card>
            </div>

            <Callout tone="stop" title="Ground rules">
              <ul className="flex list-disc flex-col gap-1.5 pl-4">
                <li>
                  No ChatGPT, Claude, Copilot or other AI assistants. If you use
                  AI anyway, tell us — it changes how we can use the review.
                </li>
                <li>
                  Do not look at our agent&apos;s findings, the prescreening
                  document, or another reviewer&apos;s report before you finish.
                  The examples on this site are from NeurIPS papers outside this
                  study; they are safe to read, but never copy them.
                </li>
              </ul>
            </Callout>

            <p className="text-sm leading-relaxed text-muted-foreground">
              There is no second reviewer, so your evidence has to stand on its
              own. There is also no time limit: take the time you need, and note
              roughly how long it took.
            </p>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/editor"
                className={buttonVariants({ size: "lg", className: "px-4" })}
              >
                Start the audit
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <Link
                href="/examples"
                className={buttonVariants({
                  variant: "outline",
                  size: "lg",
                  className: "px-4",
                })}
              >
                See real examples
              </Link>
            </div>

            <div className="lg:hidden">
              <GuideProgressCard />
            </div>
          </header>

          <section id="steps" className="flex scroll-mt-20 flex-col gap-8">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-brand uppercase">
                The path
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                The review in six steps
              </h2>
            </div>

            <Step
              id="step-1"
              number={1}
              title="Read the paper for claims"
              icon={<SearchIcon />}
            >
              <p>
                Read as an auditor, not as a domain expert: what does the paper{" "}
                <em>claim</em>, and what would have to be true in the code for
                that claim to hold? List every headline number, figure, table,
                ablation and statistical test.
              </p>
              <Callout
                tone="good"
                title="A claim is something the paper asserts as a result"
              >
                <p>
                  &ldquo;AUROC 0.91 on the test set&rdquo;; &ldquo;a 3.2% gain
                  from augmentation&rdquo;; &ldquo;the improvement is
                  significant&rdquo;; &ldquo;44 candidate genes&rdquo;. You do
                  not need to understand the biology to check whether the code
                  computes these numbers.
                </p>
              </Callout>
              <p>
                Ignore style, novelty and writing quality, and ignore minor
                issues the authors already acknowledge.
              </p>
              <GuideStepToggle id="step-1" />
            </Step>

            <Step
              id="step-2"
              number={2}
              title="Map the repository"
              icon={<FolderSearchIcon />}
            >
              <ul className="flex list-disc flex-col gap-2 pl-5">
                <li>
                  Read the README, the top-level file tree, the entrypoints, the
                  requirements and the data instructions.
                </li>
                <li>
                  Is this the repository that produced the paper&apos;s numbers,
                  or a re-implementation? Does the README match this paper?
                </li>
                <li>
                  Note which files look like the producers for your claims. You
                  will verify them in the next step.
                </li>
                <li>
                  Note the snapshot or commit. If the code changes while you
                  work, stop and ask the study lead.
                </li>
              </ul>
              <GuideStepToggle id="step-2" />
            </Step>

            <Step
              id="step-3"
              number={3}
              title="Build the traceability table"
              icon={<Table2Icon />}
            >
              <p>
                The core of the review: every headline number, figure, table,
                ablation and statistical test should point to the code that{" "}
                <em>computes</em> it. A plotting script does not count.
              </p>
              <ol className="flex list-decimal flex-col gap-2 pl-5">
                <li>Find the function or script that produces the value.</li>
                <li>
                  Run the cheapest producer. If it is too expensive, trace it
                  statically and mark the row <em>Not checked</em>.
                </li>
                <li>
                  Compare with the paper and record <em>Verified</em>,{" "}
                  <em>Mismatch</em>, <em>Missing</em> or <em>Not checked</em>.
                </li>
                <li>
                  A <em>Missing</em> row becomes a <code>missing</code> finding;
                  a <em>Mismatch</em> becomes a <code>difference</code> or{" "}
                  <code>bug</code>, depending on why it differs.
                </li>
              </ol>
              <Callout
                tone="note"
                title="This table is the most useful part of the report"
              >
                It shows what you checked, what you could not check, and which
                numbers are traceable. Even a few <em>Missing</em> rows are a
                result.
              </Callout>
              <Link
                href="/editor#traceability"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Open the traceability editor
                <ArrowRightIcon data-icon="inline-end" />
              </Link>
              <GuideStepToggle id="step-3" />
            </Step>

            <Step
              id="step-4"
              number={4}
              title="Run the code"
              icon={<TerminalIcon />}
            >
              <p>
                Run the documented command, then the smallest experiment that
                produces a reported number.
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                <li>
                  Record the exact command, environment and result. A failure is
                  evidence; copy the error message.
                </li>
                <li>
                  Classify a failure: missing dependency or data, a bug, or an
                  environment limitation.
                </li>
                <li>
                  If the full experiment is too expensive, run a toy
                  configuration, one fold or one epoch, and say what you scaled
                  down.
                </li>
                <li>
                  If you write a script to check something, keep it in{" "}
                  <code>checks/</code> and cite the script and output row in the
                  finding.
                </li>
              </ul>
              <Callout
                tone="warn"
                title="“I could not run it” is not yet a finding"
              >
                Say what you ran, what failed and where. &ldquo;train.py stops
                at line 42 because data/train.csv is not shipped and no script
                creates it&rdquo; is a finding. &ldquo;The code does not
                work&rdquo; is not.
              </Callout>
              <GuideStepToggle id="step-4" />
            </Step>

            <Step
              id="step-5"
              number={5}
              title="Inspect the method"
              icon={<FlaskConicalIcon />}
            >
              <p>
                This is where the high-severity findings usually are. Prioritize
                the headline claims.
              </p>
              <ul className="flex list-disc flex-col gap-2 pl-5">
                <li>
                  <strong>Splits.</strong> Is there a held-out test set? Are
                  related samples (patient, donor, batch, cell line) split
                  across train and test? Quantify the overlap.
                </li>
                <li>
                  <strong>Leakage.</strong> Was preprocessing fitted before the
                  split? Does selection or early stopping use the test set?
                </li>
                <li>
                  <strong>Baselines.</strong> Is there a naive baseline, run on
                  the same split, metric and tuning budget?
                </li>
                <li>
                  <strong>Statistics.</strong> Multiple comparisons, impossible
                  confidence intervals, the wrong test, selective seeds.
                </li>
                <li>
                  <strong>Paper vs code.</strong> Metric, split, preprocessing,
                  hyperparameters, aggregation, protocol. Quote both sides when
                  they differ.
                </li>
              </ul>
              <GuideStepToggle id="step-5" />
            </Step>

            <Step
              id="step-6"
              number={6}
              title="Write the report"
              icon={<ClipboardListIcon />}
            >
              <p>
                Use the editor. One finding block per defect; the YAML is
                generated from the form. The sections below cover
                classification, writing and submission.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/editor" className={buttonVariants({ size: "sm" })}>
                  Open the editor
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
                <Link
                  href="/examples"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  See example findings
                </Link>
              </div>
              <GuideStepToggle id="step-6" />
            </Step>
          </section>

          <section id="categories" className="flex scroll-mt-20 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-brand uppercase">
                Taxonomy
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                What counts as a finding
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                One category per finding. The category is the <em>owner</em> of
                the defect; cross-reference related findings instead of filing
                the same defect twice.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {FINDING_CATEGORIES.map((category) => {
                const info = CATEGORY_INFO[category]
                return (
                  <Card key={category} size="sm">
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <CategoryBadge category={category} />
                        <CardTitle>{info.definition}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm leading-relaxed text-muted-foreground">
                      {info.test}{" "}
                      <span className="text-foreground/70">
                        e.g. {info.examples}
                      </span>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Callout tone="warn" title="Not a finding">
              Style, novelty, writing quality, a harmless typo, an issue the
              authors already acknowledge, or a suspicion you could not check.
              Put the last one under <em>Open questions for the authors</em>.
            </Callout>
          </section>

          <section id="writing" className="flex scroll-mt-20 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-brand uppercase">
                Craft
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Writing a finding
              </h2>
            </div>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
              <li>
                <strong>Severity.</strong> <code>high</code> invalidates or
                materially weakens a headline conclusion, or blocks a headline
                number. <code>medium</code> affects a secondary result.{" "}
                <code>low</code> is hygiene.
              </li>
              <li>
                <strong>Confidence.</strong> <code>high</code> if you opened the
                evidence and verified it; <code>medium</code> if one branch is
                unchecked; <code>low</code> for a hypothesis.
              </li>
              <li>
                <strong>Status.</strong> <code>finding</code> when the evidence
                supports it, <code>question</code> when it is incomplete. A
                question is honest, not weak.
              </li>
              <li>
                <strong>Independence.</strong> Severity and confidence are
                independent. Do not downgrade a high-severity finding because
                your confidence is medium.
              </li>
            </ul>

            <div className="flex flex-col gap-2">
              <h3 className="font-heading text-lg font-semibold">
                Evidence rules
              </h3>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
                <li>
                  Point to something a reader can open in seconds: a file and
                  inclusive line range, a PDF page/table/figure, a URL with an
                  access date, or a script output row.
                </li>
                <li>
                  Quote <em>verbatim</em>. Re-open the file immediately before
                  writing; whitespace is part of the quote.
                </li>
                <li>
                  Do not extrapolate. If you cannot find X, the finding is
                  &ldquo;X is not in the repository&rdquo;, not &ldquo;X is
                  wrong&rdquo;.
                </li>
                <li>
                  An absence claim needs a search: say what you searched and
                  what you found.
                </li>
                <li>
                  Deterministic facts (counts, overlaps, line numbers) should
                  come from a small script. Keep it in <code>checks/</code>,
                  cite it in the finding, and submit it with{" "}
                  <code>audit.md</code>.
                </li>
                <li>
                  One defect, one finding. Cross-reference related defects.
                </li>
              </ul>
            </div>

            <Callout tone="note" title="The editor holds the schema">
              You fill in the id, category, topic, title, severity, confidence,
              status, evidence location, line range, quote, claim, concern and
              resolution. PDF evidence also needs a page/table/figure reference;
              URL evidence needs the access date. Findings need the three
              validator checks. The YAML block is generated for you, and the
              editor previews it next to the form.
            </Callout>

            <p className="text-sm leading-relaxed text-muted-foreground">
              A strong finding names the location, the exact behaviour and the
              consequence, so a reader can open the evidence and decide in
              seconds. For full examples, open{" "}
              <Link
                href="/examples"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Examples
              </Link>
              .
            </p>
          </section>

          <section id="finishing" className="flex scroll-mt-20 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-brand uppercase">
                Last mile
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Finishing and submitting
              </h2>
            </div>

            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-relaxed">
              <li>
                <strong>Summary.</strong> One paragraph on what you read, ran
                and could not run, then two or three sentences on whether the
                headline numbers reproduce and what remains unverifiable.
              </li>
              <li>
                <strong>Scoreboard and take-aways.</strong> The editor computes
                the scoreboard. Keep at most six take-aways, ranked by severity
                × confidence.
              </li>
              <li>
                <strong>What looks fine.</strong> List what you checked and
                found correct — verified numbers, a working entrypoint, a fair
                baseline. It tells us what not to re-check.
              </li>
              <li>
                <strong>Open questions.</strong> Missing data, dead links,
                expensive runs, checks you could not make. Say what would turn
                them into findings.
              </li>
              <li>
                <strong>Submit.</strong> Download <code>audit.md</code> and send
                it with your <code>checks/</code> folder. Submission details
                will be on StudOn.
              </li>
            </ul>

            <Callout tone="note" title="If you find nothing">
              A clean audit is a valid result. Write exactly{" "}
              <strong>No findings identified.</strong>, put <code>0</code> /{" "}
              <code>-</code> in the scoreboard, and explain what you checked.
            </Callout>
          </section>

          <section id="qa" className="flex scroll-mt-20 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-brand uppercase">
                Questions
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Q&amp;A
              </h2>
            </div>
            <Accordion className="rounded-xl border bg-card px-4">
              {QA.map((item, index) => (
                <AccordionItem key={item.q} value={`qa-${index}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section id="checklist" className="flex scroll-mt-20 flex-col gap-6">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium tracking-wide text-brand uppercase">
                Before you send
              </p>
              <h2 className="font-heading text-2xl font-semibold tracking-tight">
                Checklist
              </h2>
            </div>
            <GuideChecklist />
          </section>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-20 flex flex-col gap-5">
            <nav className="flex flex-col gap-1" aria-label="On this page">
              <p className="px-1 pb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                On this page
              </p>
              {TOC.map((entry) => (
                <a
                  key={entry.href}
                  href={entry.href}
                  className="rounded-md px-1 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {entry.label}
                </a>
              ))}
            </nav>
            <GuideProgressCard />
          </div>
        </aside>
      </div>
    </div>
  )
}

function Step({
  id,
  number,
  title,
  icon,
  children,
}: {
  id: string
  number: number
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 border-t pt-8 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand [&_svg]:size-4">
            {icon}
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Step {number}
            </p>
            <h3 className="font-heading text-xl font-semibold tracking-tight">
              {title}
            </h3>
          </div>
        </div>
        <div className="flex flex-col gap-4 text-sm leading-relaxed [&_a]:underline [&_a]:underline-offset-4 [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]">
          {children}
        </div>
      </div>
    </section>
  )
}
