import { useEffect } from "react";
import { useLocation } from "wouter";
import { SITE } from "@shared/site";

// Lynx has shipped two generations of element ids (`lynx-widget-*` in the
// version vendored at lynx-ai-full/server/widgetRouter.ts, `lynx-loader-*`
// in what www.lynxaiassistant.com/api/widget.js actually serves today), so
// match the prefix rather than the exact ids — this keeps working if they
// rename again, and matching too broadly is harmless because we only ever
// touch direct children of <body>, which is the only place the widget
// mounts.
const WIDGET_SELECTOR = '[id^="lynx-loader-"],[id^="lynx-widget-"]';

// Above all page content, below every overlay meant to block interaction:
// the ConsentGate (z-50), the navbar pill (z-50) and the full-screen mobile
// menu panel (z-40). Lynx pins the bubble at 2147483647 — the 32-bit
// maximum — so without this it floats over the mobile menu.
const BUTTON_Z_INDEX = "30";
const PANEL_Z_INDEX = "29";

export function isChatWidgetHidden(path: string): boolean {
  const clean = path.replace(/\/+$/, "") || "/";
  return SITE.chatWidgetHiddenRoutes.some((route) => clean === route || clean.startsWith(`${route}/`));
}

// Everything here is done by writing inline styles from JS, NOT from
// client/src/index.css, and that is not a stylistic choice: Lynx builds its
// elements with `z-index:...!important` and `display:...!important` in the
// style *attribute*, and an important inline declaration outranks an
// important declaration in an author stylesheet. A CSS rule — even with
// !important — silently loses. Writing the inline style ourselves is the
// only thing that wins.
//
// Which properties we take is also deliberate. The widget drives `display`
// itself (block/flex/none, to open and close its panel), so fighting it
// over that property would mean either clobbering its open/close or having
// it clobber our hide. It never touches `visibility` or `pointer-events` —
// verified against the served bundle — so those are ours to own outright.
function applyWidgetPolicy(hidden: boolean) {
  document.querySelectorAll<HTMLElement>(WIDGET_SELECTOR).forEach((el) => {
    if (el.parentElement !== document.body) return;

    el.style.setProperty("z-index", el.id.includes("btn") ? BUTTON_Z_INDEX : PANEL_Z_INDEX, "important");

    if (hidden) {
      el.style.setProperty("visibility", "hidden", "important");
      el.style.setProperty("pointer-events", "none", "important");
    } else {
      el.style.removeProperty("visibility");
      el.style.removeProperty("pointer-events");
    }
  });
}

// Renders nothing. The loader in client/index.html already refuses to inject
// the bubble on SITE.chatWidgetHiddenRoutes, but that check runs once,
// against the path of the document that was served. Every navigation after
// that is client-side — wouter swaps the tree, no new document is ever
// requested — so a bubble injected on "/" would otherwise follow the visitor
// onto /signin, /account or /chat. We can't unmount it (it lives outside the
// React tree, as a direct child of <body>), so we hide it instead.
export default function ChatWidgetRouteGate() {
  const [location] = useLocation();

  useEffect(() => {
    const hidden = isChatWidgetHidden(location);
    applyWidgetPolicy(hidden);

    // The widget is injected several seconds after load (see index.html) and
    // its elements can appear long after this effect has run, so re-apply
    // when <body> gains children. Scoped to childList on body alone: the
    // widget appends exactly two nodes there, so this observer is idle for
    // the entire life of the page apart from that one moment.
    const observer = new MutationObserver(() => applyWidgetPolicy(hidden));
    observer.observe(document.body, { childList: true });
    return () => observer.disconnect();
  }, [location]);

  return null;
}
