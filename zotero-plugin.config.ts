import { defineConfig } from "zotero-plugin-scaffold";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  source: ["src", "addon"],
  dist: ".scaffold/build",
  name: pkg.config.addonName,
  id: pkg.config.addonID,
  namespace: pkg.config.addonRef,
  build: {
    assets: ["addon/**/*.*"],
    // Ersetzt __key__ in allen Asset-Dateien (manifest.json, bootstrap.js, ...)
    define: {
      addonName: pkg.config.addonName,
      addonID: pkg.config.addonID,
      addonRef: pkg.config.addonRef,
      addonInstance: pkg.config.addonInstance,
      prefsPrefix: pkg.config.prefsPrefix,
      buildVersion: pkg.version,
    },
    // In Phase 1 bewusst ohne automatische Präfixe – hält alles explizit.
    fluent: {
      prefixLocaleFiles: false,
      prefixFluentMessages: false,
    },
    prefs: {
      prefixPrefKeys: false,
    },
    esbuildOptions: [
      {
        entryPoints: ["src/index.ts"],
        bundle: true,
        target: "firefox115",
        outfile: ".scaffold/build/addon/content/scripts/index.js",
      },
    ],
    // Wir liefern manifest.json/update.json selbst mit.
    makeManifest: { enable: false },
    makeUpdateJson: { enable: false },
  },
  server: {
    // Legt das Test-Profil an, falls es noch nicht existiert.
    createProfileIfMissing: true,
    asProxy: true,
  },
});
