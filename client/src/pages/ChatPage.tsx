import { useState } from "react";
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

export default function ChatPage() {
  const [loaded, setLoaded] = useState(false);

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
            <iframe
              src={SITE.chatEmbedUrl}
              allow="clipboard-write"
              title="Sunny chat"
              onLoad={() => setLoaded(true)}
              className="block h-full w-full border-0"
            />

            {/* Sits over the iframe on the same noche surface rather than
                the reference file's grey, so the wait reads as part of the
                page instead of a blank white rectangle. Kept mounted after
                load (opacity only) so the fade can actually play out. */}
            <div
              aria-hidden={loaded}
              className={`absolute inset-0 flex flex-col items-center justify-center gap-4 bg-noche transition-opacity duration-500 ${
                loaded ? "pointer-events-none opacity-0" : "opacity-100"
              }`}
            >
              <div
                className="h-9 w-9 animate-spin rounded-full border-2 border-background/15 border-t-accent"
                role="status"
                aria-label="Loading chat"
              />
              <p className="text-sm text-background/50">Waking Sunny up…</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
