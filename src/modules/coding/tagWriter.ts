import { CODES, codeById } from "./codes";
import { type Project } from "../types";

/**
 * Phase 4 – Farbmarkierung durch farbige Zotero-Tags (Konzept Kap. 9.2/23).
 *
 * Für jede bestätigte/vorgeschlagene (nicht abgelehnte) Kodierung wird dem
 * Eintrag ein farbiger Tag der Kategorie hinzugefügt. Nichtdestruktiv und
 * jederzeit über die Zotero-Tag-Verwaltung entfernbar.
 */

function log(msg: string) {
  Zotero.debug(`[zotero-lit-rev] coding: ${msg}`);
}

/** Registers the category colours in the library (once). */
async function ensureTagColors(libraryID: number): Promise<void> {
  const Z = Zotero as any;
  for (let i = 0; i < CODES.length; i++) {
    const c = CODES[i];
    try {
      const existing = Z.Tags.getColor(libraryID, c.tag);
      if (!existing) {
        await Z.Tags.setColor(libraryID, c.tag, c.hex, i);
      }
    } catch (e) {
      log(`setColor failed for ${c.tag}: ${e}`);
    }
  }
}

export interface TagApplyResult {
  itemsTagged: number;
  tagsAdded: number;
}

/**
 * Applies category tags to the items of all coded findings.
 * @param onlyConfirmed if true, only findings with codeStatus === "confirmed".
 */
export async function applyCodeTags(
  project: Project,
  onlyConfirmed = false,
): Promise<TagApplyResult> {
  const Z = Zotero as any;
  const libraryID = project.sources?.libraryID ?? Z.Libraries.userLibraryID;
  await ensureTagColors(libraryID);

  const findings = (project.findings ?? []).filter((f) => {
    if (!f.codeId || f.codeStatus === "rejected") return false;
    if (onlyConfirmed && f.codeStatus !== "confirmed") return false;
    return true;
  });

  // Group category tags per item (an item may have several coded findings).
  const perItem = new Map<string, Set<string>>();
  for (const f of findings) {
    const cat = codeById(f.codeId);
    if (!cat) continue;
    if (!perItem.has(f.itemKey)) perItem.set(f.itemKey, new Set());
    perItem.get(f.itemKey)!.add(cat.tag);
  }

  let itemsTagged = 0;
  let tagsAdded = 0;
  for (const [itemKey, tags] of perItem) {
    const item = Z.Items.getByLibraryAndKey(libraryID, itemKey);
    if (!item) continue;
    let changed = false;
    for (const tag of tags) {
      if (!item.hasTag(tag)) {
        item.addTag(tag, 1); // type 1 = manual/automatic tag
        tagsAdded++;
        changed = true;
      }
    }
    if (changed) {
      await item.saveTx();
      itemsTagged++;
    }
  }
  return { itemsTagged, tagsAdded };
}
