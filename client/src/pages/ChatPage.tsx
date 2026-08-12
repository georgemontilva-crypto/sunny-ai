import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import AuthBackdrop from "@/components/AuthBackdrop";
import Navbar from "@/components/landing/Navbar";
import { getSlotUrl } from "@/lib/media";
import { SITE } from "@shared/site";

// The floating navbar pill sits at top:14px and is 56px tall, so its bottom
// edge lands at 70px — this clears it with a little air. Hard-coded rather
// than measured: the pill is a fixed-size element, and a ResizeObserver here
// would buy nothing but a layout read on every frame of its scroll
// transition.
const NAV_OFFSET = "78px";

// How long to wait for Lynx's loader to actually put an iframe on the page
// before showing the fallback. Generous on purpose: a slow phone connection
// shouldn't be told the chat is broken, but nobody should stare at a spinner
// forever either.
const LOAD_TIMEOUT_MS = 12000;

const MOUNT_ID = "sunny-chat";

export default function ChatPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const mountRef = useRef<HTMLDivElement>(null);

  // Injected here rather than in client/index.html: /chat is the only route
  // that needs it, and a site-wide <script> would pull Lynx onto every page
  // for nothing. Re-runs on remount (client-side navigation away and back),
  // hence the cleanup — without it a second visit would stack a second chat.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const script = document.createElement("script");
    script.src = SITE.chatPageLoaderSrc;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-api-key", SITE.chatWidgetKey);
    script.setAttribute("data-mount", `#${MOUNT_ID}`);
    script.setAttribute("data-color", SITE.chatAccent);
    // Without this the loader falls back to a fixed 600px box; the chat has to
    // fill the card the layout already sized for it.
    script.setAttribute("data-height", "100%");

    // The script tag loading is not the same as the chat being on screen —
    // the loader appends an <iframe> into the mount, so that's what's watched.
    const observer = new MutationObserver(() => {
      if (mount.querySelector("iframe")) {
        setStatus("ready");
        observer.disconnect();
      }
    });
    observer.observe(mount, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      if (!mount.querySelector("iframe")) setStatus("failed");
    }, LOAD_TIMEOUT_MS);

    script.onerror = () => setStatus("failed");
    document.body.appendChild(script);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      script.remove();
      // The loader's own wrapper div lives inside the mount, so emptying it
      // takes the iframe with it.
      mount.replaceChildren();
    };
  }, []);

  return (
    // 100dvh, not 100vh: on mobile Safari/Chrome the URL bar is part of vh,
    // so vh would push the bottom of the chat's input row under the browser
    // chrome — the one part of this page that must always be reachable.
    <div className="h-[100dvh] flex flex-col bg-noche relative overflow-hidden">
      <AuthBackdrop />
      <Navbar />

      <main
        className="relative z-10 flex-1 min-h-0 flex flex-col px-0 pb-0 sm:px-6 sm:pb-6"
        style={{ paddingTop: NAV_OFFSET }}
      >
        {/* Full-bleed on mobile (every pixel of a phone screen counts for a
            chat), inset card on desktop. Hence border-y + square corners
            below the sm breakpoint, full border + radius above it. */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden border-y border-background/13 bg-background/5 shadow-[0_34px_74px_-44px_rgba(0,0,0,0.7)] sm:rounded-[22px] sm:border">
          {/* Legal line, deliberately above the iframe and outside it: it
              has to be readable the moment the page opens, without
              scrolling and without waiting for a third party to load. */}
          <header className="shrink-0 flex flex-col gap-1.5 border-b border-background/13 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <Link href="/" className="shrink-0">
              <img src={getSlotUrl("logo")} alt="Sunny" className="h-7 w-auto" />
            </Link>
            <p className="text-[12.5px] leading-snug text-background/60">
              Educational research summaries. Not medical advice. For adults 21+.
            </p>
          </header>

          <div className="relative flex-1 min-h-0">
            {/* Lynx's loader appends its iframe in here. Empty in the markup
                on purpose — nothing is rendered until the script runs. */}
            <div id={MOUNT_ID} ref={mountRef} className="h-full w-full" />

            {/* Sits over the mount on the same noche surface rather than the
                loader's own grey, so the wait reads as part of the page
                instead of a blank light rectangle. Kept mounted after load
                (opacity only) so the fade can actually play out. */}
            <div
              aria-hidden={status === "ready"}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-noche transition-opacity duration-500 ${
                status === "ready" ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              {status === "failed" ? (
                // A blank rectangle would just look broken. Point at the one
                // route that doesn't depend on the third party being up.
                <div className="max-w-sm px-6 text-center">
                  <p className="text-sm text-background/80">Sunny isn’t loading right now.</p>
                  <p className="mt-2 text-sm text-background/55">
                    It’s us, not you — please{" "}
                    <Link href="/contact" className="text-accent underline underline-offset-4">
                      send your question through the contact form
                    </Link>{" "}
                    and we’ll get back to you.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className="h-9 w-9 animate-spin rounded-full border-2 border-background/15 border-t-accent"
                    role="status"
                    aria-label="Loading chat"
                  />
                  <p className="text-sm text-background/50">Waking Sunny up…</p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
