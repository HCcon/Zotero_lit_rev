# Phase-1-Detailplan (MVP)

> Grundlage: [KONZEPT.md](KONZEPT.md) Kap. 19–20 und [KONZEPT-GESAMT.md](KONZEPT-GESAMT.md)
> Module 1–4 (Teilmenge). Ziel: ein **installierbares, benutzbares** Plugin, das den
> Kernkreislauf abbildet – ohne KI, rein lokal. KI-Funktionen folgen in Phase 2.
>
> Dieser Plan ist bewusst so geschnitten, dass am Ende **alle 14 Akzeptanzkriterien
> aus KONZEPT.md Kap. 20 erfüllt** sind.

## Abgrenzung Phase 1

**Enthalten (lokal, ohne KI):**
Projekte, Collections-Auswahl, Suchkonzepte, Boolesche Suche (AND/OR/NOT),
Volltextsuche in PDFs, Trefferliste mit einfacher Relevanz, manuelle Prüfung,
Zotero-Annotationen, einfache (manuell verfasste) Paraphrase, CSV/JSON-Export,
Item-Pane-Integration, nachvollziehbare Trefferbegründung.

**Bewusst NICHT in Phase 1 (später):**
Semantische/KI-Suche, KI-Screening, automatische Paraphrasen, Qualitätsbewertung,
Forschungslücken, Synthese, PRISMA-Zähler, Mehrbenutzer, Import externer Quellen,
NEAR/EXACT/STEM/Fuzzy-Operatoren (nur AND/OR/NOT im MVP).

---

## Schritt 0 – Technisches Fundament (einmalige Einrichtung)

**Was:** Umstellung des Grundgerüsts auf die etablierte TypeScript-Vorlage
(zotero-plugin-template + zotero-plugin-toolkit). TypeScript = sicherere JavaScript-
Variante, die viele Fehler schon vor dem Start erkennt.

**Voraussetzung:** Node.js muss auf dem Mac installiert sein (Bau-Werkzeug).
→ Siehe Abschnitt „Node.js installieren" unten.

**Ergebnis:** `npm install` lädt Bausteine, `npm run build` erzeugt die `.xpi`,
`npm start` startet ein Test-Zotero mit geladenem Plugin.

**Ordnerstruktur (Ziel):**
```
src/
  index.ts               Einstiegspunkt
  modules/
    projects/            Modul 1
    collections/         Modul 2 (Auswahl)
    concepts/            Modul 2 (Suchkonzepte)
    search/              Modul 2 (Boolesche + Volltextsuche)
    results/             Trefferliste + Begründung
    annotations/         Modul 4
    paraphrase/          Modul 5 (nur manuell in Phase 1)
    export/              CSV/JSON
    store/               lokaler Datenspeicher
  ui/                    Dialoge, Item-Pane-Abschnitt
addon/                   manifest.json, locale, Icons (aus Vorlage)
```

---

## Baustein 1 – Lokaler Datenspeicher (`store`)
- **Zweck:** Plugin-Daten (Projekte, Konzepte, Fundstellen, Paraphrasen) speichern,
  **ohne** die Zotero-Datenbank zu verändern (Konzept Kap. 18).
- **Technik:** JSON-Datei(en) im Zotero-Profilordner, versioniert.
- **Oberfläche:** keine (Hintergrund).
- **Datenmodell:** wie KONZEPT.md Kap. 16 (Rechercheprojekt, Suchkonzept,
  Fundstelle, Paraphrase).

## Baustein 2 – Projektverwaltung (`projects`, Modul 1)
- **Zweck:** Rechercheprojekte anlegen/bearbeiten/löschen.
- **Felder (MVP-Teilmenge):** Titel, Forschungsfrage, Teilfragen (Liste),
  Review-Typ (Auswahl), Sprachen, Ein-/Ausschlusskriterien (Freitext),
  Erstellungsdatum, Version.
- **Oberfläche:** Projektliste + Formular-Dialog. Erfüllt Akzeptanzkriterium 1.

## Baustein 3 – Collections-Auswahl (`collections`, Modul 2)
- **Zweck:** einem Projekt eine/mehrere Zotero-Collections zuordnen.
- **Funktionen:** Bibliothek wählen, Collections anhaken, Option „Subcollections
  einschließen", Option „nur Einträge mit PDF-Volltext".
- **Oberfläche:** Baumansicht der Collections mit Checkboxen. Erfüllt
  Akzeptanzkriterium 2.

## Baustein 4 – Suchkonzepte (`concepts`, Modul 2)
- **Zweck:** Suchkonzepte je Projekt definieren.
- **Felder (MVP):** Name, Beschreibung/Kontext, Keywords (Liste), Synonyme (Liste),
  Ausschlussbegriffe (Liste), zugeordnete Teilfrage.
- **Oberfläche:** Konzeptliste + Editor mit einfachen Eingabefeldern (Begriffe je
  Zeile). Erfüllt Akzeptanzkriterien 3, 4, 6.

## Baustein 5 – Suchlogik (`search`, Modul 2)
- **Query-Parser:** wandelt Konzept + Operatoren in eine ausführbare Abfrage.
  **MVP-Operatoren: AND, OR, NOT** (Kap. 5.3 – Rest folgt in Phase 2). Erfüllt
  Akzeptanzkriterium 5.
- **PDF-Volltext:** nutzt Zoteros vorhandenen Volltextindex bzw. extrahiert Text
  aus den PDF-Anhängen der gewählten Collections.
- **Matching:** findet Vorkommen der Keywords/Synonyme, berücksichtigt
  Ausschlussbegriffe (NOT), erfasst Fundstelle + Seite + kurzen Kontext (Satz davor/
  danach). Literaturverzeichnis standardmäßig ausgeschlossen (Kap. 6.2).
- **Einfacher Relevanzwert (ohne KI):** aus Trefferanzahl, Anzahl verschiedener
  Keywords, Vorkommen im Titel/Abstract. Transparent zusammengesetzt.
- **Oberfläche:** „Analyse starten"-Button je Projekt + Fortschrittsanzeige.
  Erfüllt Akzeptanzkriterium 7.

## Baustein 6 – Trefferliste & Begründung (`results`)
- **Zweck:** gefundene Dokumente/Fundstellen anzeigen, nach Relevanz sortiert.
- **Spalten:** Autor, Jahr, Titel, Collection, Anzahl Fundstellen, Relevanzwert,
  betroffene Suchkonzepte, Status.
- **Begründung:** je Treffer eine verständliche Erklärung („3 Fundstellen zu
  Konzept X, davon 1 im Abstract; Keyword ‚profitability' 5×"). Erfüllt
  Akzeptanzkriterien 8, 9, 14.

## Baustein 7 – Annotationen (`annotations`, Modul 4)
- **Zweck:** eine geprüfte Fundstelle als **Zotero-Annotation** übernehmen (offizielle
  API, nicht direkt in die DB – Kap. 9, 18).
- **Inhalt:** Originaltext, Seite, Suchkonzept, Relevanzwert, kurze Begründung,
  Plugin-Version, Prüfstatus.
- **Kontrolle:** zuerst Vorschau/Vorschlag, dann bewusste Übernahme (keine
  Massenmarkierung – Kap. 9.3). Erfüllt Akzeptanzkriterium 10.

## Baustein 8 – Einfache Paraphrase (`paraphrase`, Modul 5, MVP-Umfang)
- **Zweck:** zu einer Fundstelle eine **manuell verfasste**, klar gekennzeichnete
  Paraphrase speichern (KI-Paraphrase erst Phase 2).
- **Speicherung:** als Kommentar der Annotation, dauerhaft mit Original + Seite +
  Quelle verbunden. Status „manuell erstellt". Erfüllt Akzeptanzkriterien 11, 12.

## Baustein 9 – Export (`export`, Modul 8, MVP-Umfang)
- **Zweck:** Treffer + Entscheidungen als **CSV** und **JSON** exportieren.
- **Inhalt:** Quelle, Jahr, Titel, Suchkonzept, Fundstelle, Seite, Relevanzwert,
  Paraphrase, Status. Erfüllt Akzeptanzkriterium 13.

## Baustein 10 – Zotero-Integration (`ui`)
- **Item Pane:** einklappbarer Abschnitt „Systematic Review" (Zotero-7-API) mit:
  zugeordnete Projekte, Anzahl Fundstellen, Relevanzwert, Anzahl Annotationen.
- **Kontextmenü:** „Dokument analysieren", „Fundstellen anzeigen", „Zu Projekt
  hinzufügen".
- **Hauptfenster:** eigener Dialog/Tab für Projekte, Konzepte, Trefferliste.

---

## Node.js installieren (einmalig, durch dich)

Node.js und Homebrew sind auf dem Mac aktuell **nicht** vorhanden. Empfohlener,
einfachster Weg (grafischer Installer, kein Terminal):

1. Offizielle Seite öffnen: <https://nodejs.org>
2. Die große grüne Schaltfläche **„LTS"** (empfohlene, stabile Version) herunterladen
   – lädt eine `.pkg`-Datei für macOS.
3. Die heruntergeladene Datei doppelklicken und den Installer durchklicken
   (dein Mac-Passwort wird einmal abgefragt).
4. Fertig. Danach kann ich alles Weitere automatisch erledigen.

> Warum du das selbst machst: Eine systemweite Installation benötigt dein
> Administrator-Passwort, das ich aus Sicherheitsgründen weder kenne noch eingeben
> darf.

---

## Reihenfolge der Umsetzung
0. Fundament (nach Node.js-Installation) →
1. store → 2. projects → 3. collections → 4. concepts → 5. search →
6. results → 7. annotations → 8. paraphrase → 9. export → 10. ui-Feinschliff.

Nach Baustein 6 gibt es einen ersten sichtbaren Zwischenstand zum Testen in Zotero;
nach Baustein 10 ist Phase 1 vollständig und als `.xpi` installierbar.
