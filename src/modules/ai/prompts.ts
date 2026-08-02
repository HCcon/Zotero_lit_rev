import { type Concept, type Finding, type Project } from "../types";

/**
 * Phase 2 – versionierte Prompt-Vorlagen (Konzept Kap. 30).
 * Bei Änderungen die Version erhöhen, damit Ergebnisse nachvollziehbar bleiben.
 */
export const PROMPT_VERSION = "p2-2026-08-02";

function conceptContext(concept: Concept | undefined): string {
  if (!concept) return "";
  const pos = concept.positiveExamples ?? [];
  const neg = concept.negativeExamples ?? [];
  const parts = [
    concept.description && `Beschreibung: ${concept.description}`,
    concept.keywords.length && `Keywords: ${concept.keywords.join(", ")}`,
    concept.synonyms.length && `Synonyme: ${concept.synonyms.join(", ")}`,
    concept.exclusionTerms.length &&
      `Ausschlussbegriffe: ${concept.exclusionTerms.join(", ")}`,
    pos.length && `Beispiele für RELEVANTE Stellen:\n- ${pos.join("\n- ")}`,
    neg.length &&
      `Beispiele für NICHT relevante Stellen:\n- ${neg.join("\n- ")}`,
  ].filter(Boolean);
  return parts.join("\n");
}

export const RELEVANCE_SYSTEM =
  "Du bist ein methodisch sorgfältiger wissenschaftlicher Assistent für " +
  "systematische Literaturauswertung. Bewerte nüchtern und nachvollziehbar. " +
  "Erfinde nichts, was nicht im Textausschnitt steht. Antworte ausschließlich " +
  "im geforderten JSON-Format.";

export function buildRelevancePrompt(
  project: Project,
  concept: Concept | undefined,
  finding: Finding,
): string {
  return [
    `Forschungsfrage: ${project.researchQuestion || "(nicht angegeben)"}`,
    concept ? `Suchkonzept: ${concept.name}` : "",
    conceptContext(concept),
    project.inclusionCriteria
      ? `Einschlusskriterien: ${project.inclusionCriteria}`
      : "",
    project.exclusionCriteria
      ? `Ausschlusskriterien: ${project.exclusionCriteria}`
      : "",
    "",
    "Zu bewertende Textstelle:",
    `"""${finding.snippet}"""`,
    "",
    "Bewerte, wie relevant diese Textstelle für die Forschungsfrage und das " +
      "Suchkonzept ist. Antworte NUR mit einem JSON-Objekt der Form:",
    '{"score": <0-100>, "recommendation": "include"|"exclude"|"manual", ' +
      '"explanation": "<kurze Begründung auf Deutsch, max. 2 Sätze>"}',
  ]
    .filter(Boolean)
    .join("\n");
}

export const PARAPHRASE_SYSTEM =
  "Du bist ein wissenschaftlicher Assistent. Du erstellst eine Paraphrase, " +
  "die den Inhalt sinngemäß wiedergibt, die Bedeutung erhält, keine neuen " +
  "Tatsachen hinzufügt und sprachlich hinreichend vom Original abweicht. " +
  "Antworte nur mit der Paraphrase, ohne Vorrede.";

export function buildParaphrasePrompt(
  project: Project,
  finding: Finding,
): string {
  return [
    `Forschungsfrage (Kontext): ${project.researchQuestion || "(nicht angegeben)"}`,
    "",
    "Originaltextstelle:",
    `"""${finding.snippet}"""`,
    "",
    "Erstelle eine wissenschaftlich-neutrale deutsche Paraphrase dieser " +
      "Textstelle. Verändere keine Zahlen, keine Aussagerichtung und keine " +
      "Einschränkungen. Gib nur die Paraphrase aus.",
  ].join("\n");
}
