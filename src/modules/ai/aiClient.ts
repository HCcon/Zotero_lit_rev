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
    if (data.stop_reason === "max_tokens") {
      throw new AIError(
        "Das Modell hat das Token-Limit erreicht, bevor eine Antwort kam. " +
          "Bitte in den KI-Einstellungen „Antwort-Token“ erhöhen.",
      );
    }
    throw new AIError("Leere Antwort vom Modell.");
  }
  return String(block.text).trim();
}

async function openAIRequest(
  cfg: AIConfig,
  system: string,
  user: string,
  maxTokens: number,
): Promise<{ content: string; finishReason: string }> {
  const base = cfg.baseURL.replace(/\/+$/, "");
  // Newer OpenAI/Azure models require `max_completion_tokens`; other
  // OpenAI-compatible servers (Ollama, LM Studio, vLLM) use `max_tokens`.
  const useCompletionTokens = /openai\.com|azure\.com/i.test(base);
  const body: Record<string, any> = {
    model: cfg.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  };
  if (useCompletionTokens) {
    body.max_completion_tokens = maxTokens;
  } else {
    body.max_tokens = maxTokens;
  }
  const res = await fetch(`${base}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AIError(`API ${res.status}: ${text.slice(0, 300)}`);
  }
  const data: any = await res.json();
  const choice = data?.choices?.[0] ?? {};
  const content = choice.message?.content ?? "";
  return { content: String(content), finishReason: String(choice.finish_reason ?? "") };
}

async function callOpenAICompatible(
  cfg: AIConfig,
  system: string,
  user: string,
  maxTokens: number,
): Promise<string> {
  let result = await openAIRequest(cfg, system, user, maxTokens);

  // Reasoning models (gpt-5 family) can spend the whole budget on internal
  // reasoning and return empty content with finish_reason "length".
  // Retry once with a much larger budget.
  if (!result.content.trim() && result.finishReason === "length") {
    log("empty content (length) – retrying with larger budget");
    result = await openAIRequest(cfg, system, user, Math.max(maxTokens * 3, 8000));
  }

  if (!result.content.trim()) {
    if (result.finishReason === "length") {
      throw new AIError(
        "Das Modell hat sein Token-Limit im internen Denken verbraucht und " +
          "keine Antwort geliefert. Bitte in den KI-Einstellungen die " +
          "Antwort-Token erhöhen oder ein Nicht-Reasoning-Modell wählen " +
          "(z. B. gpt-4o, gpt-4o-mini oder claude-haiku-4-5).",
      );
    }
    throw new AIError("Leere Antwort vom Modell.");
  }
  return result.content.trim();
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

  // Antwort-Token: mindestens der in den Einstellungen konfigurierte Wert
  // (großzügig, damit Reasoning-/Denk-Modelle nicht abgeschnitten werden).
  const effectiveMax = Math.max(maxTokens, cfg.maxTokens || 0);

  log(`request to ${cfg.provider} model=${cfg.model} maxTokens=${effectiveMax}`);
  if (cfg.provider === "anthropic") {
    return callAnthropic(cfg, system, trimmed, effectiveMax);
  }
  return callOpenAICompatible(cfg, system, trimmed, effectiveMax);
}

/** Simple connectivity test used by the settings dialog. */
export async function aiTest(): Promise<string> {
  // Generous max_tokens: models with thinking on (e.g. claude-opus-5) need
  // headroom so the short answer isn't truncated by the thinking budget.
  return aiComplete(
    "Antworte mit genau einem Wort.",
    "Antworte mit: OK",
    512,
  );
}
