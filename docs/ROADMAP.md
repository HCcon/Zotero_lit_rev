# Roadmap – Zotero Literature Review Plugin

Die Umsetzung folgt den vier Ausbaustufen aus [KONZEPT.md](KONZEPT.md) (Kap. 19).
Ziel jeder Stufe ist ein installierbares, benutzbares Plugin – nicht nur Code.

## Phase 1 – MVP (aktueller Fokus)

Entspricht den Akzeptanzkriterien in KONZEPT.md Kap. 20.

- [ ] Datenspeicher für Plugin-Daten (Projekte, Konzepte, Fundstellen) – ohne
      Eingriff in die Zotero-Datenbank
- [ ] Rechercheprojekt anlegen / bearbeiten / löschen
- [ ] Zotero-Collections einem Projekt zuordnen (inkl. Subcollections-Option)
- [ ] Suchkonzepte mit Keywords, Synonymen und Kontextbeschreibung
- [ ] Operatoren AND / OR / NOT (Parser)
- [ ] Volltextsuche in vorhandenen PDF-Anhängen der gewählten Collections
- [ ] Trefferliste, nach einfacher Relevanz sortiert
- [ ] Manuelle Prüfung einzelner Fundstellen
- [ ] Übernahme einer Fundstelle als Zotero-Annotation
- [ ] Einfache, gekennzeichnete Paraphrase als Annotation-Kommentar
- [ ] Export der Treffer/Entscheidungen als CSV und JSON
- [ ] Kurze Begründung, warum ein Treffer als relevant gilt
- [ ] "Systematic Review"-Abschnitt im Item Pane (Zotero 7)

## Phase 2 – Kontextbezogene Analyse
- [ ] Ausführliche Kontextbeschreibungen, positive/negative Beispiele
- [ ] Semantische Suche (KI-Modus)
- [ ] Konfigurierbarer Relevanzscore + Begründung
- [ ] Abschnittserkennung (Results, Discussion, …)
- [ ] Automatische Annotationsvorschläge (mit Vorschau)
- [ ] Versionierung der Suchprofile

## Phase 3 – Systematisches Review
- [ ] Titel-/Abstract- und Volltext-Screening
- [ ] Ausschlussgründe, Freitextbegründung
- [ ] Dublettenprüfung (DOI/ISBN/Titel/Hash)
- [ ] PRISMA-Zähler + Datengrundlage für Flussdiagramm
- [ ] Evidenztabelle (CSV/XLSX/JSON/Markdown/HTML)
- [ ] Review-Protokoll, Freigabestatus

## Phase 4 – Wissenschaftliche Inhaltsanalyse
- [ ] Extraktion von Methoden/Ergebnissen/Variablen
- [ ] Forschungslücken, Qualitätsbewertung
- [ ] Studienvergleich, Synthese
- [ ] Strukturierte Review-Berichte (DOCX)

## Grundsätze (gelten in allen Phasen)
Nichtdestruktiv · nachvollziehbar · reproduzierbar · transparent (KI vs. geprüft) ·
Quellenbindung · Nutzerkontrolle · Datenschutz. Siehe KONZEPT.md Kap. 18 & 21.
