import { DialogHelper } from "zotero-plugin-toolkit";
import { openProgressWindow } from "../ui/notify";
import { notify } from "../ui/notify";
import { ProjectManager } from "../projects/projectManager";
import {
  QUALITY_CRITERIA,
  RATINGS,
  activeCriteria,
  qualityScore,
} from "./quality";
import { assessQuality } from "../ai/aiService";
import { isAIReady } from "../ai/aiConfig";
import { getItemTextByKey } from "../search/searchEngine";
import { exportQualityMatrix } from "../export/reports";
import { actionColumn } from "../ui/dialogParts";
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
  const criteria = activeCriteria(project);
  const data: Record<string, any> = { note: existing?.note ?? "" };
  for (const c of criteria) {
    data[c.id] = existing?.ratings?.[c.id] ?? "unclear";
  }

  const dialog = new DialogHelper(criteria.length + 2, 2);
  dialog.addCell(0, 0, {
    tag: "h3",
    namespace: "html",
    properties: {
      textContent: `Qualität — ${rec.creator} ${rec.year}`.trim(),
    },
  });
  criteria.forEach((c, i) => {
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
  const noteRow = criteria.length + 1;
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
    for (const c of criteria) ratings[c.id] = String(data[c.id]);
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
    notify(
      "Keine eingeschlossenen Einträge. Bitte zuerst im Screening einschließen.",
    );
    return;
  }
  const prog = openProgressWindow("Qualitätsbewertung der Studien");
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
    void prog.set(done, items.length, `Bewerte ${done}/${items.length} Studie(n)`);
  }
  prog.close();
  notify(
    `Qualitätsbewertung abgeschlossen.\n\n${done - errors} von ${items.length} ` +
      `Studie(n) bewertet${errors ? `, ${errors} Fehler` : ""}.\n\n` +
      "Prüfe/bestätige die Kriterien mit „Bearbeiten…“ und exportiere die " +
      "„Qualitätsmatrix (CSV)“.",
  );
}

/** Dialog to enable/disable quality criteria (classic SR checklist). */
async function openCriteriaDialog(
  pm: ProjectManager,
  project: Project,
): Promise<boolean> {
  const active = new Set(activeCriteria(project).map((c) => c.id));
  const dialog = new DialogHelper(QUALITY_CRITERIA.length + 2, 1);
  dialog.addCell(0, 0, {
    tag: "div",
    namespace: "html",
    styles: { maxWidth: "420px" },
    properties: {
      textContent:
        "Wähle die Qualitätskriterien, die bewertet werden sollen. " +
        "Abgewählte Kriterien entfallen in KI-Bewertung, Formular, Score und Matrix.",
    },
  });
  QUALITY_CRITERIA.forEach((c, i) => {
    dialog.addCell(i + 1, 0, {
      tag: "div",
      namespace: "html",
      styles: { display: "flex", alignItems: "center", gap: "6px", padding: "2px 0" },
      children: [
        {
          tag: "input",
          namespace: "html",
          id: `crit-${c.id}`,
          attributes: {
            type: "checkbox",
            ...(active.has(c.id) ? { checked: "checked" } : {}),
          },
        },
        {
          tag: "label",
          namespace: "html",
          attributes: { for: `crit-${c.id}` },
          properties: { textContent: c.label },
        },
      ],
    });
  });
  dialog
    .addButton("Speichern", "save")
    .addButton("Abbrechen", "cancel")
    .setDialogData({});
  dialog.open("Qualitätskriterien wählen", {
    centerscreen: true,
    fitContent: true,
  });
  await (dialog.dialogData as any).unloadLock?.promise;
  if (dialog.dialogData._lastButtonId !== "save") return false;

  const doc = dialog.window.document;
  const ids = QUALITY_CRITERIA.filter(
    (c) => (doc.getElementById(`crit-${c.id}`) as HTMLInputElement | null)?.checked,
  ).map((c) => c.id);
  if (ids.length === 0) {
    notify("Mindestens ein Kriterium muss aktiv bleiben.");
    return false;
  }
  await pm.setQualityCriteria(project.projectId, ids);
  return true;
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
  const dialog = new DialogHelper(2, 2);

  const options =
    items.length > 0
      ? items.map((r) => {
          const q = byKey.get(r.itemKey);
          const s = q
            ? ` (${qualityScore(q.ratings, activeCriteria(project)).score}%)`
            : "";
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
          styles: { color: "gray", display: "block", maxWidth: "440px" },
          properties: {
            textContent:
              "Bewertet die methodische Qualität / Risk of Bias je eingeschlossener " +
              "Studie anhand von Kriterien (erfüllt/teilweise/nicht/unklar) → Score. " +
              "Kriterien unter „Kriterien…“ anpassbar; Ausgabe: „Qualitätsmatrix (CSV)“.",
          },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray", display: "block", marginTop: "4px" },
          properties: {
            textContent: `${items.length} eingeschlossene Studie(n) · ${assessments.length} bewertet`,
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
      { heading: "Qualitätsbewertung" },
      {
        label: "KI-Bewertung (Auswahl)",
        title:
          "Bewertet die 10 Qualitätskriterien der ausgewählten Studie per KI (fehlende Info = „unklar“).",
        variant: "primary",
        onClick: async () => {
          const rec = selectedRec();
          if (!rec) return;
          if (!isAIReady()) {
            notify("KI ist nicht konfiguriert (KI-Einstellungen…).");
            return;
          }
          try {
            await runQuality(pm, project, rec);
            notify("Qualitätsbewertung erstellt (bitte prüfen).");
            reopen();
          } catch (e) {
            notify(`Bewertung fehlgeschlagen:\n${e}`);
          }
        },
      },
      {
        label: "Bearbeiten…",
        title: "Kriterien prüfen/anpassen und die Bewertung bestätigen.",
        onClick: async () => {
          const rec = selectedRec();
          if (rec) await openQualityForm(pm, project, rec);
        },
      },
      {
        label: "Kriterien…",
        title:
          "Qualitätskriterien ein-/ausschalten (klassische SR-Checkliste). " +
          "Wirkt auf KI-Bewertung, Formular, Score und Matrix.",
        onClick: async () => {
          if (await openCriteriaDialog(pm, project)) reopen();
        },
      },
      {
        label: "KI: alle bewerten",
        title: "Qualitätsbewertung per KI für alle eingeschlossenen Studien.",
        onClick: async () => {
          if (!isAIReady()) {
            notify("KI ist nicht konfiguriert (KI-Einstellungen…).");
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
      },
      { heading: "Export" },
      {
        label: "Qualitätsmatrix (CSV)",
        title: "Alle Bewertungen samt Score als CSV-Matrix speichern.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportQualityMatrix(p);
            if (path) notify(`Gespeichert:\n${path}`);
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

  dialog.open(`Qualitätsbewertung — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
