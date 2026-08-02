import { DialogHelper, ProgressWindowHelper } from "zotero-plugin-toolkit";
import { ProjectManager } from "../projects/projectManager";
import { runAnalysis, countItems } from "../search/searchEngine";
import { createFindingNote } from "../notes/noteWriter";
import { exportFindings } from "../export/exporter";
import { openAISettings } from "../ai/settingsUI";
import {
  evaluateRelevance,
  generateParaphrase,
  classifyFinding,
} from "../ai/aiService";
import { isAIReady } from "../ai/aiConfig";
import { CODES, codeById, codeLabel } from "../coding/codes";
import { applyCodeTags } from "../coding/tagWriter";
import { type Concept, type Finding } from "../types";

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
    f.snippet.length > 55 ? f.snippet.slice(0, 55) + "…" : f.snippet;
  const ai = typeof f.aiScore === "number" ? ` KI:${f.aiScore}` : "";
  const code = f.codeId ? ` ‹${codeById(f.codeId)?.color ?? ""}›` : "";
  return `${statusMark(f)} [${f.score}${ai}]${code} ${who} · ${f.conceptName} — ${snippet}`;
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

function conceptOf(
  concepts: Concept[] | undefined,
  conceptId: string,
): Concept | undefined {
  return concepts?.find((c) => c.conceptId === conceptId);
}

/** Phase 2 – KI-Bewertung aller Fundstellen nacheinander, mit Fortschritt. */
async function batchEvaluate(
  pm: ProjectManager,
  projectId: string,
): Promise<void> {
  const project = await pm.get(projectId);
  if (!project) return;
  const findings = await pm.listFindings(projectId);
  if (findings.length === 0) return;

  const pw = new ProgressWindowHelper("Zotero Literature Review — KI");
  pw.createLine({ text: `KI-Bewertung 0/${findings.length} …`, progress: 0 });
  pw.show();

  let done = 0;
  let errors = 0;
  for (const f of findings) {
    try {
      const r = await evaluateRelevance(
        project,
        conceptOf(project.concepts, f.conceptId),
        f,
      );
      await pm.updateFinding(projectId, f.findingId, {
        aiScore: r.score,
        aiRecommendation: r.recommendation,
        aiExplanation: r.explanation,
        aiModel: r.model,
      });
    } catch (e) {
      errors++;
      Zotero.debug(`[zotero-lit-rev] batch eval error: ${e}`);
    }
    done++;
    pw.changeLine({
      text: `KI-Bewertung ${done}/${findings.length} …`,
      progress: Math.round((done / findings.length) * 100),
    });
  }
  pw.changeLine({
    text: `Fertig: ${done - errors} bewertet${errors ? `, ${errors} Fehler` : ""}.`,
    progress: 100,
  });
  pw.startCloseTimer(4000);
}

/** Phase 4 – KI-Kodierung aller Fundstellen als Vorschläge. */
async function batchCode(pm: ProjectManager, projectId: string): Promise<void> {
  const findings = await pm.listFindings(projectId);
  if (findings.length === 0) return;

  const pw = new ProgressWindowHelper("Zotero Literature Review — KI");
  pw.createLine({ text: `Kodierung 0/${findings.length} …`, progress: 0 });
  pw.show();

  let done = 0;
  let errors = 0;
  for (const f of findings) {
    try {
      const r = await classifyFinding(f);
      await pm.updateFinding(projectId, f.findingId, {
        codeId: r.codeId,
        codeStatus: "suggested",
        codeSource: "ai",
        codeRationale: r.rationale,
      });
    } catch (e) {
      errors++;
      Zotero.debug(`[zotero-lit-rev] batch code error: ${e}`);
    }
    done++;
    pw.changeLine({
      text: `Kodierung ${done}/${findings.length} …`,
      progress: Math.round((done / findings.length) * 100),
    });
  }
  pw.changeLine({
    text: `Fertig: ${done - errors} kodiert${errors ? `, ${errors} Fehler` : ""}. Bitte prüfen.`,
    progress: 100,
  });
  pw.startCloseTimer(4000);
}

/** Detail-/Paraphrase-Dialog für eine Fundstelle. */
async function openFindingDetail(
  pm: ProjectManager,
  projectId: string,
  finding: Finding,
): Promise<void> {
  const data: Record<string, any> = {
    paraphrase: finding.paraphrase ?? "",
    code: finding.codeId ?? "",
  };
  const aiInfo =
    typeof finding.aiScore === "number"
      ? `KI-Relevanz: ${finding.aiScore}/100 (${finding.aiRecommendation ?? "?"}) — ${finding.aiExplanation ?? ""}`
      : "Noch keine KI-Bewertung.";
  const codeOptions = [
    { tag: "option", namespace: "html", properties: { value: "", textContent: "(keine Kodierung)" } },
    ...CODES.map((c) => ({
      tag: "option",
      namespace: "html",
      properties: { value: c.id, textContent: `${c.color} – ${c.label}` },
      attributes: c.id === data.code ? { selected: "selected" } : {},
    })),
  ];

  const dialog = new DialogHelper(7, 1);
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
    .addCell(5, 0, {
      tag: "small",
      namespace: "html",
      id: "ai-info",
      styles: { color: "gray", maxWidth: "520px" },
      properties: { textContent: aiInfo },
    })
    .addCell(6, 0, {
      tag: "div",
      namespace: "html",
      styles: { display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" },
      children: [
        {
          tag: "label",
          namespace: "html",
          styles: { fontWeight: "bold" },
          properties: { textContent: "Kodierung:" },
        },
        {
          tag: "select",
          namespace: "html",
          attributes: { "data-bind": "code", "data-prop": "value" },
          styles: { width: "300px" },
          children: codeOptions as any,
        },
      ],
    })
    .addButton("Speichern", "save")
    .addButton("KI-Bewertung", "airate", {
      noClose: true,
      callback: async () => {
        const project = await pm.get(projectId);
        if (!project) return;
        try {
          const r = await evaluateRelevance(
            project,
            conceptOf(project.concepts, finding.conceptId),
            finding,
          );
          await pm.updateFinding(projectId, finding.findingId, {
            aiScore: r.score,
            aiRecommendation: r.recommendation,
            aiExplanation: r.explanation,
            aiModel: r.model,
          });
          const el = dialog.window.document.getElementById("ai-info");
          if (el)
            el.textContent = `KI-Relevanz: ${r.score}/100 (${r.recommendation}) — ${r.explanation}`;
        } catch (e) {
          mainWindow().alert(`KI-Bewertung fehlgeschlagen:\n${e}`);
        }
      },
    })
    .addButton("KI-Paraphrase", "aipara", {
      noClose: true,
      callback: async () => {
        const project = await pm.get(projectId);
        if (!project) return;
        try {
          const { text, model } = await generateParaphrase(project, finding);
          const ta = dialog.window.document.querySelector(
            'textarea[data-bind="paraphrase"]',
          ) as HTMLTextAreaElement | null;
          if (ta) ta.value = text;
          data.paraphrase = text;
          data.__aiParaphrase = { model };
        } catch (e) {
          mainWindow().alert(`KI-Paraphrase fehlgeschlagen:\n${e}`);
        }
      },
    })
    .addButton("KI-Kodierung", "aicode", {
      noClose: true,
      callback: async () => {
        try {
          const r = await classifyFinding(finding);
          const sel = dialog.window.document.querySelector(
            'select[data-bind="code"]',
          ) as HTMLSelectElement | null;
          if (sel) sel.value = r.codeId;
          data.code = r.codeId;
          data.__aiCode = { rationale: r.rationale };
          mainWindow().alert(
            `KI-Vorschlag: ${codeLabel(r.codeId)}\n${r.rationale}`,
          );
        } catch (e) {
          mainWindow().alert(`KI-Kodierung fehlgeschlagen:\n${e}`);
        }
      },
    })
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);

  dialog.open("Fundstelle — Details, Paraphrase & Kodierung", {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });

  await (data as any).unloadLock?.promise;
  if (data._lastButtonId === "save") {
    const ai = data.__aiParaphrase;
    const newCode = String(data.code ?? "");
    const codeChanged = newCode !== (finding.codeId ?? "");
    await pm.updateFinding(projectId, finding.findingId, {
      paraphrase: String(data.paraphrase ?? "").trim(),
      paraphraseSource: ai ? "ai" : "manual",
      paraphraseStatus: ai ? "ai-unreviewed" : "manual",
      paraphraseModel: ai ? ai.model : undefined,
      codeId: newCode || undefined,
      // Manually chosen (or confirmed) code counts as confirmed.
      codeStatus: newCode ? "confirmed" : undefined,
      codeSource: codeChanged && data.__aiCode ? "ai" : "manual",
      codeRationale: data.__aiCode?.rationale,
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
    .addButton("KI-Einstellungen…", "aicfg", {
      noClose: true,
      callback: async () => {
        await openAISettings();
      },
    })
    .addButton("KI: alle bewerten", "aiall", {
      noClose: true,
      callback: async () => {
        if (!isAIReady()) {
          mainWindow().alert(
            "KI ist nicht konfiguriert. Bitte zuerst „KI-Einstellungen…\".",
          );
          return;
        }
        try {
          dialog.window?.close();
        } catch {
          /* ignore */
        }
        await batchEvaluate(pm, projectId);
        void openResults(pm, projectId);
      },
    })
    .addButton("KI: alle kodieren", "aicode", {
      noClose: true,
      callback: async () => {
        if (!isAIReady()) {
          mainWindow().alert(
            "KI ist nicht konfiguriert. Bitte zuerst „KI-Einstellungen…\".",
          );
          return;
        }
        try {
          dialog.window?.close();
        } catch {
          /* ignore */
        }
        await batchCode(pm, projectId);
        void openResults(pm, projectId);
      },
    })
    .addButton("Kodierung → Zotero-Tags", "tags", {
      noClose: true,
      callback: async () => {
        const p = await pm.get(projectId);
        if (!p) return;
        const coded = (p.findings ?? []).filter(
          (f) => f.codeId && f.codeStatus !== "rejected",
        ).length;
        if (coded === 0) {
          mainWindow().alert(
            "Keine Kodierungen vorhanden. Bitte zuerst kodieren (KI oder manuell).",
          );
          return;
        }
        if (
          !mainWindow().confirm(
            `${coded} kodierte Fundstelle(n) als farbige Zotero-Tags an den Einträgen übernehmen?`,
          )
        ) {
          return;
        }
        try {
          const res = await applyCodeTags(p, false);
          mainWindow().alert(
            `${res.tagsAdded} Tag(s) an ${res.itemsTagged} Eintrag/Einträgen gesetzt.`,
          );
        } catch (e) {
          mainWindow().alert(`Fehler beim Setzen der Tags:\n${e}`);
        }
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
