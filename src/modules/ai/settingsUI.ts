import { DialogHelper } from "zotero-plugin-toolkit";
import { notify } from "../ui/notify";
import { getAIConfig, saveAIConfig, type AIProvider } from "./aiConfig";
import { aiTest } from "./aiClient";

/**
 * Phase 2 – Einstellungsdialog für die KI-Anbindung.
 * Der API-Schlüssel wird nur hier eingegeben und in den Zotero-Prefs
 * gespeichert (nicht in Projektdaten/Exporten).
 */

function mainWindow(): Window {
  return Zotero.getMainWindow() as unknown as Window;
}

export async function openAISettings(): Promise<void> {
  const cfg = getAIConfig();
  const data: Record<string, any> = {
    enabled: cfg.enabled,
    provider: cfg.provider,
    baseURL: cfg.baseURL,
    model: cfg.model,
    apiKey: cfg.apiKey,
    maxChars: String(cfg.maxChars),
    maxTokens: String(cfg.maxTokens),
  };

  const labelStyle = { style: "margin-top: 6px; font-weight: bold;" };
  const inputStyle = { width: "460px" };

  const dialog = new DialogHelper(10, 2);
  dialog
    .addCell(0, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "KI aktivieren" },
      attributes: labelStyle,
    })
    .addCell(0, 1, {
      tag: "input",
      namespace: "html",
      attributes: {
        "data-bind": "enabled",
        "data-prop": "checked",
        type: "checkbox",
      },
    })
    .addCell(1, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Anbieter" },
      attributes: labelStyle,
    })
    .addCell(1, 1, {
      tag: "select",
      namespace: "html",
      attributes: { "data-bind": "provider", "data-prop": "value" },
      styles: inputStyle,
      children: [
        {
          tag: "option",
          namespace: "html",
          properties: { value: "anthropic", textContent: "Anthropic (Claude)" },
          attributes: cfg.provider === "anthropic" ? { selected: "selected" } : {},
        },
        {
          tag: "option",
          namespace: "html",
          properties: {
            value: "openai-compatible",
            textContent: "OpenAI-kompatibel (OpenAI, Azure, Ollama, LM Studio …)",
          },
          attributes:
            cfg.provider === "openai-compatible" ? { selected: "selected" } : {},
        },
      ],
    })
    .addCell(2, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Basis-URL" },
      attributes: labelStyle,
    })
    .addCell(2, 1, {
      tag: "input",
      namespace: "html",
      attributes: { "data-bind": "baseURL", "data-prop": "value", type: "text" },
      styles: inputStyle,
    })
    .addCell(3, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Modell" },
      attributes: labelStyle,
    })
    .addCell(3, 1, {
      tag: "input",
      namespace: "html",
      attributes: { "data-bind": "model", "data-prop": "value", type: "text" },
      styles: inputStyle,
    })
    .addCell(4, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "API-Schlüssel" },
      attributes: labelStyle,
    })
    .addCell(4, 1, {
      tag: "input",
      namespace: "html",
      attributes: {
        "data-bind": "apiKey",
        "data-prop": "value",
        type: "password",
      },
      styles: inputStyle,
    })
    .addCell(5, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Max. Zeichen je Textstelle" },
      attributes: labelStyle,
    })
    .addCell(5, 1, {
      tag: "input",
      namespace: "html",
      attributes: {
        "data-bind": "maxChars",
        "data-prop": "value",
        type: "number",
      },
      styles: { width: "120px" },
    })
    .addCell(6, 0, {
      tag: "label",
      namespace: "html",
      properties: { textContent: "Antwort-Token (max.)" },
      attributes: labelStyle,
    })
    .addCell(6, 1, {
      tag: "input",
      namespace: "html",
      attributes: {
        "data-bind": "maxTokens",
        "data-prop": "value",
        type: "number",
      },
      styles: { width: "120px" },
    })
    .addCell(7, 0, {
      tag: "small",
      namespace: "html",
      styles: { color: "gray", maxWidth: "560px" },
      properties: {
        textContent:
          "Modell-Beispiele: Anthropic „claude-opus-5“ (stark) oder " +
          "„claude-haiku-4-5“ (günstig/schnell). OpenAI: „gpt-4o“ / „gpt-4o-mini“. " +
          "Tipp: Für viele Bewertungen sind Nicht-Reasoning-Modelle (gpt-4o-mini, " +
          "claude-haiku-4-5) zuverlässiger und günstiger. Reasoning-Modelle " +
          "(gpt-5-Familie) brauchen ein hohes „Antwort-Token“-Budget (z. B. 4000+).",
      },
    })
    .addCell(8, 0, {
      tag: "small",
      namespace: "html",
      styles: { color: "gray", maxWidth: "560px" },
      properties: {
        textContent:
          "Datenschutz: Es werden nur die ausgewählte Textstelle, die " +
          "Forschungsfrage und die Konzeptbeschreibung an den Anbieter " +
          "übertragen – keine vollständigen PDFs. Der Schlüssel wird lokal in " +
          "Zotero gespeichert und nicht exportiert.",
      },
    })
    .addButton("Speichern", "save")
    .addButton("Verbindung testen", "test", {
      noClose: true,
      callback: async () => {
        // Save current form values first so the test uses them.
        persist(data);
        try {
          const answer = await aiTest();
          notify(`Verbindung OK. Antwort: ${answer}`);
        } catch (e) {
          notify(`Test fehlgeschlagen:\n${e}`);
        }
      },
    })
    .addButton("Abbrechen", "cancel")
    .setDialogData(data);

  dialog.open("KI-Einstellungen", {
    centerscreen: true,
    resizable: true,
    fitContent: true,
  });

  await (data as any).unloadLock?.promise;
  if (data._lastButtonId === "save") {
    persist(data);
  }
}

function persist(data: Record<string, any>): void {
  saveAIConfig({
    enabled: Boolean(data.enabled),
    provider: String(data.provider) as AIProvider,
    baseURL: String(data.baseURL ?? "").trim(),
    model: String(data.model ?? "").trim(),
    apiKey: String(data.apiKey ?? ""),
    maxChars: Math.max(500, Number(data.maxChars) || 4000),
    maxTokens: Math.max(512, Number(data.maxTokens) || 4000),
  });
}
