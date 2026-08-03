import { DialogHelper } from "zotero-plugin-toolkit";

/**
 * Einheitliche Meldungen und ein bleibender Fortschrittsbalken.
 *
 * Statt window.alert („[JavaScript Application]“ + Warndreieck) wird
 * Services.prompt mit dem Plugin-Namen als Titel verwendet.
 */

const APP_TITLE = "Zotero Literature Review";

function mainWin(): any {
  return (Zotero as any).getMainWindow();
}

export function notify(message: string, title = APP_TITLE): void {
  const win = mainWin();
  const Services = (globalThis as any).Services;
  try {
    Services.prompt.alert(win, title, message);
  } catch {
    win?.alert?.(message);
  }
}

export function confirmDialog(message: string, title = APP_TITLE): boolean {
  const win = mainWin();
  const Services = (globalThis as any).Services;
  try {
    return Services.prompt.confirm(win, title, message);
  } catch {
    return Boolean(win?.confirm?.(message));
  }
}

export interface ProgressHandle {
  set(done: number, total: number, text: string): Promise<void>;
  close(): void;
}

/**
 * Opens a small, persistent progress window with a bar that stays visible
 * until close() is called. Runs non-blocking so the caller's loop continues.
 */
export function openProgressWindow(heading: string): ProgressHandle {
  const dialog = new DialogHelper(2, 1);
  dialog
    .addCell(0, 0, {
      tag: "div",
      namespace: "html",
      id: "lr-progress-text",
      styles: { minWidth: "380px", marginBottom: "8px", fontSize: "13px" },
      properties: { textContent: `${heading} …` },
    })
    .addCell(1, 0, {
      tag: "progress",
      namespace: "html",
      id: "lr-progress-bar",
      attributes: { max: "100", value: "0" },
      styles: { width: "380px", height: "16px" },
    } as any)
    .setDialogData({});

  dialog.open(APP_TITLE, {
    centerscreen: true,
    fitContent: true,
    noDialogMode: true,
    resizable: false,
  });

  const ready: Promise<void> =
    (dialog.dialogData as any).loadLock?.promise ?? Promise.resolve();

  return {
    async set(done, total, text) {
      await ready;
      const doc = dialog.window?.document;
      if (!doc) return;
      const bar = doc.getElementById("lr-progress-bar") as any;
      const label = doc.getElementById("lr-progress-text") as HTMLElement | null;
      const pct = total ? Math.round((done / total) * 100) : 0;
      if (bar) bar.value = pct;
      if (label) label.textContent = `${text}  (${pct} %)`;
    },
    close() {
      try {
        dialog.window?.close();
      } catch {
        /* ignore */
      }
    },
  };
}
