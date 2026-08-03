import { FilePickerHelper } from "zotero-plugin-toolkit";
import { type Finding, type Project, type ScreeningRecord } from "../types";
import {
  DECISION_LABELS,
  exclusionReasonLabel,
  prismaCounts,
} from "../screening/screening";
import { codeLabel } from "../coding/codes";
import { EXTRACTION_FIELDS } from "../extraction/extraction";
import {
  activeCriteria,
  qualityScore,
  ratingLabel,
} from "../quality/quality";

/**
 * Phase 3 – Berichte: Screening-Liste, PRISMA-Kennzahlen, Evidenztabelle.
 */

const IOUtils = (globalThis as any).IOUtils;

function csvCell(v: string): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 40) || "projekt";
}

async function saveWithPicker(
  title: string,
  ext: "csv" | "md" | "svg" | "html",
  suggestion: string,
  content: string,
): Promise<string | null> {
  const path = await new FilePickerHelper(
    title,
    "save",
    [[ext.toUpperCase(), `*.${ext}`]],
    suggestion,
  ).open();
  if (!path) return null;
  await IOUtils.writeUTF8(path, content);
  return path;
}

// --- Screening list -------------------------------------------------------

const SCREEN_COLS: { h: string; get: (r: ScreeningRecord) => string }[] = [
  { h: "Autor", get: (r) => r.creator },
  { h: "Jahr", get: (r) => r.year },
  { h: "Titel", get: (r) => r.title },
  { h: "DOI", get: (r) => r.doi },
  { h: "Entscheidung", get: (r) => DECISION_LABELS[r.decision] },
  { h: "Ausschlussgrund", get: (r) => exclusionReasonLabel(r.exclusionReason) },
  { h: "Dublette", get: (r) => (r.isDuplicate ? "ja" : "") },
  { h: "Notiz", get: (r) => r.note ?? "" },
  { h: "ItemKey", get: (r) => r.itemKey },
];

export async function exportScreening(project: Project): Promise<string | null> {
  const records = project.screening ?? [];
  const header = SCREEN_COLS.map((c) => c.h).join(",");
  const rows = records.map((r) =>
    SCREEN_COLS.map((c) => csvCell(c.get(r))).join(","),
  );
  return saveWithPicker(
    "Screening-Liste als CSV",
    "csv",
    `${sanitize(project.name)}-screening.csv`,
    [header, ...rows].join("\n"),
  );
}

// --- PRISMA report --------------------------------------------------------

export async function exportPrisma(project: Project): Promise<string | null> {
  const c = prismaCounts(project.screening ?? []);
  const lines = [
    `# PRISMA-Kennzahlen — ${project.name}`,
    "",
    `Erstellt: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Identifikation & Screening",
    `- Identifizierte Datensätze: ${c.identified}`,
    `- Entfernte Dubletten: ${c.duplicatesRemoved}`,
    `- Nach Dublettenbereinigung: ${c.afterDuplicates}`,
    "",
    "## Entscheidungen",
    `- Eingeschlossen: ${c.included}`,
    `- Ausgeschlossen: ${c.excluded}`,
    `- Möglicherweise relevant: ${c.maybe}`,
    `- Hintergrundliteratur: ${c.background}`,
    `- Offen: ${c.undecided}`,
    "",
    "## Ausschlussgründe",
    ...(c.exclusionByReason.length
      ? c.exclusionByReason.map((e) => `- ${e.reason}: ${e.count}`)
      : ["- (keine)"]),
    "",
    "## Suchkonzepte",
    ...((project.concepts ?? []).map(
      (k) => `- ${k.name} (${k.keywords.length} Keywords)`,
    ) || []),
  ];
  return saveWithPicker(
    "PRISMA-Bericht als Markdown",
    "md",
    `${sanitize(project.name)}-prisma.md`,
    lines.join("\n"),
  );
}

// --- PRISMA flow diagram (SVG image) --------------------------------------

export async function exportPrismaSVG(
  project: Project,
): Promise<string | null> {
  const c = prismaCounts(project.screening ?? []);
  const reasons = c.exclusionByReason
    .map((e) => `${e.reason}: ${e.count}`)
    .join(" · ");

  const box = (
    x: number,
    y: number,
    w: number,
    h: number,
    lines: string[],
    fill = "#eef3fb",
  ) => {
    const tspans = lines
      .map(
        (t, i) =>
          `<tspan x="${x + w / 2}" dy="${i === 0 ? 0 : 18}">${escXml(t)}</tspan>`,
      )
      .join("");
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="#4a6fa5"/>` +
      `<text x="${x + w / 2}" y="${y + 24}" text-anchor="middle" font-family="sans-serif" font-size="13">${tspans}</text>`;
  };
  const arrow = (x1: number, y1: number, x2: number, y2: number) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4a6fa5" stroke-width="1.5" marker-end="url(#a)"/>`;

  const cx = 60;
  const w = 340;
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="560" viewBox="0 0 640 560">`,
    `<defs><marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="#4a6fa5"/></marker></defs>`,
    `<text x="320" y="28" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold">PRISMA — ${escXml(project.name)}</text>`,
    box(cx, 50, w, 46, [`Identifizierte Datensätze`, `n = ${c.identified}`]),
    arrow(cx + w / 2, 96, cx + w / 2, 130),
    box(cx, 130, w, 46, [`Nach Dublettenbereinigung`, `n = ${c.afterDuplicates}  (entfernt: ${c.duplicatesRemoved})`]),
    arrow(cx + w / 2, 176, cx + w / 2, 210),
    box(cx, 210, w, 46, [`Gescreent`, `n = ${c.afterDuplicates}`]),
    arrow(cx + w / 2, 256, cx + w / 2, 290),
    box(cx, 290, w, 66, [`Eingeschlossen`, `n = ${c.included}`, `(vielleicht: ${c.maybe} · offen: ${c.undecided})`], "#e7f6e7"),
    // Exclusion side box
    box(cx + w + 40, 210, 180, 90, [`Ausgeschlossen`, `n = ${c.excluded}`, ...(reasons ? [reasons] : [])], "#fdeeee"),
    arrow(cx + w, 233, cx + w + 40, 233),
    `<text x="320" y="380" text-anchor="middle" font-family="sans-serif" font-size="11" fill="gray">Erstellt: ${new Date().toISOString().slice(0, 10)} · Zotero Literature Review</text>`,
    `</svg>`,
  ].join("\n");

  return saveWithPicker(
    "PRISMA-Diagramm als SVG",
    "svg",
    `${sanitize(project.name)}-prisma.svg`,
    svg,
  );
}

function escXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// --- Evidence table -------------------------------------------------------

const EVID_COLS: {
  h: string;
  get: (r: ScreeningRecord, f: Finding | undefined) => string;
}[] = [
  { h: "Autor", get: (r) => r.creator },
  { h: "Jahr", get: (r) => r.year },
  { h: "Titel", get: (r) => r.title },
  { h: "Suchkonzept", get: (_r, f) => f?.conceptName ?? "" },
  { h: "Kodierung", get: (_r, f) => codeLabel(f?.codeId) },
  { h: "Abschnitt", get: (_r, f) => f?.section ?? "" },
  { h: "Fundstelle", get: (_r, f) => f?.snippet ?? "" },
  { h: "Paraphrase", get: (_r, f) => f?.paraphrase ?? "" },
  {
    h: "KI-Score",
    get: (_r, f) => (f && f.aiScore != null ? String(f.aiScore) : ""),
  },
  { h: "lokaler Score", get: (_r, f) => (f ? String(f.score) : "") },
  { h: "DOI", get: (r) => r.doi },
];

/** Evidence table: one row per finding of INCLUDED, non-duplicate items. */
export async function exportEvidence(project: Project): Promise<string | null> {
  const included = (project.screening ?? []).filter(
    (r) => r.decision === "included" && !r.isDuplicate,
  );
  const findings = project.findings ?? [];
  const rows: string[] = [];
  for (const r of included) {
    const itemFindings = findings.filter((f) => f.itemKey === r.itemKey);
    if (itemFindings.length === 0) {
      rows.push(EVID_COLS.map((c) => csvCell(c.get(r, undefined))).join(","));
    } else {
      for (const f of itemFindings) {
        rows.push(EVID_COLS.map((c) => csvCell(c.get(r, f))).join(","));
      }
    }
  }
  const header = EVID_COLS.map((c) => c.h).join(",");
  return saveWithPicker(
    "Evidenztabelle als CSV",
    "csv",
    `${sanitize(project.name)}-evidenz.csv`,
    [header, ...rows].join("\n"),
  );
}

// --- Study characteristics (extraction) table -----------------------------

export async function exportExtractionTable(
  project: Project,
): Promise<string | null> {
  const extractions = project.extractions ?? [];
  const header = ["Autor", "Jahr", "Titel", ...EXTRACTION_FIELDS.map((f) => f.label)]
    .map(csvCell)
    .join(",");
  const rows = extractions.map((e) =>
    [
      e.creator,
      e.year,
      e.title,
      ...EXTRACTION_FIELDS.map((f) => e.fields?.[f.id] ?? ""),
    ]
      .map(csvCell)
      .join(","),
  );
  return saveWithPicker(
    "Studiencharakteristika als CSV",
    "csv",
    `${sanitize(project.name)}-studiencharakteristika.csv`,
    [header, ...rows].join("\n"),
  );
}

// --- Quality matrix -------------------------------------------------------

export async function exportQualityMatrix(
  project: Project,
): Promise<string | null> {
  const assessments = project.qualityAssessments ?? [];
  const criteria = activeCriteria(project);
  const header = [
    "Autor",
    "Jahr",
    "Titel",
    ...criteria.map((c) => c.label),
    "Score %",
    "Notiz",
  ]
    .map(csvCell)
    .join(",");
  const rows = assessments.map((q) =>
    [
      q.creator,
      q.year,
      q.title,
      ...criteria.map((c) => ratingLabel(q.ratings?.[c.id])),
      String(qualityScore(q.ratings ?? {}, criteria).score),
      q.note ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  return saveWithPicker(
    "Qualitätsmatrix als CSV",
    "csv",
    `${sanitize(project.name)}-qualitaet.csv`,
    [header, ...rows].join("\n"),
  );
}

// --- Synthesis report -----------------------------------------------------

export async function exportSynthesis(
  project: Project,
): Promise<string | null> {
  const s = project.synthesis;
  if (!s) return null;
  const md = [
    `# Evidenzsynthese — ${project.name}`,
    "",
    `Forschungsfrage: ${project.researchQuestion || "(nicht angegeben)"}`,
    `Studien: ${s.studyCount} · KI-Modell: ${s.model} · erstellt: ${new Date(
      s.generatedAt,
    ).toLocaleString()}`,
    "",
    "## Zentrale Erkenntnisse",
    s.keyFindings || "(keine)",
    "",
    "## Widersprüchliche Befunde",
    s.contradictions || "(keine)",
    "",
    "## Forschungslücken",
    s.researchGaps || "(keine)",
    "",
    "## Mögliche neue Forschungsfragen (KI-generierte Hypothesen)",
    s.newQuestions || "(keine)",
    "",
    "---",
    "_KI-generierte Synthese – vor wissenschaftlicher Verwendung prüfen._",
  ].join("\n");
  return saveWithPicker(
    "Synthesebericht als Markdown",
    "md",
    `${sanitize(project.name)}-synthese.md`,
    md,
  );
}
