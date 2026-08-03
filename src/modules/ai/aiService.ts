import { aiComplete } from "./aiClient";
import {
  CODING_SYSTEM,
  EXTRACTION_SYSTEM,
  PARAPHRASE_SYSTEM,
  QUALITY_SYSTEM,
  RELEVANCE_SYSTEM,
  buildCodingPrompt,
  buildExtractionPrompt,
  buildParaphrasePrompt,
  buildQualityPrompt,
  buildRelevancePrompt,
} from "./prompts";
import { getAIConfig } from "./aiConfig";
import { CODES } from "../coding/codes";
import {
  EXTRACTION_FIELDS,
  NOT_REPORTED,
} from "../extraction/extraction";
import { QUALITY_CRITERIA, RATING_IDS } from "../quality/quality";
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

export async function assessQuality(
  project: Project,
  text: string,
): Promise<{ ratings: Record<string, string>; note: string; model: string }> {
  const raw = await aiComplete(
    QUALITY_SYSTEM,
    buildQualityPrompt(project, text),
    800,
  );
  const obj = extractJSON(raw);
  const ratings: Record<string, string> = {};
  for (const c of QUALITY_CRITERIA) {
    const v = obj[c.id];
    ratings[c.id] = RATING_IDS.includes(v) ? v : "unclear";
  }
  return {
    ratings,
    note: String(obj.note ?? "").trim(),
    model: getAIConfig().model,
  };
}

export async function extractStudy(
  project: Project,
  text: string,
): Promise<{ fields: Record<string, string>; model: string }> {
  const raw = await aiComplete(
    EXTRACTION_SYSTEM,
    buildExtractionPrompt(project, text),
    1500,
  );
  const obj = extractJSON(raw);
  const fields: Record<string, string> = {};
  for (const f of EXTRACTION_FIELDS) {
    const v = obj[f.id];
    fields[f.id] = v == null || String(v).trim() === "" ? NOT_REPORTED : String(v).trim();
  }
  return { fields, model: getAIConfig().model };
}
