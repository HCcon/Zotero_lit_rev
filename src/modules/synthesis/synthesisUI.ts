import { DialogHelper, ProgressWindowHelper } from "zotero-plugin-toolkit";
import { ProjectManager } from "../projects/projectManager";
import { synthesize } from "../ai/aiService";
import { isAIReady } from "../ai/aiConfig";
import { exportSynthesis } from "../export/reports";
import { includedKeys } from "./synthesis";

/**
 * Phase 4 (Oberfläche) – Evidenzsynthese über alle eingeschlossenen Studien.
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

function section(title: string, body: string) {
  return {
    tag: "div",
    namespace: "html",
    styles: { marginTop: "8px", maxWidth: "620px" },
    children: [
      {
        tag: "b",
        namespace: "html",
        properties: { textContent: title },
      },
      {
        tag: "div",
        namespace: "html",
        styles: { whiteSpace: "pre-wrap", marginTop: "2px" },
        properties: { textContent: body || "—" },
      },
    ],
  };
}

export async function openSynthesis(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) return;

  const s = project.synthesis;
  const included = includedKeys(project).length;
  const dialog = new DialogHelper(2, 1);

  const headerText = s
    ? `${s.studyCount} Studien · Modell ${s.model} · ${new Date(s.generatedAt).toLocaleString()}`
    : `${included} eingeschlossene Studie(n) · noch keine Synthese`;

  const body = s
    ? [
        section("Zentrale Erkenntnisse", s.keyFindings),
        section("Widersprüchliche Befunde", s.contradictions),
        section("Forschungslücken", s.researchGaps),
        section(
          "Mögliche neue Forschungsfragen (KI-Hypothesen)",
          s.newQuestions,
        ),
      ]
    : [
        {
          tag: "div",
          namespace: "html",
          properties: {
            textContent:
              "Noch keine Synthese erstellt. Bitte „KI-Synthese erstellen“ wählen.",
          },
        },
      ];

  dialog
    .addCell(0, 0, {
      tag: "div",
      namespace: "html",
      children: [
        {
          tag: "h2",
          namespace: "html",
          properties: { textContent: `Synthese — ${project.name}` },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray" },
          properties: { textContent: headerText },
        },
      ],
    })
    .addCell(1, 0, {
      tag: "div",
      namespace: "html",
      styles: {
        maxHeight: "420px",
        overflow: "auto",
        border: "1px solid rgba(128,128,128,0.4)",
        borderRadius: "4px",
        padding: "8px",
      },
      children: body as any,
    })
    .addButton("KI-Synthese erstellen", "run", {
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
        const pw = new ProgressWindowHelper("Zotero Literature Review");
        pw.createLine({ text: "Erstelle Synthese …", progress: 50 });
        pw.show();
        try {
          const result = await synthesize(project);
          await pm.setSynthesis(projectId, result);
          pw.changeLine({ text: "Synthese erstellt.", progress: 100 });
          pw.startCloseTimer(2500);
        } catch (e) {
          pw.changeLine({ text: "Fehlgeschlagen.", progress: 100 });
          pw.startCloseTimer(2000);
          mainWindow().alert(`Synthese fehlgeschlagen:\n${e}`);
        }
        void openSynthesis(pm, projectId);
      },
    })
    .addButton("Export als Markdown", "exp", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (!p?.synthesis) {
          mainWindow().alert("Noch keine Synthese vorhanden.");
          return;
        }
        const path = await exportSynthesis(p);
        if (path) mainWindow().alert(`Gespeichert:\n${path}`);
      },
    })
    .addButton("Schließen", "close")
    .setDialogData({});

  dialog.open(`Synthese — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
