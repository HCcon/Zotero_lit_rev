/**
 * Data model for the plugin. Phase-1 subset of KONZEPT.md Kap. 16.
 * Everything is stored in a JSON file in the Zotero data directory
 * (see store.ts) — the Zotero database is never modified directly.
 */

/** Selected Zotero sources for a project (Baustein 3). */
export interface ProjectSources {
  /** Zotero library id (e.g. the user library). */
  libraryID: number;
  /** Keys of the selected collections. */
  collectionKeys: string[];
  /** Include items of sub-collections of the selected ones. */
  includeSubcollections: boolean;
  /** Only analyse items that have a PDF full-text attachment. */
  onlyWithPDF: boolean;
}

/** A search concept (Suchkonzept). Phase-1 subset of KONZEPT.md Kap. 5.1. */
export interface Concept {
  conceptId: string;
  /** Concept name. */
  name: string;
  /** Context description (positive meaning of the concept). */
  description: string;
  /** Main keywords. */
  keywords: string[];
  /** Synonyms / alternative spellings. */
  synonyms: string[];
  /** Terms that mark a passage as NOT relevant. */
  exclusionTerms: string[];
  /** Example passages that ARE relevant (guides the AI). */
  positiveExamples: string[];
  /** Example passages that are NOT relevant (guides the AI). */
  negativeExamples: string[];
  /** Optional link to one of the project's sub-questions. */
  subQuestion: string;
}

/** A found relevant passage (Fundstelle). Phase-1 subset of KONZEPT.md Kap. 16.3. */
export interface Finding {
  findingId: string;
  /** Parent (regular) item key. */
  itemKey: string;
  itemTitle: string;
  itemCreator: string;
  itemYear: string;
  conceptId: string;
  conceptName: string;
  /** Where the match was found. */
  location: "title" | "abstract" | "fulltext";
  /** Detected scientific section (e.g. Results, Discussion), if any. */
  section?: string;
  /** The matched passage with a bit of surrounding context. */
  snippet: string;
  /** Which of the concept's terms matched. */
  matchedTerms: string[];
  /** Simple, transparent relevance score. */
  score: number;
  /** Human-readable justification of the score. */
  explanation: string;
  reviewStatus: "suggested" | "accepted" | "rejected";
  /** Manually written or AI-generated paraphrase (Baustein 8 / Phase 2). */
  paraphrase?: string;
  /** Origin of the paraphrase. */
  paraphraseSource?: "manual" | "ai";
  /** Prüfstatus der Paraphrase (Kap. 10.3). */
  paraphraseStatus?:
    | "manual"
    | "ai-unreviewed"
    | "ai-reviewed"
    | "approved";
  /** Model that produced the AI paraphrase, for transparency. */
  paraphraseModel?: string;
  /** Phase 2: AI semantic relevance score (0–100). */
  aiScore?: number;
  /** Phase 2: AI screening recommendation. */
  aiRecommendation?: "include" | "exclude" | "manual";
  /** Phase 2: AI justification for the rating. */
  aiExplanation?: string;
  /** Model that produced the AI rating. */
  aiModel?: string;
  /** Key of the Zotero note created on acceptance, if any. */
  noteKey?: string;
}

/** A research project (Rechercheprojekt). */
export interface Project {
  projectId: string;
  /** Project title. */
  name: string;
  /** Main research question. */
  researchQuestion: string;
  /** Sub-questions (Teilfragen). */
  subQuestions: string[];
  /** Review type id, see REVIEW_TYPES. */
  reviewType: string;
  /** Languages to include, e.g. ["de", "en"]. */
  languages: string[];
  /** Inclusion criteria (free text). */
  inclusionCriteria: string;
  /** Exclusion criteria (free text). */
  exclusionCriteria: string;
  /** Selected Zotero sources (collections). Optional until assigned. */
  sources?: ProjectSources;
  /** Search concepts belonging to this project. */
  concepts?: Concept[];
  /** Findings from the last analysis run. */
  findings?: Finding[];
  /** Per-item screening records (Phase 3). */
  screening?: ScreeningRecord[];
  /** ISO datetime of the last analysis run. */
  lastRun?: string;
  /** ISO date (YYYY-MM-DD). */
  createdAt: string;
  /** Bumped on every edit. */
  version: number;
}

/** Screening stage (Konzept Kap. 11). */
export type ScreeningStage =
  | "identification"
  | "title-abstract"
  | "fulltext";

/** Screening decision for an item. */
export type ScreeningDecision =
  | "undecided"
  | "included"
  | "excluded"
  | "maybe"
  | "background";

/** Per-item screening record (Konzept Kap. 8/11). */
export interface ScreeningRecord {
  itemKey: string;
  title: string;
  creator: string;
  year: string;
  doi: string;
  decision: ScreeningDecision;
  stage: ScreeningStage;
  /** Id from EXCLUSION_REASONS, when excluded. */
  exclusionReason?: string;
  /** Free-text justification. */
  note?: string;
  /** Marked as a probable duplicate. */
  isDuplicate?: boolean;
  /** itemKey of the record this duplicates. */
  duplicateOf?: string;
  updatedAt?: string;
}

/** Root object persisted to disk. */
export interface PluginData {
  schemaVersion: number;
  projects: Project[];
}

export const CURRENT_SCHEMA_VERSION = 1;
