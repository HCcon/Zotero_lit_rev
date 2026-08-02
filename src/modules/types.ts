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
