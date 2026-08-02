import { ProjectManager } from "../projects/projectManager";

/**
 * Baustein 10 – Item-Pane-Abschnitt „Systematic Review" (Konzept Kap. 14.2).
 *
 * Zeigt für den ausgewählten Eintrag, in wie vielen Rechercheprojekten er als
 * Fundstelle vorkommt. Defensiv registriert: falls die API in einer
 * Zotero-Version abweicht, bricht der Start nicht ab.
 */

const SECTION_ID = "zotero-lit-rev-section";
const PLUGIN_ID = "zotero-lit-rev@noveledge.local";

function log(msg: string) {
  Zotero.debug(`[zotero-lit-rev] itempane: ${msg}`);
}

export function registerItemPaneSection(pm: ProjectManager): void {
  const Z = Zotero as any;
  try {
    if (!Z.ItemPaneManager?.registerSection) {
      log("ItemPaneManager.registerSection not available – skipping");
      return;
    }
    Z.ItemPaneManager.registerSection({
      paneID: SECTION_ID,
      pluginID: PLUGIN_ID,
      header: {
        l10nID: "zotero-lit-rev-section-header",
        label: "Systematic Review",
        icon: "chrome://zotero/skin/16/universal/note.svg",
      },
      sidenav: {
        l10nID: "zotero-lit-rev-section-header",
        label: "Systematic Review",
        icon: "chrome://zotero/skin/20/universal/note.svg",
      },
      onRender: ({ body, item }: { body: HTMLElement; item: any }) => {
        renderSection(body, item, pm).catch((e) =>
          log(`render error: ${e}`),
        );
      },
    });
    log("section registered");
  } catch (e) {
    log(`registerSection failed: ${e}`);
  }
}

async function renderSection(
  body: HTMLElement,
  item: any,
  pm: ProjectManager,
): Promise<void> {
  body.textContent = "";
  const doc = body.ownerDocument;
  const wrap = doc.createElement("div");
  wrap.style.padding = "6px";
  wrap.style.fontSize = "12px";

  if (!item || typeof item.key !== "string") {
    wrap.textContent = "Kein Eintrag ausgewählt.";
    body.appendChild(wrap);
    return;
  }

  const projects = await pm.list();
  const hits = projects
    .map((p) => ({
      name: p.name,
      findings: (p.findings ?? []).filter((f) => f.itemKey === item.key),
    }))
    .filter((x) => x.findings.length > 0);

  if (hits.length === 0) {
    wrap.textContent =
      "Dieser Eintrag ist in noch keinem Review-Projekt als Fundstelle erfasst.";
  } else {
    const list = doc.createElement("ul");
    list.style.margin = "4px 0 0 16px";
    for (const h of hits) {
      const accepted = h.findings.filter(
        (f) => f.reviewStatus === "accepted",
      ).length;
      const li = doc.createElement("li");
      li.textContent = `${h.name}: ${h.findings.length} Fundstelle(n), ${accepted} übernommen`;
      list.appendChild(li);
    }
    wrap.appendChild(list);
  }
  body.appendChild(wrap);
}
