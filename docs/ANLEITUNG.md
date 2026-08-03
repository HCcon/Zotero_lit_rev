# Anleitung — Zotero Literature Review

Öffnen: **Werkzeuge → „Zotero Literature Review — Projekte…“** (oder Rechtsklick auf einen Eintrag).

Der Ablauf ist **sequentiell** – du stößt jeden Schritt einzeln an. Jeder Button hat einen **Hover-Tooltip** mit Kurzerklärung. Nach jedem KI-/Analyse-Lauf erscheint eine **Abschlussmeldung**.

## Einmalig: KI einrichten (optional, aber empfohlen)
**KI-Einstellungen…** → KI aktivieren, Anbieter/Modell/Schlüssel eintragen → **Verbindung testen**.
- Anthropic: URL `https://api.anthropic.com`, Modell z. B. `claude-haiku-4-5` (günstig) oder `claude-opus-5`.
- OpenAI: URL `https://api.openai.com`, Modell z. B. `gpt-4o-mini` oder `gpt-4o`.
- **Antwort-Token** großzügig lassen (4000+); Reasoning-Modelle (gpt-5-Familie) brauchen viel Budget. Für Massenbewertung sind Nicht-Reasoning-Modelle zuverlässiger/günstiger.

## Der Ablauf

1. **Sammlungen** — welche Zotero-Ordner durchsucht werden.
2. **Suchkonzepte** — Keywords, Synonyme, Kontext, Ausschlussbegriffe, +/– Beispiele.
3. **Analyse & Treffer** — „Analyse starten“ durchsucht die PDFs → Trefferliste. Während Analyse/KI-Läufen erscheint ein **Fortschrittsbalken**, der bis zum Ende sichtbar bleibt; danach eine Abschlussmeldung.
   - `[Zahl]` = lokaler Score · `KI:xx` = KI-Relevanz · `‹Farbe›` = Kodierung.
   - **Doppelklick** auf einen Treffer (oder **Details / Paraphrase…**) öffnet: warum der Treffer gefunden wurde (Begriffe, Fundort/Abschnitt), **Eintrag in Zotero öffnen**, Paraphrase, Kodierung; per Treffer KI-Bewertung/-Paraphrase/-Kodierung.
   - **Als Notiz übernehmen**: erzeugt am Zotero-Eintrag eine strukturierte Notiz (Original + Begründung + Paraphrase).
   - **KI: alle bewerten / alle kodieren**: Stapelverarbeitung mit Fortschritt + Abschlussmeldung.
   - **Kodierung → Zotero-Tags**: setzt farbige Tags je Kategorie an den Einträgen.
   - **Export CSV/JSON**.
4. **Screening** — je Eintrag ein-/ausschließen, Ausschlussgründe, **Dublettenprüfung**, **PRISMA-Zahlen**. Exporte: Screening-Liste (CSV), **Evidenztabelle (CSV)**, PRISMA-Bericht (Markdown), **PRISMA-Diagramm (SVG-Bild)**, **Bewertungssheets (HTML)**.
5. **Extraktion** — 16 Studienmerkmale je eingeschlossener Studie (KI + manuell). Export: Studiencharakteristika (CSV).
6. **Qualität** — Risk of Bias je Studie; **Kriterien…** ein-/ausschaltbar. Export: Qualitätsmatrix (CSV).
7. **Synthese** — studienübergreifende Erkenntnisse, Widersprüche, Forschungslücken, neue Fragen (KI). Export: Markdown.

## Bewertungssheet (pro Studie) & PRISMA
**Screening → „Bewertungssheets (HTML)“ bzw. „(Word)“** erzeugt ein Blatt je eingeschlossener Studie: Bibliografie, **Abstract**, Screening-Entscheidung + Begründung, relevante **Fundstellen** (mit Begründung, Kodierung, Paraphrase, KI-Score), **Extraktion** und **Qualität**. HTML im Browser öffnen/drucken; Word (.doc) zum Weiterbearbeiten.
**PRISMA** gibt es als **SVG-Bild** und als **Word-Dokument** (bearbeitbar).

## Grundsätze
- **Nichtdestruktiv**: bestehende Zotero-Daten werden nicht verändert; Notizen/Tags nur auf deine Aktion, jederzeit entfernbar.
- **KI = Vorschlag**: Bewertungen, Kodierungen, Paraphrasen, Extraktionen und Synthese sind Vorschläge und müssen von dir geprüft/bestätigt werden.
- **Datenschutz**: an die KI gehen nur Textausschnitt + Forschungsfrage + Konzept – keine ganzen PDFs; der Schlüssel bleibt lokal.
