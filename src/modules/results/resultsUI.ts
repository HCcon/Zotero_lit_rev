import { DialogHelper, ProgressWindowHelper } from "zotero-plugin-toolkit";
import { ProjectManager } from "../projects/projectManager";
import { runAnalysis, countItems } from "../search/searchEngine";
import { createFindingNote } from "../notes/noteWriter";
import { exportFindings } from "../export/exporter";
import { type Finding } from "../types";

/**
 * Baustein 6 (Oberfläche) – Analyse starten und Trefferliste prüfen.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

function statusMark(f: Finding): string {
  return f.reviewStatus === "accepted"
    ? "✓"
    : f.reviewStatus === "rejected"
      ? "✗"
      : "•";
}

function findingLabel(f: Finding): string {
  const who = [f.itemCreator, f.itemYear].filter(Boolean).join(" ");
  const snippet =
    f.snippet.length > 60 ? f.snippet.slice(0, 60) + "…" : f.snippet;
  return `${statusMark(f)} [${f.score}] ${who} · ${f.conceptName} — ${snippet}`;
}

/** Runs the analysis with a progress window and stores the findings. */
async function doAnalysis(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) return;

  const total = countItems(project);
  if (total === 0) {
    mainWindow().alert(
      "Keine Einträge gefunden. Bitte zuerst unter „Sammlungen…\" " +
        "mindestens eine Sammlung mit Einträgen zuordnen.",
    );
    return;
  }
  if ((project.concepts ?? []).length === 0) {
    mainWindow().alert(
      "Keine Suchkonzepte vorhanden. Bitte zuerst unter „Suchkonzepte…\" " +
        "mindestens ein Konzept mit Keywords anlegen.",
    );
    return;
  }

  const pw = new ProgressWindowHelper("Zotero Literature Review");
  pw.createLine({ text: `Analysiere 0/${total} …`, progress: 0 });
  pw.show();

  const findings = await runAnalysis(project, (done, t) => {
    const pct = t ? Math.round((done / t) * 100) : 100;
    pw.changeLine({ text: `Analysiere ${done}/${t} …`, progress: pct });
  });

  await pm.setFindings(projectId, findings);
  pw.changeLine({
    text: `Fertig: ${findings.length} Fundstelle(n).`,
    progress: 100,
  });
  pw.startCloseTimer(3000);
}

/** Detail-/Paraphrase-Dialog für eine Fundstelle. */
async function openFindingDetail(
  pm: ProjectManager,
  projectId: string,
  finding: Finding,
): Promise<void> {
  const data: Record<string, any> = { paraphrase: finding.paraphrase ?? "" };

  const dialog = new DialogHelper(5, 1);
  dialog
    .addCell(0, 0, {
      tag: "h3",
      namespace: "html",
      properties: {
        textContent: `${finding.conceptName} — Score ${finding.score}`,
      },
    })
    .addCell(1, 0, {
      tag: "div",
      namespace: "html",
      styles: {
        maxWidth: "520px",
        padding: "6px",
        border: "1px solid rgba(128,128,128,0.4)",
        borderRadius: "4px",
      },
      properties: { textContent: `„${finding.snippet}"` },
    })
    .addCell(2, 0, {
      tag: "small",
      namespace: "html",
      styles: { color: "gray" },
      properties: { textContent: finding.explanation },
    })
    .addCell(3, 0, {
      tag: "label",
      namespace: "html",
      styles: { fontWeight: "bold", marginTop: "6px" },
      properties: { textContent: "Paraphrase (manuell):" },
    })
    .addCell(4, 0, {
      tag: "textarea",
      namespace: "html",
      attributes: { "data-bind": "paraphrase", "data-prop": "value" },
      styles: { width: "520px", height: "90px" },
    })
    .addButton("Speichern", "save")
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);

  dialog.open("Fundstelle — Details & Paraphrase", {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });

  await (data as any).unloadLock?.promise;
  if (data._lastButtonId === "save") {
    await pm.updateFinding(projectId, finding.findingId, {
      paraphrase: String(data.paraphrase ?? "").trim(),
    });
  }
}

/** Hauptdialog: Analyse + Trefferliste. */
export async function openResults(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) return;
  const findings = await pm.listFindings(projectId);
  const data: Record<string, any> = { selected: findings[0]?.findingId ?? "" };

  const dialog = new DialogHelper(3, 1);

  const lastRun = project.lastRun
    ? new Date(project.lastRun).toLocaleString()
    : "noch nie";

  const optionChildren =
    findings.length > 0
      ? findings.map((f) => ({
          tag: "option",
          namespace: "html",
          properties: { value: f.findingId, textContent: findingLabel(f) },
        }))
      : [
          {
            tag: "option",
            namespace: "html",
            properties: {
              value: "",
              textContent: "(noch keine Treffer – bitte Analyse starten)",
            },
          },
        ];

  const reopen = () => {
    try {
      dialog.window?.close();
    } catch {
      /* ignore */
    }
    void openResults(pm, projectId);
  };

  const selectedFinding = async (): Promise<Finding | undefined> => {
    const id = String(data.selected ?? "");
    if (!id) return undefined;
    return (await pm.listFindings(projectId)).find((f) => f.findingId === id);
  };

  dialog
    .addCell(0, 0, {
      tag: "div",
      namespace: "html",
      children: [
        {
          tag: "h2",
          namespace: "html",
          properties: { textContent: `Treffer — ${project.name}` },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray" },
          properties: {
            textContent: `${findings.length} Fundstelle(n) · letzte Analyse: ${lastRun}`,
          },
        },
      ],
    })
    .addCell(1, 0, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "selected", "data-prop": "value", size: "14" },
      styles: { width: "560px", fontFamily: "monospace" },
      children: optionChildren as any,
    })
    .addButton("Analyse starten", "run", {
      noClose: true,
      callback: async () => {
        try {
          dialog.window?.close();
        } catch {
          /* ignore */
        }
        await doAnalysis(pm, projectId);
        void openResults(pm, projectId);
      },
    })
    .addButton("Details / Paraphrase…", "detail", {
      noClose: true,
      callback: async () => {
        const f = await selectedFinding();
        if (f) await openFindingDetail(pm, projectId, f);
      },
    })
    .addButton("Als Notiz übernehmen", "accept", {
      noClose: true,
      callback: async () => {
        const f = await selectedFinding();
        if (!f) return;
        const noteKey = await createFindingNote(project, f, f.paraphrase ?? "");
        if (noteKey) {
          await pm.updateFinding(projectId, f.findingId, {
            reviewStatus: "accepted",
            noteKey,
          });
          mainWindow().alert("Fundstelle als Notiz am Eintrag gespeichert.");
          reopen();
        } else {
          mainWindow().alert(
            "Konnte den zugehörigen Eintrag nicht finden (evtl. anderes Profil).",
          );
        }
      },
    })
    .addButton("Ablehnen", "reject", {
      noClose: true,
      callback: async () => {
        const f = await selectedFinding();
        if (!f) return;
        await pm.updateFinding(projectId, f.findingId, {
          reviewStatus: "rejected",
        });
        reopen();
      },
    })
    .addButton("Export CSV", "csv", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (!p) return;
        const path = await exportFindings(p, "csv");
        if (path) mainWindow().alert(`CSV exportiert:\n${path}`);
      },
    })
    .addButton("Export JSON", "json", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (!p) return;
        const path = await exportFindings(p, "json");
        if (path) mainWindow().alert(`JSON exportiert:\n${path}`);
      },
    })
    .addButton("Schließen", "close")
    .setDialogData(data);

  dialog.open(`Treffer — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
