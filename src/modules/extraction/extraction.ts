/**
 * Phase 4 – Feldkatalog für die strukturierte Studien-Extraktion
 * (Konzept Kap. 11/19). Nicht gefundene Angaben werden als "nicht berichtet"
 * gekennzeichnet; die KI ergänzt keine fehlenden Informationen.
 */

export interface ExtractionField {
  id: string;
  label: string;
}

export const EXTRACTION_FIELDS: ExtractionField[] = [
  { id: "keyStatement", label: "Kernaussage" },
  { id: "theory", label: "Theoretischer Ansatz / Konstrukte" },
  { id: "design", label: "Studiendesign" },
  { id: "methodType", label: "Methode (qualitativ/quantitativ/mixed)" },
  { id: "sample", label: "Stichprobe (Größe/Art)" },
  { id: "country", label: "Land" },
  { id: "industry", label: "Branche / Organisationstyp" },
  { id: "period", label: "Untersuchungszeitraum" },
  { id: "analysis", label: "Analyseverfahren" },
  { id: "mainResults", label: "Hauptergebnisse" },
  { id: "effectSize", label: "Effektstärke" },
  { id: "significance", label: "Signifikanz / Konfidenzintervalle" },
  { id: "limitations", label: "Limitationen / Bias-Risiken" },
  { id: "researchGaps", label: "Forschungslücken" },
  { id: "implicationsScience", label: "Implikationen für die Wissenschaft" },
  { id: "implicationsPractice", label: "Implikationen für die Praxis" },
];

export const NOT_REPORTED = "nicht berichtet";
