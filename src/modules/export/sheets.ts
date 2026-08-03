import { FilePickerHelper } from "zotero-plugin-toolkit";
import { getItemTextByKey } from "../search/searchEngine";
import { codeLabel } from "../coding/codes";
import {
  DECISION_LABELS,
  exclusionReasonLabel,
} from "../screening/screening";
import { EXTRACTION_FIELDS } from "../extraction/extraction";
import { activeCriteria, ratingLabel, qualityScore } from "../quality/quality";
import { type Project, type ScreeningRecord } from "../types";

/**
 * Phase 4 – Bewertungssheet je Studie (HTML).
 * Konsolidiert pro eingeschlossener Studie: Bibliografie, Abstract, Screening-
 * Entscheidung + Begründung, relevante Fundstellen, Extraktion und Qualität.
 */

const IOUtils = (globalThis as any).IOUtils;

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const CSS = `
body{font-family:-apple-system,Segoe UI,Roboto,sans-serif;margin:24px;color:#222;line-height:1.5;}
h1{font-size:20px;} h2{font-size:16px;margin:22px 0 6px;border-bottom:2px solid #4a6fa5;padding-bottom:3px;color:#2b4a75;}
h3{font-size:14px;margin:14px 0 4px;color:#444;}
.study{border:1px solid #ccc;border-radius:8px;padding:16px 20px;margin:0 0 26px;}
.meta{color:#555;font-size:13px;margin-bottom:8px;}
.badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:bold;}
.inc{background:#e7f6e7;color:#276627;} .abstract{background:#f7f7f7;padding:8px 10px;border-radius:6px;font-size:13px;}
table{border-collapse:collapse;width:100%;font-size:13px;margin-top:4px;}
td,th{border:1px solid #ddd;padding:4px 8px;text-align:left;vertical-align:top;}
th{background:#f0f4fa;width:34%;}
.finding{border-left:3px solid #4a6fa5;padding:4px 10px;margin:6px 0;background:#fafbfe;}
.small{color:#777;font-size:12px;}
`;

function findingBlock(f: any): string {
  const meta = [
    f.conceptName && `Konzept: ${esc(f.conceptName)}`,
    f.codeId && `Kodierung: ${esc(codeLabel(f.codeId))}`,
    typeof f.aiScore === "number" &&
      `KI: ${f.aiScore}/100 (${esc(f.aiRecommendation ?? "?")})`,
    `lokal: ${f.score}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const para = f.paraphrase
    ? `<div class="small"><b>Paraphrase:</b> ${esc(f.paraphrase)}</div>`
    : "";
  return `<div class="finding"><div>„${esc(f.snippet)}"</div>
    <div class="small">${esc(f.explanation ?? "")}</div>
    <div class="small">${meta}</div>${para}</div>`;
}

async function studySection(
  project: Project,
  rec: ScreeningRecord,
  libraryID: number,
): Promise<string> {
  const text = await getItemTextByKey(libraryID, rec.itemKey);
  const abstract = text?.abstract ?? "";
  const findings = (project.findings ?? []).filter(
    (f) => f.itemKey === rec.itemKey,
  );
  const ex = (project.extractions ?? []).find((e) => e.itemKey === rec.itemKey);
  const q = (project.qualityAssessments ?? []).find(
    (x) => x.itemKey === rec.itemKey,
  );
  const criteria = activeCriteria(project);

  const screening = `${DECISION_LABELS[rec.decision]}${
    rec.exclusionReason ? ` — ${exclusionReasonLabel(rec.exclusionReason)}` : ""
  }${rec.note ? ` — ${esc(rec.note)}` : ""}`;

  const extractionRows = ex
    ? EXTRACTION_FIELDS.map(
        (fld) =>
          `<tr><th>${esc(fld.label)}</th><td>${esc(ex.fields?.[fld.id] ?? "")}</td></tr>`,
      ).join("")
    : `<tr><td colspan="2" class="small">Keine Extraktion vorhanden.</td></tr>`;

  const qualityRows = q
    ? criteria
        .map(
          (crit) =>
            `<tr><th>${esc(crit.label)}</th><td>${esc(ratingLabel(q.ratings?.[crit.id]))}</td></tr>`,
        )
        .join("") +
      `<tr><th>Score</th><td>${qualityScore(q.ratings ?? {}, criteria).score}%</td></tr>` +
      (q.note ? `<tr><th>Gesamteinschätzung</th><td>${esc(q.note)}</td></tr>` : "")
    : `<tr><td colspan="2" class="small">Keine Qualitätsbewertung vorhanden.</td></tr>`;

  return `<div class="study">
    <h1>${esc([rec.creator, rec.year].filter(Boolean).join(" "))} — ${esc(rec.title)}</h1>
    <div class="meta">${rec.doi ? `DOI: ${esc(rec.doi)} · ` : ""}<span class="badge inc">Screening: ${esc(screening)}</span></div>

    <h2>Abstract</h2>
    <div class="abstract">${abstract ? esc(abstract) : "<span class='small'>Kein Abstract vorhanden.</span>"}</div>

    <h2>Relevante Fundstellen (${findings.length})</h2>
    ${findings.length ? findings.map(findingBlock).join("") : "<div class='small'>Keine Fundstellen.</div>"}

    <h2>Extraktion</h2>
    <table>${extractionRows}</table>

    <h2>Qualität</h2>
    <table>${qualityRows}</table>
  </div>`;
}

function sanitize(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]+/g, "_").slice(0, 40) || "projekt";
}

export async function exportAssessmentSheets(
  project: Project,
): Promise<string | null> {
  const libraryID =
    project.sources?.libraryID ?? (Zotero as any).Libraries.userLibraryID;
  const included = (project.screening ?? []).filter(
    (r) => r.decision === "included" && !r.isDuplicate,
  );
  if (included.length === 0) {
    (Zotero.getMainWindow() as any).alert(
      "Keine eingeschlossenen Studien. Bitte zuerst im Screening Studien einschließen.",
    );
    return null;
  }

  const sections: string[] = [];
  for (const rec of included) {
    sections.push(await studySection(project, rec, libraryID));
  }

  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>Bewertungssheets — ${esc(project.name)}</title><style>${CSS}</style></head>
<body>
<h1 style="border:none">Bewertungssheets — ${esc(project.name)}</h1>
<div class="meta">Forschungsfrage: ${esc(project.researchQuestion || "(nicht angegeben)")}<br/>
${included.length} eingeschlossene Studie(n) · erstellt ${new Date().toLocaleString()}</div>
${sections.join("\n")}
</body></html>`;

  const path = await new FilePickerHelper(
    "Bewertungssheets als HTML",
    "save",
    [["HTML", "*.html"]],
    `${sanitize(project.name)}-bewertungssheets.html`,
  ).open();
  if (!path) return null;
  await IOUtils.writeUTF8(path, html);
  return path;
}
