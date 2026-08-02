import { FilePickerHelper } from "zotero-plugin-toolkit";
import { type Finding, type Project, type ScreeningRecord } from "../types";
import {
  DECISION_LABELS,
  exclusionReasonLabel,
  prismaCounts,
} from "../screening/screening";
import { codeLabel } from "../coding/codes";

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
  ext: "csv" | "md",
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
