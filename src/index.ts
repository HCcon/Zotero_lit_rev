import { Addon } from "./addon";

/**
 * Entry point. Bundled into content/scripts/index.js and loaded by
 * bootstrap.js via Services.scriptloader. It attaches the plugin instance
 * to the global Zotero object so the bootstrap can reach its hooks.
 *
 * The global name must match __addonInstance__ in package.json config
 * (replaced inside bootstrap.js at build time).
 */
if (!(Zotero as any).ZoteroLitRev) {
  (Zotero as any).ZoteroLitRev = new Addon();
}
