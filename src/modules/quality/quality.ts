/**
 * Phase 4 – Qualitätsbewertung / Risk of Bias (Konzept Kap. 20).
 * KI liefert Vorschläge; die finale Bewertung muss manuell bestätigt werden.
 */

import { type Project } from "../types";

export interface QualityCriterion {
  id: string;
  label: string;
}

export const QUALITY_CRITERIA: QualityCriterion[] = [
  { id: "clearQuestion", label: "Klare Forschungsfrage" },
  { id: "design", label: "Geeignetes Studiendesign" },
  { id: "sample", label: "Nachvollziehbare Stichprobe" },
  { id: "measurement", label: "Valide Messinstrumente" },
  { id: "analysis", label: "Geeignete Auswertungsmethode" },
  { id: "confounders", label: "Umgang mit Störvariablen" },
  { id: "transparency", label: "Transparente Ergebnisdarstellung" },
  { id: "limitations", label: "Nachvollziehbare Limitationen" },
  { id: "replicability", label: "Replizierbarkeit" },
  { id: "conflicts", label: "Interessenkonflikte offengelegt" },
];

export const RATINGS: { id: string; label: string }[] = [
  { id: "fulfilled", label: "erfüllt" },
  { id: "partial", label: "teilweise erfüllt" },
  { id: "not", label: "nicht erfüllt" },
  { id: "unclear", label: "unklar" },
  { id: "na", label: "nicht anwendbar" },
];

export const RATING_IDS = RATINGS.map((r) => r.id);

export function ratingLabel(id: string | undefined): string {
  if (!id) return "";
  return RATINGS.find((r) => r.id === id)?.label ?? id;
}

/** Active (enabled) criteria for a project. Empty/undefined = all. */
export function activeCriteria(project: Project): QualityCriterion[] {
  const ids = project.qualityCriteria;
  if (!ids || ids.length === 0) return QUALITY_CRITERIA;
  return QUALITY_CRITERIA.filter((c) => ids.includes(c.id));
}

/** Simple quality score: fulfilled=1, partial=0.5, else 0 (over applicable). */
export function qualityScore(
  ratings: Record<string, string>,
  criteria: QualityCriterion[] = QUALITY_CRITERIA,
): { score: number; applicable: number } {
  let sum = 0;
  let applicable = 0;
  for (const c of criteria) {
    const r = ratings[c.id];
    if (!r || r === "na") continue;
    applicable++;
    if (r === "fulfilled") sum += 1;
    else if (r === "partial") sum += 0.5;
  }
  return { score: applicable ? Math.round((sum / applicable) * 100) : 0, applicable };
}
