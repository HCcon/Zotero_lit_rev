import { type Project } from "../types";

/**
 * Phase 4 – Synthese-Hilfen (Konzept Kap. 24/25).
 * Baut einen kompakten Studien-Digest aus Extraktionen (bevorzugt),
 * ergänzt um Qualitäts-Score und Fundstellen, als Eingabe für die KI-Synthese.
 */

/** Returns the item keys of included, non-duplicate studies. */
export function includedKeys(project: Project): string[] {
  return (project.screening ?? [])
    .filter((r) => r.decision === "included" && !r.isDuplicate)
    .map((r) => r.itemKey);
}

/** Compact, one-block-per-study digest for the synthesis prompt. */
export function buildStudyDigest(project: Project): {
  digest: string;
  count: number;
} {
  const keys = includedKeys(project);
  const extractions = project.extractions ?? [];
  const quality = project.qualityAssessments ?? [];
  const findings = project.findings ?? [];

  const blocks: string[] = [];
  for (const key of keys) {
    const ex = extractions.find((e) => e.itemKey === key);
    const scr = (project.screening ?? []).find((r) => r.itemKey === key);
    const who = scr
      ? `${scr.creator} ${scr.year}`.trim() || scr.title
      : key;

    const parts: string[] = [`### ${who}`];
    if (ex) {
      const f = ex.fields;
      const line = (label: string, id: string) =>
        f[id] && f[id] !== "nicht berichtet" ? `${label}: ${f[id]}` : "";
      parts.push(
        [
          line("Kernaussage", "keyStatement"),
          line("Methode", "methodType"),
          line("Stichprobe", "sample"),
          line("Hauptergebnis", "mainResults"),
          line("Effekt", "effectSize"),
          line("Limitationen", "limitations"),
          line("Forschungslücken", "researchGaps"),
        ]
          .filter(Boolean)
          .join("\n"),
      );
    } else {
      // Fallback: use the top finding snippets/paraphrases for this item.
      const fs = findings
        .filter((x) => x.itemKey === key)
        .slice(0, 3)
        .map((x) => x.paraphrase || x.snippet)
        .filter(Boolean);
      parts.push(fs.length ? fs.join("\n") : "(keine Extraktion vorhanden)");
    }
    const q = quality.find((x) => x.itemKey === key);
    if (q?.note) parts.push(`Qualität: ${q.note}`);

    blocks.push(parts.join("\n"));
  }

  return { digest: blocks.join("\n\n"), count: keys.length };
}
