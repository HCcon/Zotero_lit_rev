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
  /** The matched passage with a bit of surrounding context. */
  snippet: string;
  /** Which of the concept's terms matched. */
  matchedTerms: string[];
  /** Simple, transparent relevance score. */
  score: number;
  /** Human-readable justification of the score. */
  explanation: string;
  reviewStatus: "suggested" | "accepted" | "rejected";
  /** Manually written paraphrase (Baustein 8). */
  paraphrase?: string;
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
  /** ISO datetime of the last analysis run. */
  lastRun?: string;
  /** ISO date (YYYY-MM-DD). */
  createdAt: string;
  /** Bumped on every edit. */
  version: number;
}

/** Root object persisted to disk. */
export interface PluginData {
  schemaVersion: number;
  projects: Project[];
}

export const CURRENT_SCHEMA_VERSION = 1;
