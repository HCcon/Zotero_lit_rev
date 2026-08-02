import { aiComplete } from "./aiClient";
import {
  CODING_SYSTEM,
  PARAPHRASE_SYSTEM,
  RELEVANCE_SYSTEM,
  buildCodingPrompt,
  buildParaphrasePrompt,
  buildRelevancePrompt,
} from "./prompts";
import { getAIConfig } from "./aiConfig";
import { CODES } from "../coding/codes";
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

export interface CodingResult {
  codeId: string;
  rationale: string;
}

export async function classifyFinding(
  finding: Finding,
): Promise<CodingResult> {
  const raw = await aiComplete(CODING_SYSTEM, buildCodingPrompt(finding), 256);
  const obj = extractJSON(raw);
  const codeId = CODES.some((c) => c.id === obj.code) ? obj.code : "context";
  return { codeId, rationale: String(obj.rationale ?? "").trim() };
}

export async function generateParaphrase(
  project: Project,
  finding: Finding,
): Promise<{ text: string; model: string }> {
  const prompt = buildParaphrasePrompt(project, finding);
  const text = await aiComplete(PARAPHRASE_SYSTEM, prompt, 512);
  return { text: text.trim(), model: getAIConfig().model };
}
