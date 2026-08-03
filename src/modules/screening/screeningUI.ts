import { DialogHelper } from "zotero-plugin-toolkit";
import { notify } from "../ui/notify";
import { ProjectManager } from "../projects/projectManager";
import {
  EXCLUSION_REASONS,
  prismaCounts,
} from "./screening";
import {
  exportEvidence,
  exportPrisma,
  exportPrismaSVG,
  exportPrismaWord,
  exportScreening,
} from "../export/reports";
import {
  exportAssessmentSheets,
  exportAssessmentSheetsWord,
} from "../export/sheets";
import { actionColumn } from "../ui/dialogParts";
import { type ScreeningDecision, type ScreeningRecord } from "../types";

/**
 * Phase 3 (Oberfläche) – Screening-Workflow.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

function mark(r: ScreeningRecord): string {
  if (r.isDuplicate) return "⧉";
  switch (r.decision) {
    case "included":
      return "✓";
    case "excluded":
      return "✗";
    case "maybe":
      return "?";
    case "background":
      return "▷";
    default:
      return "•";
  }
}

function label(r: ScreeningRecord): string {
  const who = [r.creator, r.year].filter(Boolean).join(" ");
  const title = r.title.length > 55 ? r.title.slice(0, 55) + "…" : r.title;
  const dup = r.isDuplicate ? " [Dublette]" : "";
  return `${mark(r)} ${who} — ${title}${dup}`;
}

/** Sub-dialog: pick an exclusion reason + optional note. */
async function openExclusionDialog(
  existing?: ScreeningRecord,
): Promise<{ reason: string; note: string } | null> {
  const data: Record<string, any> = {
    reason: existing?.exclusionReason ?? EXCLUSION_REASONS[0].id,
    note: existing?.note ?? "",
  };
  const dialog = new DialogHelper(3, 2);
  dialog
    .addCell(0, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Ausschlussgrund" },
      attributes: { style: "font-weight:bold;" },
    })
    .addCell(0, 1, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "reason", "data-prop": "value" },
      styles: { width: "320px" },
      children: EXCLUSION_REASONS.map((r) => ({
        tag: "option",
        namespace: "html",
        properties: { value: r.id, textContent: r.label },
        attributes: r.id === data.reason ? { selected: "selected" } : {},
      })) as any,
    })
    .addCell(1, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Begründung (optional)" },
      attributes: { style: "font-weight:bold;" },
    })
    .addCell(1, 1, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "note", "data-prop": "value" },
      styles: { width: "320px", height: "60px" },
    })
    .addButton("Ausschließen", "ok")
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);
  dialog.open("Ausschluss begründen", {
    centerscreen: true,
    fitContent: true,
  });
  await (data as any).unloadLock?.promise;
  if (data._lastButtonId !== "ok") return null;
  return {
    reason: String(data.reason),
    note: String(data.note ?? "").trim(),
  };
}

function prismaText(records: ScreeningRecord[]): string {
  const c = prismaCounts(records);
  const reasons = c.exclusionByReason.length
    ? c.exclusionByReason.map((e) => `   • ${e.reason}: ${e.count}`).join("\n")
    : "   (keine)";
  return [
    "PRISMA-Kennzahlen",
    "",
    `Identifiziert: ${c.identified}`,
    `Dubletten entfernt: ${c.duplicatesRemoved}`,
    `Nach Bereinigung: ${c.afterDuplicates}`,
    "",
    `Eingeschlossen: ${c.included}`,
    `Ausgeschlossen: ${c.excluded}`,
    `Möglicherweise relevant: ${c.maybe}`,
    `Hintergrundliteratur: ${c.background}`,
    `Offen: ${c.undecided}`,
    "",
    "Ausschlussgründe:",
    reasons,
  ].join("\n");
}

export async function openScreening(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) return;

  let records = await pm.listScreening(projectId);
  // First open with no records yet → build them from the collections.
  if (records.length === 0) {
    await pm.syncScreening(projectId);
    records = await pm.listScreening(projectId);
  }

  const data: Record<string, any> = { selected: records[0]?.itemKey ?? "" };
  const dialog = new DialogHelper(2, 2);

  const c = prismaCounts(records);
  const summary = `${records.length} Einträge · ${c.included} eingeschlossen · ${c.excluded} ausgeschlossen · ${c.duplicatesRemoved} Dubletten · ${c.undecided} offen`;

  const options =
    records.length > 0
      ? records.map((r) => ({
          tag: "option",
          namespace: "html",
          properties: { value: r.itemKey, textContent: label(r) },
        }))
      : [
          {
            tag: "option",
            namespace: "html",
            properties: {
              value: "",
              textContent: "(keine Einträge – „Aktualisieren\" klicken)",
            },
          },
        ];

  const reopen = () => {
    try {
      dialog.window?.close();
    } catch {
      /* ignore */
    }
    void openScreening(pm, projectId);
  };

  const selected = () => String(data.selected ?? "");
  const setDecision = async (decision: ScreeningDecision) => {
    const key = selected();
    if (!key) return;
    await pm.updateScreening(projectId, key, {
      decision,
      exclusionReason: undefined,
    });
    reopen();
  };

  dialog
    .addCell(0, 0, {
      tag: "div",
      namespace: "html",
      children: [
        {
          tag: "h2",
          namespace: "html",
          properties: { textContent: `Screening — ${project.name}` },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray" },
          properties: { textContent: summary },
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
      { heading: "Entscheidung (ausgewählter Eintrag)" },
      {
        label: "Einschließen",
        title: "Den ausgewählten Eintrag in das Review aufnehmen.",
        variant: "primary",
        onClick: () => setDecision("included"),
      },
      {
        label: "Ausschließen…",
        title: "Ausschließen und einen standardisierten Grund + Notiz angeben.",
        onClick: async () => {
          const key = selected();
          if (!key) return;
          const rec = (await pm.listScreening(projectId)).find(
            (r) => r.itemKey === key,
          );
          const result = await openExclusionDialog(rec);
          if (result) {
            await pm.updateScreening(projectId, key, {
              decision: "excluded",
              exclusionReason: result.reason,
              note: result.note,
            });
            reopen();
          }
        },
      },
      {
        label: "Vielleicht",
        title: "Als „möglicherweise relevant“ markieren (später erneut prüfen).",
        onClick: () => setDecision("maybe"),
      },
      {
        label: "Hintergrund",
        title: "Als Hintergrund-/Methodenliteratur markieren.",
        onClick: () => setDecision("background"),
      },
      { heading: "Werkzeuge" },
      {
        label: "Dubletten prüfen",
        title: "Mögliche Dubletten über DOI bzw. Titel + Jahr erkennen und markieren.",
        onClick: async () => {
          const n = await pm.runDuplicateDetection(projectId);
          notify(`${n} mögliche Dublette(n) markiert.`);
          reopen();
        },
      },
      {
        label: "PRISMA…",
        title: "Aktuelle PRISMA-Kennzahlen anzeigen (identifiziert, eingeschlossen …).",
        onClick: async () => {
          notify(prismaText(await pm.listScreening(projectId)));
        },
      },
      {
        label: "Aktualisieren",
        title: "Einträge aus den zugeordneten Sammlungen (neu) übernehmen.",
        onClick: async () => {
          const n = await pm.syncScreening(projectId);
          notify(`${n} Einträge aus den Sammlungen übernommen.`);
          reopen();
        },
      },
      { heading: "Export" },
      {
        label: "Screening-Liste (CSV)",
        title: "Alle Screening-Entscheidungen als CSV speichern.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportScreening(p);
            if (path) notify(`Gespeichert:\n${path}`);
          }
        },
      },
      {
        label: "Evidenztabelle (CSV)",
        title:
          "Eingeschlossene Studien mit Fundstellen, Paraphrasen und Kodierung als CSV.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportEvidence(p);
            if (path) notify(`Gespeichert:\n${path}`);
          }
        },
      },
      {
        label: "PRISMA-Bericht (Markdown)",
        title: "PRISMA-Kennzahlen als Markdown-Bericht speichern.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportPrisma(p);
            if (path) notify(`Gespeichert:\n${path}`);
          }
        },
      },
      {
        label: "PRISMA-Diagramm (SVG)",
        title:
          "PRISMA-Flussdiagramm als Bilddatei (SVG) – im Browser/Vorschau als Bild, weiter bearbeitbar.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportPrismaSVG(p);
            if (path) notify(`PRISMA-Diagramm (SVG) gespeichert:\n${path}`);
          }
        },
      },
      {
        label: "PRISMA-Diagramm (Word)",
        title: "PRISMA-Flussdiagramm als bearbeitbares Word-Dokument (.doc).",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportPrismaWord(p);
            if (path) notify(`PRISMA-Diagramm (Word) gespeichert:\n${path}`);
          }
        },
      },
      {
        label: "Bewertungssheets (HTML)",
        title:
          "Ein Blatt je eingeschlossener Studie: Abstract, Screening-Entscheidung, Fundstellen, Extraktion, Qualität.",
        variant: "primary",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportAssessmentSheets(p);
            if (path) notify(`Bewertungssheets (HTML) gespeichert:\n${path}`);
          }
        },
      },
      {
        label: "Bewertungssheets (Word)",
        title:
          "Dasselbe Bewertungssheet als bearbeitbares Word-Dokument (.doc).",
        variant: "primary",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (p) {
            const path = await exportAssessmentSheetsWord(p);
            if (path) notify(`Bewertungssheets (Word) gespeichert:\n${path}`);
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

  dialog.open(`Screening — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
