import { type Concept, type Finding, type Project } from "../types";

/**
 * Baustein 5 – lokale Such- und Analysemaschine (ohne KI).
 *
 * Durchsucht Titel, Abstract und PDF-Volltext der Einträge in den
 * zugeordneten Sammlungen nach den Keywords/Synonymen der Suchkonzepte.
 * Ausschlussbegriffe (NOT) im Kontext einer Fundstelle verwerfen den Treffer.
 * Erzeugt pro (Eintrag × Konzept) höchstens eine Fundstelle.
 */

function log(msg: string) {
  Zotero.debug(`[zotero-lit-rev] search: ${msg}`);
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;
}

/** Collect all regular items of a project's selected collections. */
function collectItems(project: Project): any[] {
  const src = project.sources;
  if (!src || src.collectionKeys.length === 0) {
    return [];
  }
  const Z = Zotero as any;
  const seen = new Set<number>();
  const items: any[] = [];

  const addFromCollection = (coll: any) => {
    if (!coll) return;
    for (const item of coll.getChildItems(false, false)) {
      if (item.isRegularItem() && !seen.has(item.id)) {
        seen.add(item.id);
        items.push(item);
      }
    }
    if (src.includeSubcollections) {
      for (const sub of coll.getChildCollections()) {
        addFromCollection(sub);
      }
    }
  };

  for (const key of src.collectionKeys) {
    const coll = Z.Collections.getByLibraryAndKey(src.libraryID, key);
    addFromCollection(coll);
  }
  return items;
}

/** Extract text of an item (title, abstract, PDF full text). */
async function getItemText(item: any): Promise<{
  title: string;
  abstract: string;
  fulltext: string;
  hasPDF: boolean;
}> {
  const title = String(item.getField("title") || "");
  const abstract = String(item.getField("abstractNote") || "");
  let fulltext = "";
  let hasPDF = false;

  const Z = Zotero as any;
  for (const attID of item.getAttachments()) {
    const att = Z.Items.get(attID);
    if (!att) continue;
    const isPdf =
      att.attachmentContentType === "application/pdf" ||
      (typeof att.isPDFAttachment === "function" && att.isPDFAttachment());
    if (!isPdf) continue;
    hasPDF = true;
    try {
      const text = await att.attachmentText;
      if (text) {
        fulltext += "\n" + text;
      }
    } catch (e) {
      log(`could not read attachment text: ${e}`);
    }
  }
  return { title, abstract, fulltext, hasPDF };
}

/** Cut off a trailing bibliography to reduce false positives (Kap. 6.2). */
function stripReferences(text: string): string {
  const markers = [
    "\nReferences\n",
    "\nREFERENCES\n",
    "\nBibliography\n",
    "\nLiteraturverzeichnis\n",
    "\nLiteratur\n",
  ];
  let cut = text.length;
  for (const m of markers) {
    const idx = text.lastIndexOf(m);
    if (idx > text.length * 0.5 && idx < cut) {
      cut = idx;
    }
  }
  return text.slice(0, cut);
}

function conceptTerms(concept: Concept): string[] {
  return [...concept.keywords, ...concept.synonyms]
    .map((t) => t.trim())
    .filter(Boolean);
}

/** Typical scientific section headings (Kap. 6.3). */
const SECTION_HEADINGS: { name: string; re: RegExp }[] = [
  { name: "Abstract", re: /^abstract\b/i },
  { name: "Introduction", re: /^introduction\b/i },
  { name: "Background", re: /^(theoretical background|background|literature review)\b/i },
  { name: "Methods", re: /^(methodology|methods|materials and methods|study design)\b/i },
  { name: "Results", re: /^(results|findings)\b/i },
  { name: "Discussion", re: /^discussion\b/i },
  { name: "Limitations", re: /^limitations\b/i },
  { name: "Conclusion", re: /^(conclusion|conclusions|concluding remarks)\b/i },
  { name: "Future Research", re: /^future (research|work|directions)\b/i },
];

/** Best-effort detection of the section a match sits in (scans backwards). */
function detectSection(text: string, index: number): string | undefined {
  const before = text.slice(Math.max(0, index - 6000), index);
  const lines = before.split(/\n+/);
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line || line.length > 40) continue;
    for (const s of SECTION_HEADINGS) {
      if (s.re.test(line)) return s.name;
    }
  }
  return undefined;
}

function findFirstMatch(
  haystackLower: string,
  terms: string[],
): { index: number; term: string } | null {
  let best: { index: number; term: string } | null = null;
  for (const term of terms) {
    const idx = haystackLower.indexOf(term.toLowerCase());
    if (idx >= 0 && (best === null || idx < best.index)) {
      best = { index: idx, term };
    }
  }
  return best;
}

function makeSnippet(text: string, index: number, term: string): string {
  const start = Math.max(0, index - 90);
  const end = Math.min(text.length, index + term.length + 90);
  let snippet = text.slice(start, end).replace(/\s+/g, " ").trim();
  if (start > 0) snippet = "… " + snippet;
  if (end < text.length) snippet = snippet + " …";
  return snippet;
}

interface ConceptMatch {
  location: "title" | "abstract" | "fulltext";
  section?: string;
  snippet: string;
  matchedTerms: string[];
  occurrences: number;
}

function matchConcept(
  concept: Concept,
  parts: { title: string; abstract: string; fulltext: string },
): ConceptMatch | null {
  const terms = conceptTerms(concept);
  if (terms.length === 0) {
    return null;
  }
  const excl = concept.exclusionTerms
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const fields: { name: "title" | "abstract" | "fulltext"; text: string }[] = [
    { name: "title", text: parts.title },
    { name: "abstract", text: parts.abstract },
    { name: "fulltext", text: stripReferences(parts.fulltext) },
  ];

  const matchedTerms = new Set<string>();
  let occurrences = 0;
  let bestLocation: "title" | "abstract" | "fulltext" | null = null;
  let bestSnippet = "";
  let bestSection: string | undefined;

  for (const field of fields) {
    if (!field.text) continue;
    const lower = field.text.toLowerCase();
    for (const term of terms) {
      const t = term.toLowerCase();
      let from = 0;
      let idx = lower.indexOf(t, from);
      while (idx >= 0) {
        // Check exclusion terms in the local context window.
        const ctxStart = Math.max(0, idx - 120);
        const ctxEnd = Math.min(lower.length, idx + t.length + 120);
        const ctx = lower.slice(ctxStart, ctxEnd);
        const excluded = excl.some((e) => ctx.includes(e));
        if (!excluded) {
          matchedTerms.add(term);
          occurrences++;
          if (
            bestLocation === null ||
            (bestLocation === "fulltext" && field.name !== "fulltext")
          ) {
            bestLocation = field.name;
            bestSnippet = makeSnippet(field.text, idx, term);
            bestSection =
              field.name === "fulltext"
                ? detectSection(field.text, idx)
                : undefined;
          }
        }
        from = idx + t.length;
        idx = lower.indexOf(t, from);
      }
    }
  }

  if (bestLocation === null || matchedTerms.size === 0) {
    return null;
  }
  return {
    location: bestLocation,
    section: bestSection,
    snippet: bestSnippet,
    matchedTerms: [...matchedTerms],
    occurrences,
  };
}

const STRONG_SECTIONS = ["Results", "Discussion", "Conclusion", "Limitations"];

function scoreMatch(m: ConceptMatch): { score: number; explanation: string } {
  const locBonus =
    m.location === "title" ? 3 : m.location === "abstract" ? 2 : 1;
  const termBonus = m.matchedTerms.length * 2;
  const occBonus = Math.min(m.occurrences, 10);
  const sectionBonus = m.section && STRONG_SECTIONS.includes(m.section) ? 2 : 0;
  const score = locBonus + termBonus + occBonus + sectionBonus;
  const locLabel =
    m.location === "title"
      ? "Titel"
      : m.location === "abstract"
        ? "Abstract"
        : "Volltext";
  const sectionNote = m.section ? ` im Abschnitt „${m.section}"` : "";
  const explanation =
    `${m.matchedTerms.length} Begriff(e) getroffen ` +
    `(${m.matchedTerms.join(", ")}); ${m.occurrences} Fundstelle(n); ` +
    `bester Treffer im ${locLabel}${sectionNote}.`;
  return { score, explanation };
}

export interface SearchProgress {
  (done: number, total: number): void;
}

/**
 * Runs the analysis for a project and returns the findings (sorted by score).
 * Does not modify the project object; the caller persists the result.
 */
export async function runAnalysis(
  project: Project,
  onProgress?: SearchProgress,
): Promise<Finding[]> {
  const concepts = (project.concepts ?? []).filter(
    (c) => conceptTerms(c).length > 0,
  );
  const items = collectItems(project);
  const findings: Finding[] = [];

  log(`analysing ${items.length} item(s) with ${concepts.length} concept(s)`);

  let done = 0;
  for (const item of items) {
    const parts = await getItemText(item);
    if (project.sources?.onlyWithPDF && !parts.hasPDF) {
      done++;
      onProgress?.(done, items.length);
      continue;
    }

    const creators = item.getCreators?.() ?? [];
    const creator =
      creators.length > 0
        ? (creators[0].lastName || creators[0].name || "")
        : "";
    const year = String(item.getField("date") || "").match(/\d{4}/)?.[0] ?? "";

    for (const concept of concepts) {
      const m = matchConcept(concept, parts);
      if (!m) continue;
      const { score, explanation } = scoreMatch(m);
      findings.push({
        findingId: newId("finding"),
        itemKey: item.key,
        itemTitle: parts.title || "(ohne Titel)",
        itemCreator: creator,
        itemYear: year,
        conceptId: concept.conceptId,
        conceptName: concept.name,
        location: m.location,
        section: m.section,
        snippet: m.snippet,
        matchedTerms: m.matchedTerms,
        score,
        explanation,
        reviewStatus: "suggested",
      });
    }
    done++;
    onProgress?.(done, items.length);
  }

  findings.sort((a, b) => b.score - a.score);
  return findings;
}

/** Count of regular items that would be analysed (for a pre-run hint). */
export function countItems(project: Project): number {
  return collectItems(project).length;
}
