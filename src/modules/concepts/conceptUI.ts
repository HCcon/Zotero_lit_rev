import { DialogHelper } from "zotero-plugin-toolkit";
import {
  ProjectManager,
  type ConceptInput,
} from "../projects/projectManager";
import { type Concept } from "../types";

/**
 * Baustein 4 (Oberfläche) – Verwaltung der Suchkonzepte eines Projekts.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

const splitLines = (s: string) =>
  String(s ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);

/** Formular zum Anlegen/Bearbeiten eines Suchkonzepts. */
async function openConceptForm(
  subQuestions: string[],
  existing?: Concept,
): Promise<ConceptInput | null> {
  const data: Record<string, any> = {
    name: existing?.name ?? "",
    description: existing?.description ?? "",
    keywords: (existing?.keywords ?? []).join("\n"),
    synonyms: (existing?.synonyms ?? []).join("\n"),
    exclusionTerms: (existing?.exclusionTerms ?? []).join("\n"),
    positiveExamples: (existing?.positiveExamples ?? []).join("\n"),
    negativeExamples: (existing?.negativeExamples ?? []).join("\n"),
    subQuestion: existing?.subQuestion ?? "",
  };

  const labelStyle = { style: "margin-top: 6px; font-weight: bold;" };
  const inputStyle = { width: "440px" };
  const areaStyle = { width: "440px", height: "60px" };

  const subQuestionChildren = [
    {
      tag: "option",
      namespace: "html",
      properties: { value: "", textContent: "(keine Zuordnung)" },
    },
    ...subQuestions.map((q) => ({
      tag: "option",
      namespace: "html",
      properties: { value: q, textContent: q },
      attributes: q === data.subQuestion ? { selected: "selected" } : {},
    })),
  ];

  const dialog = new DialogHelper(8, 2);
  dialog
    .addCell(0, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Name *" },
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
      properties: { textContent: "Kontextbeschreibung" },
      attributes: labelStyle,
    })
    .addCell(1, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "description", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(2, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Hauptkeywords (eines pro Zeile)" },
      attributes: labelStyle,
    })
    .addCell(2, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "keywords", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(3, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Synonyme (eines pro Zeile)" },
      attributes: labelStyle,
    })
    .addCell(3, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "synonyms", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(4, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Ausschlussbegriffe (einer pro Zeile)" },
      attributes: labelStyle,
    })
    .addCell(4, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "exclusionTerms", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(5, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Relevante Beispiele (eines pro Zeile)" },
      attributes: labelStyle,
    })
    .addCell(5, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "positiveExamples", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(6, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Nicht relevante Beispiele (eines pro Zeile)" },
      attributes: labelStyle,
    })
    .addCell(6, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "negativeExamples", "data-prop": "value" },
      styles: areaStyle,
    })
    .addCell(7, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Zugeordnete Teilfrage" },
      attributes: labelStyle,
    })
    .addCell(7, 1, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "subQuestion", "data-prop": "value" },
      styles: inputStyle,
      children: subQuestionChildren as any,
    })
    .addButton("Speichern", "save")
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);

  dialog.open(existing ? "Suchkonzept bearbeiten" : "Neues Suchkonzept", {
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
    mainWindow().alert("Bitte einen Namen für das Suchkonzept eingeben.");
    return null;
  }

  return {
    name,
    description: String(data.description ?? "").trim(),
    keywords: splitLines(data.keywords),
    synonyms: splitLines(data.synonyms),
    exclusionTerms: splitLines(data.exclusionTerms),
    positiveExamples: splitLines(data.positiveExamples),
    negativeExamples: splitLines(data.negativeExamples),
    subQuestion: String(data.subQuestion ?? "").trim(),
  };
}

/** Hauptdialog: Liste der Suchkonzepte eines Projekts. */
export async function openConceptManager(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) {
    return;
  }
  const concepts = await pm.listConcepts(projectId);
  const subQuestions = project.subQuestions ?? [];
  const data: Record<string, any> = { selected: concepts[0]?.conceptId ?? "" };

  const dialog = new DialogHelper(3, 1);

  const optionChildren =
    concepts.length > 0
      ? concepts.map((c) => ({
          tag: "option",
          namespace: "html",
          properties: {
            value: c.conceptId,
            textContent: `${c.name}  ·  ${c.keywords.length} Keyword(s)`,
          },
        }))
      : [
          {
            tag: "option",
            namespace: "html",
            properties: { value: "", textContent: "(noch keine Suchkonzepte)" },
          },
        ];

  const reopen = () => {
    try {
      dialog.window?.close();
    } catch {
      /* ignore */
    }
    void openConceptManager(pm, projectId);
  };

  dialog
    .addCell(0, 0, {
      tag: "h2",
      namespace: "html",
      properties: { textContent: `Suchkonzepte — ${project.name}` },
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
        const input = await openConceptForm(subQuestions);
        if (input) {
          await pm.addConcept(projectId, input);
          reopen();
        }
      },
    })
    .addButton("Bearbeiten…", "edit", {
      noClose: true,
      callback: async () => {
        const id = String(data.selected ?? "");
        if (!id) return;
        const existing = await pm.getConcept(projectId, id);
        if (!existing) return;
        const input = await openConceptForm(subQuestions, existing);
        if (input) {
          await pm.updateConcept(projectId, id, input);
          reopen();
        }
      },
    })
    .addButton("Löschen", "delete", {
      noClose: true,
      callback: async () => {
        const id = String(data.selected ?? "");
        if (!id) return;
        const existing = await pm.getConcept(projectId, id);
        if (!existing) return;
        if (
          mainWindow().confirm(`Suchkonzept „${existing.name}" wirklich löschen?`)
        ) {
          await pm.removeConcept(projectId, id);
          reopen();
        }
      },
    })
    .addButton("Schließen", "close")
    .setDialogData(data);

  dialog.open(`Suchkonzepte — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
