/**
 * Phase 4 – Thematische Kodierung mit Farbsystem (Konzept Kap. 23 / 9.2).
 *
 * Feste Kodierkategorien. Jede Kategorie hat eine Farbe, die als farbiger
 * Zotero-Tag am Eintrag sichtbar gemacht wird (siehe coding/tagWriter.ts).
 * Die Zotero-Farbwerte entsprechen den Standard-Annotationsfarben.
 */

export interface CodeCategory {
  id: string;
  /** Colour name (German). */
  color: string;
  /** Short label. */
  label: string;
  /** Longer description – also given to the AI classifier. */
  description: string;
  /** Hex colour for the Zotero tag. */
  hex: string;
  /** Tag name used in Zotero. */
  tag: string;
}

export const CODES: CodeCategory[] = [
  {
    id: "definitions",
    color: "Gelb",
    label: "Definitionen & Grundlagen",
    description:
      "Begriffsdefinitionen, zentrale Konzepte, Modelle und theoretische Aussagen.",
    hex: "#ffd400",
    tag: "LR:Definitionen",
  },
  {
    id: "methods",
    color: "Blau",
    label: "Methodik",
    description:
      "Forschungsdesign, Stichprobe, Datenerhebung, Messgrößen und Auswertungsverfahren.",
    hex: "#2ea8e5",
    tag: "LR:Methodik",
  },
  {
    id: "results",
    color: "Grün",
    label: "Ergebnisse & Evidenz",
    description:
      "Empirische Ergebnisse, nachgewiesene Zusammenhänge, Kennzahlen und zentrale Erkenntnisse.",
    hex: "#5fb236",
    tag: "LR:Ergebnisse",
  },
  {
    id: "arguments",
    color: "Orange",
    label: "Argumente & Wirkungen",
    description:
      "Wichtige Aussagen, Wirkmechanismen, praktische Auswirkungen und Nutzen.",
    hex: "#f19837",
    tag: "LR:Argumente",
  },
  {
    id: "critique",
    color: "Rot",
    label: "Kritik & Limitationen",
    description:
      "Einschränkungen, Risiken, methodische Schwächen, Gegenargumente und widersprüchliche Ergebnisse.",
    hex: "#ff6666",
    tag: "LR:Limitationen",
  },
  {
    id: "gaps",
    color: "Violett",
    label: "Forschungslücken",
    description:
      "Offene Fragen, fehlende Untersuchungen, zukünftiger Forschungsbedarf und mögliche neue Forschungsfragen.",
    hex: "#a28ae5",
    tag: "LR:Forschungsluecken",
  },
  {
    id: "context",
    color: "Grau",
    label: "Kontextinformationen",
    description:
      "Hintergrundwissen, Beispiele, allgemeine Erläuterungen und ergänzende Informationen.",
    hex: "#aaaaaa",
    tag: "LR:Kontext",
  },
];

export function codeById(id: string | undefined): CodeCategory | undefined {
  if (!id) return undefined;
  return CODES.find((c) => c.id === id);
}

export function codeLabel(id: string | undefined): string {
  const c = codeById(id);
  return c ? `${c.color} – ${c.label}` : "";
}
