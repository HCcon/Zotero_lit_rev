import type { Addon } from "./addon";
import { openProjectManager } from "./modules/projects/projectUI";

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
    // Attach to any main windows that are already open.
    for (const win of Zotero.getMainWindows()) {
      onMainWindowLoad(win);
    }
  }

  function onMainWindowLoad(win: Window) {
    const doc = win.document;
    const menu = doc.getElementById("menu_ToolsPopup");
    if (!menu || doc.getElementById(addon.data.ui.menuitemId)) {
      return;
    }
    // `createXULElement` exists on Zotero/Firefox documents.
    const menuitem = (doc as any).createXULElement("menuitem");
    menuitem.id = addon.data.ui.menuitemId;
    menuitem.setAttribute("label", `${ADDON_NAME} — Projekte…`);
    menuitem.addEventListener("command", () => {
      void openProjectManager(addon.projects);
    });
    menu.appendChild(menuitem);
    log("Menu item added");
  }

  function onMainWindowUnload(win: Window) {
    const menuitem = win.document.getElementById(addon.data.ui.menuitemId);
    menuitem?.remove();
  }

  function onShutdown() {
    log("Shutting down");
    for (const win of Zotero.getMainWindows()) {
      onMainWindowUnload(win);
    }
    addon.data.alive = false;
  }

  return { onStartup, onMainWindowLoad, onMainWindowUnload, onShutdown };
}
