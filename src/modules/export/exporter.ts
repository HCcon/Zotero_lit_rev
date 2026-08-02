import { FilePickerHelper } from "zotero-plugin-toolkit";
import { codeLabel } from "../coding/codes";
import { type Finding, type Project } from "../types";

/**
 * Baustein 9 – Export der Fundstellen als CSV und JSON.
 */

const IOUtils = (globalThis as any).IOUtils;

function csvCell(value: string): string {
  const s = String(value ?? "");
  if (/[",\n;]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

const CSV_COLUMNS: { header: string; get: (f: Finding) => string }[] = [
  { header: "Autor", get: (f) => f.itemCreator },
  { header: "Jahr", get: (f) => f.itemYear },
  { header: "Titel", get: (f) => f.itemTitle },
  { header: "Suchkonzept", get: (f) => f.conceptName },
  { header: "Fundort", get: (f) => f.location },
  { header: "Abschnitt", get: (f) => f.section ?? "" },
  { header: "Score", get: (f) => String(f.score) },
  { header: "Begruendung", get: (f) => f.explanation },
  { header: "Getroffene Begriffe", get: (f) => f.matchedTerms.join("; ") },
  { header: "Fundstelle", get: (f) => f.snippet },
  { header: "Status", get: (f) => f.reviewStatus },
  { header: "Kodierung", get: (f) => codeLabel(f.codeId) },
  { header: "KI-Score", get: (f) => (f.aiScore != null ? String(f.aiScore) : "") },
  { header: "KI-Empfehlung", get: (f) => f.aiRecommendation ?? "" },
  { header: "KI-Begruendung", get: (f) => f.aiExplanation ?? "" },
  { header: "Paraphrase", get: (f) => f.paraphrase ?? "" },
  { header: "Paraphrase-Quelle", get: (f) => f.paraphraseSource ?? "" },
  { header: "ItemKey", get: (f) => f.itemKey },
];

function toCSV(findings: Finding[]): string {
  const header = CSV_COLUMNS.map((c) => c.header).join(",");
  const rows = findings.map((f) =>
    CSV_COLUMNS.map((c) => csvCell(c.get(f))).join(","),
  );
  return [header, ...rows].join("\n");
}

function toJSON(project: Project, findings: Finding[]): string {
  return JSON.stringify(
    {
      project: {
        projectId: project.projectId,
        name: project.name,
        researchQuestion: project.researchQuestion,
        reviewType: project.reviewType,
        lastRun: project.lastRun ?? null,
      },
      exportedAt: new Date().toISOString(),
      findingCount: findings.length,
      findings,
    },
    null,
    2,
  );
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 40) || "projekt";
}

/**
 * Opens a save dialog and writes the findings in the given format.
 * Returns the written path, or null if cancelled.
 */
export async function exportFindings(
  project: Project,
  format: "csv" | "json",
): Promise<string | null> {
  const findings = project.findings ?? [];
  const content =
    format === "csv" ? toCSV(findings) : toJSON(project, findings);
  const suggestion = `${sanitize(project.name)}-fundstellen.${format}`;

  const path = await new FilePickerHelper(
    `Export als ${format.toUpperCase()}`,
    "save",
    [[format.toUpperCase(), `*.${format}`]],
    suggestion,
  ).open();

  if (!path) {
    return null;
  }
  await IOUtils.writeUTF8(path, content);
  return path;
}
