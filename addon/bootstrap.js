/**
 * Zotero 7 plugin bootstrap.
 * These functions are called by Zotero's plugin loader.
 * See: https://www.zotero.org/support/dev/zotero_7_for_developers
 */

var chromeHandle;

/**
 * Log a message to the Zotero debug console with a plugin prefix.
 */
function log(msg) {
  Zotero.debug("[zotero-plugin] " + msg);
}

// --- Plugin lifecycle ---------------------------------------------------

function install(data, reason) {
  log("Installed");
}

async function startup({ id, version, rootURI }, reason) {
  log("Starting up v" + version);

  // Register the chrome:// content mapping so we can load resources
  // (icons, XHTML preference panes, etc.) from the addon.
  const aomStartup = Components.classes[
    "@mozilla.org/addons/addon-manager-startup;1"
  ].getService(Components.interfaces.amIAddonManagerStartup);
  const manifestURI = Services.io.newURI(rootURI + "manifest.json");
  chromeHandle = aomStartup.registerChrome(manifestURI, [
    ["content", "zotero-plugin", rootURI + "content/"],
    ["locale", "zotero-plugin", "en-US", rootURI + "locale/en-US/"],
    ["locale", "zotero-plugin", "de", rootURI + "locale/de/"],
  ]);

  // Attach to any main windows that are already open.
  const windows = Zotero.getMainWindows();
  for (const win of windows) {
    onMainWindowLoad({ window: win });
  }
}

function shutdown({ id, version, rootURI }, reason) {
  log("Shutting down");

  if (reason === APP_SHUTDOWN) {
    return;
  }

  // Detach from all main windows.
  const windows = Zotero.getMainWindows();
  for (const win of windows) {
    onMainWindowUnload({ window: win });
  }

  if (chromeHandle) {
    chromeHandle.destruct();
    chromeHandle = null;
  }
}

function uninstall(data, reason) {
  log("Uninstalled");
}

// --- Per-window UI ------------------------------------------------------

/**
 * Called for every Zotero main window that opens (and for already-open
 * windows during startup). Add your menu items / toolbar buttons here.
 */
function onMainWindowLoad({ window }) {
  const doc = window.document;

  // Example: add an item to the Tools menu.
  const menu = doc.getElementById("menu_ToolsPopup");
  if (menu && !doc.getElementById("zotero-plugin-tools-menuitem")) {
    const menuitem = doc.createXULElement("menuitem");
    menuitem.id = "zotero-plugin-tools-menuitem";
    menuitem.setAttribute("label", "Hello from zotero-plugin");
    menuitem.addEventListener("command", () => {
      window.Zotero_Tabs; // no-op reference to show `window` is usable
      window.alert("Hello from zotero-plugin!");
    });
    menu.appendChild(menuitem);
  }
}

/**
 * Called for every Zotero main window that closes (and for all windows
 * during shutdown). Remove anything you added in onMainWindowLoad.
 */
function onMainWindowUnload({ window }) {
  const doc = window.document;
  const menuitem = doc.getElementById("zotero-plugin-tools-menuitem");
  if (menuitem) {
    menuitem.remove();
  }
}
