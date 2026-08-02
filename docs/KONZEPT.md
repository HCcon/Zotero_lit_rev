# Konzeption und Umsetzung eines Zotero-Plugins für systematische Literaturauswertung

> Dieses Dokument ist die verbindliche fachliche Grundlage ("Blaupause") für die
> Entwicklung. Änderungen am Funktionsumfang werden hier gepflegt.

## 1. Zielsetzung des Plugins

Das Zotero-Plugin soll Nutzer bei der strukturierten, nachvollziehbaren und
weitgehend automatisierten Auswertung wissenschaftlicher Literatur unterstützen.
Im Mittelpunkt stehen nicht nur klassische Stichwortsuchen, sondern die
kontextbezogene Identifikation relevanter Textstellen innerhalb ausgewählter
Literaturbestände. Die gefundenen Textstellen sollen unmittelbar in Zotero
markiert, kategorisiert, bewertet und für die weitere wissenschaftliche Arbeit
aufbereitet werden können.

Unterstützte Arbeitsschritte:

1. Auswahl der für ein Forschungsprojekt relevanten Zotero-Sammlungen.
2. Definition von Forschungsfragen, Themenfeldern und Suchkonzepten.
3. Kombination von Suchbegriffen und Synonymen durch Operatoren.
4. Kontextbezogene Durchsuchung der vorhandenen Literatur.
5. Bewertung und Sortierung der gefundenen Literatur.
6. Markierung relevanter Fundstellen in den PDF-Dokumenten.
7. Erstellung gekennzeichneter Paraphrasen zu den Fundstellen.
8. Dokumentation aller Such-, Auswahl- und Bearbeitungsschritte.
9. Unterstützung eines systematischen Literaturreview-Prozesses.
10. Export der Ergebnisse für wissenschaftliche Arbeiten und Review-Dokumentationen.

Das Plugin wird primär als Erweiterung des Zotero-Desktop-Clients entwickelt.
Zotero stellt hierfür eine lokale JavaScript-API bereit. Für Zotero 7 und
nachfolgende Versionen werden die offiziellen Erweiterungsschnittstellen,
insbesondere für eigene Bereiche im Item Pane, verwendet. Direkte Änderungen an
der Zotero-Datenbank werden vermieden, da die offizielle API stabiler und
weniger fehleranfällig ist.

## 2. Grundprinzip: dreistufiges Suchmodell

**Stufe 1 – Formale Begriffssuche:** Prüfung, ob Keywords, Synonyme, Wortstämme
oder Begriffskombinationen im Dokument vorkommen (z. B. Business Continuity
Management, BCM, organisational resilience, continuity planning).

**Stufe 2 – Kontextprüfung:** Zu jedem Suchkonzept wird eine inhaltliche
Beschreibung hinterlegt (positiver Kontext) sowie ein Ausschlusskontext.

**Stufe 3 – Semantische Relevanzprüfung:** Bewertung, ob eine Textpassage
inhaltlich zum Suchkonzept passt. Berücksichtigt: Bedeutung der Passage,
Forschungsfrage, Kontextbeschreibung, Ein-/Ausschlusskriterien, Nähe zu
Keywords, Aussagekraft, wissenschaftliche Verwendbarkeit, Art der Aussage,
methodischer Kontext. So werden auch Stellen gefunden, die dasselbe Konzept
ohne die exakten Keywords beschreiben.

## 3. Projekt- und Sammlungsverwaltung

### 3.1 Rechercheprojekt
Felder: Projekttitel, Forschungsfrage, Unterfragen, Ziel, Review-Typ, Fachgebiet,
Untersuchungszeitraum, Sprachen, Dokumenttypen, Ein-/Ausschlusskriterien,
verantwortliche Person, Erstellungsdatum, Versionsstand.

Review-Typen: systematisches Literaturreview, Scoping Review, Rapid Review,
narrative Übersicht, strukturierte Recherche, thematische Analyse, explorative
Recherche.

PRISMA ist kein Suchalgorithmus, sondern ein Rahmen für die nachvollziehbare
Dokumentation von Identifikation, Screening und Auswahl.

### 3.2 Zuordnung von Zotero-Sammlungen (Collections)
Auswählbar: Bibliothek, einbezogene Collections, automatischer Einschluss von
Subcollections, ausgeschlossene Collections, Dokumenttypen-Filter, nur Dokumente
mit PDF-Volltext, erneute Berücksichtigung bereits analysierter Dokumente.

### 3.3 Mehrfache Projektzuordnung
Ein Eintrag kann mehreren Projekten zugeordnet werden, ohne bestehende
Sammlungszuordnungen zu verändern. Speicherung über eine Kombination aus:
Plugin-eigener Projektverwaltung, Zotero-Tags, Zotero-Notizen, Annotationen und
optionalen projektspezifischen Ergebnis-Collections.

## 4. Forschungsfrage
Oberste Ebene der Recherche, aufteilbar in Teilfragen. Jede Teilfrage kann mit
einem oder mehreren Suchkonzepten verbunden werden.

## 5. Suchkonzepte und Keywords

### 5.1 Aufbau
Bezeichnung, Beschreibung, zugehörige (Teil-)Frage, Hauptkeywords, Synonyme,
Abkürzungen, verwandte Begriffe, Ober-/Unterbegriffe, alternative Schreibweisen,
fremdsprachige Begriffe, Wortstämme, positive/negative Kontextmerkmale,
Einbeziehungs-/Ausschlusskriterien, Beispiele relevanter/nicht relevanter Stellen.

### 5.2 Einfache Eingabemaske
Eingabe auch ohne technische Kenntnisse möglich (Begriffsgruppen, Verknüpfung,
Ausschlussbegriffe, Kontextbeschreibung).

### 5.3 Operatoren
- **AND** – alle Konzepte müssen vorkommen/erfüllt sein.
- **OR** – mindestens einer reicht.
- **NOT** – bestimmte Begriffe/Kontexte ausschließen.
- **NEAR/n** – zwei Begriffe innerhalb einer Wort-/Satzdistanz.
- **EXACT** – exakte Wortfolge ("business continuity management").
- **STEM** – Wortstamm (resilien\* → resilience, resilient, resiliency).

### 5.4 Recherche ohne Operatoren
Operatoren sind optional; ohne sie erfolgt die Suche primär semantisch anhand der
Beschreibung.

## 6. Such- und Analyseprozess

### 6.1 Dokumentvorbereitung
Prüfungen: PDF vorhanden? Text maschinenlesbar? Volltextindex vorhanden?
Gescannt? OCR nötig? Verschlüsselt? Text vollständig extrahierbar? Sprache?
Status u. a.: vollständig/teilweise analysierbar, nur Abstract, OCR erforderlich,
PDF nicht lesbar, kein Volltext, Analyse fehlgeschlagen.

### 6.2 Analysebereiche
Titel, Abstract, Autoren-Keywords, Inhaltsverzeichnis, Volltext, Tabellen,
Abbildungsbeschreibungen, Fußnoten, Literaturverzeichnis, Zotero-Notizen,
Annotationen. Das Literaturverzeichnis wird standardmäßig aus der inhaltlichen
Trefferanalyse ausgeschlossen (Vermeidung falscher Treffer).

### 6.3 Abschnittserkennung
Abstract, Introduction, Theoretical Background, Literature Review, Methodology,
Results, Discussion, Limitations, Conclusion, Future Research. Die Position einer
Fundstelle beeinflusst die Bewertung.

## 7. Trefferbewertung und Relevanzsortierung

### 7.1 Relevanzscore
Bestandteile u. a.: Keyword-Übereinstimmung, semantische Übereinstimmung,
Übereinstimmung mit Forschungsfrage/Kontext, Anzahl/Verteilung der Fundstellen,
Lage im Ergebnis-/Diskussionsteil, Ein-/Ausschlusskriterien, methodische
Aussagekraft, Publikationstyp.

Beispiel-Gewichtung (konfigurierbar):

```
Relevanzscore = 0,20 × Keywords
              + 0,30 × semantische Ähnlichkeit
              + 0,20 × Kontextübereinstimmung
              + 0,15 × Abschnittsrelevanz
              + 0,15 × methodische Relevanz
```

### 7.2 Ergebnisdarstellung
Autor, Jahr, Titel, Publikationstyp, Collection, Anzahl Fundstellen, höchster/
durchschnittlicher Score, betroffene Suchkonzepte, relevante Abschnitte,
Analysequalität, Screeningstatus, Ausschlussgrund, Bearbeitungsstatus.

### 7.3 Erklärbarkeit
Jede Einstufung muss begründet werden (nicht nur Prozentwert), zurückführbar auf
konkrete Textstellen und deren Lage im Dokument.

## 8. Screening-Prozess
- **Phase 1 Identifikation:** Erfassung aller Datensätze der Collections.
- **Phase 2 Dublettenprüfung:** DOI, ISBN, Titel, Autor, Jahr, Dateihash,
  bibliografische Ähnlichkeit. Keine automatische Löschung.
- **Phase 3 Titel-/Abstract-Screening:** Entscheidung einschließen/ausschließen/
  unklar/Volltextprüfung nötig.
- **Phase 4 Volltext-Screening.**
- **Phase 5 Finale Aufnahme:** aufgenommen/ausgeschlossen/zurückgestellt/
  Hintergrundliteratur.

Standard-Ausschlussgründe (auswählbar) plus Freitextbegründung: falsches Thema/
Population/Kontext/Publikationstyp, keine empirischen Ergebnisse, kein Volltext,
Sprache/Zeitraum ausgeschlossen, Dublette, unzureichende methodische Qualität,
keine relevante Aussage zur Forschungsfrage.

## 9. Markierungen in Zotero

### 9.1 Automatische Annotationen
Zotero speichert PDF-Annotationen in seiner Datenbank (nicht in der PDF-Datei).
Jede Annotation enthält mindestens: Textstelle, Seitenzahl, Position, Suchkonzept,
Relevanzscore, kurze Begründung, Erstellungsdatum, Plugin-Version,
Analysemodell/Regelversion, Status der manuellen Prüfung.

### 9.2 Farbsystem (frei konfigurierbar)
Gelb: theoretische Grundlagen · Blau: Methodik · Grün: empirische Ergebnisse ·
Rot: Einschränkungen · Violett: Forschungslücken · Orange: wirtschaftliche
Auswirkungen.

### 9.3 Keine unkontrollierte Massenmarkierung
Erkannte Stellen erscheinen zuerst als Vorschläge. Nutzer kann übernehmen (einzeln/
gesammelt), bearbeiten, ablehnen, Bewertung korrigieren, anderem Konzept zuweisen.

## 10. Paraphrasierungsfunktion

### 10.1 Grundfunktion
Paraphrase gibt Inhalt sinngemäß wieder, ohne neue Tatsachen, erhält Bedeutung,
weicht sprachlich hinreichend ab, wissenschaftlich formuliert, klar als Paraphrase
gekennzeichnet, dauerhaft mit der Originalstelle verbunden.

### 10.2 Darstellung
Als Kommentar der Annotation oder separate Notiz. Struktur: Originalfundstelle,
Paraphrase, Status, Quelle (Autor, Jahr, Seite), Suchkonzept.

### 10.3 Kennzeichnung (Status)
automatisch erstellt / manuell geprüft / manuell überarbeitet / freigegeben /
verworfen. KI-Paraphrasen dürfen nicht als geprüft dargestellt werden.

### 10.4 Varianten
sehr nah am Original, wissenschaftlich-neutral, stark verdichtet, ausführlich,
Deutsch, Originalsprache, argumentationsbezogen, ergebnisbezogen.

### 10.5 Inhaltliche Kontrolle
Warnungen, wenn Zahlen verändert, Aussagerichtung gedreht, Kausalität hinzugefügt,
Einschränkungen/Unsicherheiten entfernt, Aussagen verstärkt oder Korrelation als
Kausalität dargestellt wurde.

## 11. Extraktion wissenschaftlicher Aussagen
Felder u. a.: Kernaussage, theoretisches Konzept, Variablen (unabhängig/abhängig,
Moderator/Mediator), Stichprobe, Land, Branche, Zeitraum, Methode, statistisches
Verfahren, Ergebnis, Effektstärke, Signifikanz, Einschränkung, Forschungslücke,
Implikationen (Wissenschaft/Praxis). Nur tatsächlich vorhandene Angaben; sonst
"nicht angegeben".

## 12. Notizen und Evidenztabellen

### 12.1 Literaturnotiz
Bibliografie, Relevanz, theoretischer Hintergrund, Methode, Stichprobe,
Ergebnisse, Originalstellen, Paraphrasen, Einschränkungen, Forschungslücken,
eigene Bewertung, zugeordnete Suchkonzepte.

### 12.2 Evidenztabelle
Spalten u. a.: Quelle, Jahr, Forschungsfrage, Methode, Stichprobe, Variablen,
Hauptergebnis, Fundstelle, Paraphrase, Seitenzahl, Suchkonzept, Qualität,
Screeningentscheidung, Kommentar.
Export: CSV, XLSX, JSON, Markdown, HTML, optional DOCX.

## 13. Dokumentation nach PRISMA
Erfasst: untersuchte Einträge, Dubletten, nach Bereinigung, Titel-/Abstract-
Prüfungen, Ausschlüsse, Volltextprüfungen, nicht verfügbare Volltexte,
ausgeschlossene Volltexte, Ausschlussgründe, final aufgenommene Publikationen.
Zusätzlich: untersuchte Collections, verwendete Suchkonzepte/Keywords/Operatoren,
Analysezeitpunkt, Suchprofil-Version, Entscheider. Ziel: Datengrundlage für ein
PRISMA-Flussdiagramm (grafische Darstellung als spätere Erweiterung).

## 14. Benutzeroberfläche

### 14.1 Hauptbereiche
Projekte, Quellen, Forschungsfragen, Suchkonzepte, Analyse, Treffer, Screening,
Annotationen, Paraphrasen, Evidenztabelle, Review-Protokoll.

### 14.2 Integration in Zotero
Eigener, einklappbarer Abschnitt "Systematic Review" im Item Pane (Zotero 7):
zugeordnete Projekte, Screeningstatus, Relevanzscore, gefundene Suchkonzepte,
Anzahl relevanter Annotationen, Paraphrasen, Qualitätsbewertung, letzte Analyse.
Kontextmenü: Dokument(e) analysieren, zum Review-Projekt hinzufügen, Fundstellen
anzeigen, Paraphrase erstellen, Evidenzdaten exportieren.

## 15. Technische Architektur

### 15.1 Grundlage
Zotero-Desktop-Plugin, Auslieferung als `.xpi`. Technik: JavaScript/TypeScript,
HTML/XHTML für Dialoge, CSS, Zotero JavaScript API, Item-Pane-APIs, Annotationen,
Notizen/Tags, lokale Plugin-Datenbank oder strukturierte Einstellungsdateien.

### 15.2 Empfohlene Module

```text
src/
  bootstrap/     startup, shutdown
  projects/      projectManager, projectModel
  collections/   collectionSelector, itemResolver
  search/        conceptManager, queryParser, keywordMatcher, semanticMatcher, contextEvaluator
  documents/     pdfTextExtractor, sectionDetector, languageDetector
  scoring/       relevanceScorer, explanationGenerator
  screening/     screeningManager, duplicateDetector, exclusionReasons
  annotations/   annotationManager, annotationReview
  paraphrasing/  paraphraseService, paraphraseValidator
  extraction/    evidenceExtractor, evidenceTable
  export/        csvExporter, jsonExporter, markdownExporter
  ui/            projectDialog, conceptEditor, resultsPane, reviewPane
  audit/         auditLog, versionManager
```

### 15.3 Lokale und externe Verarbeitung
- **Lokaler Modus:** Keyword-/Volltextsuche, Operatoren, einfache Kontextregeln,
  lokale Relevanzberechnung, keine Übermittlung von Dokumentinhalten.
- **KI-gestützter Modus:** semantische Bewertung, Klassifikation, Paraphrasierung,
  strukturierte Extraktion, Begründung.

Bei externer KI-Verarbeitung transparent anzeigen: welche Texte, an welchen Dienst,
Speicherdauer, ganze Dokumente vs. Ausschnitte, Abschaltbarkeit. Standardmäßig nur
die für die Analyse nötigen Ausschnitte übertragen.

## 16. Datenmodell (Auszug)

### 16.1 Rechercheprojekt
```json
{
  "projectId": "project-001",
  "name": "BCM Economic Impact Review",
  "researchQuestion": "Welchen Einfluss hat BCM auf die Unternehmensleistung?",
  "reviewType": "systematic-review",
  "languages": ["de", "en"],
  "createdAt": "2026-08-02",
  "version": 1
}
```

### 16.2 Suchkonzept
```json
{
  "conceptId": "concept-001",
  "name": "Financial Performance",
  "description": "Finanzielle Auswirkungen von BCM und organisationaler Resilienz",
  "keywords": ["financial performance", "profitability", "return on assets", "revenue"],
  "synonyms": ["economic performance", "business performance"],
  "positiveContext": ["measurable effect", "empirical relationship", "loss avoidance"],
  "negativeContext": ["publication cost", "study funding"]
}
```

### 16.3 Fundstelle
```json
{
  "findingId": "finding-001",
  "itemKey": "ABCD1234",
  "attachmentKey": "EFGH5678",
  "conceptId": "concept-001",
  "page": 15,
  "section": "Results",
  "originalText": "Relevant original passage",
  "keywordScore": 0.82,
  "semanticScore": 0.91,
  "overallScore": 0.87,
  "reviewStatus": "suggested",
  "annotationKey": null
}
```

### 16.4 Paraphrase
```json
{
  "paraphraseId": "paraphrase-001",
  "findingId": "finding-001",
  "text": "Paraphrasierte wissenschaftliche Aussage",
  "language": "de",
  "generationType": "ai",
  "status": "not-reviewed",
  "createdAt": "2026-08-02",
  "approvedBy": null
}
```

## 17. Audit Trail
Protokolliert: ursprüngliche Suchkonfiguration, Änderungen an Keywords/Kontext,
Analysezeitpunkt, analysierte Dokumentversion, vorgeschlagene/angenommene/
abgelehnte Fundstellen, erstellte/überarbeitete Paraphrasen, Screeningentscheidungen,
Ausschlussbegründungen, Exporte.

## 18. Schutz vorhandener Zotero-Daten
Keine automatische Löschung von Einträgen, keine automatische Entfernung aus
Collections, kein Überschreiben bestehender Notizen, keine ungeprüfte Änderung
vorhandener Annotationen, keine direkte SQLite-Manipulation. Sicherung vor
Massenänderungen, Rückgängig-Funktion, Vorschau vor Erstellung zahlreicher
Annotationen. Zotero empfiehlt die JavaScript-API statt direkter DB-Zugriffe.

## 19. Entwicklung in Ausbaustufen

**Phase 1 – MVP:** Projekt anlegen, Collections auswählen, einfache Suchkonzepte,
Keywords mit AND/OR/NOT, Volltextsuche in PDFs, Trefferliste, manuelle
Relevanzprüfung, Annotationen erstellen, einfache Paraphrase als Annotation-
Kommentar, CSV-Export.

**Phase 2 – Kontextbezogene Analyse:** Kontextbeschreibungen, positive/negative
Beispiele, semantische Suche, Relevanzscore, Begründung, Abschnittserkennung,
automatische Annotationsvorschläge, Versionierung der Suchprofile.

**Phase 3 – Systematisches Review:** Titel-/Abstract- und Volltext-Screening,
Ausschlussgründe, Dublettenprüfung, PRISMA-Zähler, Evidenztabelle, Review-Protokoll,
Mehrbenutzer-/Freigabestatus.

**Phase 4 – Wissenschaftliche Inhaltsanalyse:** Extraktion von Methoden/Ergebnissen,
Variablen/Wirkzusammenhänge, Forschungslücken, Qualitätsbewertung, Studienvergleich,
Synthese, strukturierte Review-Berichte.

## 20. Akzeptanzkriterien (erster Prototyp)
Nutzer kann: (1) Projekt anlegen, (2) Collection wählen, (3) mehrere Suchkonzepte
erstellen, (4) Keywords/Synonyme eingeben, (5) mit AND/OR/NOT kombinieren,
(6) Kontextbeschreibung ergänzen, (7) alle PDFs einer Collection analysieren,
(8) Dokumente nach Relevanz sortiert sehen, (9) Fundstellen prüfen, (10) als
Annotation übernehmen, (11) gekennzeichnete Paraphrase erstellen, (12) Original +
Paraphrase dauerhaft verbunden sehen, (13) als CSV/JSON exportieren, (14) erkennen,
warum ein Treffer relevant ist.

## 21. Qualitätsanforderungen
Nachvollziehbarkeit · Reproduzierbarkeit · Transparenz (KI vs. manuell geprüft) ·
Quellenbindung · Kontrolle durch den Nutzer · Datenschutz · nichtdestruktive
Verarbeitung.

## 22. Zielbild
Aus Zotero wird nicht nur eine Literaturverwaltung, sondern eine strukturierte
Arbeitsumgebung für systematische Literaturauswertungen: von der Definition der
Forschungsfrage über Suchkonzepte, Analyse, Screening und Annotation bis zur
finalen, versioniert dokumentierten Evidenztabelle.

## Quellen
- Zotero 7 for developers: https://www.zotero.org/support/dev/zotero_7_for_developers
- Collections and tags: https://www.zotero.org/support/collections_and_tags
- Annotations in database: https://www.zotero.org/support/kb/annotations_in_database
- Zotero JavaScript API: https://www.zotero.org/support/dev/client_coding/javascript_api
- Plugins: https://www.zotero.org/support/plugins
