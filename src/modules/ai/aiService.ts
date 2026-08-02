import { aiComplete } from "./aiClient";
import {
  PARAPHRASE_SYSTEM,
  RELEVANCE_SYSTEM,
  buildParaphrasePrompt,
  buildRelevancePrompt,
} from "./prompts";
import { getAIConfig } from "./aiConfig";
import { type Concept, type Finding, type Project } from "../types";

/**
 * Phase 2 – KI-Auswertung einzelner Fundstellen.
 */

export interface RelevanceResult {
  score: number;
  recommendation: "include" | "exclude" | "manual";
  explanation: string;
  model: string;
}

function extractJSON(text: string): any {
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("Keine JSON-Antwort erkannt.");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}

export async function evaluateRelevance(
  project: Project,
  concept: Concept | undefined,
  finding: Finding,
): Promise<RelevanceResult> {
  const prompt = buildRelevancePrompt(project, concept, finding);
  const raw = await aiComplete(RELEVANCE_SYSTEM, prompt, 512);
  const obj = extractJSON(raw);

  const score = Math.max(0, Math.min(100, Number(obj.score) || 0));
  const rec =
    obj.recommendation === "include" || obj.recommendation === "exclude"
      ? obj.recommendation
      : "manual";
  return {
    score,
    recommendation: rec,
    explanation: String(obj.explanation ?? "").trim(),
    model: getAIConfig().model,
  };
}

export async function generateParaphrase(
  project: Project,
  finding: Finding,
): Promise<{ text: string; model: string }> {
  const prompt = buildParaphrasePrompt(project, finding);
  const text = await aiComplete(PARAPHRASE_SYSTEM, prompt, 512);
  return { text: text.trim(), model: getAIConfig().model };
}
