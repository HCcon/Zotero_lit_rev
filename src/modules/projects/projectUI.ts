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
import { openScreening } from "../screening/screeningUI";
import { openExtraction } from "../extraction/extractionUI";
import { openQuality } from "../quality/qualityUI";
import { openSynthesis } from "../synthesis/synthesisUI";
import { openAISettings } from "../ai/settingsUI";
import { actionColumn } from "../ui/dialogParts";
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

  const dialog = new DialogHelper(2, 2);

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
  const sel = () => String(data.selected ?? "");
  const withProject = async (fn: (id: string) => void | Promise<void>) => {
    const id = sel();
    if (!id) {
      mainWindow().alert("Bitte zuerst ein Projekt auswählen.");
      return;
    }
    await fn(id);
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
        size: "16",
      },
      styles: { width: "420px", fontSize: "13px" },
      children: optionChildren as any,
    })
    .addCell(1, 1, actionColumn([
      { heading: "Projekt" },
      {
        label: "Neu…",
        title: "Neues Rechercheprojekt anlegen (Forschungsfrage, Review-Typ …).",
        variant: "primary",
        onClick: async () => {
          const input = await openProjectForm();
          if (input) {
            await pm.create(input);
            reopen();
          }
        },
      },
      {
        label: "Bearbeiten…",
        title: "Das ausgewählte Projekt bearbeiten.",
        onClick: () =>
          withProject(async (id) => {
            const existing = await pm.get(id);
            if (!existing) return;
            const input = await openProjectForm(existing);
            if (input) {
              await pm.update(id, input);
              reopen();
            }
          }),
      },
      {
        label: "Löschen",
        title: "Das ausgewählte Projekt löschen (nur die Plugin-Daten).",
        variant: "danger",
        onClick: () =>
          withProject(async (id) => {
            const existing = await pm.get(id);
            if (!existing) return;
            if (
              mainWindow().confirm(`Projekt „${existing.name}" wirklich löschen?`)
            ) {
              await pm.remove(id);
              reopen();
            }
          }),
      },
      { heading: "Recherche vorbereiten" },
      {
        label: "Sammlungen…",
        title:
          "Zotero-Sammlungen (Ordner) auswählen, die durchsucht werden sollen.",
        onClick: () => withProject((id) => openCollectionSelector(pm, id)),
      },
      {
        label: "Suchkonzepte…",
        title:
          "Keywords, Synonyme, Kontextbeschreibung und Beispiele je Suchkonzept festlegen.",
        onClick: () => withProject((id) => openConceptManager(pm, id)),
      },
      {
        label: "Analyse & Treffer…",
        title:
          "PDFs durchsuchen; Treffer prüfen, KI-Bewertung, Paraphrasen, Kodierung, Export.",
        variant: "primary",
        onClick: () => withProject((id) => openResults(pm, id)),
      },
      { heading: "Systematisches Review" },
      {
        label: "Screening…",
        title:
          "Studien ein-/ausschließen, Ausschlussgründe, Dublettenprüfung, PRISMA, Evidenztabelle.",
        onClick: () => withProject((id) => openScreening(pm, id)),
      },
      {
        label: "Extraktion…",
        title:
          "Studienmerkmale strukturiert erfassen: Methode, Stichprobe, Ergebnisse, Limitationen …",
        onClick: () => withProject((id) => openExtraction(pm, id)),
      },
      {
        label: "Qualität…",
        title:
          "Methodische Qualität / Risk of Bias je Studie bewerten (10 Kriterien, Score).",
        onClick: () => withProject((id) => openQuality(pm, id)),
      },
      {
        label: "Synthese…",
        title:
          "Studienübergreifende Erkenntnisse, Widersprüche und Forschungslücken (KI).",
        onClick: () => withProject((id) => openSynthesis(pm, id)),
      },
      { heading: "Sonstiges" },
      {
        label: "KI-Einstellungen…",
        title: "Anbieter, Modell und API-Schlüssel für die KI-Funktionen.",
        onClick: () => openAISettings(),
      },
      {
        label: "Schließen",
        title: "Dieses Fenster schließen.",
        onClick: () => {
          try {
            dialog.window?.close();
          } catch {
            /* ignore */
          }
        },
      },
    ]))
    .setDialogData(data);

  dialog.open("Zotero Literature Review — Projekte", {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
