# Zotero Literature Review

Ein [Zotero 7](https://www.zotero.org/) Plugin für **KI-gestützte, systematische
Literaturauswertung**. Aufgebaut mit TypeScript und
[zotero-plugin-scaffold](https://github.com/northword/zotero-plugin-scaffold) +
[zotero-plugin-toolkit](https://github.com/windingwind/zotero-plugin-toolkit).

## Dokumentation
- [docs/KONZEPT-GESAMT.md](docs/KONZEPT-GESAMT.md) — vollständige Vision (41 Kapitel, 9 Module)
- [docs/KONZEPT.md](docs/KONZEPT.md) — Phase-1-Fokus
- [docs/ROADMAP.md](docs/ROADMAP.md) — Phasen- und Modulplan
- [docs/PHASE1_PLAN.md](docs/PHASE1_PLAN.md) — Detailplan des ersten Bauabschnitts

## Projektstruktur
```
src/                     TypeScript-Quellcode (wird gebündelt)
  index.ts               Einstiegspunkt (attacht an Zotero.ZoteroLitRev)
  addon.ts               zentrales Plugin-Objekt (Zustand + Hooks)
  hooks.ts               Lebenszyklus (Startup/Shutdown/Fenster)
addon/                   statische Ressourcen
  manifest.json          Plugin-Metadaten (mit __placeholders__)
  bootstrap.js           Loader (lädt das gebündelte Script)
  prefs.js               Standard-Einstellungen
  locale/                Übersetzungen (ftl)
zotero-plugin.config.ts  Build-Konfiguration
tsconfig.json            TypeScript-Konfiguration
```

## Voraussetzungen
- Node.js (LTS). Prüfen mit `node --version`.

## Einrichtung
```bash
npm install
```

## Bauen (installierbare .xpi erzeugen)
```bash
npm run build
```
Ergebnis: `.scaffold/build/zotero-literature-review.xpi`. In Zotero installierbar über
**Tools → Plugins → Zahnrad → Install Plugin From File…**.

## Entwicklung mit Auto-Reload
```bash
npm start
```
Startet ein Test-Zotero mit geladenem Plugin und baut bei jeder Änderung neu.
Beim ersten Mal ist ggf. eine `.env` mit dem Pfad zur Zotero-Installation nötig
(siehe zotero-plugin-scaffold-Doku).

## Type-Check
```bash
npm run lint
```

## Lizenz
AGPL-3.0-or-later
