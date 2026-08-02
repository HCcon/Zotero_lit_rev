/**
 * Zotero 7 bootstrap loader.
 * Registers the chrome content path, loads the bundled plugin logic
 * (built from src/ into content/scripts/index.js) and delegates all
 * lifecycle events to the hooks defined there.
 *
 * The __placeholders__ are replaced at build time (see zotero-plugin.config.ts).
 */

var chromeHandle;

function install(data, reason) {}

async function startup({ id, version, rootURI }, reason) {
  await Zotero.initializationPromise;

  const aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  const manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "__addonRef__", rootURI + "content/"],
  ]);

  // Load the bundled plugin code. It attaches itself to Zotero.__addonInstance__.
  Services.scriptloader.loadSubScript(`${rootURI}content/scripts/index.js`);

  Zotero.__addonInstance__.hooks.onStartup({ id, version, rootURI });
}

function onMainWindowLoad({ window }, reason) {
  Zotero.__addonInstance__?.hooks.onMainWindowLoad(window);
}

function onMainWindowUnload({ window }, reason) {
  Zotero.__addonInstance__?.hooks.onMainWindowUnload(window);
}

function shutdown({ id, version, rootURI }, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }

  try {
    Zotero.__addonInstance__?.hooks.onShutdown();
  } catch (e) {
    Zotero.debug("[__addonRef__] shutdown hook error: " + e);
  }

  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }

  delete Zotero.__addonInstance__;
}

function uninstall(data, reason) {}
