import { getAIConfig, isAIReady, type AIConfig } from "./aiConfig";

/**
 * Phase 2 – anbieter-agnostischer KI-Client (Konzept Kap. 28/29).
 *
 * Nutzt das globale fetch von Zotero. Unterstützt Anthropic (Standard) und
 * OpenAI-kompatible Endpunkte (z. B. Ollama, LM Studio, Azure OpenAI).
 * Es werden nur die übergebenen Texte gesendet – keine ganzen PDFs (Kap. 31).
 */

function log(msg: string) {
  Zotero.debug(`[zotero-lit-rev] ai: ${msg}`);
}

export class AIError extends Error {}

async function callAnthropic(
  cfg: AIConfig,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const res = await fetch(`${cfg.baseURL}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": cfg.apiKey,
      "anthropic-version": "2023-06-01",
      // Needed when calling from a browser-like (Gecko) context.
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AIError(`Anthropic API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: any = await res.json();
  if (data.stop_reason === "refusal") {
    throw new AIError("Die Anfrage wurde vom Modell abgelehnt (refusal).");
  }
  const block = Array.isArray(data.content)
    ? data.content.find((b: any) => b.type === "text")
    : null;
  if (!block?.text) {
    throw new AIError("Leere Antwort vom Modell.");
  }
  return String(block.text).trim();
}

async function callOpenAICompatible(
  cfg: AIConfig,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  const base = cfg.baseURL.replace(/\/+$/, "");
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AIError(`API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new AIError("Leere Antwort vom Modell.");
  }
  return String(content).trim();
}

/**
 * Sends a single system+user prompt to the configured provider and returns
 * the model's text answer.
 */
export async function aiComplete(
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<string> {
  const cfg = getAIConfig();
  if (!isAIReady(cfg)) {
    throw new AIError(
      "KI ist nicht konfiguriert. Bitte unter „KI-Einstellungen…\" Anbieter, " +
        "Modell und API-Schlüssel eintragen und KI aktivieren.",
    );
  }
  // Datenminimierung: den übergebenen Nutzertext auf maxChars kürzen.
  const trimmed =
    user.length > cfg.maxChars ? user.slice(0, cfg.maxChars) + " …" : user;

  log(`request to ${cfg.provider} model=${cfg.model}`);
  if (cfg.provider === "anthropic") {
    return callAnthropic(cfg, system, trimmed, maxTokens);
  }
  return callOpenAICompatible(cfg, system, trimmed, maxTokens);
}

/** Simple connectivity test used by the settings dialog. */
export async function aiTest(): Promise<string> {
  return aiComplete(
    "Antworte mit genau einem Wort.",
    "Antworte mit: OK",
    16,
  );
}
