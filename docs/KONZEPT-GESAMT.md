# Erweiterte Gesamtkonzeption – KI-gestütztes Zotero-Plugin für systematische Literaturrecherchen

> **Master-Vision.** Dieses Dokument beschreibt das vollständige Zielbild.
> [KONZEPT.md](KONZEPT.md) ist die auf Phase 1 fokussierte Teilmenge,
> [ROADMAP.md](ROADMAP.md) ordnet alles in umsetzbare Stufen, und
> [PHASE1_PLAN.md](PHASE1_PLAN.md) beschreibt den konkreten ersten Bauabschnitt.

## 1. Übergeordnetes Zielbild
Zotero wird zu einer vollständig integrierten Arbeitsumgebung für systematische,
strukturierte und KI-gestützte Literaturrecherchen. Alle wesentlichen Schritte
laufen innerhalb von Zotero: Forschungsproblem beschreiben → Forschungsfrage/
Teilfragen → Review-Protokoll → Collections wählen → Suchkonzepte/Keywords/
Operatoren → formal + semantisch durchsuchen → Titel/Abstract/Volltext screenen →
Ein-/Ausschluss dokumentieren → Textstellen markieren → paraphrasieren/
strukturieren → Studienmerkmale extrahieren → Qualität bewerten → Studien
vergleichen → Widersprüche/Forschungslücken → Evidenz-/Synthesetabellen →
PRISMA-Kennzahlen → Export für wissenschaftliche Arbeiten.
Kein reines Such- oder Chat-Tool, sondern Unterstützung des gesamten
wissenschaftlichen Erkenntnisprozesses.

## 2. Forschungsprojekt als zentrale Einheit
Jede Recherche = eigenständiges Projekt. Felder u. a.: Projekttitel, Arbeitstitel,
Forschungsproblem, Ziel, Haupt-/Teilforschungsfragen, theoretischer Hintergrund,
Fachgebiet, Review-Typ, Untersuchungsgegenstand, Population, Kontext, geografischer/
zeitlicher Fokus, Sprachen, Publikationstypen, Ein-/Ausschlusskriterien,
Auswertungsmethode, verantwortliche Personen, Protokollversion.
Forschungsfrage wird **verknüpft** (nicht nur Freitext): Suchkonzept→Teilfrage,
Fundstelle→Teilfrage, Studie→Evidenz für Frage, Forschungslücke→Teilfrage.

## 3. Unterstützung bei der Entwicklung der Forschungsfrage
Funktionen: Erstformulierung aus Themenbeschreibung, Erkennung zu breiter/enger
Fragen, Aufteilung in Teilfragen, alternative Formulierungen, begriffliche
Klarheit, zentrale Konstrukte, PICO-artige Elemente, Ableitung von Suchkonzepten.
Frameworks: PICO, PICOS, SPIDER, SPICE, PCC, CIMO, Population–Concept–Context,
Intervention–Mechanism–Outcome, frei definierbar. KI erzeugt nur Vorschläge.

## 4. Review-Protokoll
Enthält Forschungsfrage, Ziel, Typ, Suchstrategie, Datenquellen, Collections,
Suchkonzepte, Suchstrings, Ein-/Ausschlusskriterien, Screening-/Qualitäts-/
Extraktions-/Syntheseverfahren, Umgang mit Dubletten/fehlenden Volltexten/
Mehrfachpublikationen, Aktualisierungsintervalle. **Alle Änderungen versioniert**
(Beispiel: „v1.2: Zeitraum 2015–2026 → 2010–2026, da Grundlagenstudien vor 2015").

## 5. Zotero-Sammlungen und Literaturbestände
Wählbar: persönliche/Gruppen-Bibliotheken, einzelne/mehrere Collections,
Subcollections, ausgeschlossene Collections, gespeicherte Suchen, nur ausgewählte
Einträge, nur mit Volltext, nur bestimmte Publikationstypen/Zeitraum/Sprachen.
Ergebnisziele: bestehende/automatische Projekt-Collection, Screening-,
eingeschlossene/ausgeschlossene/Hintergrund-/methodische Literatur, offene
Prüfungen. Ursprüngliche Struktur bleibt unverändert.

## 6. Import und Erweiterung der Literaturbasis
Optional: Import RIS/BibTeX/CSV, bestehende Suchergebnisse, wissenschaftliche
Datenbanken, DOI-Ergänzung, verwandte Publikationen, Rückwärts-/Vorwärtssuche
(Zitationen), Autoren-/Ähnlichkeitssuche, neuere Versionen, Preprint vs. final.
Klar getrennt von der Analyse bereits ausgewählter Zotero-Bestände.

## 7. Mehrdimensionale Suchkonzepte
Je Konzept: Name, Beschreibung, Bezug zur Frage, Hauptbegriffe, Synonyme,
Abkürzungen, Schreibvarianten, Ober-/Unterbegriffe, verwandte Konstrukte,
fremdsprachige Begriffe, Wortstämme, positive/negative Kontextmerkmale, relevante/
nicht relevante Beispiele, Ein-/Ausschlusskriterien, erwartete Zusammenhänge/
Ergebnisse.

## 8. Suchlogik (kombinierbar)
Exakte Suche · Keyword-Suche · Boolesch (AND/OR/NOT, Klammern, Verschachtelung) ·
Distanzsuche (Wort-/Satz-/Absatzdistanz) · Wortstammsuche · Fuzzy Search ·
semantische Suche · kontextbasierte Suche (anhand Konzeptbeschreibung) ·
fragengestützte Suche · Negativsuche (falsche Treffer reduzieren).

## 9. Suchstrategie-Editor
Grafischer Editor für komplexe Recherchen (verschachtelte Konzepte A AND B NOT C).
Zwei Ansichten: einfache Eingabemaske ↔ erweiterter Suchstring-Editor. Erzeugter
Suchstring wird angezeigt und gespeichert.

## 10. Lernende Suchstrategie
Aus manuellen relevant/irrelevant-Entscheidungen: Vorschläge für neue Synonyme,
Ausschlussbegriffe, präzisere Kontexte, zusätzliche Konzepte, Gewichtungen,
Priorisierung ähnlicher Stellen. **Nie automatisch/unbemerkt** – stets mit Anzeige
von Änderung, Begründung, Grundlage und Auswirkung auf bisherige Treffer.

## 11. Screening-Prozess
Initiale Erfassung · Dublettenprüfung (DOI/Titel/Autoren/Jahr/Journal/ISBN/PDF-
Hash/Metadaten) · Titel-Screening · Abstract-Screening · Volltext-Screening ·
finale Entscheidung (eingeschlossen/ausgeschlossen/möglicherweise relevant/unklar/
Hintergrund/methodisch/Volltext fehlt/erneut prüfen). Jede Entscheidung begründbar.

## 12. KI-gestützte Screening-Unterstützung
KI-Empfehlung: wahrscheinlich ein-/ausschließen / manuelle Prüfung. Mit Begründung
(erfüllte Einschluss-/mögliche Ausschlusskriterien, stützende Passagen,
Unsicherheiten). Endgültige Entscheidung beim Nutzer.

## 13. Relevanzbewertung auf mehreren Ebenen
Thematische · methodische · inhaltliche · Evidenz- · Kontext- · Aktualitäts- ·
Syntheserelevanz. Gesamtscore nur unterstützend; Einzelkomponenten sichtbar.

## 14. Erkennung relevanter Textstellen
Sätze, Satzgruppen, Absätze, Tabellenzellen/-überschriften,
Abbildungsbeschreibungen, Fußnoten, Ergebnis-/Limitations-/Diskussions-/
Schlussabschnitte. Kontextbereich mitanalysieren (vorheriger/gefundener/
nachfolgender Satz, Absatz, Abschnittsüberschrift) → Verneinungen/Einschränkungen
nicht übersehen.

## 15. Annotationen und Markierungen
Zotero-Annotation je Fundstelle mit: Originaltext, Seite, Abschnitt, Suchkonzept,
Forschungsfrage, Score, Begründung, Aussageart, Evidenztyp, Prüfstatus, Farbe,
Tags, Verknüpfung zu Paraphrase/Evidenztabelle. Zuerst Vorschläge; Status:
vorgeschlagen/übernommen/bearbeitet/abgelehnt/falsch-positiv/erneut prüfen.

## 16. Typisierung wissenschaftlicher Aussagen
Kategorien u. a.: Definition, Theorie, Hypothese, Annahme, empirisches Ergebnis,
statistischer Zusammenhang, Kausalität, Korrelation, praktische Empfehlung,
methodische Aussage, Limitation, Forschungslücke, Widerspruch, Bestätigung/
Abweichung früherer Forschung, künftiger Forschungsbedarf, Kontext, Beispiel,
Autoreninterpretation.

## 17. Paraphrasierung
Dauerhaft mit Original verbunden. Gespeichert: Originaltext, Paraphrase, Sprache,
Art, KI-Modell, Datum, Status, manuelle Änderungen, Seite, Quelle, Suchkonzept,
Forschungsfrage. Status: KI-generiert/ungeprüft/manuell geprüft/überarbeitet/
freigegeben/verworfen. Arten: neutral, kurz, ausführlich, nah am Original,
abstrahiert, de/en, argumentations-/ergebnisbezogen, für Theorie-/Ergebnis-/
Diskussionsteil.

## 18. Schutz vor fehlerhaften Paraphrasen
Automatischer Vergleich Original↔Paraphrase; Warnung bei: veränderten Zahlen,
fehlenden statistischen Werten, entfernten Einschränkungen, Unsicherheit→Gewissheit,
Korrelation als Kausalität, verändertem Aussagegegenstand, unzulässiger
Verallgemeinerung, umgekehrtem Effekt, Vermischung Autorenposition/Ergebnis.
Optionaler Ähnlichkeitswert (zu nah am Original?).

## 19. Strukturierte Datenextraktion
Bibliografisch (Autor/Jahr/Titel/Journal/DOI/Typ) · forschungsbezogen (Frage/
Hypothesen/Theorie/Konstrukte) · methodisch (Design, qual/quant, Stichprobe(ngröße/
-art), Land, Branche, Organisationstyp, Erhebung, Analyse, Zeitraum) · Ergebnisse
(Haupt-/Nebenbefunde, Effektstärken, Signifikanz, Konfidenzintervalle,
Zusammenhänge, (nicht) bestätigte Hypothesen) · kritisch (Limitationen, Bias,
Datenprobleme, Übertragbarkeit, Interessenkonflikte, Finanzierung).
Fehlende Angaben: „nicht berichtet"/„nicht eindeutig erkennbar". KI ergänzt nichts.

## 20. Qualitätsbewertung der Studien
Instrumente: freie Checklisten, qualitative/quantitative/Mixed-Methods-Matrizen,
Risk-of-Bias, methodenspezifische Kriterien. Prüffelder: klare Frage, geeignetes
Design, nachvollziehbare Stichprobe, valide Messung, geeignete Auswertung,
Störvariablen, transparente Ergebnisse, Limitationen, Replizierbarkeit,
Interessenkonflikte. Bewertung: erfüllt/teilweise/nicht/unklar/nicht anwendbar.
KI schlägt vor, finale Bewertung manuell.

## 21. Identifikation von Forschungslücken
Quellen: explizit genannt („future research should…"), methodisch (kleine
Stichproben, nur Querschnitt, fehlende Langzeit/Kontrollgruppen), inhaltlich
(nicht untersuchte Variablen, ungeklärte Mechanismen), kontextuell (Länder/
Branchen/KMU), widersprüchliche Evidenz, zeitlich (veraltete Daten). Strukturierte
Darstellung: Beschreibung, Typ, zugrunde liegende Studien, Originalstellen,
betroffene Frage, Häufigkeit, Widersprüche, mögliche neue Frage, Relevanz.

## 22. Forschungsfragen aus Forschungslücken ableiten
Vorschläge für neue Fragen/Unterfragen/Hypothesen/Modelle/Populationen/Branchen/
Methoden – gekennzeichnet als KI-generierte Hypothesen.

## 23. Thematische Codierung
Codes/Untercodes erstellen, zu Suchkonzepten zuordnen, Annotationen codieren,
KI-Codierung vorschlagen + manuell bestätigen, mehrere Codes je Fundstelle,
Codebuch mit Beschreibungen + positiven/negativen Beispielen, versioniert +
exportierbar.

## 24. Vergleich und Synthese mehrerer Studien
Gruppieren gleicher Ergebnisse, Widersprüche identifizieren, Modelle/Methoden/
Populationen/Länder/Branchen vergleichen, zeitliche Entwicklung, Wirkmechanismen,
Moderatoren/Mediatoren, Evidenzstärke. Darstellungen: Evidenztabelle,
Studienmatrix, Concept-/Theme-by-Study-/Method-by-Study-Matrix, Forschungslücken-/
Widerspruchsmatrix, Wirkungsmodell, Zeitverlauf.

## 25. Argumentations- und Evidenzstruktur
Je Aussage nachvollziehbar: stützende Studie, konkrete Textstelle, Seite, Zitat vs.
Paraphrase, Ergebnis vs. Interpretation, widersprechende Studien, methodische
Qualität, Evidenzstärke. Evidenzkette:
`Forschungsfrage → Teilfrage → Suchkonzept → Studie → Fundstelle → Paraphrase → Syntheseaussage`.
Jede Syntheseaussage auf Fundstellen zurückführbar.

## 26. Unterstützung beim wissenschaftlichen Schreiben
Editierbare Textbausteine (theoretischer Hintergrund, Stand der Forschung,
Methodik, Ergebnisse, Diskussion, Forschungslücken, Limitationen, Ausblick) –
nur aus bestätigten/geprüften Inhalten. Regeln: nur bestätigte Quellen, keine
erfundenen Quellen, keine Aussage ohne Fundstellenbezug, Zitat vs. Paraphrase,
Zitierinfos, Widersprüche darstellen, Unsicherheiten beibehalten, KI-Texte
kennzeichnen. Kein ungeprüfter Fertigtext.

## 27. Zitier- und Quellenprüfung
Prüfungen: Paraphrase↔Quelle, Seitenzahl vorhanden, passt Quelle zur Aussage,
Sekundär- statt Primärquelle, aus Zusammenhang gelöst, Autor/Jahr korrekt, DOI
korrekt, Retraktion/Korrektur, mehrere Versionen, unabhängige Mehrfachbestätigung.

## 28. API- und KI-Integration
Anbieter: OpenAI, Azure OpenAI, Anthropic, Google Gemini, lokale Modelle, Ollama,
LM Studio, OpenAI-kompatible APIs, institutionsinterne Dienste, selbst gehostete
Embeddings. Konfigurierbar: Anbieter, Endpunkt, Modell, API-Schlüssel, Temperatur,
Token-Limit, Sprache, Embedding-Modell, lokal/extern, erlaubte Funktionen, max.
übertragene Textmenge. **API-Schlüssel nie im Klartext in Projektdateien/Exporten.**

## 29. Unterschiedliche KI-Modelle je Aufgabe
Embedding-Modell (semantische Suche), kleines lokales Modell (Klassifikation),
starkes Modell (Paraphrase), separates Modell (Extraktion), regelbasiert (Zahlen/
Seiten). Je Funktion: lokal/extern/deaktiviert/nur nach Bestätigung.

## 30. Prompt- und Modellverwaltung
Versioniert speichern: System-/Aufgabenprompt, Modell(version), Parameter, Datum,
Eingabe, Ausgabe, manuelle Korrekturen. Vordefinierte Vorlagen (Relevanz,
Screening, Paraphrase, Extraktion, Qualität, Forschungslücken, Synthese,
Widerspruch) + eigene Vorlagen.

## 31. Datenschutz und Vertraulichkeit
Vor externer Verarbeitung transparent: welcher Text, welcher Anbieter, Metadaten?,
Volltext vs. Ausschnitt, mögliche sensible Inhalte, Abschaltung. Optionen: nur
lokal, nur Metadaten extern, nur ausgewählte Passagen, volle PDF-Verarbeitung,
personenbezogene Daten entfernen, einzelne Dokumente ausschließen.

## 32. Nachvollziehbarkeit und Audit Trail
Protokolliert: Projektanlage, Änderungen an Frage/Strategie/Kriterien,
Analysezeitpunkt, KI-Modelle, vorgeschlagene/manuelle Entscheidungen,
Annotationen, Paraphrasen, Überarbeitungen, Bewertungen, Forschungslücken,
Syntheseaussagen, Exporte. Stets erkennbar: automatisch vs. manuell geprüft, wer,
welche Version.

## 33. Mehrbenutzer- und Review-Funktion
Rollen: Projektleitung, Reviewer, Zweit-Reviewer, Methodik, Leser, Admin.
Funktionen: unabhängiges/verdecktes Screening, Entscheidungsvergleich,
Konfliktauflösung, Konsens, Kommentare, Änderungsverlauf, Übereinstimmung
(Cohen's Kappa o. ä.).

## 34. Qualitätskontrolle des gesamten Reviews
Projektstatus, z. B.: Frage vollständig?, Strategie vollständig?, Kriterien fehlen,
„32 Dokumente ungescreent", „14 KI-Paraphrasen ungeprüft", „8 Fundstellen ohne
Seite", „3 Syntheseaussagen ohne Evidenz", „5 Studien ohne Qualitätsbewertung",
PRISMA unvollständig. → Plugin als Qualitätssicherungssystem.

## 35. PRISMA-Unterstützung
Erfasst: identifizierte Datensätze, entfernte Dubletten, gescreente Titel/
Abstracts, ausgeschlossene, angeforderte/nicht verfügbare/geprüfte/ausgeschlossene
Volltexte, Ausschlussgründe, final eingeschlossene Studien. Export: PRISMA-
Datentabelle, Screeningprotokoll, Ausschlussliste, Suchstrategien,
Versionshistorie, optional Flussdiagramm.

## 36. Aktualisierung einer Literaturrecherche
Prüft: neue Literatur seit letztem Lauf, veränderte PDFs, neue Treffer/
Forschungslücken, ob neue Studien frühere Ergebnisse bestätigen/widerlegen,
zu aktualisierende Syntheseaussagen. Alte/neue Läufe unterscheidbar.

## 37. Dashboard
Anzahl Quellen/PDFs/analysiert/relevant, Screeningfortschritt, offene
Entscheidungen, Fundstellen, übernommene Annotationen, ungeprüfte Paraphrasen,
extrahierte/bewertete Studien, Forschungslücken, Widersprüche, PRISMA-Status,
letzter Suchlauf, letzte Aktualisierung.

## 38. Exporte
Wissenschaftlich: Evidenztabelle, Studiencharakteristika, Methoden-/Ergebnistabelle,
Qualitätsbewertung, Forschungslückenmatrix, Synthesebericht, Review-Protokoll.
Technisch: JSON, CSV, XLSX, Markdown, HTML, DOCX, RIS, BibTeX.
Zotero-intern: Notizen, Tags, Collections, Annotationen, Berichte.
Verknüpfung zur Zotero-Quelle erhalten, soweit möglich.

## 39. Vollumfängliches Zielbild (Prozesskette)
```
Forschungsthema → Forschungsfrage → Review-Protokoll → Collections/Literaturbasis
→ Suchkonzepte/Suchstrings → Keyword-/semantische Analyse → Titel-/Abstract-
Screening → Volltext-Screening → relevante Fundstellen → Zotero-Annotationen →
Paraphrasen/Extraktion → Qualitätsbewertung → Studienvergleich →
Widersprüche/Forschungslücken → Evidenzsynthese → PRISMA → Schreibunterstützung
```
Integriert, methodisch geführt, KI-gestützt, nachvollziehbar, reproduzierbar,
quellengebunden, datenschutzkonform, innerhalb Zotero.

## 40. Modulare Umsetzung
- **Modul 1 – Projekt & Forschungsdesign:** Forschungsfrage, Teilfragen, Review-
  Protokoll, Ein-/Ausschlusskriterien.
- **Modul 2 – Recherche & Suche:** Collections, Suchkonzepte, Keywords, Operatoren,
  semantische Suche.
- **Modul 3 – Screening:** Titel/Abstract/Volltext, Entscheidungen, Ausschlussgründe.
- **Modul 4 – Fundstellen & Annotationen:** Textstellenerkennung, Markierung,
  Relevanzbegründung, Codierung.
- **Modul 5 – Paraphrasen & Extraktion:** Paraphrasierung, Qualitätsprüfung,
  Studienmerkmale, Ergebnisse.
- **Modul 6 – Qualität & Evidenz:** Qualitätsbewertung, Risk-of-Bias, Evidenzstärke.
- **Modul 7 – Synthese & Forschungslücken:** Studienvergleich, Widersprüche,
  Forschungslücken, neue Forschungsfragen.
- **Modul 8 – Reporting:** Evidenztabellen, PRISMA, Audit Trail, Exporte.
- **Modul 9 – KI- & API-Verwaltung:** Anbieter, lokale Modelle, Prompt-Versionen,
  Datenschutz, Kostenkontrolle.

## 41. Alleinstellungsmerkmale
1. Vollständige Verbindung Forschungsfrage↔Suchstrategie↔Fundstellen.
2. Boolesche + semantische + kontextbasierte Suche kombiniert.
3. Direkte, überprüfbare Zotero-Annotationen.
4. Dauerhafte Verbindung Originaltext↔Paraphrase.
5. Transparente Kennzeichnung aller KI-Inhalte.
6. Strukturierte Extraktion von Studienmerkmalen.
7. Methodische Qualitätsbewertung.
8. Automatische, strukturierte Forschungslücken.
9. Nachvollziehbare Ableitung neuer Forschungsfragen.
10. Vergleich widersprüchlicher Ergebnisse.
11. Vollständiges Audit Trail.
12. PRISMA-Unterstützung.
13. Flexible Integration externer/lokaler KI-Modelle.
14. Vollständige Nutzung innerhalb Zotero.
15. Reproduzierbarkeit aller Schritte.

→ Schließt die Lücke zwischen Literaturverwaltung, systematischem Review,
qualitativer Inhaltsanalyse, KI-gestützter Textanalyse und wissenschaftlichem
Schreiben.
