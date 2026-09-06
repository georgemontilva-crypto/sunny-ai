import { lazy } from "react";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";

// Everything below the fold is a separate chunk. The page is still fully
// prerendered — entry-server.tsx resolves every Suspense boundary before it
// emits HTML — so this changes nothing a crawler or a visitor sees; it just
// takes these sections out of the bundle the browser has to parse before it
// can hydrate the part of the page that is actually on screen.
//
// Hero, Navbar and Footer stay eager on purpose: the first two are the
// visible page, and the third is small and shared with every other route.
// HeroCarousel is deliberately NOT lazy either — it holds the LCP image, so
// deferring it would trade a smaller bundle for a slower Largest
// Contentful Paint, which is the opposite of the goal.
const Questions = lazy(() => import("@/components/landing/Questions"));
const Compounds = lazy(() => import("@/components/landing/Compounds"));
const MeetSunny = lazy(() => import("@/components/landing/MeetSunny"));
const HowItWorks = lazy(() => import("@/components/landing/HowItWorks"));
const ChatDemo = lazy(() => import("@/components/landing/ChatDemo"));
const Goals = lazy(() => import("@/components/landing/Goals"));
const FAQ = lazy(() => import("@/components/landing/FAQ"));
const Contact = lazy(() => import("@/components/landing/Contact"));

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
