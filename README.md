# zotero-plugin

A [Zotero 7](https://www.zotero.org/) plugin (bootstrapped extension).

## Projektstruktur

```
zotero-plugin/
├── addon/
│   ├── manifest.json          # Plugin-Metadaten (Zotero-7-Manifest)
│   ├── bootstrap.js           # Lifecycle-Hooks (startup/shutdown/…)
│   ├── prefs.js               # Standard-Einstellungen
│   ├── content/
│   │   └── preferences.xhtml  # Einstellungs-Panel
│   └── locale/
│       ├── en-US/zotero-plugin.ftl
│       └── de/zotero-plugin.ftl
├── build.sh                   # Baut die .xpi-Datei
└── update.json                # Update-Manifest für Auto-Updates
```

## Entwicklung: Plugin in Zotero laden (ohne Neu-Bauen)

1. `addon/manifest.json` merken – die ID ist `zotero-plugin@noveledge.local`.
2. Im Zotero-Profilordner die Datei
   `extensions/zotero-plugin@noveledge.local` anlegen, deren **Inhalt** der
   absolute Pfad zum `addon/`-Ordner dieses Projekts ist (Proxy-File-Methode).
3. Zotero mit `-purgecaches -ZoteroDebugText` starten, damit Änderungen
   zuverlässig geladen werden.

Details: <https://www.zotero.org/support/dev/zotero_7_for_developers>

## Build (installierbare .xpi erzeugen)

```bash
./build.sh
```

Erzeugt `build/zotero-plugin-<version>.xpi`. Diese Datei lässt sich in Zotero
über **Tools → Plugins → Zahnrad → Install Plugin From File…** installieren.

## Release

1. Version in `addon/manifest.json` erhöhen.
2. `./build.sh` ausführen.
3. Die `.xpi` als GitHub-Release-Asset hochladen.
4. `update.json` auf die neue Version/URL zeigen lassen (für Auto-Updates).

## Lizenz

Noch festzulegen.
