import { CURRENT_SCHEMA_VERSION, type PluginData } from "./types";

/**
 * Baustein 1 – lokaler Datenspeicher.
 *
 * Speichert die Plugin-Daten als JSON-Datei im Zotero-Datenverzeichnis,
 * OHNE die Zotero-Datenbank anzufassen (Konzept Kap. 18). Die Datei liegt
 * unter `<Zotero-Datenverzeichnis>/zotero-lit-rev/data.json` und ist damit
 * für den Nutzer einsehbar und exportierbar.
 */

const SUBDIR = "zotero-lit-rev";
const FILENAME = "data.json";

// Gecko-Globals (in Zotero verfügbar); über globalThis, um Typkonflikte zu vermeiden.
const IOUtils = (globalThis as any).IOUtils;
const PathUtils = (globalThis as any).PathUtils;

function log(msg: string) {
  Zotero.debug(`[zotero-lit-rev] store: ${msg}`);
}

function emptyData(): PluginData {
  return { schemaVersion: CURRENT_SCHEMA_VERSION, projects: [] };
}

function dataDir(): string {
  return PathUtils.join((Zotero as any).DataDirectory.dir, SUBDIR);
}

function dataFile(): string {
  return PathUtils.join(dataDir(), FILENAME);
}

/** Reads the plugin data from disk. Returns empty data if nothing is stored yet. */
export async function loadData(): Promise<PluginData> {
  try {
    const file = dataFile();
    if (!(await IOUtils.exists(file))) {
      return emptyData();
    }
    const text = await IOUtils.readUTF8(file);
    const parsed = JSON.parse(text) as Partial<PluginData>;
    return {
      schemaVersion: parsed.schemaVersion ?? CURRENT_SCHEMA_VERSION,
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
    };
  } catch (e) {
    log(`loadData failed, using empty data: ${e}`);
    return emptyData();
  }
}

/** Writes the plugin data to disk (pretty-printed). */
export async function saveData(data: PluginData): Promise<void> {
  const dir = dataDir();
  await IOUtils.makeDirectory(dir, { ignoreExisting: true, createAncestors: true });
  await IOUtils.writeUTF8(dataFile(), JSON.stringify(data, null, 2));
  log(`saved ${data.projects.length} project(s)`);
}

/** Absolute path of the data file (for display / export). */
export function dataFilePath(): string {
  return dataFile();
}
