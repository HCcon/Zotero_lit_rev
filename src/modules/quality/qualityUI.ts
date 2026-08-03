import { DialogHelper, ProgressWindowHelper } from "zotero-plugin-toolkit";
import { ProjectManager } from "../projects/projectManager";
import { QUALITY_CRITERIA, RATINGS, qualityScore } from "./quality";
import { assessQuality } from "../ai/aiService";
import { isAIReady } from "../ai/aiConfig";
import { getItemTextByKey } from "../search/searchEngine";
import { exportQualityMatrix } from "../export/reports";
import {
  type Project,
  type QualityAssessment,
  type ScreeningRecord,
} from "../types";

/**
 * Phase 4 (Oberfläche) – Qualitätsbewertung der eingeschlossenen Studien.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

function includedItems(project: Project): ScreeningRecord[] {
  return (project.screening ?? []).filter(
    (r) => r.decision === "included" && !r.isDuplicate,
  );
}

async function runQuality(
  pm: ProjectManager,
  project: Project,
  rec: ScreeningRecord,
): Promise<void> {
  const libraryID =
    project.sources?.libraryID ?? (Zotero as any).Libraries.userLibraryID;
  const text = await getItemTextByKey(libraryID, rec.itemKey);
  if (!text) throw new Error("Eintrag/Text nicht gefunden.");
  const { ratings, note, model } = await assessQuality(
    project,
    [text.title, text.abstract, text.fulltext].filter(Boolean).join("\n\n"),
  );
  const quality: QualityAssessment = {
    itemKey: rec.itemKey,
    title: rec.title,
    creator: rec.creator,
    year: rec.year,
    ratings,
    note,
    source: "ai",
    model,
    status: "ai-unreviewed",
  };
  await pm.upsertQuality(project.projectId, quality);
}

async function openQualityForm(
  pm: ProjectManager,
  project: Project,
  rec: ScreeningRecord,
): Promise<void> {
  const existing = await pm.getQuality(project.projectId, rec.itemKey);
  const data: Record<string, any> = { note: existing?.note ?? "" };
  for (const c of QUALITY_CRITERIA) {
    data[c.id] = existing?.ratings?.[c.id] ?? "unclear";
  }

  const dialog = new DialogHelper(QUALITY_CRITERIA.length + 2, 2);
  dialog.addCell(0, 0, {
    tag: "h3",
    namespace: "html",
    properties: {
      textContent: `Qualität — ${rec.creator} ${rec.year}`.trim(),
    },
  });
  QUALITY_CRITERIA.forEach((c, i) => {
    const row = i + 1;
    dialog
      .addCell(row, 0, {
        tag: "label",
        namespace: "html",
        styles: { fontWeight: "bold" },
        properties: { textContent: c.label },
      })
      .addCell(row, 1, {
        tag: "select",
        namespace: "html",
        attributes: { "data-bind": c.id, "data-prop": "value" },
        styles: { width: "220px" },
        children: RATINGS.map((r) => ({
          tag: "option",
          namespace: "html",
          properties: { value: r.id, textContent: r.label },
          attributes: r.id === data[c.id] ? { selected: "selected" } : {},
        })) as any,
      });
  });
  const noteRow = QUALITY_CRITERIA.length + 1;
  dialog
    .addCell(noteRow, 0, {
      tag: "label",
      namespace: "html",
      styles: { fontWeight: "bold" },
      properties: { textContent: "Gesamteinschätzung" },
    })
    .addCell(noteRow, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "note", "data-prop": "value" },
      styles: { width: "300px", height: "50px" },
    })
    .addButton("Speichern (bestätigt)", "save")
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);

  dialog.open(`Qualität — ${rec.title.slice(0, 40)}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });

  await (data as any).unloadLock?.promise;
  if (data._lastButtonId === "save") {
    const ratings: Record<string, string> = {};
    for (const c of QUALITY_CRITERIA) ratings[c.id] = String(data[c.id]);
    await pm.upsertQuality(project.projectId, {
      itemKey: rec.itemKey,
      title: rec.title,
      creator: rec.creator,
      year: rec.year,
      ratings,
      note: String(data.note ?? "").trim(),
      source: existing?.source === "ai" ? "ai" : "manual",
      model: existing?.model,
      status: "confirmed",
    });
  }
}

async function batchQuality(pm: ProjectManager, project: Project): Promise<void> {
  const items = includedItems(project);
  if (items.length === 0) {
    mainWindow().alert(
      "Keine eingeschlossenen Einträge. Bitte zuerst im Screening einschließen.",
    );
    return;
  }
  const pw = new ProgressWindowHelper("Zotero Literature Review — Qualität");
  pw.createLine({ text: `Bewertung 0/${items.length} …`, progress: 0 });
  pw.show();
  let done = 0;
  let errors = 0;
  for (const rec of items) {
    try {
      await runQuality(pm, project, rec);
    } catch (e) {
      errors++;
      Zotero.debug(`[zotero-lit-rev] quality error: ${e}`);
    }
    done++;
    pw.changeLine({
      text: `Bewertung ${done}/${items.length} …`,
      progress: Math.round((done / items.length) * 100),
    });
  }
  pw.changeLine({
    text: `Fertig: ${done - errors} bewertet${errors ? `, ${errors} Fehler` : ""}. Bitte prüfen.`,
    progress: 100,
  });
  pw.startCloseTimer(4000);
}

export async function openQuality(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) return;

  const items = includedItems(project);
  const assessments = await pm.listQuality(projectId);
  const byKey = new Map(assessments.map((q) => [q.itemKey, q]));

  const data: Record<string, any> = { selected: items[0]?.itemKey ?? "" };
  const dialog = new DialogHelper(3, 1);

  const options =
    items.length > 0
      ? items.map((r) => {
          const q = byKey.get(r.itemKey);
          const s = q ? ` (${qualityScore(q.ratings).score}%)` : "";
          return {
            tag: "option",
            namespace: "html",
            properties: {
              value: r.itemKey,
              textContent: `${q ? "✓" : "•"} ${[r.creator, r.year].filter(Boolean).join(" ")}${s} — ${r.title.slice(0, 50)}`,
            },
          };
        })
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
    void openQuality(pm, projectId);
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
          properties: { textContent: `Qualitätsbewertung — ${project.name}` },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray" },
          properties: {
            textContent: `${items.length} eingeschlossene Studie(n) · ${assessments.length} bewertet`,
          },
        },
      ],
    })
    .addCell(1, 0, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "selected", "data-prop": "value", size: "14" },
      styles: { width: "560px", fontFamily: "monospace" },
      children: options as any,
    })
    .addButton("KI-Bewertung (Auswahl)", "aione", {
      noClose: true,
      callback: async () => {
        const rec = selectedRec();
        if (!rec) return;
        if (!isAIReady()) {
          mainWindow().alert("KI ist nicht konfiguriert (KI-Einstellungen…).");
          return;
        }
        try {
          await runQuality(pm, project, rec);
          mainWindow().alert("Qualitätsbewertung erstellt (bitte prüfen).");
          reopen();
        } catch (e) {
          mainWindow().alert(`Bewertung fehlgeschlagen:\n${e}`);
        }
      },
    })
    .addButton("Bearbeiten…", "edit", {
      noClose: true,
      callback: async () => {
        const rec = selectedRec();
        if (rec) await openQualityForm(pm, project, rec);
      },
    })
    .addButton("KI: alle bewerten", "aiall", {
      noClose: true,
      callback: async () => {
        if (!isAIReady()) {
          mainWindow().alert("KI ist nicht konfiguriert (KI-Einstellungen…).");
          return;
        }
        try {
          dialog.window?.close();
        } catch {
          /* ignore */
        }
        await batchQuality(pm, project);
        void openQuality(pm, projectId);
      },
    })
    .addButton("Export: Qualitätsmatrix", "exp", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (p) {
          const path = await exportQualityMatrix(p);
          if (path) mainWindow().alert(`Gespeichert:\n${path}`);
        }
      },
    })
    .addButton("Schließen", "close")
    .setDialogData(data);

  dialog.open(`Qualitätsbewertung — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
