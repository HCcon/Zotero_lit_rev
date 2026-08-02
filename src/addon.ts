import { createHooks } from "./hooks";

/**
 * Central plugin object. Holds runtime state and the lifecycle hooks.
 * A single instance is attached to `Zotero.ZoteroLitRev` by index.ts.
 */
export class Addon {
  /** Runtime data shared across the plugin. */
  public data: {
    alive: boolean;
    /** Populated at startup with { id, version, rootURI }. */
    env: { id?: string; version?: string; rootURI?: string };
    /** Ids of UI elements we added, per main window, for clean removal. */
    ui: { menuitemId: string };
  };

  public hooks: ReturnType<typeof createHooks>;

  constructor() {
    this.data = {
      alive: true,
      env: {},
      ui: { menuitemId: "zotero-lit-rev-tools-menuitem" },
    };
    this.hooks = createHooks(this);
  }
}

export default Addon;
