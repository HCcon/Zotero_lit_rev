/**
 * Phase 2 – KI-/API-Konfiguration (Konzept Kap. 28–31).
 *
 * Gespeichert in den Zotero-Einstellungen (Prefs), NICHT in den Projektdaten
 * oder Exporten. Der API-Schlüssel bleibt damit vom exportierbaren Review
 * getrennt (Datenschutz, Kap. 28/31).
 */

const PREFIX = "extensions.zotero-lit-rev.ai";

export type AIProvider = "anthropic" | "openai-compatible";

export interface AIConfig {
  enabled: boolean;
  provider: AIProvider;
  /** Base URL for openai-compatible providers (e.g. Ollama, LM Studio). */
  baseURL: string;
  model: string;
  apiKey: string;
  /** Max characters of a passage sent to the model (data minimisation). */
  maxChars: number;
}

const DEFAULTS: AIConfig = {
  enabled: false,
  provider: "anthropic",
  baseURL: "https://api.anthropic.com",
  model: "claude-opus-5",
  apiKey: "",
  maxChars: 4000,
};

function getPref<T>(key: string, fallback: T): T {
  try {
    const v = (Zotero as any).Prefs.get(`${PREFIX}.${key}`, true);
    return (v === undefined || v === null ? fallback : v) as T;
  } catch {
    return fallback;
  }
}

function setPref(key: string, value: any): void {
  (Zotero as any).Prefs.set(`${PREFIX}.${key}`, value, true);
}

export function getAIConfig(): AIConfig {
  return {
    enabled: getPref("enabled", DEFAULTS.enabled),
    provider: getPref("provider", DEFAULTS.provider) as AIProvider,
    baseURL: getPref("baseURL", DEFAULTS.baseURL),
    model: getPref("model", DEFAULTS.model),
    apiKey: getPref("apiKey", DEFAULTS.apiKey),
    maxChars: getPref("maxChars", DEFAULTS.maxChars),
  };
}

export function saveAIConfig(cfg: Partial<AIConfig>): void {
  for (const [k, v] of Object.entries(cfg)) {
    setPref(k, v);
  }
}

export function isAIReady(cfg = getAIConfig()): boolean {
  return cfg.enabled && cfg.model.length > 0 && cfg.apiKey.length > 0;
}
