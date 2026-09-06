import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Questions from "@/components/landing/Questions";
import Compounds from "@/components/landing/Compounds";
import MeetSunny from "@/components/landing/MeetSunny";
import HowItWorks from "@/components/landing/HowItWorks";
import ChatDemo from "@/components/landing/ChatDemo";
import Goals from "@/components/landing/Goals";
import FAQ from "@/components/landing/FAQ";
import Contact from "@/components/landing/Contact";
import Footer from "@/components/landing/Footer";

// These eleven imports are static, and that is a decision rather than an
// oversight — the sections below the fold were briefly lazy() and it had to
// be undone. Two things went wrong, and the second one is why per-section
// <Suspense> boundaries are not the fix either:
//
//   1. All eight shared the route-level <Suspense> in App.tsx. Any one of
//      them suspending replaced the whole subtree with that boundary's
//      "Loading…" fallback, so arriving at "/" from another route blanked
//      the entire page — Navbar and Hero included — until the slowest chunk
//      landed. Measured at 22 frames on a fast connection, 76 on a slow one.
//      (A fresh load was never affected: the prerendered HTML is complete
//      and React keeps the server DOM through hydration.)
//
//   2. Giving each section its own boundary fixes that, but breaks the
//      prerender. React's static prerender defers every Suspense boundary
//      that sits below the shell and emits it in streaming shape: the
//      fallback inline, the real markup in a <div hidden>, and a script to
//      swap them. Verified directly — with eight per-section boundaries the
//      prerendered home carried eight empty placeholder divs plus hidden
//      copies of every section. It is not caused by lazy() being slow to
//      resolve: rendering three times in a row, so every lazy payload was
//      already resolved, still produced eight deferred boundaries, and so
//      did replacing all eight lazy components with plain static imports
//      while keeping the boundaries. Any boundary under the shell streams,
//      full stop.
//
// A page whose entire value is being complete without JavaScript cannot ship
// eight coloured empty bands and a swap script, so the sections stay eager.
// The route-level split is unaffected and still in place: /blog, /contact,
// /partner and the four legal pages are lazy in App.tsx, where the boundary
// IS the shell and React inlines it. That split is where most of the win
// was; keeping these eight in the entry chunk costs about 37 KiB gzipped.

// Rhythm (per sunny-home-FINAL.html): hero(DARK) -> questions(light) ->
// compounds(DARK) -> meetSunny(arena) -> howItWorks(light) -> chat(DARK) ->
// goals(light) -> faq(light) -> contact(arena, with a dark legal-notice band
// folded inside it) -> footer(DARK) — no two adjacent sections share the
// same background weight. LegalNotice is no longer mounted here on its own;
// Contact.tsx renders it internally, below the form. B2BWhiteLabel used to
// sit here too; it's gone from the home (duplicated /partner's message) but
// the component itself still lives in the repo for /partner to reuse — see
// Contact's "Run a clinic or brand?" line and Footer's "For brands" link for
// where that path now lives on this page instead.
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <Hero />
      <Questions />
      <Compounds />
      <MeetSunny />
      <HowItWorks />
      <ChatDemo />
      <Goals />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
