import type { Finding } from "@/lib/audit/types"

import rawFindings from "./neurips-findings.json"

export interface ExampleSource {
  audit: string
  paper: string
  venue: string
}

export interface FindingExample extends Finding {
  sourceAudit: string
  sourcePaper: string
  venue: string
}

export const FINDING_EXAMPLES =
  rawFindings.findings as unknown as FindingExample[]

function sourceOf(finding: FindingExample): ExampleSource {
  return {
    audit: finding.sourceAudit,
    paper: finding.sourcePaper,
    venue: finding.venue,
  }
}

export interface SummaryExample {
  id: string
  whatIDid: string
  headline: string
  source: ExampleSource
}

export const SUMMARY_EXAMPLES: SummaryExample[] = [
  {
    id: "205",
    whatIDid:
      "I read paper.pdf (15 pages plus the checklist; Appendices A-D referenced by the paper are not in the provided PDF), ran the author code as shipped, and wrote the checks under _audit_code/. Concretely I ran check_repo_coverage.py, check_batch_reference_inference.py, run_demo_tabular_reduced.py (the demo notebook cells plus a 40-sample subset of the explanation cell; the full 500-sample Captum pass did not finish in 25 min on CPU) and check_paper_table_arithmetic.py. Outputs are in _audit_code/out/.",
    headline:
      "The paper's empirical contribution cannot be reproduced from the released code, and the one released path that emulates the paper's explanation experiment is wired so that ReCalX collapses to a single global temperature scaling (the ReCalX Shapley values are exactly the uncalibrated values divided by that temperature).",
    source: {
      audit: "205",
      paper:
        "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration",
      venue: "NeurIPS 2025",
    },
  },
  {
    id: "376",
    whatIDid:
      "I read the paper (pp. 1-17, Tables 1-5, Figs 1-8) against every file in the repo, then ran deterministic checks under _audit_code/: check_ode_noop.py, check_notebook_protocol.py, check_repo_artifacts.py, check_train_entrypoint.py and check_param_counts.py. The released model components were instantiated on CPU to count parameters; the Proton Drive link returns HTTP 200.",
    headline:
      "The released code can run one demonstration (SH, one trajectory, 80 steps) and does not reproduce even that number; four of five systems in Table 1, all baselines and all ablations are absent, and the released inference path never integrates the probe-graph ODE that the paper presents as its dynamics model.",
    source: {
      audit: "376",
      paper:
        "Sparse Diffusion Autoencoder for Test-time Adapting Prediction of Complex Systems",
      venue: "NeurIPS 2025",
    },
  },
  {
    id: "543",
    whatIDid:
      "The workspace contains one repository, open-thought/reasoning-gym, the Reasoning Gym dataset library; ProRL uses it only as a data source and verifier. I verified the absence of the training recipe, benchmark evaluations and pass@k analysis with a keyword/AST scan of all 337 Python/YAML/JSON/MD files, then re-derived every number in Tables 1-3 from the printed cells with check_paper_arithmetic.py.",
    headline:
      "No code in the workspace implements the ProRL training recipe or any reported benchmark, and the 9,600 Reasoning-Gym validation samples equal the 96 tasks x 100 reserved test samples exactly.",
    source: {
      audit: "543",
      paper:
        "ProRL: Prolonged Reinforcement Learning Expands Reasoning Boundaries in Large Language Models",
      venue: "NeurIPS 2025",
    },
  },
  {
    id: "768",
    whatIDid:
      "I read the paper (main text and Appendices D-F) and the whole author code base (2,604 lines excluding vendored timm), then ran static checks under _audit_code/ for path and index arithmetic, the download path, hyperparameter resolution, the minimised objective and the split logic. I could not execute the pipeline: no GPU, no dataset and torch is not installed, so every finding is a static code fact or a paper-code comparison.",
    headline:
      "The released code cannot be run end-to-end as documented; the Office-Home path raises an IndexError from a hardcoded source-env count; the reported accuracies are maxima over the same split that drives early stopping; and the data-efficiency numbers in the abstract are produced by no code.",
    source: {
      audit: "768",
      paper:
        "A High-Dimensional Statistical Method for Optimizing Transfer Quantities in Multi-Source Transfer Learning",
      venue: "NeurIPS 2025",
    },
  },
  {
    id: "1829",
    whatIDid:
      "I read the paper (including appendices A-M), parsed all 123 shell drivers and 45 Python files, and ran deterministic checks on asset existence, Q-matrix regeneration, dataset statistics, hyper-parameters and appendix-driver coverage. I also executed the release: a direct forward pass of model/OLinear.py and a two-pass run.py smoke run — a pristine CPU install under requirements.txt, which crashes, then a scratch copy with np.Inf changed to np.inf, which trains one epoch and evaluates on the shipped Weather data.",
    headline:
      "The core OLinear method is implemented and sound, and the pre-computed transforms are reproducible and free of test-set leakage; but a fresh install crashes before the first epoch, more than half of the 24 datasets and all of their Q matrices are absent, and three headline experiment families — the plug-in tables, OLinear-C for 8 of 9 datasets, and most ablation rows — have no runnable code.",
    source: {
      audit: "1829",
      paper:
        "OLinear: A Linear Model for Time Series Forecasting in Orthogonally Transformed Domain",
      venue: "NeurIPS 2025",
    },
  },
]

export interface TraceExample {
  id: string
  artefact: string
  location: string
  computed: string
  matches: "yes" | "no" | "none"
  status: "Verified" | "Mismatch" | "Missing" | "Not checked"
  source: ExampleSource
}

function source(audit: string, paper: string): ExampleSource {
  return { audit, paper, venue: "NeurIPS 2025" }
}

export const TRACE_EXAMPLES: TraceExample[] = [
  {
    id: "trace-205-1",
    artefact:
      "Table 1, Electricity/MLP, ReCalX CE_AVG / CE_MAX = 0.0097 / 0.0163",
    location: "demo_tabular.ipynb cell 13",
    computed: "0.0073 / 0.0140",
    matches: "no",
    status: "Mismatch",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "trace-205-2",
    artefact: "Table 1, 7 of the 8 dataset rows",
    location: "(none)",
    computed: "—",
    matches: "none",
    status: "Missing",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "trace-376-1",
    artefact: "Table 3, Predictor parameter count, 1.32 M",
    location: "model/grand_predictor.py:151-161",
    computed: "1.3225 M",
    matches: "yes",
    status: "Verified",
    source: source(
      "376",
      "Sparse Diffusion Autoencoder for Test-time Adapting Prediction of Complex Systems"
    ),
  },
  {
    id: "trace-376-2",
    artefact: "Table 1, Swift-Hohenberg, Ours RMSE 7.628e-2",
    location: "sample_sh.ipynb:437-441",
    computed: "5.372e-2",
    matches: "no",
    status: "Mismatch",
    source: source(
      "376",
      "Sparse Diffusion Autoencoder for Test-time Adapting Prediction of Complex Systems"
    ),
  },
  {
    id: "trace-768-1",
    artefact: "Table 2, Office-Home column",
    location: "main.py:95",
    computed: "— (IndexError)",
    matches: "no",
    status: "Mismatch",
    source: source(
      "768",
      "A High-Dimensional Statistical Method for Optimizing Transfer Quantities in Multi-Source Transfer Learning"
    ),
  },
  {
    id: "trace-768-2",
    artefact: "Table 6, ViT-B + LoRA",
    location: "(none)",
    computed: "—",
    matches: "none",
    status: "Missing",
    source: source(
      "768",
      "A High-Dimensional Statistical Method for Optimizing Transfer Quantities in Multi-Source Transfer Learning"
    ),
  },
  {
    id: "trace-54-1",
    artefact: "Table 2 MSTTR (window 800)",
    location: "metric/lexical.py:33-34",
    computed: "MSTTR computed as described",
    matches: "yes",
    status: "Verified",
    source: source(
      "54",
      "EVOREFUSE: Evolutionary Prompt Optimization for Evaluation and Mitigation of LLM Over-Refusal to Pseudo-Malicious Instructions"
    ),
  },
  {
    id: "trace-654-1",
    artefact: "Table 1 average ranking changes, CIFAR10 SiMExp eta=10 = 18.70",
    location: "notebooks/plots_and_tables.ipynb:613",
    computed:
      "argsort position differences // 2; 5 of 24 permutations agree with true inversions",
    matches: "no",
    status: "Mismatch",
    source: source(
      "654",
      "Unveiling Transformer Perception by Exploring Input Manifolds"
    ),
  },
  {
    id: "trace-1829-1",
    artefact: "All 84 shipped Q matrices (Fig. 2 / Fig. 7 transforms)",
    location: "_audit_code/check_qmat_all.py",
    computed: "reproduced from the first `ratio` fraction, max |Δ| ≤ 3e-9",
    matches: "yes",
    status: "Verified",
    source: source(
      "1829",
      "OLinear: A Linear Model for Time Series Forecasting in Orthogonally Transformed Domain"
    ),
  },
  {
    id: "trace-1829-2",
    artefact: "Tables 5, 9 and 10 — plug-in results",
    location: "(none)",
    computed: "—",
    matches: "none",
    status: "Missing",
    source: source(
      "1829",
      "OLinear: A Linear Model for Time Series Forecasting in Orthogonally Transformed Domain"
    ),
  },
  {
    id: "trace-760-1",
    artefact: "Table 1, 2024 test-year RMSE, 0.61",
    location: "main.py (eval loop)",
    computed: "not run (no GPU)",
    matches: "none",
    status: "Not checked",
    source: source(
      "760",
      "Mesh Interpolation Graph Network for Dynamic and Spatially Irregular Global Weather Forecasting"
    ),
  },
]

export interface SynthesisExample {
  id: string
  text: string
  category?: "missing" | "bug" | "difference" | "methodology"
  severity?: "high" | "medium" | "low"
  confidence?: "high" | "medium" | "low"
  source: ExampleSource
}

export const TAKEAWAY_EXAMPLES: SynthesisExample[] = [
  {
    id: "takeaway-205-1",
    text: "No result-producing code or data: Tables 1-3 and Figures 2-5 have no producing script, and 9 of the 10 tabular datasets are not shipped.",
    category: "missing",
    severity: "high",
    confidence: "high",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "takeaway-205-2",
    text: "ReCalX collapses to one global temperature during explanation: 39 of 40 explained samples receive the same T=5.000, so the Shapley evidence for better rankings is void.",
    category: "bug",
    severity: "high",
    confidence: "high",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "takeaway-376-1",
    text: "The released inference never integrates the probe-graph ODE, so the predictor is bit-for-bit decoder(encoder(x)) and the paper's dynamics model is not exercised.",
    category: "bug",
    severity: "high",
    confidence: "high",
    source: source(
      "376",
      "Sparse Diffusion Autoencoder for Test-time Adapting Prediction of Complex Systems"
    ),
  },
  {
    id: "takeaway-543-1",
    text: "The 9,600 Reasoning-Gym validation samples equal the 96 tasks x 100 reserved test samples, so the headline logic-puzzle gain is not a held-out estimate.",
    category: "methodology",
    severity: "high",
    confidence: "medium",
    source: source(
      "543",
      "ProRL: Prolonged Reinforcement Learning Expands Reasoning Boundaries in Large Language Models"
    ),
  },
]

export const FINE_EXAMPLES: SynthesisExample[] = [
  {
    id: "fine-205-1",
    text: "The released tabular split fits StandardScaler on the training split only and applies it to validation/test, so there is no preprocessing leakage across the split.",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "fine-205-2",
    text: "All 16 down-arrow MAX (%) values in Tables 1-2 reproduce from the CE_MAX columns to 0.1 percentage point, and the ranges quoted in the text match the tables.",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "fine-376-1",
    text: "The README's external Proton Drive link resolves (HTTP 200), so the shipped checkpoints are at least reachable even though they are not in the repository.",
    source: source(
      "376",
      "Sparse Diffusion Autoencoder for Test-time Adapting Prediction of Complex Systems"
    ),
  },
]

export const QUESTION_EXAMPLES: SynthesisExample[] = [
  {
    id: "question-205-1",
    text: "Appendices A-D (proofs, the 10-dataset protocol, regression experiments, runtime) are not in the provided PDF and no supplement was available. Is there a version of Appendix B that specifies the exact splits and hyperparameters?",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "question-205-2",
    text: "requirements.txt lists only lower bounds (torch>=1.10, captum>=0.5, ...). Is there a pinned environment or lockfile for the versions used for the published numbers?",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "question-768-1",
    text: "The reported accuracies are maxima over evaluations on the same split that drives early stopping. Was a separate selection split used, and where are the per-epoch logs?",
    source: source(
      "768",
      "A High-Dimensional Statistical Method for Optimizing Transfer Quantities in Multi-Source Transfer Learning"
    ),
  },
]

export const SCOREBOARD_NOTE_EXAMPLES: SynthesisExample[] = [
  {
    id: "note-205-missing",
    text: "No code for Tables 1-3 or Figures 2-5; 9 of 10 tabular datasets absent.",
    category: "missing",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "note-205-bug",
    text: "Batch temperature collapse; truncated perturbation levels; broken early stopping; censored temperature.",
    category: "bug",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
  {
    id: "note-205-methodology",
    text: "Calibration error is evaluated on the fitting samples; the sensitivity metric may be scale-driven.",
    category: "methodology",
    source: source(
      "205",
      "Improving Perturbation-based Explanations by Understanding the Role of Uncertainty Calibration"
    ),
  },
]

export const EFFORT_EXAMPLES = [
  {
    id: "effort-1",
    hours: "14",
    sessions: "3 sessions over 4 days",
    longest:
      "Re-running the demo notebook and reconciling Table 1 row by row; the full Shapley pass timed out and had to be scaled down.",
    couldNotCheck:
      "Figure 3 (image pipeline absent), the appendix proofs, and anything needing a GPU.",
  },
  {
    id: "effort-2",
    hours: "22",
    sessions: "5 sessions over 2 weeks",
    longest:
      "Tracing the data split and reading the notebook cells that produce the headline table.",
    couldNotCheck:
      "The full training run (no GPU and no dataset); Appendix E was missing from the PDF.",
  },
] as const

export type ExampleField =
  | "summary.whatIDid"
  | "summary.headline"
  | "finding.title"
  | "finding.topic"
  | "finding.quote"
  | "finding.claim"
  | "finding.concern"
  | "finding.resolution"
  | "finding.file"
  | "trace.artefact"
  | "trace.location"
  | "trace.computed"
  | "takeaway.text"
  | "fineItem.text"
  | "question.text"
  | "scoreboard.note"
  | "effort"

function findingSnippets(
  field:
    "title" | "topic" | "quote" | "claim" | "concern" | "resolution" | "file",
  limit = 4
): Array<{ id: string; text: string; source: ExampleSource; context: string }> {
  const preferred = [
    "205:no-tabular-results-pipeline",
    "654:algo-both-type-mismatch",
    "54:prr-substring-not-prefix",
    "1829:plugin-experiments-absent",
    "376:hardcoded-data-path",
    "646:lr-optimizer-mismatch",
    "543:rg-val-equals-test",
    "768:baselines-not-implemented",
    "585:cosine-dist-memory-blowup",
  ]
  const ordered = [...FINDING_EXAMPLES].sort((a, b) => {
    const ai = preferred.indexOf(a.key)
    const bi = preferred.indexOf(b.key)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })
  return ordered.slice(0, limit).map((finding) => ({
    id: `${finding.key}:${field}`,
    text: finding[field],
    source: sourceOf(finding),
    context: finding.title,
  }))
}

export interface SnippetGroup {
  title: string
  items: Array<{
    id: string
    text: string
    source?: ExampleSource
    context?: string
  }>
}

export function examplesForField(field: ExampleField): SnippetGroup[] {
  switch (field) {
    case "summary.whatIDid":
      return [
        {
          title: "What I did",
          items: SUMMARY_EXAMPLES.map((example) => ({
            id: example.id,
            text: example.whatIDid,
            source: example.source,
          })),
        },
      ]
    case "summary.headline":
      return [
        {
          title: "Headline",
          items: SUMMARY_EXAMPLES.map((example) => ({
            id: example.id,
            text: example.headline,
            source: example.source,
          })),
        },
      ]
    case "finding.title":
      return [{ title: "Titles", items: findingSnippets("title", 5) }]
    case "finding.topic":
      return [
        {
          title: "Topics",
          items: [
            ...new Set(
              FINDING_EXAMPLES.map((finding) => finding.topic).filter(Boolean)
            ),
          ].map((topic) => ({
            id: `topic-${topic}`,
            text: topic,
          })),
        },
      ]
    case "finding.quote":
      return [{ title: "Quotes", items: findingSnippets("quote", 3) }]
    case "finding.claim":
      return [{ title: "Claims", items: findingSnippets("claim", 3) }]
    case "finding.concern":
      return [{ title: "Concerns", items: findingSnippets("concern", 3) }]
    case "finding.resolution":
      return [{ title: "Resolutions", items: findingSnippets("resolution", 3) }]
    case "finding.file":
      return [
        {
          title: "Evidence locations",
          items: FINDING_EXAMPLES.map((finding) => ({
            id: `${finding.key}:file`,
            text: finding.file,
            source: sourceOf(finding),
            context: finding.title,
          })),
        },
      ]
    case "trace.artefact":
      return [
        {
          title: "Paper artefacts",
          items: TRACE_EXAMPLES.map((example) => ({
            id: example.id,
            text: example.artefact,
            source: example.source,
          })),
        },
      ]
    case "trace.location":
      return [
        {
          title: "Repository locations",
          items: TRACE_EXAMPLES.filter((example) => example.location).map(
            (example) => ({
              id: `${example.id}:location`,
              text: example.location,
              source: example.source,
              context: example.artefact,
            })
          ),
        },
      ]
    case "trace.computed":
      return [
        {
          title: "Computed values",
          items: TRACE_EXAMPLES.filter((example) => example.computed).map(
            (example) => ({
              id: `${example.id}:computed`,
              text: example.computed,
              source: example.source,
              context: example.artefact,
            })
          ),
        },
      ]
    case "takeaway.text":
      return [
        {
          title: "Take-aways",
          items: TAKEAWAY_EXAMPLES.map((example) => ({
            id: example.id,
            text: example.text,
            source: example.source,
          })),
        },
      ]
    case "fineItem.text":
      return [
        {
          title: "Things that look fine",
          items: FINE_EXAMPLES.map((example) => ({
            id: example.id,
            text: example.text,
            source: example.source,
          })),
        },
      ]
    case "question.text":
      return [
        {
          title: "Open questions",
          items: QUESTION_EXAMPLES.map((example) => ({
            id: example.id,
            text: example.text,
            source: example.source,
          })),
        },
      ]
    case "scoreboard.note":
      return [
        {
          title: "Scoreboard notes",
          items: SCOREBOARD_NOTE_EXAMPLES.map((example) => ({
            id: example.id,
            text: example.text,
            source: example.source,
            context: example.category,
          })),
        },
      ]
    case "effort":
      return [
        {
          title: "Illustrative effort notes",
          items: EFFORT_EXAMPLES.map((example) => ({
            id: example.id,
            text: [
              `Rough total hours: ${example.hours}`,
              `Sessions / days: ${example.sessions}`,
              `What took longest: ${example.longest}`,
              `What I could not check: ${example.couldNotCheck}`,
            ].join("\n"),
          })),
        },
      ]
  }
}
