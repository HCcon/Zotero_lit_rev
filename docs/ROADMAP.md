# Roadmap – Zotero Literature Review Plugin

Die Umsetzung folgt den vier Ausbaustufen aus [KONZEPT.md](KONZEPT.md) (Kap. 19).
Ziel jeder Stufe ist ein installierbares, benutzbares Plugin – nicht nur Code.

**Dokumente:** [KONZEPT-GESAMT.md](KONZEPT-GESAMT.md) = vollständige Vision
(41 Kapitel, 9 Module) · [KONZEPT.md](KONZEPT.md) = Phase-1-Fokus ·
[PHASE1_PLAN.md](PHASE1_PLAN.md) = konkreter Detailplan des ersten Bauabschnitts.

## Module (aus KONZEPT-GESAMT.md Kap. 40) → Phasen-Zuordnung
- **Modul 1** Projekt & Forschungsdesign → Phase 1/2
- **Modul 2** Recherche & Suche → Phase 1 (lokal) / 2 (semantisch)
- **Modul 3** Screening → Phase 3
- **Modul 4** Fundstellen & Annotationen → Phase 1/2
- **Modul 5** Paraphrasen & Extraktion → Phase 1 (manuell) / 2–4 (KI)
- **Modul 6** Qualität & Evidenz → Phase 4
- **Modul 7** Synthese & Forschungslücken → Phase 4
- **Modul 8** Reporting → Phase 1 (CSV/JSON) / 3 (PRISMA, Evidenztabelle)
- **Modul 9** KI- & API-Verwaltung → Phase 2

## Phase 1 – MVP (aktueller Fokus)

Entspricht den Akzeptanzkriterien in KONZEPT.md Kap. 20.

- [x] Datenspeicher für Plugin-Daten (Projekte, Konzepte, Fundstellen) – ohne
      Eingriff in die Zotero-Datenbank
- [x] Rechercheprojekt anlegen / bearbeiten / löschen
- [x] Zotero-Collections einem Projekt zuordnen (inkl. Subcollections-Option)
- [x] Suchkonzepte mit Keywords, Synonymen und Kontextbeschreibung
- [x] Operatoren AND / OR / NOT (Keywords/Synonyme = OR, Ausschlussbegriffe = NOT)
- [x] Volltextsuche in vorhandenen PDF-Anhängen der gewählten Collections
- [x] Trefferliste, nach einfacher Relevanz sortiert
- [x] Manuelle Prüfung einzelner Fundstellen
- [x] Übernahme einer Fundstelle als Zotero-Notiz*
- [x] Einfache, gekennzeichnete Paraphrase (in der Notiz)
- [x] Export der Treffer/Entscheidungen als CSV und JSON
- [x] Kurze Begründung, warum ein Treffer als relevant gilt
- [x] "Systematic Review"-Abschnitt im Item Pane + Kontextmenü

> *Phase 1 erzeugt eine strukturierte Kind-Notiz am Eintrag (nichtdestruktiv).
> Präzise In-PDF-Markierungen mit Seitenposition folgen in Phase 2 über die
> Zotero-Reader-API.

## Phase 2 – Kontextbezogene Analyse & KI (in Arbeit)
- [x] KI-/API-Anbindung, anbieter-konfigurierbar (Anthropic-Standard + OpenAI-kompatibel), Schlüssel getrennt gespeichert (Modul 9)
- [x] Semantische KI-Relevanzbewertung je Fundstelle (Score + Empfehlung + Begründung), einzeln und im Stapel
- [x] KI-Paraphrasen mit Kennzeichnung (KI-generiert/ungeprüft, Modellangabe)
- [x] Versionierte Prompt-Vorlagen
- [x] Positive/negative Beispiele je Suchkonzept (fließen in die KI-Bewertung)
- [x] Abschnittserkennung (Results, Discussion, …) inkl. Score-Bonus
- [ ] Konfigurierbare Score-Gewichtung (lokal + KI kombiniert)
- [ ] Automatische Annotationsvorschläge (mit Vorschau)
- [ ] Versionierung der Suchprofile

## Phase 3 – Systematisches Review (in Arbeit)
- [x] Screening je Eintrag: einschließen / ausschließen / vielleicht / Hintergrund
- [x] Standardisierte Ausschlussgründe + Freitextbegründung
- [x] Dublettenprüfung (DOI + Titel/Jahr; ISBN/Datei-Hash später)
- [x] PRISMA-Zähler (Datengrundlage für Flussdiagramm)
- [x] Evidenztabelle-Export (CSV; XLSX/HTML später)
- [x] PRISMA-Bericht-Export (Markdown)
- [ ] Explizite Trennung Titel-/Abstract- vs. Volltext-Stufe
- [ ] Evidenztabelle als XLSX/HTML
- [ ] Review-Protokoll mit Versionierung, Freigabestatus, Mehrbenutzer

## Phase 4 – Wissenschaftliche Inhaltsanalyse
- [ ] Extraktion von Methoden/Ergebnissen/Variablen
- [ ] Forschungslücken, Qualitätsbewertung
- [ ] Studienvergleich, Synthese
- [ ] Strukturierte Review-Berichte (DOCX)

## Grundsätze (gelten in allen Phasen)
Nichtdestruktiv · nachvollziehbar · reproduzierbar · transparent (KI vs. geprüft) ·
Quellenbindung · Nutzerkontrolle · Datenschutz. Siehe KONZEPT.md Kap. 18 & 21.
