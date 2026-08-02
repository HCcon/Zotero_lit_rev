import {
  type Project,
  type ScreeningDecision,
  type ScreeningRecord,
} from "../types";

/**
 * Phase 3 – Screening-Kernlogik (Konzept Kap. 8/11/13/35).
 * Reine Funktionen + Zotero-Item-Sammlung; die Persistenz liegt im
 * ProjectManager (project.screening).
 */

/** Standardisierte Ausschlussgründe (Konzept Kap. 8). */
export const EXCLUSION_REASONS: { id: string; label: string }[] = [
  { id: "topic", label: "Falsches Thema" },
  { id: "population", label: "Falsche Population" },
  { id: "context", label: "Falscher Kontext" },
  { id: "pubtype", label: "Falscher Publikationstyp" },
  { id: "no-empirical", label: "Keine empirischen Ergebnisse" },
  { id: "no-fulltext", label: "Kein Volltext verfügbar" },
  { id: "language", label: "Sprache ausgeschlossen" },
  { id: "timeframe", label: "Zeitraum ausgeschlossen" },
  { id: "duplicate", label: "Dublette" },
  { id: "quality", label: "Unzureichende methodische Qualität" },
  { id: "no-relevance", label: "Keine relevante Aussage zur Forschungsfrage" },
];

export function exclusionReasonLabel(id: string | undefined): string {
  if (!id) return "";
  return EXCLUSION_REASONS.find((r) => r.id === id)?.label ?? id;
}

export const DECISION_LABELS: Record<ScreeningDecision, string> = {
  undecided: "offen",
  included: "eingeschlossen",
  excluded: "ausgeschlossen",
  maybe: "möglicherweise relevant",
  background: "Hintergrundliteratur",
};

export interface ItemMeta {
  itemKey: string;
  title: string;
  creator: string;
  year: string;
  doi: string;
}

/** Collect metadata of all regular items in a project's selected collections. */
export function gatherItemMetas(project: Project): ItemMeta[] {
  const src = project.sources;
  if (!src || src.collectionKeys.length === 0) return [];
  const Z = Zotero as any;
  const seen = new Set<number>();
  const metas: ItemMeta[] = [];

  const add = (coll: any) => {
    if (!coll) return;
    for (const item of coll.getChildItems(false, false)) {
      if (!item.isRegularItem() || seen.has(item.id)) continue;
      seen.add(item.id);
      const creators = item.getCreators?.() ?? [];
      metas.push({
        itemKey: item.key,
        title: String(item.getField("title") || "(ohne Titel)"),
        creator:
          creators.length > 0
            ? creators[0].lastName || creators[0].name || ""
            : "",
        year: String(item.getField("date") || "").match(/\d{4}/)?.[0] ?? "",
        doi: String(item.getField("DOI") || "").trim().toLowerCase(),
      });
    }
    if (src.includeSubcollections) {
      for (const sub of coll.getChildCollections()) add(sub);
    }
  };

  for (const key of src.collectionKeys) {
    add(Z.Collections.getByLibraryAndKey(src.libraryID, key));
  }
  return metas;
}

function normTitle(t: string): string {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Marks probable duplicates in-place: same DOI, or same normalized
 * title + year. The first record in a group is kept.
 * Returns the number of duplicates found.
 */
export function detectDuplicates(records: ScreeningRecord[]): number {
  const byKey = new Map<string, ScreeningRecord>();
  let count = 0;
  for (const r of records) {
    r.isDuplicate = false;
    r.duplicateOf = undefined;
    const key = r.doi
      ? `doi:${r.doi}`
      : `t:${normTitle(r.title)}|${r.year}`;
    const first = byKey.get(key);
    if (first) {
      r.isDuplicate = true;
      r.duplicateOf = first.itemKey;
      count++;
    } else {
      byKey.set(key, r);
    }
  }
  return count;
}

export interface PrismaCounts {
  identified: number;
  duplicatesRemoved: number;
  afterDuplicates: number;
  included: number;
  excluded: number;
  maybe: number;
  background: number;
  undecided: number;
  exclusionByReason: { reason: string; count: number }[];
}

export function prismaCounts(records: ScreeningRecord[]): PrismaCounts {
  const active = records.filter((r) => !r.isDuplicate);
  const by = (d: ScreeningDecision) =>
    active.filter((r) => r.decision === d).length;

  const reasonMap = new Map<string, number>();
  for (const r of active) {
    if (r.decision === "excluded" && r.exclusionReason) {
      reasonMap.set(
        r.exclusionReason,
        (reasonMap.get(r.exclusionReason) ?? 0) + 1,
      );
    }
  }

  return {
    identified: records.length,
    duplicatesRemoved: records.filter((r) => r.isDuplicate).length,
    afterDuplicates: active.length,
    included: by("included"),
    excluded: by("excluded"),
    maybe: by("maybe"),
    background: by("background"),
    undecided: by("undecided"),
    exclusionByReason: [...reasonMap.entries()]
      .map(([reason, count]) => ({ reason: exclusionReasonLabel(reason), count }))
      .sort((a, b) => b.count - a.count),
  };
}
