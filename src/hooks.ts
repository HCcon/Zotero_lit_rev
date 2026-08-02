import type { Addon } from "./addon";
import { openProjectManager } from "./modules/projects/projectUI";
import {
  addItemContextMenu,
  removeItemContextMenu,
} from "./modules/ui/contextMenu";
import { registerItemPaneSection } from "./modules/ui/itemPane";

const ADDON_NAME = "Zotero Literature Review";

function log(msg: string) {
  Zotero.debug(`[zotero-lit-rev] ${msg}`);
}

/**
 * Creates the lifecycle hooks. The bootstrap loader calls these:
 * onStartup once, onMainWindowLoad/Unload per window, onShutdown at the end.
 */
export function createHooks(addon: Addon) {
  function onStartup(env: { id?: string; version?: string; rootURI?: string }) {
    addon.data.env = env;
    log(`Starting up v${env.version ?? "?"}`);

    // Item-Pane-Abschnitt einmalig registrieren (defensiv).
    registerItemPaneSection(addon.projects);

    // Attach to any main windows that are already open.
    for (const win of Zotero.getMainWindows()) {
      onMainWindowLoad(win);
    }
  }

  function onMainWindowLoad(win: Window) {
    const doc = win.document;

    // Tools-Menüeintrag
    const menu = doc.getElementById("menu_ToolsPopup");
    if (menu && !doc.getElementById(addon.data.ui.menuitemId)) {
      const menuitem = (doc as any).createXULElement("menuitem");
      menuitem.id = addon.data.ui.menuitemId;
      menuitem.setAttribute("label", `${ADDON_NAME} — Projekte…`);
      menuitem.addEventListener("command", () => {
        void openProjectManager(addon.projects);
      });
      menu.appendChild(menuitem);
    }

    // Rechtsklick-Kontextmenü in der Eintragsliste
    addItemContextMenu(win, addon.projects);

    log("Window UI added");
  }

  function onMainWindowUnload(win: Window) {
    win.document.getElementById(addon.data.ui.menuitemId)?.remove();
    removeItemContextMenu(win);
  }

  function onShutdown() {
    log("Shutting down");
    for (const win of Zotero.getMainWindows()) {
      onMainWindowUnload(win);
    }
    const Z = Zotero as any;
    try {
      Z.ItemPaneManager?.unregisterSection?.("zotero-lit-rev-section");
    } catch {
      /* ignore */
    }
    addon.data.alive = false;
  }

  return { onStartup, onMainWindowLoad, onMainWindowUnload, onShutdown };
}
