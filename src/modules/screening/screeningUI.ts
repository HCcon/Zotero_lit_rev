import { DialogHelper } from "zotero-plugin-toolkit";
import { ProjectManager } from "../projects/projectManager";
import {
  EXCLUSION_REASONS,
  prismaCounts,
} from "./screening";
import {
  exportEvidence,
  exportPrisma,
  exportScreening,
} from "../export/reports";
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
  const dialog = new DialogHelper(3, 1);

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
      attributes: { "data-bind": "selected", "data-prop": "value", size: "14" },
      styles: { width: "600px", fontFamily: "monospace" },
      children: options as any,
    })
    .addButton("Einschließen", "inc", {
      noClose: true,
      callback: () => setDecision("included"),
    })
    .addButton("Ausschließen…", "exc", {
      noClose: true,
      callback: async () => {
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
    })
    .addButton("Vielleicht", "maybe", {
      noClose: true,
      callback: () => setDecision("maybe"),
    })
    .addButton("Hintergrund", "bg", {
      noClose: true,
      callback: () => setDecision("background"),
    })
    .addButton("Dubletten prüfen", "dup", {
      noClose: true,
      callback: async () => {
        const n = await pm.runDuplicateDetection(projectId);
        mainWindow().alert(`${n} mögliche Dublette(n) markiert.`);
        reopen();
      },
    })
    .addButton("PRISMA…", "prisma", {
      noClose: true,
      callback: async () => {
        mainWindow().alert(prismaText(await pm.listScreening(projectId)));
      },
    })
    .addButton("Aktualisieren", "sync", {
      noClose: true,
      callback: async () => {
        const n = await pm.syncScreening(projectId);
        mainWindow().alert(`${n} Einträge aus den Sammlungen übernommen.`);
        reopen();
      },
    })
    .addButton("Export: Screening", "expS", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (p) {
          const path = await exportScreening(p);
          if (path) mainWindow().alert(`Gespeichert:\n${path}`);
        }
      },
    })
    .addButton("Export: Evidenztabelle", "expE", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (p) {
          const path = await exportEvidence(p);
          if (path) mainWindow().alert(`Gespeichert:\n${path}`);
        }
      },
    })
    .addButton("Export: PRISMA", "expP", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (p) {
          const path = await exportPrisma(p);
          if (path) mainWindow().alert(`Gespeichert:\n${path}`);
        }
      },
    })
    .addButton("Schließen", "close")
    .setDialogData(data);

  dialog.open(`Screening — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
