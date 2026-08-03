import { DialogHelper, ProgressWindowHelper } from "zotero-plugin-toolkit";
import { ProjectManager } from "../projects/projectManager";
import { EXTRACTION_FIELDS, NOT_REPORTED } from "./extraction";
import { extractStudy } from "../ai/aiService";
import { isAIReady } from "../ai/aiConfig";
import { getItemTextByKey } from "../search/searchEngine";
import { exportExtractionTable } from "../export/reports";
import { actionColumn } from "../ui/dialogParts";
import { type Extraction, type Project, type ScreeningRecord } from "../types";

/**
 * Phase 4 (Oberfläche) – strukturierte Extraktion von Studienmerkmalen.
 * Arbeitet über die im Screening EINGESCHLOSSENEN Einträge.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

function includedItems(project: Project): ScreeningRecord[] {
  return (project.screening ?? []).filter(
    (r) => r.decision === "included" && !r.isDuplicate,
  );
}

function combinedText(t: {
  title: string;
  abstract: string;
  fulltext: string;
}): string {
  return [t.title, t.abstract, t.fulltext].filter(Boolean).join("\n\n");
}

async function runExtraction(
  pm: ProjectManager,
  project: Project,
  rec: ScreeningRecord,
): Promise<void> {
  const libraryID =
    project.sources?.libraryID ?? (Zotero as any).Libraries.userLibraryID;
  const text = await getItemTextByKey(libraryID, rec.itemKey);
  if (!text) {
    throw new Error("Eintrag/Text nicht gefunden.");
  }
  const { fields, model } = await extractStudy(project, combinedText(text));
  const extraction: Extraction = {
    itemKey: rec.itemKey,
    title: rec.title,
    creator: rec.creator,
    year: rec.year,
    fields,
    source: "ai",
    model,
    status: "ai-unreviewed",
  };
  await pm.upsertExtraction(project.projectId, extraction);
}

/** Editable form for one extraction. */
async function openExtractionForm(
  pm: ProjectManager,
  project: Project,
  rec: ScreeningRecord,
): Promise<void> {
  const existing = await pm.getExtraction(project.projectId, rec.itemKey);
  const data: Record<string, any> = {};
  for (const f of EXTRACTION_FIELDS) {
    data[f.id] = existing?.fields?.[f.id] ?? "";
  }

  const dialog = new DialogHelper(EXTRACTION_FIELDS.length + 1, 2);
  dialog.addCell(0, 0, {
    tag: "h3",
    namespace: "html",
    properties: {
      textContent: `Extraktion — ${rec.creator} ${rec.year}`.trim(),
    },
  });
  EXTRACTION_FIELDS.forEach((f, i) => {
    const row = i + 1;
    dialog
      .addCell(row, 0, {
        tag: "label",
        namespace: "html",
        styles: { fontWeight: "bold", verticalAlign: "top" },
        properties: { textContent: f.label },
      })
      .addCell(row, 1, {
        tag: "textarea",
        namespace: "html",
        attributes: { "data-bind": f.id, "data-prop": "value" },
        styles: { width: "440px", height: "40px" },
      });
  });

  dialog
    .addButton("Speichern (geprüft)", "save")
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);

  dialog.open(`Extraktion — ${rec.title.slice(0, 40)}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });

  await (data as any).unloadLock?.promise;
  if (data._lastButtonId === "save") {
    const fields: Record<string, string> = {};
    for (const f of EXTRACTION_FIELDS) {
      fields[f.id] = String(data[f.id] ?? "").trim() || NOT_REPORTED;
    }
    await pm.upsertExtraction(project.projectId, {
      itemKey: rec.itemKey,
      title: rec.title,
      creator: rec.creator,
      year: rec.year,
      fields,
      source: existing?.source === "ai" ? "ai" : "manual",
      model: existing?.model,
      status: "reviewed",
    });
  }
}

async function batchExtract(
  pm: ProjectManager,
  project: Project,
): Promise<void> {
  const items = includedItems(project);
  if (items.length === 0) {
    mainWindow().alert(
      "Keine eingeschlossenen Einträge. Bitte zuerst im Screening Einträge einschließen.",
    );
    return;
  }
  const pw = new ProgressWindowHelper("Zotero Literature Review — Extraktion");
  pw.createLine({ text: `Extraktion 0/${items.length} …`, progress: 0 });
  pw.show();

  let done = 0;
  let errors = 0;
  for (const rec of items) {
    try {
      await runExtraction(pm, project, rec);
    } catch (e) {
      errors++;
      Zotero.debug(`[zotero-lit-rev] extract error: ${e}`);
    }
    done++;
    pw.changeLine({
      text: `Extraktion ${done}/${items.length} …`,
      progress: Math.round((done / items.length) * 100),
    });
  }
  pw.changeLine({
    text: `Fertig: ${done - errors} extrahiert${errors ? `, ${errors} Fehler` : ""}. Bitte prüfen.`,
    progress: 100,
  });
  pw.startCloseTimer(4000);
}

export async function openExtraction(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) return;

  const items = includedItems(project);
  const extractions = await pm.listExtractions(projectId);
  const hasExtraction = new Set(extractions.map((e) => e.itemKey));

  const data: Record<string, any> = { selected: items[0]?.itemKey ?? "" };
  const dialog = new DialogHelper(2, 2);

  const options =
    items.length > 0
      ? items.map((r) => ({
          tag: "option",
          namespace: "html",
          properties: {
            value: r.itemKey,
            textContent: `${hasExtraction.has(r.itemKey) ? "✓" : "•"} ${[r.creator, r.year].filter(Boolean).join(" ")} — ${r.title.slice(0, 55)}`,
          },
        }))
      : [
          {
            tag: "option",
            namespace: "html",
            properties: {
              value: "",
              textContent:
                "(keine eingeschlossenen Einträge – zuerst Screening durchführen)",
            },
          },
        ];

  const reopen = () => {
    try {
      dialog.window?.close();
    } catch {
      /* ignore */
    }
    void openExtraction(pm, projectId);
  };

  const selectedRec = (): ScreeningRecord | undefined =>
    items.find((r) => r.itemKey === String(data.selected ?? ""));

  dialog
    .addCell(0, 0, {
      tag: "div",
      namespace: "html",
      children: [
        {
          tag: "h2",
          namespace: "html",
          properties: { textContent: `Extraktion — ${project.name}` },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray" },
          properties: {
            textContent: `${items.length} eingeschlossene Studie(n) · ${extractions.length} extrahiert`,
          },
        },
      ],
    })
    .addCell(1, 0, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "selected", "data-prop": "value", size: "16" },
      styles: { width: "480px", fontFamily: "monospace", fontSize: "12px" },
      children: options as any,
    })
    .addCell(1, 1, actionColumn([
      { heading: "Extraktion" },
      {
        label: "KI-Extraktion (Auswahl)",
        title:
          "Füllt für die ausgewählte Studie die 16 Merkmalsfelder per KI (nur vorhandene Angaben).",
        variant: "primary",
        onClick: async () => {
          const rec = selectedRec();
          if (!rec) return;
          if (!isAIReady()) {
            mainWindow().alert("KI ist nicht konfiguriert (KI-Einstellungen…).");
            return;
          }
          try {
            await runExtraction(pm, project, rec);
            mainWindow().alert("Extraktion erstellt (bitte prüfen).");
            reopen();
          } catch (e) {
            mainWindow().alert(`Extraktion fehlgeschlagen:\n${e}`);
          }
        },
      },
      {
        label: "Bearbeiten…",
        title: "Die extrahierten Felder ansehen, korrigieren und als geprüft speichern.",
        onClick: async () => {
          const rec = selectedRec();
          if (rec) await openExtractionForm(pm, project, rec);
        },
      },
      {
        label: "KI: alle extrahieren",
        title: "KI-Extraktion für alle eingeschlossenen Studien nacheinander.",
        onClick: async () => {
          if (!isAIReady()) {
            mainWindow().alert("KI ist nicht konfiguriert (KI-Einstellungen…).");
            return;
          }
          try {
            dialog.window?.close();
          } catch {
            /* ignore */
          }
          await batchExtract(pm, project);
          void openExtraction(pm, projectId);
        },
      },
      { heading: "Export" },
      {
        label: "Studiencharakteristika (CSV)",
        title: "Tabelle aller extrahierten Studienmerkmale als CSV speichern.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportExtractionTable(p);
            if (path) mainWindow().alert(`Gespeichert:\n${path}`);
          }
        },
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

  dialog.open(`Extraktion — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
