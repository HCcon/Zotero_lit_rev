import { DialogHelper } from "zotero-plugin-toolkit";
import { notify } from "../ui/notify";
import { ProjectManager } from "../projects/projectManager";

/**
 * Baustein 3 (Oberfläche) – Zotero-Sammlungen einem Projekt zuordnen.
 * Zeigt die Collections der gewählten Bibliothek als Checkbox-Liste.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

interface LibraryInfo {
  libraryID: number;
  name: string;
}

interface CollectionInfo {
  key: string;
  name: string;
  level: number;
}

function getLibraries(): LibraryInfo[] {
  try {
    const libs = (Zotero as any).Libraries.getAll() as any[];
    return libs
      .filter((l) => l.editable !== false)
      .map((l) => ({ libraryID: l.libraryID, name: l.name }));
  } catch {
    return [
      {
        libraryID: (Zotero as any).Libraries.userLibraryID,
        name: "Meine Bibliothek",
      },
    ];
  }
}

function getCollections(libraryID: number): CollectionInfo[] {
  const all = (Zotero as any).Collections.getByLibrary(libraryID, true) as any[];
  return all.map((c) => ({
    key: c.key,
    name: c.name,
    level: typeof c.level === "number" ? c.level : 0,
  }));
}

/**
 * Öffnet den Dialog zur Sammlungsauswahl für ein Projekt.
 * @param libraryOverride wird beim Wechsel der Bibliothek gesetzt.
 */
export async function openCollectionSelector(
  pm: ProjectManager,
  projectId: string,
  libraryOverride?: number,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) {
    return;
  }

  const libraries = getLibraries();
  const userLibId = (Zotero as any).Libraries.userLibraryID as number;
  const currentLib =
    libraryOverride ?? project.sources?.libraryID ?? userLibId;

  // Vorauswahl nur übernehmen, wenn dieselbe Bibliothek.
  const preselected = new Set<string>(
    project.sources && project.sources.libraryID === currentLib
      ? project.sources.collectionKeys
      : [],
  );
  const incSub = project.sources?.includeSubcollections ?? true;
  const onlyPdf = project.sources?.onlyWithPDF ?? false;

  const collections = getCollections(currentLib);

  const dialog = new DialogHelper(6, 1);

  // 0: Überschrift
  dialog.addCell(0, 0, {
    tag: "h2",
    namespace: "html",
    properties: { textContent: `Sammlungen zuordnen — ${project.name}` },
  });

  // 1: Bibliotheks-Auswahl
  dialog.addCell(1, 0, {
    tag: "div",
    namespace: "html",
    styles: { display: "flex", alignItems: "center", gap: "8px" },
    children: [
      {
        tag: "label",
        namespace: "html",
        properties: { textContent: "Bibliothek:" },
      },
      {
        tag: "select",
        namespace: "html",
        id: "lib-select",
        children: libraries.map((l) => ({
          tag: "option",
          namespace: "html",
          properties: { value: String(l.libraryID), textContent: l.name },
          attributes:
            l.libraryID === currentLib ? { selected: "selected" } : {},
        })),
        listeners: [
          {
            type: "change",
            listener: (ev: Event) => {
              const value = Number(
                (ev.target as HTMLSelectElement).value,
              );
              const win = (ev.target as any).ownerDocument?.defaultView;
              try {
                win?.close();
              } catch {
                /* ignore */
              }
              void openCollectionSelector(pm, projectId, value);
            },
          },
        ],
      },
    ],
  });

  // 2: Scrollbare Collection-Liste
  const collectionRows =
    collections.length > 0
      ? collections.map((c) => ({
          tag: "div",
          namespace: "html",
          styles: { padding: "2px 0" },
          children: [
            {
              tag: "input",
              namespace: "html",
              id: `coll-${c.key}`,
              attributes: {
                type: "checkbox",
                "data-collection-key": c.key,
                ...(preselected.has(c.key) ? { checked: "checked" } : {}),
              },
            },
            {
              tag: "label",
              namespace: "html",
              attributes: { for: `coll-${c.key}` },
              styles: { marginLeft: "6px" },
              properties: {
                textContent: `${"    ".repeat(c.level)}${c.name}`,
              },
            },
          ],
        }))
      : [
          {
            tag: "div",
            namespace: "html",
            properties: {
              textContent:
                "(In dieser Bibliothek gibt es noch keine Sammlungen.)",
            },
          },
        ];

  dialog.addCell(2, 0, {
    tag: "div",
    namespace: "html",
    styles: {
      maxHeight: "280px",
      minWidth: "460px",
      overflow: "auto",
      border: "1px solid rgba(128,128,128,0.4)",
      borderRadius: "4px",
      padding: "6px",
    },
    children: collectionRows as any,
  });

  // 3: Option Subcollections
  dialog.addCell(3, 0, {
    tag: "div",
    namespace: "html",
    styles: { display: "flex", alignItems: "center", gap: "6px" },
    children: [
      {
        tag: "input",
        namespace: "html",
        id: "opt-subcoll",
        attributes: {
          type: "checkbox",
          ...(incSub ? { checked: "checked" } : {}),
        },
      },
      {
        tag: "label",
        namespace: "html",
        attributes: { for: "opt-subcoll" },
        properties: { textContent: "Untersammlungen einschließen" },
      },
    ],
  });

  // 4: Option nur mit PDF
  dialog.addCell(4, 0, {
    tag: "div",
    namespace: "html",
    styles: { display: "flex", alignItems: "center", gap: "6px" },
    children: [
      {
        tag: "input",
        namespace: "html",
        id: "opt-onlypdf",
        attributes: {
          type: "checkbox",
          ...(onlyPdf ? { checked: "checked" } : {}),
        },
      },
      {
        tag: "label",
        namespace: "html",
        attributes: { for: "opt-onlypdf" },
        properties: {
          textContent: "Nur Einträge mit PDF-Volltext berücksichtigen",
        },
      },
    ],
  });

  // 5: Hinweis
  dialog.addCell(5, 0, {
    tag: "small",
    namespace: "html",
    styles: { color: "gray" },
    properties: {
      textContent:
        "Die Zuordnung verändert deine Zotero-Sammlungen nicht – sie wird nur im Projekt gespeichert.",
    },
  });

  dialog
    .addButton("Speichern", "save", {
      noClose: true,
      callback: async () => {
        const doc = dialog.window.document;
        const keys = Array.from(
          doc.querySelectorAll("input[data-collection-key]"),
        )
          .filter((el) => (el as HTMLInputElement).checked)
          .map((el) => (el as HTMLElement).getAttribute("data-collection-key")!)
          .filter(Boolean);
        const includeSub =
          (doc.getElementById("opt-subcoll") as HTMLInputElement | null)
            ?.checked ?? false;
        const withPdf =
          (doc.getElementById("opt-onlypdf") as HTMLInputElement | null)
            ?.checked ?? false;

        await pm.setSources(projectId, {
          libraryID: currentLib,
          collectionKeys: keys,
          includeSubcollections: includeSub,
          onlyWithPDF: withPdf,
        });
        notify(
          `${keys.length} Sammlung(en) dem Projekt zugeordnet.`,
        );
        try {
          dialog.window.close();
        } catch {
          /* ignore */
        }
      },
    })
    .addButton("Abbrechen", "cancel")
    .setDialogData({});

  dialog.open(`Sammlungen — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
