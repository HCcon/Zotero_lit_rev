import { DialogHelper } from "zotero-plugin-toolkit";
import { openProgressWindow } from "../ui/notify";
import { confirmDialog, notify } from "../ui/notify";
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
import { actionColumn } from "../ui/dialogParts";
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
    notify(
      "Keine Einträge gefunden. Bitte zuerst unter „Sammlungen…\" " +
        "mindestens eine Sammlung mit Einträgen zuordnen.",
    );
    return;
  }
  if ((project.concepts ?? []).length === 0) {
    notify(
      "Keine Suchkonzepte vorhanden. Bitte zuerst unter „Suchkonzepte…\" " +
        "mindestens ein Konzept mit Keywords anlegen.",
    );
    return;
  }

  const prog = openProgressWindow("Analysiere Dokumente");
  try {
    const findings = await runAnalysis(project, (done, t) => {
      void prog.set(done, t, `Analysiere ${done}/${t} Dokument(e)`);
    });
    await pm.setFindings(projectId, findings);
    prog.close();
    notify(
      `Analyse abgeschlossen.\n\n${total} Eintrag/Einträge durchsucht, ` +
        `${findings.length} Fundstelle(n) gefunden.\n\n` +
        "Die Treffer stehen jetzt in der Liste (nach Relevanz sortiert). " +
        "Doppelklick auf einen Treffer (oder „Details / Paraphrase…“) zeigt, " +
        "warum er gefunden wurde, und öffnet ihn in Zotero.",
    );
  } catch (e) {
    prog.close();
    notify(`Analyse fehlgeschlagen:\n${e}`);
  }
}

function conceptOf(
  concepts: Concept[] | undefined,
  conceptId: string,
): Concept | undefined {
  return concepts?.find((c) => c.conceptId === conceptId);
}

/** Selects (and focuses) the finding's item in the Zotero library. */
function openItemInZotero(libraryID: number, itemKey: string): void {
  const Z = Zotero as any;
  const item = Z.Items.getByLibraryAndKey(libraryID, itemKey);
  if (!item) {
    notify(
      "Der zugehörige Eintrag wurde nicht gefunden (evtl. gelöscht oder " +
        "anderes Profil).",
    );
    return;
  }
  try {
    const pane = Z.getActiveZoteroPane?.();
    if (pane?.selectItem) {
      pane.selectItem(item.id);
    }
    const win = Z.getMainWindow?.();
    win?.focus?.();
  } catch (e) {
    notify(`Konnte den Eintrag nicht öffnen:\n${e}`);
  }
}

function locationLabel(f: Finding): string {
  const loc =
    f.location === "title"
      ? "Titel"
      : f.location === "abstract"
        ? "Abstract"
        : "Volltext";
  return f.section ? `${loc} · Abschnitt: ${f.section}` : loc;
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

  const prog = openProgressWindow("KI-Bewertung der Treffer");

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
    void prog.set(done, findings.length, `Bewerte ${done}/${findings.length} Treffer`);
  }
  prog.close();
  notify(
    `KI-Bewertung abgeschlossen.\n\n${done - errors} von ${findings.length} ` +
      `Fundstelle(n) bewertet${errors ? `, ${errors} Fehler` : ""}.\n\n` +
      "Der KI-Score erscheint in der Trefferliste (z. B. „KI:87“).",
  );
}

/** Phase 4 – KI-Kodierung aller Fundstellen als Vorschläge. */
async function batchCode(pm: ProjectManager, projectId: string): Promise<void> {
  const findings = await pm.listFindings(projectId);
  if (findings.length === 0) return;

  const prog = openProgressWindow("KI-Kodierung der Treffer");

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
    void prog.set(done, findings.length, `Kodiere ${done}/${findings.length} Treffer`);
  }
  prog.close();
  notify(
    `KI-Kodierung abgeschlossen.\n\n${done - errors} von ${findings.length} ` +
      `Fundstelle(n) kodiert${errors ? `, ${errors} Fehler` : ""}.\n\n` +
      "Die Farbkategorie erscheint in der Liste (z. B. ‹Grün›). Prüfe/ändere " +
      "sie unter „Details…“ und übertrage sie mit „Kodierung → Zotero-Tags“.",
  );
}

/** Detail-/Paraphrase-Dialog für eine Fundstelle. */
async function openFindingDetail(
  pm: ProjectManager,
  projectId: string,
  finding: Finding,
): Promise<void> {
  const proj = await pm.get(projectId);
  const libraryID =
    proj?.sources?.libraryID ?? (Zotero as any).Libraries.userLibraryID;
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

  const itemMeta = `${[finding.itemCreator, finding.itemYear]
    .filter(Boolean)
    .join(" ")} — ${finding.itemTitle}`;

  const dialog = new DialogHelper(7, 1);
  dialog
    .addCell(0, 0, {
      tag: "div",
      namespace: "html",
      children: [
        {
          tag: "h3",
          namespace: "html",
          styles: { margin: "0" },
          properties: {
            textContent: `${finding.conceptName} — Score ${finding.score}`,
          },
        },
        {
          tag: "div",
          namespace: "html",
          styles: { fontSize: "12px", color: "gray", margin: "2px 0" },
          properties: {
            textContent: `Quelle: ${itemMeta}  ·  Fundort: ${locationLabel(finding)}`,
          },
        },
        {
          tag: "button",
          namespace: "html",
          attributes: {
            type: "button",
            title:
              "Wählt das zugehörige Dokument in deiner Zotero-Bibliothek aus.",
          },
          styles: {
            marginTop: "2px",
            padding: "4px 10px",
            cursor: "pointer",
            borderRadius: "6px",
          },
          properties: { textContent: "📄 Eintrag in Zotero öffnen" },
          listeners: [
            {
              type: "click",
              listener: () => openItemInZotero(libraryID, finding.itemKey),
            },
          ],
        },
      ],
    })
    .addCell(1, 0, {
      tag: "div",
      namespace: "html",
      styles: {
        width: "520px",
        maxHeight: "160px",
        overflow: "auto",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        padding: "6px",
        border: "1px solid rgba(128,128,128,0.4)",
        borderRadius: "4px",
      },
      properties: { textContent: `„${finding.snippet}"` },
    })
    .addCell(2, 0, {
      tag: "small",
      namespace: "html",
      styles: {
        color: "gray",
        width: "520px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      },
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
      styles: {
        color: "gray",
        width: "520px",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      },
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
          notify(`KI-Bewertung fehlgeschlagen:\n${e}`);
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
          notify(`KI-Paraphrase fehlgeschlagen:\n${e}`);
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
          notify(
            `KI-Vorschlag: ${codeLabel(r.codeId)}\n${r.rationale}`,
          );
        } catch (e) {
          notify(`KI-Kodierung fehlgeschlagen:\n${e}`);
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

  const dialog = new DialogHelper(2, 2);

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
          styles: { margin: "0" },
          properties: { textContent: `Treffer — ${project.name}` },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray", display: "block", maxWidth: "440px" },
          properties: {
            textContent:
              "Gefundene Textstellen, nach Relevanz sortiert. „[Zahl]“ = lokaler " +
              "Score, „KI:xx“ = KI-Relevanz, ‹Farbe› = Kodierung. Wähle einen " +
              "Treffer und „Details / Paraphrase…“, um zu sehen, warum er gefunden " +
              "wurde, und ihn in Zotero zu öffnen.",
          },
        },
        {
          tag: "small",
          namespace: "html",
          styles: { color: "gray", display: "block", marginTop: "4px" },
          properties: {
            textContent: `${findings.length} Fundstelle(n) · letzte Analyse: ${lastRun}`,
          },
        },
      ],
    })
    .addCell(1, 0, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "selected", "data-prop": "value", size: "16" },
      styles: { width: "460px", fontFamily: "monospace", fontSize: "12px" },
      children: optionChildren as any,
      listeners: [
        {
          type: "dblclick",
          listener: async () => {
            const f = await selectedFinding();
            if (f) await openFindingDetail(pm, projectId, f);
          },
        },
      ],
    })
    .addCell(1, 1, actionColumn([
      { heading: "Analyse" },
      {
        label: "Analyse starten",
        title:
          "Durchsucht die PDFs der zugeordneten Sammlungen nach den Suchkonzepten und erzeugt die Trefferliste.",
        variant: "primary",
        onClick: async () => {
          try {
            dialog.window?.close();
          } catch {
            /* ignore */
          }
          await doAnalysis(pm, projectId);
          void openResults(pm, projectId);
        },
      },
      { heading: "Treffer prüfen" },
      {
        label: "Details / Paraphrase…",
        title:
          "Fundstelle im Detail ansehen; Paraphrase und Kodierung setzen; KI-Bewertung/-Paraphrase/-Kodierung für diese Stelle.",
        onClick: async () => {
          const f = await selectedFinding();
          if (f) await openFindingDetail(pm, projectId, f);
        },
      },
      {
        label: "Als Notiz übernehmen",
        title:
          "Erzeugt am zugehörigen Zotero-Eintrag eine strukturierte Notiz mit dieser Fundstelle (nichtdestruktiv).",
        onClick: async () => {
          const f = await selectedFinding();
          if (!f) return;
          const noteKey = await createFindingNote(project, f, f.paraphrase ?? "");
          if (noteKey) {
            await pm.updateFinding(projectId, f.findingId, {
              reviewStatus: "accepted",
              noteKey,
            });
            notify("Fundstelle als Notiz am Eintrag gespeichert.");
            reopen();
          } else {
            notify(
              "Konnte den zugehörigen Eintrag nicht finden (evtl. anderes Profil).",
            );
          }
        },
      },
      {
        label: "Ablehnen",
        title: "Markiert die ausgewählte Fundstelle als nicht relevant.",
        onClick: async () => {
          const f = await selectedFinding();
          if (!f) return;
          await pm.updateFinding(projectId, f.findingId, {
            reviewStatus: "rejected",
          });
          reopen();
        },
      },
      { heading: "KI (alle Treffer)" },
      {
        label: "KI: alle bewerten",
        title:
          "Lässt die KI jede Fundstelle nach Relevanz bewerten (Score + Empfehlung + Begründung).",
        onClick: async () => {
          if (!isAIReady()) {
            notify(
              "KI ist nicht konfiguriert. Bitte zuerst „KI-Einstellungen…“.",
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
      },
      {
        label: "KI: alle kodieren",
        title:
          "Ordnet jede Fundstelle per KI einer Farbkategorie zu (Vorschlag, prüfbar).",
        onClick: async () => {
          if (!isAIReady()) {
            notify(
              "KI ist nicht konfiguriert. Bitte zuerst „KI-Einstellungen…“.",
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
      },
      {
        label: "Kodierung → Zotero-Tags",
        title:
          "Überträgt die Kodierungen als farbige Zotero-Tags an die Einträge (nichtdestruktiv, entfernbar).",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (!p) return;
          const coded = (p.findings ?? []).filter(
            (f) => f.codeId && f.codeStatus !== "rejected",
          ).length;
          if (coded === 0) {
            notify(
              "Keine Kodierungen vorhanden. Bitte zuerst kodieren (KI oder manuell).",
            );
            return;
          }
          if (
            !confirmDialog(
              `${coded} kodierte Fundstelle(n) als farbige Zotero-Tags an den Einträgen übernehmen?`,
            )
          ) {
            return;
          }
          try {
            const res = await applyCodeTags(p, false);
            notify(
              `${res.tagsAdded} Tag(s) an ${res.itemsTagged} Eintrag/Einträgen gesetzt.`,
            );
          } catch (e) {
            notify(`Fehler beim Setzen der Tags:\n${e}`);
          }
        },
      },
      { heading: "Export & Einstellungen" },
      {
        label: "Export CSV",
        title: "Trefferliste als CSV-Datei speichern.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (!p) return;
          const path = await exportFindings(p, "csv");
          if (path) notify(`CSV exportiert:\n${path}`);
        },
      },
      {
        label: "Export JSON",
        title: "Trefferliste als JSON-Datei speichern.",
        onClick: async () => {
          const p = await pm.get(projectId);
          if (!p) return;
          const path = await exportFindings(p, "json");
          if (path) notify(`JSON exportiert:\n${path}`);
        },
      },
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

  dialog.open(`Treffer — ${project.name}`, {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });
}
