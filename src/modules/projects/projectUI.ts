import { DialogHelper } from "zotero-plugin-toolkit";
import {
  ProjectManager,
  REVIEW_TYPES,
  reviewTypeLabel,
  type ProjectInput,
} from "./projectManager";
import { openCollectionSelector } from "../collections/collectionUI";
import { openConceptManager } from "../concepts/conceptUI";
import { openResults } from "../results/resultsUI";
import { type Project } from "../types";

/**
 * Baustein 2 (Oberfläche) – Dialoge für die Projektverwaltung.
 * Nutzt die DialogHelper-Bausteine aus zotero-plugin-toolkit.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

/**
 * Formular zum Anlegen/Bearbeiten eines Projekts.
 * Gibt die eingegebenen Werte zurück oder null bei Abbruch.
 */
async function openProjectForm(existing?: Project): Promise<ProjectInput | null> {
  const data: Record<string, any> = {
    name: existing?.name ?? "",
    researchQuestion: existing?.researchQuestion ?? "",
    subQuestions: (existing?.subQuestions ?? []).join("\n"),
    reviewType: existing?.reviewType ?? REVIEW_TYPES[0].id,
    languages: (existing?.languages ?? []).join(", "),
    inclusionCriteria: existing?.inclusionCriteria ?? "",
    exclusionCriteria: existing?.exclusionCriteria ?? "",
  };

  const dialog = new DialogHelper(8, 2);
  const labelStyle = { style: "margin-top: 6px; font-weight: bold;" };
  const inputStyle = { width: "420px" };
  const areaStyle = { width: "420px", height: "60px" };

  dialog
    .addCell(0, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Titel *" },
      attributes: labelStyle,
    })
    .addCell(0, 1, {
      tag: "input",
      namespace: "html",
      attributes: { "data-bind": "name", "data-prop": "value", type: "text" },
      styles: inputStyle,
    })
    .addCell(1, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Forschungsfrage" },
      attributes: labelStyle,
    })
    .addCell(1, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "researchQuestion", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(2, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Teilfragen (eine pro Zeile)" },
      attributes: labelStyle,
    })
    .addCell(2, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "subQuestions", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(3, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Review-Typ" },
      attributes: labelStyle,
    })
    .addCell(3, 1, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "reviewType", "data-prop": "value" },
      styles: inputStyle,
      children: REVIEW_TYPES.map((t) => ({
        tag: "option",
        namespace: "html",
        properties: { value: t.id, textContent: t.label },
      })),
    })
    .addCell(4, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Sprachen (Komma-getrennt)" },
      attributes: labelStyle,
    })
    .addCell(4, 1, {
      tag: "input",
      namespace: "html",
      attributes: {
        "data-bind": "languages",
        "data-prop": "value",
        type: "text",
      },
      styles: inputStyle,
    })
    .addCell(5, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Einschlusskriterien" },
      attributes: labelStyle,
    })
    .addCell(5, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "inclusionCriteria", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(6, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Ausschlusskriterien" },
      attributes: labelStyle,
    })
    .addCell(6, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "exclusionCriteria", "data-prop": "value" },
      styles: areaStyle,
    })
    .addButton("Speichern", "save")
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);

  dialog.open(existing ? "Projekt bearbeiten" : "Neues Projekt", {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });

  await (data as any).unloadLock?.promise;

  if (data._lastButtonId !== "save") {
    return null;
  }
  const name = String(data.name ?? "").trim();
  if (!name) {
    mainWindow().alert("Bitte einen Titel eingeben.");
    return null;
  }

  const splitLines = (s: string) =>
    String(s ?? "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);
  const splitCommas = (s: string) =>
    String(s ?? "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);

  return {
    name,
    researchQuestion: String(data.researchQuestion ?? "").trim(),
    subQuestions: splitLines(data.subQuestions),
    reviewType: String(data.reviewType ?? REVIEW_TYPES[0].id),
    languages: splitCommas(data.languages),
    inclusionCriteria: String(data.inclusionCriteria ?? "").trim(),
    exclusionCriteria: String(data.exclusionCriteria ?? "").trim(),
  };
}

/**
 * Hauptdialog: Liste der Projekte mit Aktionen (Neu / Bearbeiten / Löschen).
 * Wird nach jeder Änderung neu geöffnet, um die Liste zu aktualisieren.
 */
export async function openProjectManager(pm: ProjectManager): Promise<void> {
  const projects = await pm.list();
  const data: Record<string, any> = {
    selected: projects[0]?.projectId ?? "",
  };

  const dialog = new DialogHelper(3, 1);

  const optionChildren =
    projects.length > 0
      ? projects.map((p) => ({
          tag: "option",
          namespace: "html",
          properties: {
            value: p.projectId,
            textContent: `${p.name}  ·  ${reviewTypeLabel(p.reviewType)}`,
          },
        }))
      : [
          {
            tag: "option",
            namespace: "html",
            properties: { value: "", textContent: "(noch keine Projekte)" },
          },
        ];

  const reopen = () => {
    try {
      dialog.window?.close();
    } catch {
      /* ignore */
    }
    void openProjectManager(pm);
  };

  dialog
    .addCell(0, 0, {
      tag: "h2",
      namespace: "html",
      properties: { textContent: "Rechercheprojekte" },
    })
    .addCell(1, 0, {
      tag: "select",
      namespace: "html",
      attributes: {
        "data-bind": "selected",
        "data-prop": "value",
        size: "12",
      },
      styles: { width: "480px" },
      children: optionChildren as any,
    })
    .addButton("Neu…", "new", {
      noClose: true,
      callback: async () => {
        const input = await openProjectForm();
        if (input) {
          await pm.create(input);
          reopen();
        }
      },
    })
    .addButton("Bearbeiten…", "edit", {
      noClose: true,
      callback: async () => {
        const id = String(data.selected ?? "");
        if (!id) return;
        const existing = await pm.get(id);
        if (!existing) return;
        const input = await openProjectForm(existing);
        if (input) {
          await pm.update(id, input);
          reopen();
        }
      },
    })
    .addButton("Sammlungen…", "sources", {
      noClose: true,
      callback: async () => {
        const id = String(data.selected ?? "");
        if (!id) return;
        await openCollectionSelector(pm, id);
      },
    })
    .addButton("Suchkonzepte…", "concepts", {
      noClose: true,
      callback: async () => {
        const id = String(data.selected ?? "");
        if (!id) return;
        await openConceptManager(pm, id);
      },
    })
    .addButton("Analyse & Treffer…", "results", {
      noClose: true,
      callback: async () => {
        const id = String(data.selected ?? "");
        if (!id) return;
        await openResults(pm, id);
      },
    })
    .addButton("Löschen", "delete", {
      noClose: true,
      callback: async () => {
        const id = String(data.selected ?? "");
        if (!id) return;
        const existing = await pm.get(id);
        if (!existing) return;
        if (mainWindow().confirm(`Projekt „${existing.name}" wirklich löschen?`)) {
          await pm.remove(id);
          reopen();
        }
      },
    })
    .addButton("Schließen", "close")
    .setDialogData(data);

  dialog.open("Zotero Literature Review — Projekte", {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
