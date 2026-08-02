import { ProjectManager } from "../projects/projectManager";
import { openProjectManager } from "../projects/projectUI";

/**
 * Baustein 10 – Kontextmenübefehl in der Eintragsliste (Konzept Kap. 14.2).
 */

const MENUITEM_ID = "zotero-lit-rev-itemmenu";

export function addItemContextMenu(win: Window, pm: ProjectManager): void {
  const doc = win.document;
  const popup = doc.getElementById("zotero-itemmenu");
  if (!popup || doc.getElementById(MENUITEM_ID)) {
    return;
  }
  const menuitem = (doc as any).createXULElement("menuitem");
  menuitem.id = MENUITEM_ID;
  menuitem.setAttribute("label", "Zotero Literature Review — Projekte…");
  menuitem.addEventListener("command", () => {
    void openProjectManager(pm);
  });
  popup.appendChild(menuitem);
}

export function removeItemContextMenu(win: Window): void {
  win.document.getElementById(MENUITEM_ID)?.remove();
}
