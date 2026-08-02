import { codeLabel } from "../coding/codes";
import { type Finding, type Project } from "../types";

/**
 * Baustein 7+8 – Übernahme einer Fundstelle als Zotero-Notiz.
 *
 * Phase 1 erzeugt eine strukturierte, klar gekennzeichnete Kind-Notiz am
 * jeweiligen Eintrag (offizielle Zotero-API, nichtdestruktiv). Präzise
 * PDF-Markierungen mit Seitenposition folgen in Phase 2 (Reader-API).
 *
 * Die Paraphrase wird manuell verfasst und als solche gekennzeichnet
 * (Konzept Kap. 10.2/10.3).
 */

function esc(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildNoteHTML(
  project: Project,
  finding: Finding,
  paraphrase: string,
): string {
  const locLabel =
    finding.location === "title"
      ? "Titel"
      : finding.location === "abstract"
        ? "Abstract"
        : "Volltext";
  const paraLabel =
    finding.paraphraseSource === "ai"
      ? `Paraphrase (KI-generiert, ungeprüft${finding.paraphraseModel ? `, Modell: ${finding.paraphraseModel}` : ""}):`
      : "Paraphrase (manuell):";
  const paraBlock = paraphrase.trim()
    ? `<p><b>${esc(paraLabel)}</b><br/>${esc(paraphrase)}</p>`
    : `<p><i>Noch keine Paraphrase erfasst.</i></p>`;
  const aiBlock =
    typeof finding.aiScore === "number"
      ? `<p><b>KI-Relevanz:</b> ${finding.aiScore}/100 (${esc(finding.aiRecommendation ?? "?")}) — ${esc(finding.aiExplanation ?? "")}</p>`
      : "";

  return [
    `<h2>Zotero Literature Review — Fundstelle</h2>`,
    `<p><b>Projekt:</b> ${esc(project.name)}</p>`,
    `<p><b>Suchkonzept:</b> ${esc(finding.conceptName)}</p>`,
    finding.codeId
      ? `<p><b>Kodierung:</b> ${esc(codeLabel(finding.codeId))}</p>`
      : "",
    `<p><b>Originalfundstelle (${locLabel}):</b><br/>„${esc(finding.snippet)}"</p>`,
    `<p><b>Relevanz:</b> Score ${finding.score} — ${esc(finding.explanation)}</p>`,
    aiBlock,
    paraBlock,
    `<hr/>`,
    `<p><small>Automatisch vom Plugin vorgeschlagen · Paraphrase manuell erstellt und noch nicht wissenschaftlich geprüft · erstellt ${new Date()
      .toISOString()
      .slice(0, 10)}</small></p>`,
  ].join("\n");
}

/**
 * Creates a child note for the finding on its parent item.
 * Returns the new note key, or undefined on failure.
 */
export async function createFindingNote(
  project: Project,
  finding: Finding,
  paraphrase: string,
): Promise<string | undefined> {
  const Z = Zotero as any;
  const libraryID = project.sources?.libraryID ?? Z.Libraries.userLibraryID;
  const parent = Z.Items.getByLibraryAndKey(libraryID, finding.itemKey);
  if (!parent) {
    return undefined;
  }
  const note = new Z.Item("note");
  note.libraryID = parent.libraryID;
  note.parentID = parent.id;
  note.setNote(buildNoteHTML(project, finding, paraphrase));
  await note.saveTx();
  return note.key as string;
}
