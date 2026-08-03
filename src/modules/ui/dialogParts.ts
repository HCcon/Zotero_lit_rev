/**
 * Gemeinsame UI-Bausteine für die Dialoge.
 *
 * Statt vieler Buttons in einer (abgeschnittenen) horizontalen Reihe werden die
 * Aktionen als vertikale Spalte dargestellt – jeder Button mit `title`-Tooltip
 * (Hover-Erklärung), gruppiert durch kleine Überschriften.
 */

export interface DialogAction {
  label: string;
  /** Tooltip text shown on hover (title attribute). */
  title: string;
  onClick: () => void | Promise<void>;
  /** Visually emphasise (e.g. primary/danger). */
  variant?: "primary" | "danger" | "default";
}

export type ActionItem = DialogAction | { heading: string };

function buttonStyles(variant: DialogAction["variant"]): Record<string, string> {
  const base: Record<string, string> = {
    display: "block",
    width: "250px",
    textAlign: "left",
    padding: "6px 10px",
    margin: "2px 0",
    cursor: "pointer",
    borderRadius: "6px",
    border: "1px solid rgba(128,128,128,0.35)",
    background: "transparent",
    fontSize: "13px",
  };
  if (variant === "primary") {
    base.fontWeight = "bold";
    base.borderColor = "rgba(46,168,229,0.8)";
  } else if (variant === "danger") {
    base.color = "#c0392b";
    base.borderColor = "rgba(192,57,43,0.5)";
  }
  return base;
}

/** Builds a vertical column of action buttons (TagElementProps for DialogHelper). */
export function actionColumn(items: ActionItem[]): any {
  const children: any[] = [];
  for (const item of items) {
    if ("heading" in item) {
      children.push({
        tag: "div",
        namespace: "html",
        styles: {
          fontSize: "10px",
          color: "gray",
          margin: "10px 0 2px",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        },
        properties: { textContent: item.heading },
      });
    } else {
      children.push({
        tag: "button",
        namespace: "html",
        attributes: { title: item.title, type: "button" },
        styles: buttonStyles(item.variant),
        properties: { textContent: item.label },
        listeners: [
          {
            type: "click",
            listener: () => {
              void item.onClick();
            },
          },
        ],
      });
    }
  }
  return {
    tag: "div",
    namespace: "html",
    styles: {
      display: "flex",
      flexDirection: "column",
      minWidth: "260px",
      marginLeft: "12px",
    },
    children,
  };
}
